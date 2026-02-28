namespace Studyzone.Domain.Entities;

public class AttendanceRecord
{
    public Guid Id { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? TeacherUserId { get; set; }
    public DateTime Date { get; set; }
    public int? PeriodNumber { get; set; }
    public string Status { get; set; } = "Present"; // Present, Absent, Late
    public string RecordType { get; set; } = "Student"; // Student, Teacher
    public DateTime CreatedAt { get; set; }
}
