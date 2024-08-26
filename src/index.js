'use strict'

const core = require('@actions/core')
const {
  getInputs,
  getMetadata,
  state,
  validatePullRequest
} = require('../src/utils')

const outputState = 'state'
const outputMessage = 'message'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
module.exports = async function run({ github, context, inputs, metadata }) {
  try {
    if (!github) {
      const msg = 'No github provided!'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    if (!context) {
      const msg = 'No context provided!'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    if (!inputs) {
      const msg =
        'No inputs provided! Please validate your configuration, especially the properties `skip-commit-verification` and `skip-verification`.'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    if (!metadata) {
      const msg =
        'No metadata provided! Please validate your configuration, especially the properties `skip-commit-verification` and `skip-verification`.'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    core.startGroup('Input Values')
    core.debug(`GitHub: ${JSON.stringify(github, null, 2)}`)
    core.debug(`Context: ${JSON.stringify(context, null, 2)}`)
    core.debug(`Inputs: ${JSON.stringify(inputs, null, 2)}`)
    core.debug(`Metadata: ${JSON.stringify(metadata, null, 2)}`)
    core.endGroup()

    const config = {
      inputs: getInputs(inputs),
      metadata: getMetadata(metadata)
    }

    // init octokit
    const { pull_request, repository } = context.payload

    const { execute, cmd, body, validationState, validationMessage } =
      await validatePullRequest(github, repository, pull_request, config)

    core.setOutput(outputState, validationState)
    core.setOutput(outputMessage, validationMessage)

    if (execute) {
      await cmd(github, repository, pull_request, body)
    }

    return core.info(validationMessage)
  } catch (error) {
    core.setOutput(outputState, state.failed)
    core.setOutput(outputMessage, error.message)
    core.setFailed(error.message)
  }
}
