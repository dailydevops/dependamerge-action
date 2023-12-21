const core = require('@actions/core')

const { logInfo, logDebug, logWarning } = require('./log')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
module.exports = async function run({ github, context, inputs, metadata }) {
  try {
    logInfo(JSON.stringify(github))
    logInfo(JSON.stringify(context))
    logInfo(JSON.stringify(inputs))

    if (metadata !== undefined) {
      logInfo(JSON.stringify(metadata))
    }

    // init octokit
    const octokit = github.getOctokit(inputs.token)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}
