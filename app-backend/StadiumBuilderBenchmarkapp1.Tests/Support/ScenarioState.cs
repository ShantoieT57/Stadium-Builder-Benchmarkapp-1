namespace StadiumBuilderBenchmarkapp1.Tests.Support;

/// <summary>
/// State shared between all step definition classes within a single scenario.
/// </summary>
public sealed class ScenarioState
{
    public HttpResponseMessage? LastResponse { get; set; }

    public string LastResponseBody { get; set; } = "";

    /// <summary>The session token value the "browser" currently holds, if any.</summary>
    public string? SessionToken { get; set; }

    public HttpResponseMessage Response =>
        LastResponse ?? throw new InvalidOperationException("No request has been sent in this scenario yet.");
}
