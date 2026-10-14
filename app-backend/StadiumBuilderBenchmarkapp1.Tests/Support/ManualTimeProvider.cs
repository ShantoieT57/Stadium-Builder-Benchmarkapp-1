namespace StadiumBuilderBenchmarkapp1.Tests.Support;

/// <summary>A clock that only moves when a test tells it to.</summary>
public sealed class ManualTimeProvider(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset _now = start;

    public override DateTimeOffset GetUtcNow() => _now;

    public void Advance(TimeSpan duration) => _now += duration;
}
