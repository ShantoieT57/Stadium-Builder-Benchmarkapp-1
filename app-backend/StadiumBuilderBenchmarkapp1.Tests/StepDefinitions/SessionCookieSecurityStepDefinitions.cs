using System.Net;
using System.Text;
using System.Text.Json;
using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class SessionCookieSecurityStepDefinitions(CommonStepDefinitions common, ScenarioState state, TransactionImportApiFixture fixture)
{
    [Given("the session cookie Secure setting is {string}")]
    public void GivenTheSessionCookieSecureSettingIs(string mode) =>
        fixture.Settings.SessionCookieSecure = Enum.Parse<SessionCookieSecureMode>(mode);

    [When("I sign in as {string} through an HTTPS proxy at {string}")]
    public async Task WhenISignInThroughAnHttpsProxyAt(string email, string proxyAddress)
    {
        using var client = CreateHttpsProxyClient(proxyAddress);
        var body = JsonSerializer.Serialize(new { email, password = "Test123" });
        await common.SendAsync(HttpMethod.Post, "/api/auth/login", new StringContent(body, Encoding.UTF8, "application/json"), client);
    }

    [When("I sign out through an HTTPS proxy at {string}")]
    public async Task WhenISignOutThroughAnHttpsProxyAt(string proxyAddress)
    {
        using var client = CreateHttpsProxyClient(proxyAddress);
        await common.SendAsync(HttpMethod.Post, "/api/auth/logout", client: client);
    }

    [Then("the session cookie is marked Secure")]
    public void ThenTheSessionCookieIsMarkedSecure()
    {
        var cookie = CommonStepDefinitions.GetSessionSetCookie(state.Response);
        Assert.NotNull(cookie);
        Assert.True(cookie.Secure);
    }

    [Then("the session cookie is not marked Secure")]
    public void ThenTheSessionCookieIsNotMarkedSecure()
    {
        var cookie = CommonStepDefinitions.GetSessionSetCookie(state.Response);
        Assert.NotNull(cookie);
        Assert.False(cookie.Secure);
    }

    // A client whose requests arrive over plain http from the given address and carry
    // X-Forwarded-Proto: https, as a reverse proxy terminating HTTPS would send them.
    private HttpClient CreateHttpsProxyClient(string proxyAddress)
    {
        var client = fixture.CreateClientFrom(IPAddress.Parse(proxyAddress));
        client.DefaultRequestHeaders.Add("X-Forwarded-Proto", "https");
        return client;
    }
}
