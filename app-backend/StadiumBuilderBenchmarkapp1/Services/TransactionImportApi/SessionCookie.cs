namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>Reads, writes and clears the HTTP-only session cookie.</summary>
internal static class SessionCookie
{
    public const string Name = "session";

    public static string? Read(HttpRequest request) =>
        request.Cookies.TryGetValue(Name, out var token) && !string.IsNullOrEmpty(token) ? token : null;

    public static void Write(HttpResponse response, string token) =>
        response.Cookies.Append(Name, token, CreateOptions(response.HttpContext.Request));

    public static void Clear(HttpResponse response) =>
        response.Cookies.Delete(Name, CreateOptions(response.HttpContext.Request));

    // Secure follows the request scheme so the cookie works over plain http in local
    // development and is HTTPS-only wherever the API is served over HTTPS.
    private static CookieOptions CreateOptions(HttpRequest request) => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = request.IsHttps,
        Path = "/",
        IsEssential = true,
    };
}
