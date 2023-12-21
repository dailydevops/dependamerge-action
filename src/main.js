const core = require('@actions/core')
const github = require('@actions/github')

const { logInfo, logDebug, logWarning } = require('./log')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
module.exports = async function run({ _, context, inputs, metadata }) {
  try {
    logInfo('context: ', JSON.stringify(context))
    logInfo('inputs: ', JSON.stringify(inputs))

    if (metadata !== undefined) {
      logInfo('metadata: ', JSON.stringify(metadata))
    }

    // init octokit
    const octokit = github.getOctokit(inputs.githubToken)
    const pull_request = context.payload.pull_request
    const repo = context.payload.repository

    logInfo('pull_request: ', JSON.stringify(pull_request))
    logInfo('repo: ', JSON.stringify(repo))
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}
