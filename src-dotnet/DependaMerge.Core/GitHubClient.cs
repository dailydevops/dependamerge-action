using DependaMerge.Core.Models;
using Octokit;

namespace DependaMerge.Core;

/// <summary>
/// Wrapper for GitHub API operations.
/// </summary>
public class GitHubClient
{
    private readonly Octokit.GitHubClient _client;

    public GitHubClient(string token)
    {
        _client = new Octokit.GitHubClient(new ProductHeaderValue("DependaMerge"))
        {
            Credentials = new Credentials(token)
        };
    }

    /// <summary>
    /// Adds a comment to a pull request.
    /// </summary>
    public async Task AddCommentAsync(Models.Repository repo, Models.PullRequest pullRequest, string body)
    {
        await _client.Issue.Comment.Create(
            repo.Owner.Login,
            repo.Name,
            pullRequest.Number,
            body);
    }

    /// <summary>
    /// Approves a pull request.
    /// </summary>
    public async Task ApprovePullRequestAsync(Models.Repository repo, Models.PullRequest pullRequest, string body)
    {
        await _client.PullRequest.Review.Create(
            repo.Owner.Login,
            repo.Name,
            pullRequest.Number,
            new PullRequestReviewCreate
            {
                Event = PullRequestReviewEvent.Approve,
                Body = body
            });
    }

    /// <summary>
    /// Compares a pull request.
    /// </summary>
    public async Task<CompareResult> ComparePullRequestAsync(Models.Repository repo, Models.PullRequest pullRequest)
    {
        return await _client.Repository.Commit.Compare(
            repo.Owner.Login,
            repo.Name,
            pullRequest.Base.Ref,
            pullRequest.Head.Ref);
    }

    /// <summary>
    /// Gets a pull request.
    /// </summary>
    public async Task<Octokit.PullRequest> GetPullRequestAsync(Models.Repository repo, Models.PullRequest pullRequest)
    {
        return await _client.PullRequest.Get(
            repo.Owner.Login,
            repo.Name,
            pullRequest.Number);
    }
}
