using System.Text.Json;
using Microsoft.Net.Http.Headers;
using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class LoginStepDefinitions(CommonStepDefinitions common, ScenarioState state)
{
    [When("I sign in with email {string} and password {string}")]
    public Task WhenISignInWithEmailAndPassword(string email, string password) =>
        common.SendLoginAsync(JsonSerializer.Serialize(new { email, password }));

    [When("I sign in with the request body (.*)")]
    public Task WhenISignInWithTheRequestBody(string body) => common.SendLoginAsync(body);

    [Then("an HTTP-only session cookie with SameSite Lax is set")]
    public void ThenAnHttpOnlySessionCookieWithSameSiteLaxIsSet()
    {
        var cookie = CommonStepDefinitions.GetSessionSetCookie(state.Response);
        Assert.NotNull(cookie);
        Assert.False(string.IsNullOrWhiteSpace(cookie.Value.Value));
        Assert.True(cookie.HttpOnly);
        Assert.Equal(SameSiteMode.Lax, cookie.SameSite);
        Assert.Equal("/", cookie.Path.Value);
    }

    [Then("no session cookie is set")]
    public void ThenNoSessionCookieIsSet() =>
        Assert.Null(CommonStepDefinitions.GetSessionSetCookie(state.Response));
}
