namespace DependaMerge.Core.Models;

/// <summary>
/// Represents metadata from dependabot.
/// </summary>
public class ActionMetadata
{
    public string DependencyNames { get; init; } = string.Empty;
    public string DependencyType { get; init; } = string.Empty;
    public string UpdateType { get; init; } = string.Empty;
    public string Ecosystem { get; init; } = string.Empty;
    public string TargetBranch { get; init; } = string.Empty;
    public string PreviousVersion { get; init; } = string.Empty;
    public string NewVersion { get; init; } = string.Empty;
    public string CompatibilityScore { get; init; } = string.Empty;
    public string MaintainerChanges { get; init; } = string.Empty;
    public string DependencyGroup { get; init; } = string.Empty;
    public string AlertState { get; init; } = string.Empty;
    public string GhsaId { get; init; } = string.Empty;
    public string Cvss { get; init; } = string.Empty;
}
