using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class RoleAuthorisationStepDefinitions(CommonStepDefinitions common)
{
    [When("I call the operation restricted to the {string} policy")]
    public Task WhenICallTheOperationRestrictedToThePolicy(string policy) =>
        common.SendAsync(HttpMethod.Get, TransactionImportApiFixture.PolicyProbePath(policy));
}
