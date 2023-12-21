const core = require('@actions/core')

const { logInfo, logDebug, logWarning } = require('./log')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
module.exports = async function run({ github, context, inputs, metadata }) {
  try {
    // extract the title
    const {
      repo,
      payload: { pull_request }
    } = github.context // eslint-disable-line camelcase

    // init octokit
    const octokit = github.getOctokit(inputs.token)

    logInfo(github)
    logInfo(context)

    logInfo(repo)
    logInfo(pull_request)
    logInfo(inputs)
    logInfo(metadata)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}
