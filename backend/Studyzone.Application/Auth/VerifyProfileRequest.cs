namespace Studyzone.Application.Auth;

public class VerifyProfileRequest
{
    public string RegisterNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "student" | "teacher"
}
