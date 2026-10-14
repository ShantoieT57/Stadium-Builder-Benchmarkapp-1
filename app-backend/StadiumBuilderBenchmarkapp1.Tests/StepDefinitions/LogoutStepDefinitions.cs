using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class LogoutStepDefinitions(CommonStepDefinitions common, ScenarioState state)
{
    private string? _tokenBeforeSignOut;

    [When("I sign out")]
    public async Task WhenISignOut()
    {
        _tokenBeforeSignOut = state.SessionToken;
        await common.SendAsync(HttpMethod.Post, "/api/auth/logout");

        // Simulate a client that keeps replaying its old cookie, regardless of what the
        // server told it to do, to prove the session itself was ended server-side.
        state.SessionToken = _tokenBeforeSignOut;
    }

    [Then("the session cookie is cleared")]
    public void ThenTheSessionCookieIsCleared()
    {
        var cookie = CommonStepDefinitions.GetSessionSetCookie(state.Response);
        Assert.NotNull(cookie);
        Assert.True(string.IsNullOrEmpty(cookie.Value.Value));
        Assert.NotNull(cookie.Expires);
        Assert.True(cookie.Expires < DateTimeOffset.UtcNow);
    }
}
