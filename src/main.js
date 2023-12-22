import * as core from '@actions/core'

import { getInputs, getMetadata, state, validatePullRequest } from './utils'

const outputState = 'state'
const outputMessage = 'message'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export default async function run({ github, context, inputs, metadata }) {
  try {
    if (metadata === null || metadata === undefined) {
      const msg =
        'No metadata provided! Please validate your configuration, especially the properties `skip-commit-verification` and `skip-verification`.'

      core.setOutput(outputState, state.failed)
      core.setOutput(outputMessage, msg)
      core.setFailed(msg)
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
      await cmd(github, repository, pull_request, body)
      return core.info(validationMessage)
    } else {
      return core.warning(validationMessage)
    }
  } catch (error) {
    core.setOutput(outputState, state.failed)
    core.setOutput(outputMessage, error.message)
    core.setFailed(error.message)
  }
}
