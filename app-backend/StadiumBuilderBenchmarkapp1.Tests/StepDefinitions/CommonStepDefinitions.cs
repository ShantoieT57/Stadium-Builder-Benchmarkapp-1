using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Net.Http.Headers;
using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class CommonStepDefinitions(TransactionImportApiFixture fixture, ScenarioState state)
{
    public const string SessionCookieName = "session";

    [Given("I am signed in as {string}")]
    public async Task GivenIAmSignedInAs(string email)
    {
        await SendLoginAsync(JsonSerializer.Serialize(new { email, password = "Test123" }));
        Assert.Equal(HttpStatusCode.OK, state.Response.StatusCode);
        Assert.NotNull(state.SessionToken);
    }

    [Given("my session cookie is {string}")]
    public void GivenMySessionCookieIs(string token) => state.SessionToken = token;

    [When("I ask who is signed in")]
    public Task WhenIAskWhoIsSignedIn() => SendAsync(HttpMethod.Get, "/api/auth/me");

    [Then("the response status code is {int}")]
    public void ThenTheResponseStatusCodeIs(int statusCode) =>
        Assert.Equal((HttpStatusCode)statusCode, state.Response.StatusCode);

    [Then("the response describes the user {string} with email {string} and role {string}")]
    public void ThenTheResponseDescribesTheUser(string name, string email, string role)
    {
        using var document = JsonDocument.Parse(state.LastResponseBody);
        var root = document.RootElement;
        Assert.Equal(name, root.GetProperty("name").GetString());
        Assert.Equal(email, root.GetProperty("email").GetString());
        Assert.Equal(role, root.GetProperty("role").GetString());
    }

    [Then("the error message is {string}")]
    public void ThenTheErrorMessageIs(string message)
    {
        using var document = JsonDocument.Parse(state.LastResponseBody);
        Assert.Equal(message, document.RootElement.GetProperty("message").GetString());
    }

    [Then("the logs do not contain {string}")]
    public void ThenTheLogsDoNotContain(string text)
    {
        Assert.NotEmpty(fixture.Logs.Entries);
        Assert.DoesNotContain(fixture.Logs.Entries, entry => entry.Contains(text, StringComparison.OrdinalIgnoreCase));
    }

    public async Task SendLoginAsync(string jsonBody) =>
        await SendAsync(HttpMethod.Post, "/api/auth/login", new StringContent(jsonBody, Encoding.UTF8, "application/json"));

    public async Task SendAsync(HttpMethod method, string path, HttpContent? content = null)
    {
        using var request = new HttpRequestMessage(method, path) { Content = content };
        if (state.SessionToken is not null)
        {
            request.Headers.Add(HeaderNames.Cookie, new CookieHeaderValue(SessionCookieName, state.SessionToken).ToString());
        }

        state.LastResponse = await fixture.Client.SendAsync(request);
        state.LastResponseBody = await state.LastResponse.Content.ReadAsStringAsync();

        var sessionCookie = GetSessionSetCookie(state.LastResponse);
        if (sessionCookie is not null)
        {
            state.SessionToken = sessionCookie.Value.Value;
        }
    }

    public static SetCookieHeaderValue? GetSessionSetCookie(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues(HeaderNames.SetCookie, out var values))
        {
            return null;
        }
        return SetCookieHeaderValue.ParseList(values.ToList())
            .SingleOrDefault(cookie => cookie.Name.Equals(SessionCookieName, StringComparison.Ordinal));
    }
}
