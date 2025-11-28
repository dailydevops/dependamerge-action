using DependaMerge.Core.Models;

namespace DependaMerge.Core;

/// <summary>
/// Utility methods for processing pull requests.
/// </summary>
public static class Utils
{
    private const string DependabotUser = "dependabot[bot]";

    /// <summary>
    /// Retrieves the appropriate command based on the given inputs.
    /// </summary>
    public static string GetCommand(string? command)
    {
        return command switch
        {
            "merge" => CommandText.Merge,
            "rebase" => CommandText.Rebase,
            _ => CommandText.Squash
        };
    }

    /// <summary>
    /// Parses and validates action inputs.
    /// </summary>
    public static ActionInputs GetInputs(Dictionary<string, string> inputs)
    {
        return new ActionInputs
        {
            Token = inputs.GetValueOrDefault("token", string.Empty),
            ApproveOnly = inputs.GetValueOrDefault("approve-only", "false") == "true",
            CommandMethod = GetCommand(inputs.GetValueOrDefault("command")),
            HandleSubmodule = inputs.GetValueOrDefault("handle-submodule", "false") == "true",
            HandleDependencyGroup = inputs.GetValueOrDefault("handle-dependency-group", "true") == "true",
            Target = UpdateTypes.MapUpdateType(inputs.GetValueOrDefault("target")),
            SkipCommitVerification = inputs.GetValueOrDefault("skip-commit-verification", "false") == "true",
            SkipVerification = inputs.GetValueOrDefault("skip-verification", "false") == "true"
        };
    }

    /// <summary>
    /// Parses metadata from dependabot.
    /// </summary>
    public static ActionMetadata GetMetadata(Dictionary<string, string> metadata)
    {
        return new ActionMetadata
        {
            DependencyNames = metadata.GetValueOrDefault("dependency-names", string.Empty),
            DependencyType = metadata.GetValueOrDefault("dependency-type", string.Empty),
            UpdateType = metadata.GetValueOrDefault("update-type", string.Empty),
            Ecosystem = metadata.GetValueOrDefault("package-ecosystem", string.Empty),
            TargetBranch = metadata.GetValueOrDefault("target-branch", string.Empty),
            PreviousVersion = metadata.GetValueOrDefault("previous-version", string.Empty),
            NewVersion = metadata.GetValueOrDefault("new-version", string.Empty),
            CompatibilityScore = metadata.GetValueOrDefault("compatibility-score", string.Empty),
            MaintainerChanges = metadata.GetValueOrDefault("maintainer-changes", string.Empty),
            DependencyGroup = metadata.GetValueOrDefault("dependency-group", string.Empty),
            AlertState = metadata.GetValueOrDefault("alert-state", string.Empty),
            GhsaId = metadata.GetValueOrDefault("ghsa-id", string.Empty),
            Cvss = metadata.GetValueOrDefault("cvss", string.Empty)
        };
    }

    /// <summary>
    /// Validates a pull request and determines the action to take.
    /// </summary>
    public static async Task<ValidationResult> ValidatePullRequestAsync(
        GitHubClient github,
        Models.Repository repository,
        Models.PullRequest pullRequest,
        ActionInputs inputs,
        ActionMetadata metadata)
    {
        // Check if PR is open and not merged
        if (pullRequest.State != "open" || pullRequest.Merged)
        {
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = "Pull request is not open or already merged."
            };
        }

        // Check if PR is a draft
        if (pullRequest.Draft)
        {
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = "Pull request is a draft."
            };
        }

        // Check if PR was created by dependabot
        if (!inputs.SkipVerification && pullRequest.User.Login != DependabotUser)
        {
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = $"The Commit/PullRequest was not created by {DependabotUser}."
            };
        }

        // Handle git submodules
        if (metadata.Ecosystem == "gitsubmodule")
        {
            if (!inputs.HandleSubmodule)
            {
                return new ValidationResult
                {
                    Execute = false,
                    ValidationState = State.Skipped,
                    ValidationMessage = "The pull-request is associated with a submodule but the action is not configured to handle submodules."
                };
            }
            // Override target for submodules
            inputs = inputs with { Target = UpdateTypes.Any };
        }

        // Handle dependency groups
        if (!inputs.HandleDependencyGroup && !string.IsNullOrEmpty(metadata.DependencyGroup))
        {
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = "The pull-request is associated with a dependency group but the action is not configured to handle dependency groups."
            };
        }

        // Handle rebase command
        if (inputs.CommandMethod == CommandText.Rebase)
        {
            return await RebasePullRequestAsync(github, repository, pullRequest);
        }
        else
        {
            return await MergePullRequestAsync(github, repository, pullRequest, inputs, metadata);
        }
    }

    /// <summary>
    /// Handles rebasing a pull request.
    /// </summary>
    private static async Task<ValidationResult> RebasePullRequestAsync(
        GitHubClient github,
        Models.Repository repository,
        Models.PullRequest pullRequest)
    {
        var compareData = await github.ComparePullRequestAsync(repository, pullRequest);

        if (compareData?.Status == "behind" && compareData.BehindBy > 0)
        {
            return new ValidationResult
            {
                Execute = true,
                Body = $"@dependabot {CommandText.Rebase}",
                Command = (g, r, p, b) => g.AddCommentAsync(r, p, b!),
                ValidationState = State.Rebased,
                ValidationMessage = "The pull request will be rebased."
            };
        }
        else
        {
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = "The pull request is not behind the target branch."
            };
        }
    }

    /// <summary>
    /// Handles merging a pull request.
    /// </summary>
    private static async Task<ValidationResult> MergePullRequestAsync(
        GitHubClient github,
        Models.Repository repository,
        Models.PullRequest pullRequest,
        ActionInputs inputs,
        ActionMetadata metadata)
    {
        // Check mergeability with retry logic
        int retryCount = 0;
        bool mergeabilityResolved = pullRequest.Mergeable != null;

        while (!mergeabilityResolved && retryCount < 5)
        {
            try
            {
                CoreLogger.Info($"Pull request mergeability is not resolved. Retry count: {retryCount}");

                var prData = await github.GetPullRequestAsync(repository, pullRequest);

                if (prData.Mergeable == null)
                {
                    CoreLogger.Info("Pull request mergeability is not yet resolved... retrying in 5 seconds.");
                    retryCount++;
                    await Task.Delay(5000);
                }
                else
                {
                    mergeabilityResolved = true;
                    pullRequest = pullRequest with { Mergeable = prData.Mergeable, MergeableState = prData.MergeableState?.StringValue };
                }
            }
            catch (Exception apiError)
            {
                return new ValidationResult
                {
                    Execute = false,
                    ValidationState = State.Skipped,
                    ValidationMessage = $"An error occurred fetching the PR from Github: {apiError.Message}"
                };
            }
        }

        // Check if PR is behind
        if (pullRequest.MergeableState == "behind")
        {
            return new ValidationResult
            {
                Execute = true,
                Body = $"@dependabot {CommandText.Rebase}",
                Command = (g, r, p, b) => g.AddCommentAsync(r, p, b!),
                ValidationState = State.Rebased,
                ValidationMessage = "The pull request will be rebased."
            };
        }

        // Check if PR is blocked or has conflicts
        if (pullRequest.MergeableState == "blocked" || pullRequest.MergeableState == "dirty")
        {
            CoreLogger.Info($"Pull request merge is blocked by conflicts. State: {pullRequest.MergeableState}");
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = "Pull request merge is blocked by conflicts, please resolve them manually."
            };
        }

        // Check version update type
        bool treatVersion = inputs.Target == UpdateTypes.Any ||
            Array.IndexOf(UpdateTypes.Priority, metadata.UpdateType) <=
            Array.IndexOf(UpdateTypes.Priority, inputs.Target);

        CoreLogger.Info($"Check package '{metadata.DependencyNames}' - Old: '{metadata.PreviousVersion}' New: '{metadata.NewVersion}'");
        CoreLogger.Info($"Is the package version treated? - {treatVersion}");

        if (!treatVersion)
        {
            return new ValidationResult
            {
                Execute = false,
                ValidationState = State.Skipped,
                ValidationMessage = "The package version is not treated by the action."
            };
        }

        // Approve only mode
        if (inputs.ApproveOnly)
        {
            return new ValidationResult
            {
                Execute = true,
                Body = "Approved by DependaMerge.",
                Command = (g, r, p, b) => g.ApprovePullRequestAsync(r, p, b!),
                ValidationState = State.Approved,
                ValidationMessage = "The pull request will be approved."
            };
        }

        // Merge the PR
        return new ValidationResult
        {
            Execute = true,
            Body = $"@dependabot {inputs.CommandMethod}",
            Command = (g, r, p, b) => g.ApprovePullRequestAsync(r, p, b!),
            ValidationState = State.Merged,
            ValidationMessage = "The pull request will be merged."
        };
    }
}
