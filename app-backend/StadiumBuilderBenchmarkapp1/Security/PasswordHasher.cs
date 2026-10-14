using Microsoft.AspNetCore.Identity;

namespace StadiumBuilderBenchmarkapp1.Security;

/// <summary>
/// Salted, iterated password hashing (ASP.NET Core Identity's PBKDF2 format: a fresh
/// random salt per hash, so equal passwords produce different hashes).
/// </summary>
public sealed class PasswordHasher
{
    private static readonly PasswordHasher<object> Hasher = new();
    private static readonly object NoUser = new();

    // Verified when the email is unknown so a failed sign-in takes about the same time
    // whether or not the account exists.
    private static readonly Lazy<string> DummyHash = new(() => Hasher.HashPassword(NoUser, Guid.NewGuid().ToString()));

    public string Hash(string password) => Hasher.HashPassword(NoUser, password);

    /// <summary>
    /// Returns true when <paramref name="password"/> matches <paramref name="passwordHash"/>.
    /// When <paramref name="passwordHash"/> is null the work is still done and false is returned.
    /// </summary>
    public bool Verify(string? passwordHash, string password)
    {
        var result = Hasher.VerifyHashedPassword(NoUser, passwordHash ?? DummyHash.Value, password);
        return passwordHash is not null && result != PasswordVerificationResult.Failed;
    }
}
