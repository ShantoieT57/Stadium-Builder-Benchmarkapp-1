using System.Data.Common;
using Microsoft.Data.Sqlite;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>Opens connections to the application database.</summary>
public sealed class DbConnectionFactory(AppSettings settings)
{
    private readonly string _connectionString = new SqliteConnectionStringBuilder(settings.DatabaseConnectionString)
    {
        ForeignKeys = true,
    }.ToString();

    public async Task<DbConnection> OpenAsync(CancellationToken cancellationToken)
    {
        var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken).ConfigureAwait(false);
        return connection;
    }
}
