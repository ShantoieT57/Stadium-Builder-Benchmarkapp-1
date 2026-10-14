using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using StadiumBuilderBenchmarkapp1.Database;
using StadiumBuilderBenchmarkapp1.Security;
using Twenty57.Builder.ApplicationRuntime.Interfaces;

namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>
/// Hosts the TransactionImportApi REST API in its own <see cref="WebApplication"/>, so it
/// can be started and stopped independently of the application's other services.
/// </summary>
public sealed class Service(AppSettings settings, IHostEnvironment environment, TimeProvider timeProvider, ILogger<Service> logger) : IService
{
    public const string OpenApiSpecResourceName = "TransactionImportApi.yaml";
    private const string OpenApiSpecPath = "/openapi/" + OpenApiSpecResourceName;

    private WebApplication? _app;

    public bool IsRunning => _app is not null;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (_app is not null)
        {
            return;
        }

        var (origin, pathBase) = SplitUrl(settings.TransactionImportApiUrl);

        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            ApplicationName = environment.ApplicationName,
            EnvironmentName = environment.EnvironmentName,
            ContentRootPath = environment.ContentRootPath,
        });
        builder.WebHost.UseUrls(origin);
        ConfigureServices(builder.Services, settings, timeProvider);

        var app = builder.Build();
        ConfigurePipeline(app, pathBase);
        await app.StartAsync(cancellationToken).ConfigureAwait(false);
        _app = app;

        logger.LogInformation("TransactionImportApi listening on {Url}.", settings.TransactionImportApiUrl);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_app is null)
        {
            return;
        }

        await _app.StopAsync(cancellationToken).ConfigureAwait(false);
        await _app.DisposeAsync().ConfigureAwait(false);
        _app = null;
    }

    /// <summary>
    /// Splits a configured URL into the scheme + authority (for the server to listen on)
    /// and its path (applied as the path base; empty when the URL has no path).
    /// </summary>
    public static (string Origin, string PathBase) SplitUrl(string url)
    {
        var uri = new Uri(url, UriKind.Absolute);
        return (uri.GetLeftPart(UriPartial.Authority), uri.AbsolutePath.TrimEnd('/'));
    }

    public static void ConfigureServices(IServiceCollection services, AppSettings settings, TimeProvider timeProvider)
    {
        services.AddSingleton(settings);
        services.AddSingleton(timeProvider);
        services.AddSingleton<DbConnectionFactory>();
        services.AddSingleton<UserRepository>();
        services.AddSingleton<SessionRepository>();
        services.AddSingleton<SessionStore>();
        services.AddSingleton<PasswordHasher>();
        services.AddSingleton<SessionCookie>();

        // Only this service's controllers, regardless of which assembly is the entry point.
        services.AddControllers().ConfigureApplicationPartManager(parts =>
        {
            parts.ApplicationParts.Clear();
            parts.ApplicationParts.Add(new AssemblyPart(typeof(Service).Assembly));
        });

        services.AddAuthentication(SessionAuthenticationHandler.SchemeName)
            .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(SessionAuthenticationHandler.SchemeName, null);
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
            options.AddRolePolicies();
        });
    }

    public static void ConfigurePipeline(WebApplication app, string pathBase)
    {
        if (!string.IsNullOrEmpty(pathBase))
        {
            app.UsePathBase(pathBase);
        }

        // Take the original scheme (X-Forwarded-Proto) from a reverse proxy such as the
        // front-end's /api rewrite, so Request.IsHttps reflects what the browser used. Only
        // the default known proxies (loopback addresses) are trusted to set it.
        app.UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.XForwardedProto });

        if (app.Environment.IsDevelopment())
        {
            // Registered before authentication/authorization so the UI is reachable anonymously.
            app.UseSwaggerUI(options => options.SwaggerEndpoint(pathBase + OpenApiSpecPath, "TransactionImportApi"));
        }

        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();

        if (app.Environment.IsDevelopment())
        {
            var spec = ReadOpenApiSpec();
            app.MapGet(OpenApiSpecPath, () => Results.Text(spec, "application/yaml")).AllowAnonymous();
        }

        app.MapControllers();
    }

    private static string ReadOpenApiSpec()
    {
        using var stream = typeof(Service).Assembly.GetManifestResourceStream(OpenApiSpecResourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{OpenApiSpecResourceName}' was not found.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
