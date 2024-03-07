// Import the functions to be tested
const { getInputs, state, validatePullRequest } = require('../src/utils')

// Mock for dependencies (in this case, for the GitHub "core" module)
jest.mock('@actions/core')

const basePullRequest = {
  base: {
    ref: ''
  },
  head: {
    ref: ''
  }
}

const mockCompare = jest.fn()
mockCompare.mockReturnValue({
  data: {
    status: 'before',
    behind_by: 0
  }
})

const mockGetPullRequest = jest.fn()
mockGetPullRequest.mockReturnValue({
  data: {
    mergeable: true
  }
})
// Mock for the object `github` that is passed to the action
const github = {
  rest: {
    issues: {
      createComment: jest.fn()
    },
    pulls: {
      createReview: jest.fn(),
      get: mockGetPullRequest
    },
    repos: {
      compare: mockCompare
    }
  }
}

// Mock for the object `repository` that is passed to the action
const repository = {
  owner: {
    login: 'dependabot[bot]'
  },
  name: 'test-repo'
}

describe('Tests for `getInputs` function', () => {
  test.each([
    ['merge', 'merge'],
    ['squash', 'squash and merge'],
    [undefined, 'squash and merge']
  ])('input command `%s` should return `%s`', (command, expected) => {
    const inputs = {
      command
    }

    const result = getInputs(inputs)

    expect(result.commandMethod).toBe(expected)
  })

  test.each([
    ['true', true],
    ['false', false],
    [undefined, false]
  ])('input approve-only `%s` should return `%s`', (approveOnly, expected) => {
    const inputs = {
      'approve-only': approveOnly
    }

    const result = getInputs(inputs)

    expect(result.approveOnly).toBe(expected)
  })

  test.each([
    ['true', true],
    ['false', false],
    [undefined, false]
  ])(
    'input handle-submodule `%s` should return `%s`',
    (handleSubmodule, expected) => {
      const inputs = {
        'handle-submodule': handleSubmodule
      }

      const result = getInputs(inputs)

      expect(result.handleSubmodule).toBe(expected)
    }
  )

  test.each([
    ['true', true],
    ['false', false],
    [undefined, false]
  ])(
    'input handle-dependency-group `%s` should return `%s`',
    (handleDependencyGroup, expected) => {
      const inputs = {
        'handle-dependency-group': handleDependencyGroup
      }

      const result = getInputs(inputs)

      expect(result.handleDependencyGroup).toBe(expected)
    }
  )

  test.each([
    ['major', 'version-update:semver-major'],
    ['minor', 'version-update:semver-minor'],
    ['patch', 'version-update:semver-patch'],
    ['any', 'version-update:semver-any'],
    [undefined, 'version-update:semver-patch']
  ])('input target `%s` should return `%s`', (target, expected) => {
    const inputs = {
      target
    }

    const result = getInputs(inputs)

    expect(result.target).toBe(expected)
  })

  test.each([
    ['true', true],
    ['false', false],
    [undefined, false]
  ])(
    'input skip-commit-verification `%s` should return `%s`',
    (skipCommitVerification, expected) => {
      const inputs = {
        'skip-commit-verification': skipCommitVerification
      }

      const result = getInputs(inputs)

      expect(result.skipCommitVerification).toBe(expected)
    }
  )

  test.each([
    ['true', true],
    ['false', false],
    [undefined, false]
  ])(
    'input skip-verification `%s` should return `%s`',
    (skipVerification, expected) => {
      const inputs = {
        'skip-verification': skipVerification
      }

      const result = getInputs(inputs)

      expect(result.skipVerification).toBe(expected)
    }
  )
})

describe('Tests for `validatePullRequest` function', () => {
  test('should return `false` when pull request is already merged', async () => {
    const pullRequest = {
      merged: true
    }

    const config = {
      inputs: {
        approveOnly: false
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(false)
    expect(result.validationState).toBe(state.skipped)
    expect(result.validationMessage).toBe(
      'Pull request is not open or already merged.'
    )
  })

  test('should return `false` when pull request is not open', async () => {
    const pullRequest = {
      merged: false,
      state: 'closed'
    }

    const config = {
      inputs: {
        approveOnly: false
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(false)
    expect(result.validationState).toBe(state.skipped)
    expect(result.validationMessage).toBe(
      'Pull request is not open or already merged.'
    )
  })

  test('should return `false` when pull request is a draft', async () => {
    const pullRequest = {
      merged: false,
      state: 'open',
      draft: 'true'
    }

    const config = {
      inputs: {
        approveOnly: false
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(false)
    expect(result.validationState).toBe(state.skipped)
    expect(result.validationMessage).toBe('Pull request is a draft.')
  })

  test('should return `false` when pull request was not created by dependabot', async () => {
    const pullRequest = {
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'not-dependabot'
      }
    }

    const config = {
      inputs: {
        approveOnly: false
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(false)
    expect(result.validationState).toBe(state.skipped)
    expect(result.validationMessage).toBe(
      'The Commit/PullRequest was not created by dependabot[bot].'
    )
  })

  test('should return `false` when pull request is associated with a submodule but the action is not configured to handle submodules', async () => {
    const pullRequest = {
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'dependabot[bot]'
      }
    }

    const config = {
      inputs: {
        approveOnly: false,
        handleSubmodule: false
      },
      metadata: {
        ecosystem: 'gitsubmodule'
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(false)
    expect(result.validationState).toBe(state.skipped)
    expect(result.validationMessage).toBe(
      'The pull-request is associated with a submodule but the action is not configured to handle submodules.'
    )
  })

  test('should return `false` when pull request is associated with a dependency group but the action is not configured to handle dependency groups', async () => {
    const pullRequest = {
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'dependabot[bot]'
      }
    }

    const config = {
      inputs: {
        approveOnly: false,
        handleSubmodule: true,
        handleDependencyGroup: false
      },
      metadata: {
        ecosystem: 'gitsubmodule',
        dependencyGroup: 'mock-group'
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(false)
    expect(result.validationState).toBe(state.skipped)
    expect(result.validationMessage).toBe(
      'The pull-request is associated with a dependency group but the action is not configured to handle dependency groups.'
    )
  })

  test('should return `true` after compare commits', async () => {
    mockCompare.mockReturnValueOnce({
      data: {
        status: 'behind',
        behind_by: 2
      }
    })

    const pullRequest = {
      ...basePullRequest,
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'dependabot[bot]'
      },
      mergeable: true,
      mergeable_state: 'behind'
    }

    const config = {
      inputs: {
        approveOnly: false,
        handleSubmodule: true,
        handleDependencyGroup: true
      },
      metadata: {}
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(true)
    expect(result.body).toBe('@dependabot rebase')
    expect(result.validationState).toBe(state.rebased)
    expect(result.validationMessage).toBe('The pull request will be rebased.')
  })

  test('should return `true` when pull request has a mergeable state of `null`', async () => {
    mockGetPullRequest.mockReturnValueOnce({
      data: {
        mergeable: null,
        mergeable_state: 'behind'
      }
    })

    const pullRequest = {
      ...basePullRequest,
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'dependabot[bot]'
      },
      mergeable: null,
      mergeable_state: 'behind'
    }

    const config = {
      inputs: {
        approveOnly: false,
        handleSubmodule: true,
        handleDependencyGroup: true
      },
      metadata: {}
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(true)
    expect(result.body).toBe('@dependabot rebase')
    expect(result.validationState).toBe(state.rebased)
    expect(result.validationMessage).toBe('The pull request will be rebased.')
  }, 15000)

  test('should return `true` when pull request has a mergeable state of `behind`', async () => {
    const pullRequest = {
      ...basePullRequest,
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'dependabot[bot]'
      },
      mergeable: true,
      mergeable_state: 'behind'
    }

    const config = {
      inputs: {
        approveOnly: false,
        handleSubmodule: true,
        handleDependencyGroup: true
      },
      metadata: {}
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(true)
    expect(result.body).toBe('@dependabot rebase')
    expect(result.validationState).toBe(state.rebased)
    expect(result.validationMessage).toBe('The pull request will be rebased.')
  })

  test.each([['dirty'], ['blocked']])(
    'should return `false` when pull request has a mergeable state of `%s`',
    async mergeableState => {
      const pullRequest = {
        ...basePullRequest,
        merged: false,
        state: 'open',
        draft: false,
        user: {
          login: 'dependabot[bot]'
        },
        mergeable: true,
        mergeable_state: mergeableState
      }

      const config = {
        inputs: {
          approveOnly: false,
          handleSubmodule: true,
          handleDependencyGroup: true
        },
        metadata: {}
      }

      const result = await validatePullRequest(
        github,
        repository,
        pullRequest,
        config
      )

      expect(result.execute).toBe(false)
      expect(result.validationState).toBe(state.skipped)
      expect(result.validationMessage).toBe(
        'Pull request merge is blocked by conflicts, please resolve them manually.'
      )
    }
  )

  test.each([
    ['version-update:semver-minor', 'version-update:semver-major'],
    ['version-update:semver-patch', 'version-update:semver-minor']
  ])(
    'should return `false` when pull request has a target `%s` and update type `%s`',
    async (target, updateType) => {
      const pullRequest = {
        ...basePullRequest,
        merged: false,
        state: 'open',
        draft: false,
        user: {
          login: 'dependabot[bot]'
        },
        mergeable: true
      }

      const config = {
        inputs: {
          approveOnly: false,
          handleSubmodule: true,
          handleDependencyGroup: true,
          target
        },
        metadata: {
          updateType
        }
      }

      const result = await validatePullRequest(
        github,
        repository,
        pullRequest,
        config
      )

      expect(result.execute).toBe(false)
      expect(result.validationState).toBe(state.skipped)
      expect(result.validationMessage).toBe(
        'The package version is not treated by the action.'
      )
    }
  )

  test.each([
    ['version-update:semver-major', 'version-update:semver-major', 'merge'],
    [
      'version-update:semver-minor',
      'version-update:semver-minor',
      'squash and merge'
    ],
    ['version-update:semver-patch', 'version-update:semver-patch', 'merge'],
    [
      'version-update:semver-any',
      'version-update:semver-any',
      'squash and merge'
    ]
  ])(
    'should return `true` when pull request has a target `%s` and update type `%s` and command `%s`',
    async (target, updateType, cmd) => {
      const pullRequest = {
        ...basePullRequest,
        merged: false,
        state: 'open',
        draft: false,
        user: {
          login: 'dependabot[bot]'
        },
        mergeable: true
      }

      const config = {
        inputs: {
          approveOnly: false,
          handleSubmodule: false,
          handleDependencyGroup: true,
          target,
          commandMethod: cmd
        },
        metadata: {
          updateType
        }
      }

      const result = await validatePullRequest(
        github,
        repository,
        pullRequest,
        config
      )

      expect(result.execute).toBe(true)
      expect(result.body).toBe(`@dependabot ${cmd}`)
      expect(result.validationState).toBe(state.merged)
      expect(result.validationMessage).toBe('The pull request will be merged.')
    }
  )

  test('should return `true` when pull request has approve-only enabled', async () => {
    const pullRequest = {
      ...basePullRequest,
      merged: false,
      state: 'open',
      draft: false,
      user: {
        login: 'dependabot[bot]'
      },
      mergeable: true
    }

    const config = {
      inputs: {
        approveOnly: true,
        handleSubmodule: false,
        handleDependencyGroup: true,
        target: 'version-update:semver-patch',
        commandMethod: 'merge'
      },
      metadata: {
        updateType: 'version-update:semver-patch'
      }
    }

    const result = await validatePullRequest(
      github,
      repository,
      pullRequest,
      config
    )

    expect(result.execute).toBe(true)
    expect(result.body).toBe('Approved by DependaMerge.')
    expect(result.validationState).toBe(state.approved)
    expect(result.validationMessage).toBe('The pull request will be approved.')
  })
})
