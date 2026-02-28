namespace Studyzone.Application.Dashboard;

public class DashboardKpiDto
{
    public int TotalStudents { get; set; }
    public int ActiveTeachers { get; set; }
    public int StaffCount { get; set; }
    public decimal RevenueCollected { get; set; }
    public decimal PendingDues { get; set; }
}

public class AdmissionPipelineDto
{
    public int NewEnquiries { get; set; }
    public int Contacted { get; set; }
    public int InterviewScheduled { get; set; }
    public int PendingApprovals { get; set; }
}

public class FeeSummaryDto
{
    public string ClassName { get; set; } = string.Empty;
    public decimal Outstanding { get; set; }
    public int StudentCount { get; set; }
}
