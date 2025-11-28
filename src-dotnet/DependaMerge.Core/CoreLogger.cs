namespace DependaMerge.Core;

/// <summary>
/// Wrapper for GitHub Actions Core logging functionality.
/// </summary>
public static class CoreLogger
{
    public static void Info(string message)
    {
        Console.WriteLine(message);
    }

    public static void Debug(string message)
    {
        Console.WriteLine($"::debug::{message}");
    }

    public static void StartGroup(string name)
    {
        Console.WriteLine($"::group::{name}");
    }

    public static void EndGroup()
    {
        Console.WriteLine("::endgroup::");
    }

    public static void SetOutput(string name, string value)
    {
        var outputFile = Environment.GetEnvironmentVariable("GITHUB_OUTPUT");
        if (!string.IsNullOrEmpty(outputFile))
        {
            File.AppendAllText(outputFile, $"{name}={value}\n");
        }
        else
        {
            Console.WriteLine($"::set-output name={name}::{value}");
        }
    }

    public static void SetFailed(string message)
    {
        Console.WriteLine($"::error::{message}");
        Environment.ExitCode = 1;
    }
}
