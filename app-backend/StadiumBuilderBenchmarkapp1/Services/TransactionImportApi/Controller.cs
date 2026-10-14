using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StadiumBuilderBenchmarkapp1.Database;
using StadiumBuilderBenchmarkapp1.Security;

namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

public sealed class Controller(UserRepository users, SessionStore sessions, PasswordHasher passwordHasher) : ControllerBase
{
    private const string InvalidCredentialsMessage = "Invalid email or password";
    private const string MissingCredentialsMessage = "Email and password are required";

    [AllowAnonymous]
    public override async Task<ActionResult<CurrentUser>> Login(LoginRequest body, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(body?.Email) || string.IsNullOrWhiteSpace(body.Password))
        {
            return BadRequest(new ErrorResponse { Message = MissingCredentialsMessage });
        }

        var user = await users.FindByEmailAsync(body.Email.Trim(), cancellationToken).ConfigureAwait(false);
        // Always verify (against a dummy hash for unknown emails) so both failure cases look alike.
        var passwordMatches = passwordHasher.Verify(user?.PasswordHash, body.Password);
        if (user is null || !passwordMatches)
        {
            return Unauthorized(new ErrorResponse { Message = InvalidCredentialsMessage });
        }

        var token = await sessions.CreateAsync(user.Id, cancellationToken).ConfigureAwait(false);
        SessionCookie.Write(Response, token);
        return ToCurrentUser(user.Name, user.Email, user.Role);
    }

    public override Task<ActionResult<CurrentUser>> GetCurrentUser(CancellationToken cancellationToken = default) =>
        Task.FromResult<ActionResult<CurrentUser>>(ToCurrentUser(
            User.FindFirstValue(ClaimTypes.Name)!,
            User.FindFirstValue(ClaimTypes.Email)!,
            User.FindFirstValue(ClaimTypes.Role)!));

    [AllowAnonymous]
    public override async Task<IActionResult> Logout(CancellationToken cancellationToken = default)
    {
        var token = SessionCookie.Read(Request);
        if (token is not null)
        {
            await sessions.EndAllForOwnerAsync(token, cancellationToken).ConfigureAwait(false);
        }
        SessionCookie.Clear(Response);
        return NoContent();
    }

    private static CurrentUser ToCurrentUser(string name, string email, string role) => new()
    {
        Name = name,
        Email = email,
        Role = Enum.Parse<Role>(role),
    };
}
