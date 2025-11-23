namespace DependaMerge.Core;

/// <summary>
/// Represents the state of the pull request processing.
/// </summary>
public static class State
{
    public const string Approved = "approved";
    public const string Merged = "merged";
    public const string Skipped = "skipped";
    public const string Failed = "failed";
    public const string Rebased = "rebased";
}
