namespace Studyzone.Application.Students;

public class ClassDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class CreateClassRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class BatchDto
{
    public string Id { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string? AcademicYearName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public int? SeatLimit { get; set; }
    public string? ClassTeacherUserId { get; set; }
    public string? ClassTeacherName { get; set; }
}

public class CreateBatchRequest
{
    public string ClassId { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Section { get; set; }
    public int? SeatLimit { get; set; }
    public string? ClassTeacherUserId { get; set; }
}
