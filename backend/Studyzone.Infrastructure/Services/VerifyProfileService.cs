using Studyzone.Application.Auth;
using Studyzone.Application.Common.Interfaces;

namespace Studyzone.Infrastructure.Services;

public class VerifyProfileService : IVerifyProfileService
{
    private readonly IUserRepository _userRepo;

    public VerifyProfileService(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<VerifyProfileResponse?> VerifyProfileAsync(string registerNumber, string role, CancellationToken ct = default)
    {
        var r = (role ?? "").Trim().ToLowerInvariant();
        var reg = (registerNumber ?? "").Trim();
        if (string.IsNullOrEmpty(reg))
            return null;

        if (r == "teacher")
        {
            var user = await _userRepo.GetByUserIdAndRoleAsync(reg, "teacher", ct);
            if (user == null)
                return null;
            return new VerifyProfileResponse
            {
                Name = user.Name ?? "",
                Phone = !string.IsNullOrWhiteSpace(user.Phone) ? user.Phone : "Not on file"
            };
        }

        return null;
    }

    public async Task SetupAccountAsync(string registerNumber, string role, string password, string? email, CancellationToken ct = default)
    {
        var r = (role ?? "").Trim().ToLowerInvariant();
        var reg = (registerNumber ?? "").Trim();
        if (string.IsNullOrEmpty(reg) || string.IsNullOrEmpty(password))
            throw new InvalidOperationException("Register number and password are required.");

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        if (r == "teacher")
        {
            var user = await _userRepo.GetByUserIdAndRoleAsync(reg, "teacher", ct);
            if (user == null)
                throw new InvalidOperationException("Teacher not found. Teachers must be created by admin first.");

            var tracked = await _userRepo.GetByIdAsync(user.Id, ct);
            if (tracked == null)
                throw new InvalidOperationException("Teacher user not found.");
            tracked.PasswordHash = hashedPassword;
            tracked.UpdatedAt = DateTime.UtcNow;
            await _userRepo.UpdateAsync(tracked, ct);
            return;
        }

        throw new InvalidOperationException("Invalid role.");
    }
}
