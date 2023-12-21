'use strict'

export async function approvePullRequest(github, repo, { number }, body) {
  await github.rest.pulls.createReview({
    ...repo,
    pull_number: number,
    event: 'APPROVE',
    body
  })
}

export async function addComment(github, repo, { number }, body) {
  await github.rest.issues.createComment({
    ...repo,
    issue_number: number,
    body
  })
}
