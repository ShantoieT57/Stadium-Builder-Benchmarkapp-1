using System.Globalization;
using Dapper;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>A server-side session row. The cookie token itself is never stored, only its hash.</summary>
public sealed record SessionRecord(string TokenHash, long UserId, DateTimeOffset CreatedAt, DateTimeOffset LastActivityAt);

/// <summary>Database access for server-side sessions.</summary>
public sealed class SessionRepository(DbConnectionFactory connectionFactory)
{
    public async Task InsertAsync(SessionRecord session, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
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
            }).ConfigureAwait(false);
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

    public async Task DeleteAsync(string tokenHash, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        await connection.ExecuteAsync("DELETE FROM Sessions WHERE TokenHash = @tokenHash", new { tokenHash }).ConfigureAwait(false);
    }

    private static string Format(DateTimeOffset value) => value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);

    private static DateTimeOffset Parse(string value) => DateTimeOffset.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);

    private sealed record SessionRow(string TokenHash, long UserId, string CreatedAt, string LastActivityAt);
}
