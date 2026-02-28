namespace Studyzone.Application.Auth;

public interface IVerifyProfileService
{
    Task<VerifyProfileResponse?> VerifyProfileAsync(string registerNumber, string role, CancellationToken ct = default);
    Task SetupAccountAsync(string registerNumber, string role, string password, string? email, CancellationToken ct = default);
}
