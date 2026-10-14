using StadiumBuilderBenchmarkapp1.Security;

namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>
/// One-shot startup step that creates the ready-to-use people if they do not exist yet.
/// Safe to run on every start.
/// </summary>
public sealed class UserSeeder(UserRepository users, ILogger<UserSeeder> logger)
{
    private const string SeedPassword = "Test123";

    private static readonly (string Name, string Email, string Role)[] SeedUsers =
    [
        ("File Importer", "fileimporter@digiata.com", "Importer"),
        ("Approver User", "approver@digiata.com", "Approver"),
    ];

    private readonly PasswordHasher _passwordHasher = new();

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var (name, email, role) in SeedUsers)
        {
            var inserted = await users.InsertIfMissingAsync(name, email, _passwordHasher.Hash(SeedPassword), role, cancellationToken)
                .ConfigureAwait(false);
            if (inserted)
            {
                logger.LogInformation("Seeded the ready-to-use {Role} user.", role);
            }
        }
    }
}
