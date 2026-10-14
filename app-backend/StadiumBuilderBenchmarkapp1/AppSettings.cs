using Twenty57.Builder.ApplicationRuntime.Interfaces;

namespace StadiumBuilderBenchmarkapp1;

public sealed class AppSettings : IAppSettings
{
    /// <summary>
    /// Base URI the TransactionImportApi REST host listens on. May include a path
    /// (e.g. <c>http://localhost:8042/v1</c>), which is applied as the path base.
    /// </summary>
    public string TransactionImportApiUrl { get; set; } = "http://localhost:8042";

    /// <summary>SQLite connection string for the application database.</summary>
    public string DatabaseConnectionString { get; set; } = "Data Source=TransactionImport.db";
}
