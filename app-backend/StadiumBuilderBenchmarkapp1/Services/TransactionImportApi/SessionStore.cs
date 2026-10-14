using System.Security.Cryptography;
using System.Text;
using StadiumBuilderBenchmarkapp1.Database;

namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>
/// Server-side session store. Sessions are identified by an opaque random token that
/// lives only in the client's cookie; the database keeps a SHA-256 hash of it together
/// with the owning user and the created / last-activity timestamps (from the injected
/// <see cref="TimeProvider"/>).
/// </summary>
public sealed class SessionStore(SessionRepository sessions, TimeProvider timeProvider)
{
    private const int TokenSizeInBytes = 32;

    /// <summary>Starts a new session for the user and returns its token.</summary>
    public async Task<string> CreateAsync(long userId, CancellationToken cancellationToken)
    {
        var token = Base64UrlEncode(RandomNumberGenerator.GetBytes(TokenSizeInBytes));
        var now = timeProvider.GetUtcNow();
        await sessions.InsertAsync(new SessionRecord(HashToken(token), userId, now, now), cancellationToken).ConfigureAwait(false);
        return token;
    }

    /// <summary>Returns the session for the token, or null when there is no such session.</summary>
    public Task<SessionRecord?> FindAsync(string token, CancellationToken cancellationToken) =>
        sessions.FindAsync(HashToken(token), cancellationToken);

    /// <summary>Ends the session for the token. Does nothing if it does not exist.</summary>
    public Task EndAsync(string token, CancellationToken cancellationToken) =>
        sessions.DeleteAsync(HashToken(token), cancellationToken);

    private static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
