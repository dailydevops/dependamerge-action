'use strict'

/**
 * Adds a comment to a pull request on GitHub.
 *
 * @param {object} github - The GitHub API client.
 * @param {object} repo - The repository object containing owner and name properties.
 * @param {object} pull_request - The pull request object containing number property.
 * @param {string} body - The body of the comment.
 * @returns {Promise<void>} - A promise that resolves when the comment is added.
 */
async function addComment(github, repo, pull_request, body) {
  await github.rest.issues.createComment({
    owner: repo.owner.login,
    repo: repo.name,
    issue_number: pull_request.number,
    body
  })
}

/**
 * Approves a pull request.
 *
 * @param {object} github - The GitHub API client.
 * @param {object} repo - The repository object.
 * @param {object} pull_request - The pull request object.
 * @param {string} body - The body of the review.
 * @returns {Promise<void>} - A promise that resolves when the pull request is approved.
 */
async function approvePullRequest(github, repo, pull_request, body) {
  await github.rest.pulls.createReview({
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pull_request.number,
    event: 'APPROVE',
    body
  })
}

/**
 * Compares a pull request in a GitHub repository.
 *
 * @param {object} github - The GitHub API client.
 * @param {object} repo - The repository object containing owner and name properties.
 * @param {object} pull_request - The pull request object containing base and head properties.
 * @returns {Promise<object>} - A promise that resolves to the comparison result.
 */
async function comparePullRequest(github, repo, pull_request) {
  return await github.rest.repos.compare({
    owner: repo.owner.login,
    repo: repo.name,
    basehead: `${pull_request.base.ref}...${pull_request.head.ref}`
  })
}

/**
 * Retrieves a pull request from a GitHub repository.
 *
 * @param {object} github - The GitHub API client.
 * @param {object} repo - The repository object containing owner and name properties.
 * @param {object} pull_request - The pull request object containing number property.
 * @returns {Promise<object>} - A promise that resolves to the pull request object.
 */
async function getPullRequest(github, repo, pull_request) {
  return await github.rest.pulls.get({
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pull_request.number
  })
}

module.exports = {
  addComment,
  approvePullRequest,
  comparePullRequest,
  getPullRequest
}
