using System.Text.Json.Serialization;

namespace Studyzone.Application.Subjects;

public class SubjectDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}

public class CreateSubjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
}

public class SetSubjectsForClassRequest
{
    public IReadOnlyList<string> SubjectIds { get; set; } = Array.Empty<string>();
}
