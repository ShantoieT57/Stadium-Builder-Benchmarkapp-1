using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Logging;
using StadiumBuilderBenchmarkapp1.Database;
using StadiumBuilderBenchmarkapp1.Security;
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

    /// <summary>The clock the API sees. Scenarios advance it to simulate idle time.</summary>
    public ManualTimeProvider Clock { get; } = new(new DateTimeOffset(2026, 1, 1, 8, 0, 0, TimeSpan.Zero));

    /// <summary>The path of the test-only operation guarded by the named authorisation policy.</summary>
    public static string PolicyProbePath(string policy) => $"/test/policies/{policy}";

    public HttpClient Client => _client ?? throw new InvalidOperationException("The fixture has not been started.");

    /// <summary>
    /// A client whose requests reach the API from the given remote address, e.g. to simulate
    /// a reverse proxy in front of it. The caller disposes it.
    /// </summary>
    public HttpClient CreateClientFrom(IPAddress remoteAddress)
    {
        var server = (_app ?? throw new InvalidOperationException("The fixture has not been started.")).GetTestServer();
        var handler = server.CreateHandler(context => context.Connection.RemoteIpAddress = remoteAddress);
        return new HttpClient(handler) { BaseAddress = server.BaseAddress };
    }

    public async Task StartAsync()
    {
        await new DatabaseMigrator(_connectionFactory, LoggerFactory.CreateLogger<DatabaseMigrator>()).MigrateAsync(CancellationToken.None);
        await RunUserSeedingAsync();

        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.WebHost.UseTestServer();
        builder.Logging.ClearProviders();
        builder.Logging.SetMinimumLevel(LogLevel.Trace);
        builder.Logging.AddProvider(Logs);
        Service.ConfigureServices(builder.Services, Settings, Clock);

        _app = builder.Build();
        Service.ConfigurePipeline(_app, pathBase: "");
        MapPolicyProbeEndpoints(_app);
        await _app.StartAsync();
        _client = _app.GetTestClient();
    }

    // Test-only operations that exist purely to prove the role policies; production
    // endpoints attach the same policies in later epics.
    private static void MapPolicyProbeEndpoints(WebApplication app)
    {
        foreach (var policy in new[] { RolePolicies.ImporterOnly, RolePolicies.ApproverOnly })
        {
            app.MapGet(PolicyProbePath(policy), () => Results.Ok()).RequireAuthorization(policy);
        }
    }

    public Task RunUserSeedingAsync()
    {
        var seeder = new UserSeeder(
            new UserRepository(_connectionFactory),
            new PasswordHasher(),
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
