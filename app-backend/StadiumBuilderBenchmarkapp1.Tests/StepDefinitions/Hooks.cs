using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class Hooks(TransactionImportApiFixture fixture)
{
    [BeforeScenario]
    public Task StartApiAsync() => fixture.StartAsync();

    [AfterScenario]
    public async Task StopApiAsync() => await fixture.DisposeAsync();
}
