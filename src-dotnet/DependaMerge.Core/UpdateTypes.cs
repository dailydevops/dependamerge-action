namespace DependaMerge.Core;

/// <summary>
/// Update types for version updates.
/// </summary>
public static class UpdateTypes
{
    public const string Major = "version-update:semver-major";
    public const string Minor = "version-update:semver-minor";
    public const string Patch = "version-update:semver-patch";
    public const string Any = "version-update:semver-any";

    public static readonly string[] Priority = [
        Patch,
        Minor,
        Major,
        Any
    ];

    public static string MapUpdateType(string? input)
    {
        return input switch
        {
            "major" => Major,
            "minor" => Minor,
            "patch" => Patch,
            "any" => Any,
            _ => Patch
        };
    }
}
