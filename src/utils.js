'use strict'

const core = require('@actions/core')
const {
  addComment,
  approvePullRequest,
  comparePullRequest,
  getPullRequest
} = require('./api')

const dependabotUser = 'dependabot[bot]'
// const dependabotCommitter = 'GitHub'

const getCommand = inputs => {
  if (
    inputs !== undefined &&
    inputs !== null &&
    inputs['command'] === 'merge'
  ) {
    return commandText.merge
  }

  return commandText.squash
}

const state = {
  approved: 'approved',
  merged: 'merged',
  skipped: 'skipped',
  failed: 'failed',
  rebased: 'rebased'
}

const commandText = {
  merge: 'merge',
  squash: 'squash and merge',
  rebase: 'rebase'
}

const updateTypes = {
  major: 'version-update:semver-major',
  minor: 'version-update:semver-minor',
  patch: 'version-update:semver-patch',
  any: 'version-update:semver-any'
}

const mapUpdateType = input => {
  return updateTypes[input] || updateTypes.patch
}

const updateTypesPriority = [
  updateTypes.patch,
  updateTypes.minor,
  updateTypes.major,
  updateTypes.any
]

function getInputs(inputs) {
  return {
    token: inputs['token'],
    approveOnly: inputs['approve-only'] === 'true',
    commandMethod: getCommand(inputs),
    handleSubmodule: inputs['handle-submodule'] === 'true',
    handleDependencyGroup: inputs['handle-dependency-group'] === 'true',
    target: mapUpdateType(inputs['target']),
    skipCommitVerification: inputs['skip-commit-verification'] === 'true',
    skipVerification: inputs['skip-verification'] === 'true'
  }
}

function getMetadata(metadata) {
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

async function validatePullRequest(github, repository, pull_request, config) {
  if (pull_request.state !== 'open' || pull_request.merged) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: 'Pull request is not open or already merged.'
    }
  }

  if (pull_request.draft) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: 'Pull request is a draft.'
    }
  }

  if (
    !config.inputs.skipVerification &&
    pull_request.user.login !== dependabotUser
  ) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: `The Commit/PullRequest was not created by ${dependabotUser}.`
    }
  }

  let targetUpdateType = config.inputs.target
  if (config.metadata.ecosystem === 'gitsubmodule') {
    if (!config.inputs.handleSubmodule) {
      return {
        execute: false,
        validationState: state.skipped,
        validationMessage:
          'The pull-request is associated with a submodule but the action is not configured to handle submodules.'
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
        'The pull-request is associated with a dependency group but the action is not configured to handle dependency groups.'
    }
  }

  const { data: compareData } = await comparePullRequest(github, repository, pull_request)
  if (compareData && compareData.status === 'behind' && compareData.behind_by > 0) {
    return {
      execute: true,
      body: `@dependabot ${commandText.rebase}`,
      cmd: addComment,
      validationState: state.rebased,
      validationMessage: 'The pull request will be rebased.'
    }
  }

  let retryCount = 0
  let mergeabilityResolved = pull_request.mergeable !== null

  while (!mergeabilityResolved && retryCount < 5) {
    try {
      core.info(
        `Pull request mergeability is not resolved. Retry count: ${retryCount}`
      )

      const { data: prData } = await getPullRequest(
        github,
        repository,
        pull_request
      )

      if (prData.mergeable === null || prData.mergeable === undefined) {
        core.info(
          `Pull request mergeability is not yet resolved... retrying in 5 seconds.`
        )
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 5000))
      } else {
        mergeabilityResolved = true
      }
    } catch (apiError) {
      return {
        execute: false,
        validationState: state.skipped,
        validationMessage: `An error occurred fetching the PR from Github: ${JSON.stringify(
          apiError
        )}`
      }
    }
  }

  if (pull_request.mergeable_state === 'behind') {
    return {
      execute: true,
      body: `@dependabot ${commandText.rebase}`,
      cmd: addComment,
      validationState: state.rebased,
      validationMessage: 'The pull request will be rebased.'
    }
  }

  if (
    pull_request.mergeable_state === 'blocked' ||
    pull_request.mergeable_state === 'dirty'
  ) {
    core.info(
      `Pull request merge is blocked by conflicts. State: ${pull_request.mergeable_state}`
    )
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage:
        'Pull request merge is blocked by conflicts, please resolve them manually.'
    }
  }

  const treatVersion =
    targetUpdateType === updateTypes.any ||
    updateTypesPriority.indexOf(config.metadata.updateType) <=
      updateTypesPriority.indexOf(targetUpdateType)

  core.info(
    `Check package '${config.metadata.dependecyNames}' - Old: '${config.metadata.previousVersion}' New: '${config.metadata.newVersion}'`
  )
  core.info(`Is the package version treated? - ${treatVersion}`)
  if (!treatVersion) {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: `The package version is not treated by the action.`
    }
  }

  if (config.inputs.approveOnly) {
    return {
      execute: true,
      body: 'Approved by DependaMerge.',
      cmd: approvePullRequest,
      validationState: state.approved,
      validationMessage: 'The pull request will be approved.'
    }
  }

  return {
    execute: true,
    body: `@dependabot ${config.inputs.commandMethod}`,
    cmd: approvePullRequest,
    validationState: state.merged,
    validationMessage: 'The pull request will be merged.'
  }
}

module.exports = {
  getInputs,
  getMetadata,
  state,
  validatePullRequest
}
