using Microsoft.AspNetCore.Authorization;

namespace StadiumBuilderBenchmarkapp1.Services.TransactionImportApi;

/// <summary>
/// Reusable authorisation policies that restrict an operation to one role, based on the
/// role claim of the signed-in person's session. Attach them with
/// <c>[Authorize(Policy = RolePolicies.ImporterOnly)]</c> (or <c>RequireAuthorization</c>).
/// A caller without a valid session gets 401; a signed-in person without the role gets 403.
/// </summary>
public static class RolePolicies
{
    public const string ImporterOnly = nameof(ImporterOnly);
    public const string ApproverOnly = nameof(ApproverOnly);

    public static void AddRolePolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(ImporterOnly, policy => policy.RequireAuthenticatedUser().RequireRole(nameof(Role.Importer)));
        options.AddPolicy(ApproverOnly, policy => policy.RequireAuthenticatedUser().RequireRole(nameof(Role.Approver)));
    }
}
