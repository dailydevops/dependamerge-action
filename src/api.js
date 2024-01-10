'use strict'

async function addComment(github, repo, pull_request, body) {
  await github.rest.issues.createComment({
    owner: repo.owner.login,
    repo: repo.name,
    issue_number: pull_request.number,
    body
  })
}

async function approvePullRequest(github, repo, pull_request, body) {
  await github.rest.pulls.createReview({
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pull_request.number,
    event: 'APPROVE',
    body
  })
}

async function comparePullRequest(github, repo, pull_request) {
  return await github.rest.repos.compare({
    owner: repo.owner.login,
    repo: repo.name,
    basehead: `${pull_request.base.ref}...${pull_request.head.ref}`
  })
}

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
