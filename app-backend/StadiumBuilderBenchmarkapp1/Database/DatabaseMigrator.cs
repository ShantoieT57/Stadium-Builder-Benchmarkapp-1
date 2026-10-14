using System.Reflection;
using Dapper;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>
/// One-shot startup step that applies the embedded <c>Database/Migrations/*.sql</c>
/// scripts, in file-name order, that have not yet been applied to the database.
/// </summary>
public sealed class DatabaseMigrator(DbConnectionFactory connectionFactory, ILogger<DatabaseMigrator> logger)
{
    private const string MigrationResourcePrefix = "StadiumBuilderBenchmarkapp1.Database.Migrations.";

    public async Task MigrateAsync(CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS SchemaMigrations (
                Name      TEXT NOT NULL PRIMARY KEY,
                AppliedAt TEXT NOT NULL
            )
            """).ConfigureAwait(false);

        var applied = (await connection.QueryAsync<string>("SELECT Name FROM SchemaMigrations").ConfigureAwait(false))
            .ToHashSet(StringComparer.Ordinal);

        foreach (var (name, script) in ReadMigrations().Where(migration => !applied.Contains(migration.Name)))
        {
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
            await connection.ExecuteAsync(script, transaction: transaction).ConfigureAwait(false);
            await connection.ExecuteAsync(
                "INSERT INTO SchemaMigrations (Name, AppliedAt) VALUES (@Name, @AppliedAt)",
                new { Name = name, AppliedAt = DateTimeOffset.UtcNow.ToString("O") },
                transaction).ConfigureAwait(false);
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);

            logger.LogInformation("Applied database migration {MigrationName}.", name);
        }
    }

    private static IEnumerable<(string Name, string Script)> ReadMigrations()
    {
        var assembly = Assembly.GetExecutingAssembly();
        foreach (var resourceName in assembly.GetManifestResourceNames()
                     .Where(resource => resource.StartsWith(MigrationResourcePrefix, StringComparison.Ordinal))
                     .Order(StringComparer.Ordinal))
        {
            using var stream = assembly.GetManifestResourceStream(resourceName)!;
            using var reader = new StreamReader(stream);
            yield return (resourceName[MigrationResourcePrefix.Length..], reader.ReadToEnd());
        }
    }
}
