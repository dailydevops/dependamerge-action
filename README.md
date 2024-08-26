# DependaMerge - GitHub Action

GitHub Action that processes pull requests created and processed by
[dependabot[bot]](https://github.com/dependabot). Depending on the settings, the
pull request is approved and/or merged. The action is triggered by the
`pull_request` event and only processes pull requests created by
[dependabot[bot]](https://github.com/dependabot).

## Usage

The simplest variant of the pipeline configuration could look like this.
However, it is recommended to link this job with a build and test process. This
ensures that the code is tested before it is merged.

```yaml
name: DependaMerge

on:
  pull_request:

jobs:
  dependabot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: DependaMerge
        uses: dailydevops/dependamerge-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          command: squash # Not required, default is squash
          approve-only: false # Not required, default is false
          handle-submodule: false # Not required, default is false
          handle-dependency-group: true # Not required, default is true
          target: patch # Not required, default is patch
          skip-commit-verification: false # Not required, default is false
          skip-verification: false # Not required, default is false
```

### Inputs

| Name                       | Description                                                                                                                                                                                                                                                                                                                                                                                               | Required | Default                       | Available Values                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | ----------------------------- | -------------------------------- |
| `token`                    | GitHub token                                                                                                                                                                                                                                                                                                                                                                                              |    ✔    | `${{ secrets.GITHUB_TOKEN }}` | ---                              |
| `command`                  | Merge Method with which the pull request is to be merged.<br/><br/>Command `squash` is the default command. All commits are squashed into one commit and merged into the target branch.<br />Command `merge` merges the pull request with the target branch, keeping the commit history.<br />Command `rebase` only checks whether the PR is behind the current compare branch, if so, the PR is rebased. |    ❌    | `squash`                      | `squash`, `merge`, `rebase`      |
| `approve-only`             | If `true`, then the pull request is only approved, but not merged.                                                                                                                                                                                                                                                                                                                                        |    ❌    | `false`                       | `true`, `false`                  |
| `handle-submodule`         | If `true`, Git submodules are also merged.                                                                                                                                                                                                                                                                                                                                                                |    ❌    | `false`                       | `true`, `false`                  |
| `handle-dependency-group`  | If `true`, all pull requests of a dependency group are merged.                                                                                                                                                                                                                                                                                                                                            |    ❌    | `true`                        | `true`, `false`                  |
| `target`                   | The maximum target of the version comparison to be merged.                                                                                                                                                                                                                                                                                                                                                |    ❌    | `patch`                       | `major`, `minor`, `patch`, `any` |
| `skip-commit-verification` | If `true`, then the action will not expect the commits to have a verification signature. It is required to set this to true in GitHub Enterprise Server.                                                                                                                                                                                                                                                  |    ❌    | `false`                       | `true`, `false`                  |
| `skip-verification`        | If `true`, the action will not validate the user or the commit verification status.                                                                                                                                                                                                                                                                                                                       |    ❌    | `false`                       | `true`, `false`                  |

### Outputs

#### Output `state`

| Value      | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `approved` | The pull request has been approved.                               |
| `merged`   | The pull request has been merged.                                 |
| `skipped`  | The pull request is skipped and all processing steps are stopped. |
| `failed`   | The pull request could not be processed.                          |
| `rebased`  | The pull request was automatically rebased.                       |

#### Output `message`

The message contains further information about the processing state of the pull
request. In some cases it contains error/debug information.
