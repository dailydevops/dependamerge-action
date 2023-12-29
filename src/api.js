'use strict'

async function approvePullRequest(github, repo, pull_request, body) {
  await github.rest.pulls.createReview({
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pull_request.number,
    event: 'APPROVE',
    body
  })
}

async function addComment(github, repo, pull_request, body) {
  await github.rest.issues.createComment({
    owner: repo.owner.login,
    repo: repo.name,
    issue_number: pull_request.number,
    body
  })
}

module.exports = {
  approvePullRequest,
  addComment
}
