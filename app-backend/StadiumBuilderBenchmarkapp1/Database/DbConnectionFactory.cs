using System.Data.Common;
using Microsoft.Data.Sqlite;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>Opens connections to the application database.</summary>
public sealed class DbConnectionFactory(AppSettings settings)
{
    /// <summary>
    /// The effective connection string: foreign keys on, and a relative database file
    /// resolved against the application folder so the same database is used whichever
    /// folder the application is started from.
    /// </summary>
    public string ConnectionString { get; } = Resolve(settings.DatabaseConnectionString);

    public async Task<DbConnection> OpenAsync(CancellationToken cancellationToken)
    {
        var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken).ConfigureAwait(false);
        return connection;
    }

    private static string Resolve(string connectionString)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString) { ForeignKeys = true };
        if (IsRelativeFile(builder))
        {
            builder.DataSource = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, builder.DataSource));
        }
        return builder.ToString();
    }

    private static bool IsRelativeFile(SqliteConnectionStringBuilder builder) =>
        builder.Mode != SqliteOpenMode.Memory
        && !string.IsNullOrEmpty(builder.DataSource)
        && builder.DataSource != ":memory:"
        && !builder.DataSource.StartsWith("file:", StringComparison.OrdinalIgnoreCase)
        && !Path.IsPathRooted(builder.DataSource);
}
