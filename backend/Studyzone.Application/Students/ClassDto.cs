namespace Studyzone.Application.Students;

public class ClassDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SeatLimit { get; set; }
}

public class CreateClassRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SeatLimit { get; set; }
}

public class BatchDto
{
    public string Id { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public int? SeatLimit { get; set; }
}

public class CreateBatchRequest
{
    public string ClassId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public int? SeatLimit { get; set; }
}
