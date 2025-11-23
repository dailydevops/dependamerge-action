using DependaMerge.Core;
using DependaMerge.Core.Models;
using NSubstitute;

namespace DependaMerge.Tests;

public class UtilsTests
{
    [Test]
    [Arguments("merge", "merge")]
    [Arguments("rebase", "rebase")]
    [Arguments("squash", "squash and merge")]
    [Arguments(null, "squash and merge")]
    public async Task GetCommand_ShouldReturnCorrectCommand(string? input, string expected)
    {
        // Act
        var result = Utils.GetCommand(input);

        // Assert
        await Assert.That(result).IsEqualTo(expected);
    }

    [Test]
    [Arguments("true", true)]
    [Arguments("false", false)]
    [Arguments(null, false)]
    public async Task GetInputs_ApproveOnly_ShouldParseCorrectly(string? input, bool expected)
    {
        // Arrange
        var inputs = new Dictionary<string, string>();
        if (input != null)
        {
            inputs["approve-only"] = input;
        }
        inputs["token"] = "test-token";

        // Act
        var result = Utils.GetInputs(inputs);

        // Assert
        await Assert.That(result.ApproveOnly).IsEqualTo(expected);
    }

    [Test]
    [Arguments("true", true)]
    [Arguments("false", false)]
    [Arguments(null, false)]
    public async Task GetInputs_HandleSubmodule_ShouldParseCorrectly(string? input, bool expected)
    {
        // Arrange
        var inputs = new Dictionary<string, string>();
        if (input != null)
        {
            inputs["handle-submodule"] = input;
        }
        inputs["token"] = "test-token";

        // Act
        var result = Utils.GetInputs(inputs);

        // Assert
        await Assert.That(result.HandleSubmodule).IsEqualTo(expected);
    }

    [Test]
    [Arguments("true", true)]
    [Arguments("false", false)]
    [Arguments(null, false)]
    public async Task GetInputs_HandleDependencyGroup_ShouldParseCorrectly(string? input, bool expected)
    {
        // Arrange
        var inputs = new Dictionary<string, string>();
        if (input != null)
        {
            inputs["handle-dependency-group"] = input;
        }
        else
        {
            // Default should be true when not specified
            expected = true;
        }
        inputs["token"] = "test-token";

        // Act
        var result = Utils.GetInputs(inputs);

        // Assert
        await Assert.That(result.HandleDependencyGroup).IsEqualTo(expected);
    }

    [Test]
    [Arguments("major", "version-update:semver-major")]
    [Arguments("minor", "version-update:semver-minor")]
    [Arguments("patch", "version-update:semver-patch")]
    [Arguments("any", "version-update:semver-any")]
    [Arguments(null, "version-update:semver-patch")]
    public async Task GetInputs_Target_ShouldMapCorrectly(string? input, string expected)
    {
        // Arrange
        var inputs = new Dictionary<string, string> { ["token"] = "test-token" };
        if (input != null)
        {
            inputs["target"] = input;
        }

        // Act
        var result = Utils.GetInputs(inputs);

        // Assert
        await Assert.That(result.Target).IsEqualTo(expected);
    }

    [Test]
    public async Task ValidatePullRequest_ShouldReturnSkipped_WhenPRIsMerged()
    {
        // Arrange
        var github = Substitute.For<GitHubClient>("test-token");
        var repository = new Repository
        {
            Owner = new Owner { Login = "test-owner" },
            Name = "test-repo"
        };
        var pullRequest = new PullRequest
        {
            Number = 1,
            State = "open",
            Merged = true,
            Draft = false,
            User = new User { Login = "dependabot[bot]" },
            Base = new Base { Ref = "main" },
            Head = new Head { Ref = "feature" }
        };
        var inputs = new ActionInputs
        {
            Token = "test-token",
            ApproveOnly = false,
            CommandMethod = "squash and merge",
            HandleSubmodule = false,
            HandleDependencyGroup = true,
            Target = "version-update:semver-patch",
            SkipCommitVerification = false,
            SkipVerification = false
        };
        var metadata = new ActionMetadata();

        // Act
        var result = await Utils.ValidatePullRequestAsync(github, repository, pullRequest, inputs, metadata);

        // Assert
        await Assert.That(result.Execute).IsFalse();
        await Assert.That(result.ValidationState).IsEqualTo(State.Skipped);
        await Assert.That(result.ValidationMessage).IsEqualTo("Pull request is not open or already merged.");
    }

    [Test]
    public async Task ValidatePullRequest_ShouldReturnSkipped_WhenPRIsNotOpen()
    {
        // Arrange
        var github = Substitute.For<GitHubClient>("test-token");
        var repository = new Repository
        {
            Owner = new Owner { Login = "test-owner" },
            Name = "test-repo"
        };
        var pullRequest = new PullRequest
        {
            Number = 1,
            State = "closed",
            Merged = false,
            Draft = false,
            User = new User { Login = "dependabot[bot]" },
            Base = new Base { Ref = "main" },
            Head = new Head { Ref = "feature" }
        };
        var inputs = new ActionInputs
        {
            Token = "test-token",
            ApproveOnly = false,
            CommandMethod = "squash and merge",
            HandleSubmodule = false,
            HandleDependencyGroup = true,
            Target = "version-update:semver-patch",
            SkipCommitVerification = false,
            SkipVerification = false
        };
        var metadata = new ActionMetadata();

        // Act
        var result = await Utils.ValidatePullRequestAsync(github, repository, pullRequest, inputs, metadata);

        // Assert
        await Assert.That(result.Execute).IsFalse();
        await Assert.That(result.ValidationState).IsEqualTo(State.Skipped);
        await Assert.That(result.ValidationMessage).IsEqualTo("Pull request is not open or already merged.");
    }

    [Test]
    public async Task ValidatePullRequest_ShouldReturnSkipped_WhenPRIsDraft()
    {
        // Arrange
        var github = Substitute.For<GitHubClient>("test-token");
        var repository = new Repository
        {
            Owner = new Owner { Login = "test-owner" },
            Name = "test-repo"
        };
        var pullRequest = new PullRequest
        {
            Number = 1,
            State = "open",
            Merged = false,
            Draft = true,
            User = new User { Login = "dependabot[bot]" },
            Base = new Base { Ref = "main" },
            Head = new Head { Ref = "feature" }
        };
        var inputs = new ActionInputs
        {
            Token = "test-token",
            ApproveOnly = false,
            CommandMethod = "squash and merge",
            HandleSubmodule = false,
            HandleDependencyGroup = true,
            Target = "version-update:semver-patch",
            SkipCommitVerification = false,
            SkipVerification = false
        };
        var metadata = new ActionMetadata();

        // Act
        var result = await Utils.ValidatePullRequestAsync(github, repository, pullRequest, inputs, metadata);

        // Assert
        await Assert.That(result.Execute).IsFalse();
        await Assert.That(result.ValidationState).IsEqualTo(State.Skipped);
        await Assert.That(result.ValidationMessage).IsEqualTo("Pull request is a draft.");
    }

    [Test]
    public async Task ValidatePullRequest_ShouldReturnSkipped_WhenNotCreatedByDependabot()
    {
        // Arrange
        var github = Substitute.For<GitHubClient>("test-token");
        var repository = new Repository
        {
            Owner = new Owner { Login = "test-owner" },
            Name = "test-repo"
        };
        var pullRequest = new PullRequest
        {
            Number = 1,
            State = "open",
            Merged = false,
            Draft = false,
            User = new User { Login = "not-dependabot" },
            Base = new Base { Ref = "main" },
            Head = new Head { Ref = "feature" }
        };
        var inputs = new ActionInputs
        {
            Token = "test-token",
            ApproveOnly = false,
            CommandMethod = "squash and merge",
            HandleSubmodule = false,
            HandleDependencyGroup = true,
            Target = "version-update:semver-patch",
            SkipCommitVerification = false,
            SkipVerification = false
        };
        var metadata = new ActionMetadata();

        // Act
        var result = await Utils.ValidatePullRequestAsync(github, repository, pullRequest, inputs, metadata);

        // Assert
        await Assert.That(result.Execute).IsFalse();
        await Assert.That(result.ValidationState).IsEqualTo(State.Skipped);
        await Assert.That(result.ValidationMessage).IsEqualTo("The Commit/PullRequest was not created by dependabot[bot].");
    }
}
