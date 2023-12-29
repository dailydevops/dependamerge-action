const core = require('@actions/core')
const { run } = require('../src/index')
const { validatePullRequest, state } = require('../src/utils')

// Mock for dependencies (in this case, for the GitHub "core" module)
jest.mock('@actions/core')

const mockValidatePullRequest = jest.fn('validatePullRequest', '../src/utils')

describe('DependaMerge Action', () => {
  test('should set output state to "failed" when github is not provided', async () => {
    const github = null
    const context = null
    const inputs = null
    const metadata = null

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.failed)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('No github provided!')
    )
  })

  test('should set output state to "failed" when context is not provided', async () => {
    const github = {}
    const context = null
    const inputs = null
    const metadata = null

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.failed)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('No context provided!')
    )
  })

  test('should set output state to "failed" when inputs are not provided', async () => {
    const github = {}
    const context = {}
    const inputs = null
    const metadata = null

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.failed)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('No inputs provided!')
    )
  })

  test('should set output state to "failed" when metadata is not provided', async () => {
    const github = {}
    const context = {}
    const inputs = {}
    const metadata = null

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.failed)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('No metadata provided!')
    )
  })

  test('should set output state to "failed" when validation fails', async () => {
    const github = {}
    const context = {}
    const inputs = {}
    const metadata = {}

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.failed)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('Cannot destructure property')
    )
  })

  test('should set output state to "skipped" when pull-request already merged', async () => {
    const github = {}
    const context = {
      payload: {
        pull_request: {
          state: 'merged'
        }
      }
    }
    const inputs = {}
    const metadata = {}

    mockValidatePullRequest.mockReturnValue({
      execute: false,
      validationState: state.skipped,
      validationMessage: 'Pull request is not open or already merged.'
    })

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.skipped)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('Pull request is not open or already merged.')
    )
  })

  test('should set output state to "skipped" when pull-request is a draft', async () => {
    const github = {}
    const context = {
      payload: {
        pull_request: {
          state: 'open',
          merged: false,
          draft: true
        }
      }
    }
    const inputs = {}
    const metadata = {}

    mockValidatePullRequest.mockReturnValue({
      execute: false,
      validationState: state.skipped,
      validationMessage: 'Pull request is a draft.'
    })

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.skipped)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining('Pull request is a draft.')
    )
  })

  test('should set output state to "skipped" when pull-request is not created by dependabot', async () => {
    const github = {}
    const context = {
      payload: {
        pull_request: {
          state: 'open',
          merged: false,
          draft: false,
          user: {
            login: 'not-dependabot'
          }
        }
      }
    }
    const inputs = {}
    const metadata = {}

    mockValidatePullRequest.mockReturnValue({
      execute: false,
      validationState: state.skipped,
      validationMessage:
        'The Commit/PullRequest was not created by dependabot[bot].'
    })

    await run({ github, context, inputs, metadata })

    expect(core.setOutput).toHaveBeenCalledWith('state', state.skipped)
    expect(core.setOutput).toHaveBeenCalledWith(
      'message',
      expect.stringContaining(
        'The Commit/PullRequest was not created by dependabot[bot].'
      )
    )
  })
})
