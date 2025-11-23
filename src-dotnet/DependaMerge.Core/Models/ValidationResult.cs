namespace DependaMerge.Core.Models;

/// <summary>
/// Represents the result of pull request validation.
/// </summary>
public class ValidationResult
{
    public bool Execute { get; init; }
    public string? Body { get; init; }
    public Func<GitHubClient, Repository, PullRequest, string?, Task>? Command { get; init; }
    public required string ValidationState { get; init; }
    public required string ValidationMessage { get; init; }
}
