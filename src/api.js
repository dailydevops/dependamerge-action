'use strict'

export async function approvePullRequest(github, repo, pull_request, body) {
  await github.rest.pulls.createReview({
    owner: repo.owner.login,
    pull_number: pull_request.number,
    event: 'APPROVE',
    body
  })
}

export async function addComment(github, repo, pull_request, body) {
  await github.rest.issues.createComment({
    owner: repo.owner.login,
    repo: repo.name,
    issue_number: pull_request.number,
    body
  })
}
