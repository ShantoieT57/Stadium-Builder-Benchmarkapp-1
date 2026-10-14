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
