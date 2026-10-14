namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>Reads, writes and clears the HTTP-only session cookie.</summary>
public sealed class SessionCookie(AppSettings settings)
{
    public const string Name = "session";

    public static string? Read(HttpRequest request) =>
        request.Cookies.TryGetValue(Name, out var token) && !string.IsNullOrEmpty(token) ? token : null;

    public void Write(HttpResponse response, string token) =>
        response.Cookies.Append(Name, token, CreateOptions(response.HttpContext.Request));

    public void Clear(HttpResponse response) =>
        response.Cookies.Delete(Name, CreateOptions(response.HttpContext.Request));

    private CookieOptions CreateOptions(HttpRequest request) => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = IsSecure(request),
        Path = "/",
        IsEssential = true,
    };

    // In Auto mode Secure follows the scheme the browser used: request.IsHttps reflects
    // X-Forwarded-Proto from a trusted (loopback) proxy, so the cookie is Secure behind the
    // front-end's HTTPS rewrite proxy and still works over plain http in local development.
    private bool IsSecure(HttpRequest request) => settings.SessionCookieSecure switch
    {
        SessionCookieSecureMode.Always => true,
        SessionCookieSecureMode.Never => false,
        _ => request.IsHttps,
    };
}
