const {
  addComment,
  approvePullRequest,
  comparePullRequest,
  getPullRequest
} = require('../src/api')

// Mock for the GitHub API client
const github = {
  rest: {
    issues: {
      createComment: jest.fn()
    },
    pulls: {
      createReview: jest.fn()
    },
    repos: {
      compare: jest.fn(),
      get: jest.fn()
    }
  }
}

// Mock data for the repository and pull request
const repo = {
  owner: {
    login: 'test-owner'
  },
  name: 'test-repo'
}

const pullRequest = {
  base: {
    ref: 'base-branch'
  },
  number: 123,
  head: {
    ref: 'head-branch'
  }
}

describe('Tests for `addComment` function', () => {
  test('should add a comment to the pull request', async () => {
    const body = 'This is a test comment.'

    await addComment(github, repo, pullRequest, body)

    expect(github.rest.issues.createComment).toHaveBeenCalledWith({
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: pullRequest.number,
      body
    })
  })
  test('should approve the pull request', async () => {
    const body = 'This is a test review.'

    await approvePullRequest(github, repo, pullRequest, body)

    expect(github.rest.pulls.createReview).toHaveBeenCalledWith({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pullRequest.number,
      event: 'APPROVE',
      body
    })
  })
  test('should compare a pull request in a GitHub repository', async () => {
    const baseRef = 'base-branch'
    const headRef = 'head-branch'

    const comparisonResult = {
      // Mock comparison result
    }

    github.rest.repos.compare = jest.fn().mockResolvedValue(comparisonResult)

    const result = await comparePullRequest(github, repo, pullRequest)

    expect(github.rest.repos.compare).toHaveBeenCalledWith({
      owner: repo.owner.login,
      repo: repo.name,
      basehead: `${baseRef}...${headRef}`
    })

    expect(result).toBe(comparisonResult)
  })
  test('should retrieve a pull request from a GitHub repository', async () => {
    const pullRequestData = {
      // Mock pull request data
    }

    github.rest.pulls.get = jest.fn().mockResolvedValue(pullRequestData)

    const result = await getPullRequest(github, repo, pullRequest)

    expect(github.rest.pulls.get).toHaveBeenCalledWith({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pullRequest.number
    })

    expect(result).toBe(pullRequestData)
  })
})
