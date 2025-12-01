namespace DependaMerge.Core.Models;

/// <summary>
/// Represents the input configuration for the action.
/// </summary>
public record ActionInputs
{
    public required string Token { get; init; }
    public bool ApproveOnly { get; init; }
    public required string CommandMethod { get; init; }
    public bool HandleSubmodule { get; init; }
    public bool HandleDependencyGroup { get; init; }
    public required string Target { get; init; }
    public bool SkipCommitVerification { get; init; }
    public bool SkipVerification { get; init; }
}
