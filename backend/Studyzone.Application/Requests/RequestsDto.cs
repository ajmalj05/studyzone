using System.Text.Json.Serialization;

namespace Studyzone.Application.Requests;

public class RequestDto
{
    [JsonPropertyName("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("userId")]
    public RequestUserDto? UserId { get; set; }

    public string Role { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? AdminComment { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}

public class RequestUserDto
{
    public string? Name { get; set; }
    public string? RegisterNumber { get; set; }
    public string? Phone { get; set; }
}

public class CreateRequestRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class UpdateRequestRequest
{
    public string Status { get; set; } = string.Empty;
    public string? AdminComment { get; set; }
}
