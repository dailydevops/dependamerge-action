'use strict'

import * as core from '@actions/core'

import * as cmd from './api'

const dependabotUser = 'dependabot[bot]'
const dependabotCommitter = 'GitHub'

const getCommand = inputs => {
  const command = inputs['command']

  if (command === 'merge') {
    return commandText.merge
  }

  return commandText.squash
}

export const state = {
  approved: 'approved',
  merged: 'merged',
  skipped: 'skipped',
  failed: 'failed',
  rebased: 'rebased',
  recreated: 'recreated'
}

export const commandText = {
  merge: 'merge',
  squash: 'squash and merge',
  rebase: 'rebase',
  recreate: 'recreate'
}

export const updateTypes = {
  major: 'version-update:semver-major',
  minor: 'version-update:semver-minor',
  patch: 'version-update:semver-patch',
  any: 'version-update:semver-any'
}

const mapUpdateType = input => {
  return updateTypes[input] || updateTypes.any
}

export const updateTypesPriority = [
  updateTypes.patch,
  updateTypes.minor,
  updateTypes.major,
  updateTypes.any
]

export function getInputs(inputs) {
  return {
    token: inputs['token'],
    approveOnly: inputs['approve-only'] === 'true',
    commandMethod: getCommand(inputs),
    handleSubmodule: inputs['handle-submodule'] === 'true',
    handleDependencyGroup: inputs['handle-dependency-group'] === 'true',
    target: mapUpdateType(inputs['target']),
    skipCommitVerification: inputs['skip-commit-verification'],
    skipVerification: inputs['skip-verification']
  }
}

export function getMetadata(metadata) {
  if (metadata === undefined || metadata === null) {
    return {
      dependecyNames: '',
      dependecyType: '',
      updateType: '',
      ecosystem: '',
      targetBranch: '',
      previousVersion: '',
      newVersion: '',
      compatibilityScore: '',
      maintainerChanges: '',
      dependecyGroup: '',
      alertState: '',
      ghsaId: '',
      cvss: ''
    }
  }

  return {
    dependecyNames: metadata['dependency-names'],
    dependecyType: metadata['dependency-type'],
    updateType: metadata['update-type'],
    ecosystem: metadata['package-ecosystem'],
    targetBranch: metadata['target-branch'],
    previousVersion: metadata['previous-version'],
    newVersion: metadata['new-version'],
    compatibilityScore: metadata['compatibility-score'],
    maintainerChanges: metadata['maintainer-changes'],
    dependecyGroup: metadata['dependency-group'],
    alertState: metadata['alert-state'],
    ghsaId: metadata['ghsa-id'],
    cvss: metadata['cvss']
  }
}

export function validatePullRequest(pull_request, config) {
  if (
    !config.inputs.skipVerification &&
    pull_request.user.login !== dependabotUser
  ) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: `The Commit/PullRequest was not executed by '${dependabotUser}'`
    }
  }

  if (pull_request.state !== 'open' || pull_request.merged) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: 'Pull request is not open or already merged.'
    }
  }

  let targetUpdateType = config.inputs.target
  if (config.metadata.ecosystem === 'gitsubmodule') {
    if (!config.inputs.handleSubmodule) {
      return {
        execute: false,
        validationState: state.skipped,
        validationMessage:
          'Pull request is associated with a submodule but the action is not configured to handle submodules'
      }
    } else {
      targetUpdateType = updateTypes.any
    }
  }

  if (
    !config.inputs.handleDependencyGroup &&
    config.metadata.dependecyGroup !== ''
  ) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage:
        'The pull-request is associated with a dependency group but the action is not configured to handle dependency groups'
    }
  }

  const treatVersion =
    targetUpdateType === updateTypes.any ||
    updateTypesPriority.indexOf(config.metadata.updateType) <
      updateTypesPriority.indexOf(targetUpdateType)

  core.info(
    `Check package '${config.metadata.dependecyNames}' - Old: '${config.metadata.previousVersion}' New: '${config.metadata.newVersion}'`
  )
  core.info(`Is the package version treated? - ${treatVersion}`)
  if (!treatVersion) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage:
        'Pull request handles package version greater than the configured value.'
    }
  }

  if (pull_request.mergeable === false) {
    if (pull_request.rebaseable) {
      return {
        execute: true,
        body: `@dependabot ${commandText.rebase}`,
        cmd: cmd.addComment,
        validationState: state.rebased,
        validationMessage: 'Pull request is blocked and will be rebased.'
      }
    } else {
      return {
        execute: true,
        body: `@dependabot ${commandText.recreate}`,
        cmd: cmd.addComment,
        validationState: state.recreated,
        validationMessage: 'Pull request is blocked and will be recreated.'
      }
    }
  }

  if (config.inputs.approveOnly) {
    return {
      execute: true,
      body: 'Approved by DependaMerge.',
      cmd: cmd.approvePullRequest,
      validationState: state.approved,
      validationMessage: 'Pull request is approved.'
    }
  }

  return {
    execute: true,
    body: `@dependabot ${config.inputs.commandMethod}`,
    cmd: cmd.approvePullRequest,
    validationState: state.merged,
    validationMessage: 'Pull request is merged.'
  }
}
