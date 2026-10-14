using System.Globalization;
using Dapper;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>A server-side session row. The cookie token itself is never stored, only its hash.</summary>
public sealed record SessionRecord(string TokenHash, long UserId, DateTimeOffset CreatedAt, DateTimeOffset LastActivityAt);

/// <summary>Database access for server-side sessions.</summary>
public sealed class SessionRepository(DbConnectionFactory connectionFactory)
{
    private const string DeleteForUserSql = "DELETE FROM Sessions WHERE UserId = @UserId";

    /// <summary>
    /// Stores the session as the user's only one: every other session of the same user is
    /// deleted in the same transaction.
    /// </summary>
    public async Task ReplaceUserSessionsAsync(SessionRecord session, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
        await connection.ExecuteAsync(DeleteForUserSql, new { session.UserId }, transaction).ConfigureAwait(false);
        await connection.ExecuteAsync("""
            INSERT INTO Sessions (TokenHash, UserId, CreatedAt, LastActivityAt)
            VALUES (@TokenHash, @UserId, @CreatedAt, @LastActivityAt)
            """,
            new
            {
                session.TokenHash,
                session.UserId,
                CreatedAt = Format(session.CreatedAt),
                LastActivityAt = Format(session.LastActivityAt),
            },
            transaction).ConfigureAwait(false);
        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<SessionRecord?> FindAsync(string tokenHash, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        var row = await connection.QuerySingleOrDefaultAsync<SessionRow>(
            "SELECT TokenHash, UserId, CreatedAt, LastActivityAt FROM Sessions WHERE TokenHash = @tokenHash",
            new { tokenHash }).ConfigureAwait(false);
        return row is null
            ? null
            : new SessionRecord(row.TokenHash, row.UserId, Parse(row.CreatedAt), Parse(row.LastActivityAt));
    }

    /// <summary>
    /// Uses the session identified by <paramref name="tokenHash"/>, on a single connection:
    /// looks it up together with its owner; when it has been idle for longer than
    /// <paramref name="idleTimeout"/> it is deleted and null is returned, otherwise its last
    /// activity is set to <paramref name="now"/> and the owner is returned.
    /// Returns null when there is no such session.
    /// </summary>
    public async Task<User?> UseAsync(string tokenHash, DateTimeOffset now, TimeSpan idleTimeout, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        var row = await connection.QuerySingleOrDefaultAsync<ActiveSessionRow>("""
            SELECT s.LastActivityAt, u.Id, u.Name, u.Email, u.PasswordHash, u.Role
            FROM Sessions s
            JOIN Users u ON u.Id = s.UserId
            WHERE s.TokenHash = @tokenHash
            """,
            new { tokenHash }).ConfigureAwait(false);
        if (row is null)
        {
            return null;
        }

        if (now - Parse(row.LastActivityAt) > idleTimeout)
        {
            await connection.ExecuteAsync("DELETE FROM Sessions WHERE TokenHash = @tokenHash", new { tokenHash }).ConfigureAwait(false);
            return null;
        }

        await connection.ExecuteAsync(
            "UPDATE Sessions SET LastActivityAt = @lastActivityAt WHERE TokenHash = @tokenHash",
            new { tokenHash, lastActivityAt = Format(now) }).ConfigureAwait(false);
        return new User(row.Id, row.Name, row.Email, row.PasswordHash, row.Role);
    }

    public async Task DeleteForUserAsync(long userId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        await connection.ExecuteAsync(DeleteForUserSql, new { UserId = userId }).ConfigureAwait(false);
    }

    private static string Format(DateTimeOffset value) => value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);

    private static DateTimeOffset Parse(string value) => DateTimeOffset.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);

    private sealed record SessionRow(string TokenHash, long UserId, string CreatedAt, string LastActivityAt);

    private sealed record ActiveSessionRow(string LastActivityAt, long Id, string Name, string Email, string PasswordHash, string Role);
}
