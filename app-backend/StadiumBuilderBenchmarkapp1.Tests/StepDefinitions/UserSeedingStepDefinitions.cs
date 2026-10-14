using Reqnroll;
using StadiumBuilderBenchmarkapp1.Tests.Support;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class UserSeedingStepDefinitions(TransactionImportApiFixture fixture)
{
    [When("the user seeding runs again")]
    public Task WhenTheUserSeedingRunsAgain() => fixture.RunUserSeedingAsync();

    [Then("the stored users are")]
    public async Task ThenTheStoredUsersAre(DataTable expected)
    {
        var users = await fixture.Database.GetUsersAsync();
        var actual = users.Select(user => (user.Name, user.Email, user.Role)).ToList();
        var wanted = expected.Rows.Select(row => (row["name"], row["email"], row["role"])).ToList();
        Assert.Equal(wanted, actual);
    }

    [Then("there are {int} stored users")]
    public async Task ThenThereAreStoredUsers(int count) =>
        Assert.Equal(count, (await fixture.Database.GetUsersAsync()).Count);

    [Then("no stored password hash contains {string}")]
    public async Task ThenNoStoredPasswordHashContains(string password)
    {
        var users = await fixture.Database.GetUsersAsync();
        Assert.All(users, user =>
        {
            Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
            Assert.DoesNotContain(password, user.PasswordHash, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Then("every stored password hash is different")]
    public async Task ThenEveryStoredPasswordHashIsDifferent()
    {
        // Both seeded people share the same password, so identical hashes would mean no salt.
        var users = await fixture.Database.GetUsersAsync();
        Assert.Equal(users.Count, users.Select(user => user.PasswordHash).Distinct().Count());
    }
}
