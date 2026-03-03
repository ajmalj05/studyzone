namespace Studyzone.Application.Auth;

public class SetupAccountRequest
{
    public string RegisterNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "teacher"
    public string Password { get; set; } = string.Empty;
    public string? Email { get; set; }
}
