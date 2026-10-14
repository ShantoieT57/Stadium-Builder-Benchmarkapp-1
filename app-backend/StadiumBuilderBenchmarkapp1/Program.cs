using Twenty57.Builder.ApplicationRuntime.Interfaces;
using Twenty57.Builder.ApplicationRuntime.Sdk;
using StadiumBuilderBenchmarkapp1;
using StadiumBuilderBenchmarkapp1.Database;
using TransactionImportApiService = StadiumBuilderBenchmarkapp1.Services.TransactionImportApi.Service;

var builder = Host.CreateApplicationBuilder();

var appSettings = builder.Configuration.Get<AppSettings>() ?? new AppSettings();
builder.Services.AddSingleton<IAppSettings>(appSettings);
builder.Services.AddSingleton(appSettings);
builder.Services.AddSingleton(TimeProvider.System);

// One-shot startup steps.
builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddSingleton<UserRepository>();
builder.Services.AddSingleton<DatabaseMigrator>();
builder.Services.AddSingleton<UserSeeder>();

// Services (started and stopped by Application).
builder.Services.AddSingleton<TransactionImportApiService>();

builder.Services.AddHostedService<Application>();

await Runner.RunAsync(builder.Build()).ConfigureAwait(false);
