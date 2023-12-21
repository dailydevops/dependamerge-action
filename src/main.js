import * as core from '@actions/core'
import * as gh from '@actions/github'

import { logInfo, logDebug, logWarning } from './log'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export default async function run({ github, context, inputs, metadata }) {
  try {
    logInfo('inputs:')
    logInfo(JSON.stringify(inputs))

    if (metadata !== undefined && metadata !== null) {
      logInfo('metadata:')
      logInfo(JSON.stringify(metadata))

      logInfo(metadata.previousVersion)
      logInfo(metadata.newVersion)
    }

    // init octokit
    // const octokit = gh.getOctokit(inputs.token)
    const pull_request = context.payload.pull_request
    const repo = context.payload.repository

    logInfo('pull_request:')
    logInfo(JSON.stringify(pull_request))
    logInfo('repo:')
    logInfo(JSON.stringify(repo))
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}
