using System.Globalization;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>
/// Authenticates requests from the session cookie by looking the session up in the
/// server-side <see cref="SessionStore"/> (one database round trip that also applies the idle
/// timeout and records the request as activity). Unauthenticated requests get a bare 401.
/// </summary>
public sealed class SessionAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    SessionStore sessions)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Session";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = SessionCookie.Read(Request);
        if (token is null)
        {
            return AuthenticateResult.NoResult();
        }

        var user = await sessions.UseAsync(token, Context.RequestAborted).ConfigureAwait(false);
        if (user is null)
        {
            return AuthenticateResult.Fail("No valid session.");
        }

        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString(CultureInfo.InvariantCulture)),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
            ],
            SchemeName);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName));
    }
}
