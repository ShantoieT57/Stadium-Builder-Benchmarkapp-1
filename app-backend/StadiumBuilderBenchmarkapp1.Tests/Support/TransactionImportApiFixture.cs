using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Logging;
using StadiumBuilderBenchmarkapp1.Database;
using StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

namespace StadiumBuilderBenchmarkapp1.Tests.Support;

/// <summary>
/// Runs the TransactionImportApi REST host in-memory (TestServer) against a fresh
/// SQLite database that has been migrated and seeded by the application's own
/// one-shot startup steps. One instance per scenario.
/// </summary>
public sealed class TransactionImportApiFixture : IAsyncDisposable
{
    private WebApplication? _app;
    private HttpClient? _client;
    private readonly DbConnectionFactory _connectionFactory;
    private bool _disposed;

    public TransactionImportApiFixture()
    {
        Settings = new AppSettings { DatabaseConnectionString = Database.ConnectionString };
        _connectionFactory = new DbConnectionFactory(Settings);
        LoggerFactory = Microsoft.Extensions.Logging.LoggerFactory.Create(logging =>
        {
            logging.SetMinimumLevel(LogLevel.Trace);
            logging.AddProvider(Logs);
        });
    }

    public TestDatabase Database { get; } = new();

    public CapturingLoggerProvider Logs { get; } = new();

    public AppSettings Settings { get; }

    public ILoggerFactory LoggerFactory { get; }

    public HttpClient Client => _client ?? throw new InvalidOperationException("The fixture has not been started.");

    public async Task StartAsync()
    {
        await new DatabaseMigrator(_connectionFactory, LoggerFactory.CreateLogger<DatabaseMigrator>()).MigrateAsync(CancellationToken.None);
        await RunUserSeedingAsync();

        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.WebHost.UseTestServer();
        builder.Logging.ClearProviders();
        builder.Logging.SetMinimumLevel(LogLevel.Trace);
        builder.Logging.AddProvider(Logs);
        Service.ConfigureServices(builder.Services, Settings, TimeProvider.System);

        _app = builder.Build();
        Service.ConfigurePipeline(_app, pathBase: "");
        await _app.StartAsync();
        _client = _app.GetTestClient();
    }

    public Task RunUserSeedingAsync()
    {
        var seeder = new UserSeeder(
            new UserRepository(_connectionFactory),
            LoggerFactory.CreateLogger<UserSeeder>());
        return seeder.SeedAsync(CancellationToken.None);
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }
        _disposed = true;

        _client?.Dispose();
        if (_app is not null)
        {
            await _app.StopAsync();
            await _app.DisposeAsync();
        }
        LoggerFactory.Dispose();
        Database.Dispose();
    }
}
