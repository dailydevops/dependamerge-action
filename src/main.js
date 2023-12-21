import * as core from '@actions/core'
import * as gh from '@actions/github'

import { logInfo, logDebug, logWarning } from './log'
import { getInputs, getMetadata } from './utils'

const dependabotUser = 'dependabot[bot]'
const dependabotCommitter = 'GitHub'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export default async function run({ github, context, inputs, metadata }) {
  try {
    const {
      token,
      submodule,
      approve,
      approveOnly,
      command,
      target,
      skipCommitVerification,
      skipVerification
    } = getInputs(inputs)

    const {
      dependecyName,
      dependecyType,
      updateType,
      ecosystem,
      targetBranch,
      previousVersion,
      newVersion,
      compatibilityScore,
      maintainerChanges,
      dependecyGroup,
      alertState,
      ghsaId,
      cvss
    } = getMetadata(metadata)

    // init octokit
    const octokit = gh.getOctokit(inputs.token)
    const { pull_request, repo: repository } = context.payload
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}
