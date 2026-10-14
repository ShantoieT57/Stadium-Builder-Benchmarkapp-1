using StadiumBuilderBenchmarkapp1.Database;
using TransactionImportApiService = StadiumBuilderBenchmarkapp1.Services.TransactionImportApi.Service;

namespace StadiumBuilderBenchmarkapp1;

internal sealed class Application(
    DatabaseMigrator databaseMigrator,
    UserSeeder userSeeder,
    TransactionImportApiService transactionImportApi,
    ILogger<Application> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // One-shot startup steps, before any service starts.
        await databaseMigrator.MigrateAsync(cancellationToken).ConfigureAwait(false);
        await userSeeder.SeedAsync(cancellationToken).ConfigureAwait(false);

        await transactionImportApi.StartAsync(cancellationToken).ConfigureAwait(false);
        logger.LogInformation("Application started.");
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Application stopping.");
        await transactionImportApi.StopAsync(cancellationToken).ConfigureAwait(false);
    }
}
