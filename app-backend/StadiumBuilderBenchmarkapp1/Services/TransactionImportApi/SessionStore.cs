using System.Security.Cryptography;
using System.Text;
using StadiumBuilderBenchmarkapp1.Database;

namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>
/// Server-side session store. Sessions are identified by an opaque random token that
/// lives only in the client's cookie; the database keeps a SHA-256 hash of it together
/// with the owning user and the created / last-activity timestamps (from the injected
/// <see cref="TimeProvider"/>).
/// <para>
/// Rules: a person has at most one session (signing in replaces earlier ones); a session
/// idle for more than <see cref="IdleTimeout"/> expires; each use slides the idle window.
/// </para>
/// </summary>
public sealed class SessionStore(SessionRepository sessions, TimeProvider timeProvider)
{
    /// <summary>How long a session may go without an authenticated request before it expires.</summary>
    public static readonly TimeSpan IdleTimeout = TimeSpan.FromMinutes(60);

    private const int TokenSizeInBytes = 32;

    /// <summary>Starts a new session for the user, ending all of their earlier sessions, and returns its token.</summary>
    public async Task<string> CreateAsync(long userId, CancellationToken cancellationToken)
    {
        var token = Base64UrlEncode(RandomNumberGenerator.GetBytes(TokenSizeInBytes));
        var now = timeProvider.GetUtcNow();
        await sessions.ReplaceUserSessionsAsync(new SessionRecord(HashToken(token), userId, now, now), cancellationToken).ConfigureAwait(false);
        return token;
    }

    /// <summary>
    /// Returns the live session for the token and records this use as activity. Returns null
    /// when there is no such session or it has been idle too long (an expired session is removed).
    /// </summary>
    public async Task<SessionRecord?> UseAsync(string token, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(token);
        var session = await sessions.FindAsync(tokenHash, cancellationToken).ConfigureAwait(false);
        if (session is null)
        {
            return null;
        }

        var now = timeProvider.GetUtcNow();
        if (now - session.LastActivityAt > IdleTimeout)
        {
            await sessions.DeleteAsync(tokenHash, cancellationToken).ConfigureAwait(false);
            return null;
        }

        await sessions.UpdateLastActivityAsync(tokenHash, now, cancellationToken).ConfigureAwait(false);
        return session with { LastActivityAt = now };
    }

    /// <summary>
    /// Ends every session of the person who owns the token. Does nothing if the token does
    /// not identify a session.
    /// </summary>
    public async Task EndAllForOwnerAsync(string token, CancellationToken cancellationToken)
    {
        var session = await sessions.FindAsync(HashToken(token), cancellationToken).ConfigureAwait(false);
        if (session is not null)
        {
            await sessions.DeleteForUserAsync(session.UserId, cancellationToken).ConfigureAwait(false);
        }
    }

    private static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
