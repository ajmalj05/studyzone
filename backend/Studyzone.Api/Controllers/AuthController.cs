using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Auth;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IVerifyProfileService _verifyProfileService;

    public AuthController(IAuthService authService, IVerifyProfileService verifyProfileService)
    {
        _authService = authService;
        _verifyProfileService = verifyProfileService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, ct);
        if (result == null)
            return Unauthorized(new { message = "Invalid credentials" });
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("verify-profile")]
    public async Task<ActionResult<VerifyProfileResponse>> VerifyProfile([FromBody] VerifyProfileRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.RegisterNumber) || string.IsNullOrWhiteSpace(request?.Role))
            return BadRequest(new { message = "Register number and role are required." });
        var result = await _verifyProfileService.VerifyProfileAsync(request.RegisterNumber, request.Role, ct);
        if (result == null)
            return NotFound(new { message = "Profile not found. Check the register/admission number and role." });
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("setup-account")]
    public async Task<IActionResult> SetupAccount([FromBody] SetupAccountRequest request, CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RegisterNumber) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Register number and password are required." });
        try
        {
            await _verifyProfileService.SetupAccountAsync(request.RegisterNumber, request.Role, request.Password, request.Email, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
