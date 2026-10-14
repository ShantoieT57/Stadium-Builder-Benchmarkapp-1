using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class LogoutStepDefinitions(CommonStepDefinitions common, ScenarioState state, TransactionImportApiFixture fixture)
{
    private string? _tokenBeforeSignOut;

    [Given("{string} also has a stored session {string}")]
    public async Task GivenAlsoHasAStoredSession(string email, string name)
    {
        var token = Guid.NewGuid().ToString("N");
        await fixture.Database.InsertSessionAsync(email, token, fixture.Clock.GetUtcNow());
        state.RememberedSessions[name] = token;
    }

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
