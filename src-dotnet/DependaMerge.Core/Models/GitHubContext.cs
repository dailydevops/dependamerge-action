namespace DependaMerge.Core.Models;

/// <summary>
/// Represents GitHub context data.
/// </summary>
public class GitHubContext
{
    public required Repository Repository { get; init; }
    public required PullRequest PullRequest { get; init; }
}

/// <summary>
/// Represents a GitHub repository.
/// </summary>
public class Repository
{
    public required Owner Owner { get; init; }
    public required string Name { get; init; }
}

/// <summary>
/// Represents a repository owner.
/// </summary>
public class Owner
{
    public required string Login { get; init; }
}

/// <summary>
/// Represents a GitHub pull request.
/// </summary>
public record PullRequest
{
    public int Number { get; init; }
    public required string State { get; init; }
    public bool Merged { get; init; }
    public bool Draft { get; init; }
    public required User User { get; init; }
    public bool? Mergeable { get; init; }
    public string? MergeableState { get; init; }
    public required Base Base { get; init; }
    public required Head Head { get; init; }
}

/// <summary>
/// Represents a GitHub user.
/// </summary>
public class User
{
    public required string Login { get; init; }
}

/// <summary>
/// Represents the base branch of a pull request.
/// </summary>
public class Base
{
    public required string Ref { get; init; }
}

/// <summary>
/// Represents the head branch of a pull request.
/// </summary>
public class Head
{
    public required string Ref { get; init; }
}
