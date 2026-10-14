using Microsoft.Data.Sqlite;
using Reqnroll;
using StadiumBuilderBenchmarkapp1.Database;

namespace StadiumBuilderBenchmarkapp1.Tests.StepDefinitions;

[Binding]
public sealed class DatabaseLocationStepDefinitions
{
    private AppSettings _settings = new();
    private string? _absolutePath;

    [Given("the default application settings")]
    public void GivenTheDefaultApplicationSettings() => _settings = new AppSettings();

    [Given("the database connection string is {string}")]
    public void GivenTheDatabaseConnectionStringIs(string connectionString) =>
        _settings = new AppSettings { DatabaseConnectionString = connectionString };

    [Given("the database connection string names an absolute file {string} in the temp folder")]
    public void GivenTheDatabaseConnectionStringNamesAnAbsoluteFile(string fileName)
    {
        _absolutePath = Path.Combine(Path.GetTempPath(), fileName);
        GivenTheDatabaseConnectionStringIs($"Data Source={_absolutePath}");
    }

    [Then("the database file used is {string} in the application folder")]
    public void ThenTheDatabaseFileUsedIsInTheApplicationFolder(string relativePath) =>
        Assert.Equal(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, relativePath)), ResolvedDataSource());

    [Then("the database file used is that absolute file")]
    public void ThenTheDatabaseFileUsedIsThatAbsoluteFile() => Assert.Equal(_absolutePath, ResolvedDataSource());

    [Then("the database file used is {string}")]
    public void ThenTheDatabaseFileUsedIs(string dataSource) => Assert.Equal(dataSource, ResolvedDataSource());

    private string ResolvedDataSource() =>
        new SqliteConnectionStringBuilder(new DbConnectionFactory(_settings).ConnectionString).DataSource;
}
