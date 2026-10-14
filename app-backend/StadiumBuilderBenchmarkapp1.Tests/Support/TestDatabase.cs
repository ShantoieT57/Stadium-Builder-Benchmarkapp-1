using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Dapper;
using Microsoft.Data.Sqlite;

namespace StadiumBuilderBenchmarkapp1.Tests.Support;

/// <summary>
/// A throw-away SQLite database file for one scenario, plus the read-only queries
/// tests use to inspect it.
/// </summary>
public sealed class TestDatabase : IDisposable
{
    private readonly string _filePath = Path.Combine(Path.GetTempPath(), $"transaction-import-tests-{Guid.NewGuid():N}.db");

    public string ConnectionString => new SqliteConnectionStringBuilder
    {
        DataSource = _filePath,
        Pooling = false,
    }.ToString();

    public async Task<IReadOnlyList<StoredUser>> GetUsersAsync()
    {
        await using var connection = new SqliteConnection(ConnectionString);
        var users = await connection.QueryAsync<StoredUser>(
            "SELECT Name, Email, Role, PasswordHash FROM Users ORDER BY Name");
        return users.ToList();
    }

    /// <summary>Stores an extra session for the user, as if they had signed in on another device.</summary>
    public async Task InsertSessionAsync(string email, string token, DateTimeOffset now)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        var timestamp = now.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
        await connection.ExecuteAsync("""
            INSERT INTO Sessions (TokenHash, UserId, CreatedAt, LastActivityAt)
            SELECT @tokenHash, Id, @timestamp, @timestamp FROM Users WHERE Email = @email
            """,
            new { tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))), timestamp, email });
    }

    public async Task<int> CountSessionsAsync(string email)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        return await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Sessions s JOIN Users u ON u.Id = s.UserId WHERE u.Email = @email",
            new { email });
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        foreach (var path in new[] { _filePath, _filePath + "-wal", _filePath + "-shm" })
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }
}

public sealed record StoredUser(string Name, string Email, string Role, string PasswordHash);
