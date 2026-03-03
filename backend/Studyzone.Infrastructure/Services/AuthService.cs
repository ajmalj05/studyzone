using Studyzone.Application.Auth;
using Studyzone.Application.Common.Interfaces;

namespace Studyzone.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IJwtTokenService _jwt;

    public AuthService(IUserRepository userRepo, IJwtTokenService jwt)
    {
        _userRepo = userRepo;
        _jwt = jwt;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByUserIdAndRoleAsync(request.UserId, request.Role, ct);
        if (user == null)
            return null;

        if (string.Equals(user.Role, "student", StringComparison.OrdinalIgnoreCase))
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var token = _jwt.GenerateToken(user);
        return new LoginResponse
        {
            AccessToken = token,
            Id = user.Id.ToString(),
            UserId = user.UserId,
            Name = user.Name,
            Role = user.Role
        };
    }
}
