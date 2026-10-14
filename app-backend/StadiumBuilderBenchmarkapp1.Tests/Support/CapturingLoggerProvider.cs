using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace StadiumBuilderBenchmarkapp1.Tests.Support;

/// <summary>
/// Captures every formatted log message (and exception text) so tests can assert
/// that sensitive values never reach the logs.
/// </summary>
public sealed class CapturingLoggerProvider : ILoggerProvider
{
    private readonly ConcurrentQueue<string> _entries = new();

    public IReadOnlyCollection<string> Entries => _entries.ToArray();

    public ILogger CreateLogger(string categoryName) => new CapturingLogger(categoryName, _entries);

    public void Dispose()
    {
    }

    private sealed class CapturingLogger(string categoryName, ConcurrentQueue<string> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            entries.Enqueue($"{logLevel} {categoryName}: {formatter(state, exception)} {exception}");
        }
    }
}
