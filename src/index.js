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
function run({ github, context, inputs, metadata }) {
  try {
    if (github === null || github === undefined) {
      const msg = 'No github provided!'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    if (context === null || context === undefined) {
      const msg = 'No context provided!'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    if (inputs === null || inputs === undefined) {
      const msg =
        'No inputs provided! Please validate your configuration, especially the properties `skip-commit-verification` and `skip-verification`.'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    if (metadata === null || metadata === undefined) {
      const msg =
        'No metadata provided! Please validate your configuration, especially the properties `skip-commit-verification` and `skip-verification`.'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      return core.setFailed(msg)
    }

    const config = {
      inputs: getInputs(inputs),
      metadata: getMetadata(metadata)
    }

    // init octokit
    const { pull_request, repository } = context.payload

    const { execute, cmd, body, validationState, validationMessage } =
      validatePullRequest(pull_request, config)

    core.setOutput(outputState, validationState)
    core.setOutput(outputMessage, validationMessage)
    if (execute) {
      cmd(github, repository, pull_request, body)
      return core.info(validationMessage)
    } else {
      return core.info(validationMessage)
    }
  } catch (error) {
    core.setOutput(outputState, state.failed)
    core.setOutput(outputMessage, error.message)
    core.setFailed(error.message)
  }
}

module.exports = { run }
