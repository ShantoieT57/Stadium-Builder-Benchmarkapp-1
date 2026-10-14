using Twenty57.Builder.ApplicationRuntime.Interfaces;

namespace StadiumBuilderBenchmarkapp1;

public sealed class AppSettings : IAppSettings
{
    /// <summary>
    /// Base URI the TransactionImportApi REST host listens on. May include a path
    /// (e.g. <c>http://localhost:8042/v1</c>), which is applied as the path base.
    /// </summary>
    public string TransactionImportApiUrl { get; set; } = "http://localhost:8042";

    /// <summary>
    /// SQLite connection string for the application database. A relative database file
    /// is resolved against the application folder, not the current working directory.
    /// </summary>
    public string DatabaseConnectionString { get; set; } = "Data Source=TransactionImport.db";

    /// <summary>
    /// Whether the session cookie is marked Secure. <c>Auto</c> (default) follows the scheme
    /// the browser used, honouring X-Forwarded-Proto from a proxy on this machine;
    /// <c>Always</c> forces Secure (use in HTTPS deployments behind other proxies);
    /// <c>Never</c> disables it.
    /// </summary>
    public SessionCookieSecureMode SessionCookieSecure { get; set; } = SessionCookieSecureMode.Auto;
}

/// <summary>How the Secure flag of the session cookie is decided. See <see cref="AppSettings.SessionCookieSecure"/>.</summary>
public enum SessionCookieSecureMode
{
    Auto,
    Always,
    Never,
}
