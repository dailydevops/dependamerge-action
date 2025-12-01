using DependaMerge.Core;
using DependaMerge.Core.Models;
using System.Text.Json;

const string OutputState = "state";
const string OutputMessage = "message";

try
{
    // Read GitHub context from environment
    var contextJson = Environment.GetEnvironmentVariable("GITHUB_CONTEXT");
    if (string.IsNullOrEmpty(contextJson))
    {
        SetFailure("No GitHub context provided! GITHUB_CONTEXT environment variable is missing.");
        return;
    }

    var inputsJson = Environment.GetEnvironmentVariable("INPUT_DATA");
    if (string.IsNullOrEmpty(inputsJson))
    {
        SetFailure("No inputs provided! INPUT_DATA environment variable is missing.");
        return;
    }

    var metadataJson = Environment.GetEnvironmentVariable("METADATA");
    if (string.IsNullOrEmpty(metadataJson))
    {
        SetFailure("No metadata provided! METADATA environment variable is missing.");
        return;
    }

    // Parse inputs
    var inputsDict = JsonSerializer.Deserialize<Dictionary<string, string>>(inputsJson);
    if (inputsDict == null)
    {
        SetFailure("Failed to parse inputs JSON.");
        return;
    }

    // Parse metadata
    var metadataDict = JsonSerializer.Deserialize<Dictionary<string, string>>(metadataJson);
    if (metadataDict == null)
    {
        SetFailure("Failed to parse metadata JSON.");
        return;
    }

    // Parse GitHub context
    var contextData = JsonSerializer.Deserialize<JsonElement>(contextJson);
    var payload = contextData.GetProperty("payload");

    var repository = ParseRepository(payload.GetProperty("repository"));
    var pullRequest = ParsePullRequest(payload.GetProperty("pull_request"));

    CoreLogger.StartGroup("Input Values");
    CoreLogger.Debug($"Context: {contextJson}");
    CoreLogger.Debug($"Inputs: {inputsJson}");
    CoreLogger.Debug($"Metadata: {metadataJson}");
    CoreLogger.EndGroup();

    var inputs = Utils.GetInputs(inputsDict);
    var metadata = Utils.GetMetadata(metadataDict);

    // Initialize GitHub client
    var github = new GitHubClient(inputs.Token);

    // Validate and process the pull request
    var result = await Utils.ValidatePullRequestAsync(github, repository, pullRequest, inputs, metadata);

    CoreLogger.SetOutput(OutputState, result.ValidationState);
    CoreLogger.SetOutput(OutputMessage, result.ValidationMessage);

    if (result.Execute && result.Command != null)
    {
        await result.Command(github, repository, pullRequest, result.Body);
    }

    CoreLogger.Info(result.ValidationMessage);
}
catch (Exception error)
{
    SetFailure(error.Message);
}

void SetFailure(string message)
{
    CoreLogger.SetOutput(OutputState, State.Failed);
    CoreLogger.SetOutput(OutputMessage, message);
    CoreLogger.SetFailed(message);
}

static Repository ParseRepository(JsonElement repo)
{
    return new Repository
    {
        Owner = new Owner
        {
            Login = repo.GetProperty("owner").GetProperty("login").GetString()!
        },
        Name = repo.GetProperty("name").GetString()!
    };
}

static PullRequest ParsePullRequest(JsonElement pr)
{
    return new PullRequest
    {
        Number = pr.GetProperty("number").GetInt32(),
        State = pr.GetProperty("state").GetString()!,
        Merged = pr.TryGetProperty("merged", out var merged) && merged.GetBoolean(),
        Draft = pr.TryGetProperty("draft", out var draft) && draft.GetBoolean(),
        User = new User
        {
            Login = pr.GetProperty("user").GetProperty("login").GetString()!
        },
        Mergeable = pr.TryGetProperty("mergeable", out var mergeable) && mergeable.ValueKind != JsonValueKind.Null
            ? mergeable.GetBoolean()
            : null,
        MergeableState = pr.TryGetProperty("mergeable_state", out var mergeableState) && mergeableState.ValueKind != JsonValueKind.Null
            ? mergeableState.GetString()
            : null,
        Base = new Base
        {
            Ref = pr.GetProperty("base").GetProperty("ref").GetString()!
        },
        Head = new Head
        {
            Ref = pr.GetProperty("head").GetProperty("ref").GetString()!
        }
    };
}
