using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
