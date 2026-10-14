using Dapper;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>Database access for <see cref="User"/> rows.</summary>
public sealed class UserRepository(DbConnectionFactory connectionFactory)
{
    private const string SelectUser = "SELECT Id, Name, Email, PasswordHash, Role FROM Users";

    /// <summary>Finds a user by email, ignoring letter case.</summary>
    public async Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        return await connection.QuerySingleOrDefaultAsync<User>(
            $"{SelectUser} WHERE Email = @email COLLATE NOCASE", new { email }).ConfigureAwait(false);
    }

    public async Task<User?> FindByIdAsync(long id, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        return await connection.QuerySingleOrDefaultAsync<User>(
            $"{SelectUser} WHERE Id = @id", new { id }).ConfigureAwait(false);
    }

    /// <summary>Inserts the user unless one with the same email already exists. Returns true when inserted.</summary>
    public async Task<bool> InsertIfMissingAsync(string name, string email, string passwordHash, string role, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);
        var inserted = await connection.ExecuteAsync("""
            INSERT INTO Users (Name, Email, PasswordHash, Role)
            VALUES (@name, @email, @passwordHash, @role)
            ON CONFLICT (Email) DO NOTHING
            """,
            new { name, email, passwordHash, role }).ConfigureAwait(false);
        return inserted > 0;
    }
}
