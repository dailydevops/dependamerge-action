# DependaMerge - GitHub Action

GitHub Action that processes pull requests created and processed by [dependabot[bot]](https://github.com/dependabot). Depending on the settings, the pull request is approved and/or merged.
The action is triggered by the `pull_request` event and only processes pull requests created by [dependabot[bot]](https://github.com/dependabot).

## Usage
The simplest variant of the pipeline configuration could look like this. However, it is recommended to link this job with a build and test process. This ensures that the code is tested before it is merged.

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
          command: squash
```

### Inputs

| Name | Description | Required | Default | Available Values |
| --- | --- |:---:| --- | --- |
| `token` | GitHub token | ✔ | `${{ secrets.GITHUB_TOKEN }}` | --- |
| `command` | Merge Method with which the pull request is to be merged. | ❌ | `squash` | `squash`, `merge` |
| `approve-only` | If `true`, then the pull request is only approved, but not merged. | ❌ | `false` | `true`, `false` |
| `handle-submodule` | If `true`, Git submodules are also merged. | ❌ | `false` | `true`, `false` |
| `handle-dependency-group` | If `true`, all pull requests of a dependency group are merged. | ❌ | `true` | `true`, `false` |
| `target` | The maximum target of the version comparison to be merged. | ❌ | `patch` | `major`, `minor`, `patch`, `any` |
| `skip-commit-verification` | If `true`, then the action will not expect the commits to have a verification signature. It is required to set this to true in GitHub Enterprise Server. | ❌ | `false` | `true`, `false` |
| `skip-verification` | If `true`, the action will not validate the user or the commit verification status. | ❌ | `false` | `true`, `false` |

### Outputs

#### Output `state`
| Value | Description |
| --- | --- |
| `approved` | The pull request has been approved. |
| `merged` | The pull request has been merged. |
| `skipped` | The pull request is skipped and all processing steps are stopped. |
| `failed` | The pull request could not be processed. |
| `rebased` | The pull request was automatically rebased. |

#### Output `message`

The message contains further information about the processing state of the pull request. In some cases it contains error/debug information.