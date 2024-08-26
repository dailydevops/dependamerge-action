'use strict'

const core = require('@actions/core')
const {
  addComment,
  approvePullRequest,
  comparePullRequest,
  getPullRequest
} = require('./api')

const dependabotUser = 'dependabot[bot]'

/**
 * Retrieves the appropriate command based on the given inputs.
 *
 * @param {object} inputs - The inputs object.
 * @returns {string} The command text.
 */
const getCommand = inputs => {
  if (inputs !== undefined && inputs !== null) {
    if (inputs['command'] === 'merge') {
      return commandText.merge
    }

    if (inputs['command'] === 'rebase') {
      return commandText.rebase
    }
  }

  return commandText.squash
}

/**
 * Represents the state object.
 * @typedef {Object} State
 * @property {string} approved - Represents the 'approved' state.
 * @property {string} merged - Represents the 'merged' state.
 * @property {string} skipped - Represents the 'skipped' state.
 * @property {string} failed - Represents the 'failed' state.
 * @property {string} rebased - Represents the 'rebased' state.
 */
/**
 * Represents the state of the application.
 *
 * @type {Object<string, string>}
 */
const state = {
  approved: 'approved',
  merged: 'merged',
  skipped: 'skipped',
  failed: 'failed',
  rebased: 'rebased'
}

/**
 * Object containing command texts.
 * @typedef {Object} CommandText
 * @property {string} merge - The merge command text.
 * @property {string} squash - The squash and merge command text.
 * @property {string} rebase - The rebase command text.
 */

/**
 * Command texts for different merge strategies.
 * @type {CommandText}
 */
const commandText = {
  merge: 'merge',
  squash: 'squash and merge',
  rebase: 'rebase'
}

/**
 * Object containing update types for version updates.
 * @typedef {Object} UpdateTypes
 * @property {string} major - Represents a major version update.
 * @property {string} minor - Represents a minor version update.
 * @property {string} patch - Represents a patch version update.
 * @property {string} any - Represents any version update.
 */

/**
 * Update types for version updates.
 * @type {UpdateTypes}
 */
const updateTypes = {
  major: 'version-update:semver-major',
  minor: 'version-update:semver-minor',
  patch: 'version-update:semver-patch',
  any: 'version-update:semver-any'
}

/**
 * Maps the input to an update type.
 * If the input is not found in the updateTypes object, it defaults to 'patch'.
 *
 * @param {string} input - The input to be mapped.
 * @returns {string} - The mapped update type.
 */
const mapUpdateType = input => {
  return updateTypes[input] || updateTypes.patch
}

/**
 * Array representing the priority of update types.
 * @type {Array<updateTypes>}
 */
const updateTypesPriority = [
  updateTypes.patch,
  updateTypes.minor,
  updateTypes.major,
  updateTypes.any
]

/**
 * Retrieves the inputs and returns an object with the following properties:
 * - token: The token input value.
 * - approveOnly: A boolean indicating if the 'approve-only' input is set to 'true'.
 * - commandMethod: The result of the getCommand function.
 * - handleSubmodule: A boolean indicating if the 'handle-submodule' input is set to 'true'.
 * - handleDependencyGroup: A boolean indicating if the 'handle-dependency-group' input is set to 'true'.
 * - target: The result of the mapUpdateType function.
 * - skipCommitVerification: A boolean indicating if the 'skip-commit-verification' input is set to 'true'.
 * - skipVerification: A boolean indicating if the 'skip-verification' input is set to 'true'.
 *
 * @param {Object} inputs - The inputs object.
 * @returns {Object} - An object containing the retrieved inputs.
 */
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

/**
 * Retrieves metadata from the given object.
 * @param {Object} metadata - The metadata object.
 * @returns {Object} - The extracted metadata.
 */
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

/**
 * Rebase a pull request.
 *
 * @param {Object} github - The GitHub API object.
 * @param {string} repository - The repository name.
 * @param {Object} pull_request - The pull request object.
 * @returns {Object} - An object containing the execution status and validation information.
 */
async function rebasePullRequest(github, repository, pull_request) {
  const { data: compareData } = await comparePullRequest(
    github,
    repository,
    pull_request
  )
  if (
    compareData &&
    compareData.status === 'behind' &&
    compareData.behind_by > 0
  ) {
    return {
      execute: true,
      body: `@dependabot ${commandText.rebase}`,
      cmd: addComment,
      validationState: state.rebased,
      validationMessage: 'The pull request will be rebased.'
    }
  } else {
    return {
      execute: false,
      validationState: state.skipped,
      validationMessage: `The pull request is not behind the target branch.`
    }
  }
}

/**
 * Merge a pull request.
 *
 * @param {Object} github - The GitHub API object.
 * @param {string} repository - The repository name.
 * @param {Object} pull_request - The pull request object.
 * @param {Object} config - The configuration object.
 * @returns {Object} - An object containing the execution status and validation information.
 */
async function mergePullRequest(github, repository, pull_request, config) {
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
    config.inputs.target === updateTypes.any ||
    updateTypesPriority.indexOf(config.metadata.updateType) <=
      updateTypesPriority.indexOf(config.inputs.target)

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

/**
 * Validates a pull request based on its state, configuration, and dependencies.
 *
 * @param {Object} github - The GitHub API object.
 * @param {string} repository - The repository name.
 * @param {Object} pull_request - The pull request object.
 * @param {Object} config - The configuration object.
 * @returns {Object} - The validation result object.
 */
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

  if (config.metadata.ecosystem === 'gitsubmodule') {
    if (!config.inputs.handleSubmodule) {
      return {
        execute: false,
        validationState: state.skipped,
        validationMessage:
          'The pull-request is associated with a submodule but the action is not configured to handle submodules.'
      }
    } else {
      config.inputs.target = updateTypes.any
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

  if (config.inputs.command === commandText.rebase) {
    return await rebasePullRequest(github, repository, pull_request)
  } else {
    return await mergePullRequest(github, repository, pull_request, config)
  }
}

module.exports = {
  getInputs,
  getMetadata,
  state,
  validatePullRequest
}
