namespace StadiumBuilderBenchmarkapp1.Database;

/// <summary>A person who can sign in. <see cref="Role"/> is "Importer" or "Approver".</summary>
public sealed record User(long Id, string Name, string Email, string PasswordHash, string Role);
