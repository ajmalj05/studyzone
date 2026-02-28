using Studyzone.Application.Auth;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class VerifyProfileService : IVerifyProfileService
{
    private readonly IUserRepository _userRepo;
    private readonly IStudentRepository _studentRepo;

    public VerifyProfileService(IUserRepository userRepo, IStudentRepository studentRepo)
    {
        _userRepo = userRepo;
        _studentRepo = studentRepo;
    }

    public async Task<VerifyProfileResponse?> VerifyProfileAsync(string registerNumber, string role, CancellationToken ct = default)
    {
        var r = (role ?? "").Trim().ToLowerInvariant();
        var reg = (registerNumber ?? "").Trim();
        if (string.IsNullOrEmpty(reg))
            return null;

        if (r == "student")
        {
            var student = await _studentRepo.GetByAdmissionNumberAsync(reg, ct);
            if (student == null)
                return null;
            return new VerifyProfileResponse
            {
                Name = student.Name ?? "",
                Phone = student.GuardianPhone ?? "Not on file"
            };
        }

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

        if (r == "student")
        {
            var student = await _studentRepo.GetByAdmissionNumberAsync(reg, ct);
            if (student == null)
                throw new InvalidOperationException("Student not found with this admission number.");

            if (student.UserId.HasValue)
            {
                var existingUser = await _userRepo.GetByIdAsync(student.UserId.Value, ct);
                if (existingUser != null)
                {
                    existingUser.PasswordHash = hashedPassword;
                    existingUser.UpdatedAt = DateTime.UtcNow;
                    await _userRepo.UpdateAsync(existingUser, ct);
                }
                return;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                UserId = student.AdmissionNumber,
                PasswordHash = hashedPassword,
                Name = student.Name,
                Role = "student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _userRepo.AddAsync(user, ct);

            var trackedStudent = await _studentRepo.GetByIdAsync(student.Id, ct);
            if (trackedStudent != null)
            {
                trackedStudent.UserId = user.Id;
                trackedStudent.UpdatedAt = DateTime.UtcNow;
                await _studentRepo.UpdateAsync(trackedStudent, ct);
            }
            return;
        }

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
