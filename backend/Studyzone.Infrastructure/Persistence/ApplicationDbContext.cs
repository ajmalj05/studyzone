using Microsoft.EntityFrameworkCore;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<School> Schools => Set<School>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Enquiry> Enquiries => Set<Enquiry>();
    public DbSet<Domain.Entities.Application> Applications => Set<Domain.Entities.Application>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<AdmissionApproval> AdmissionApprovals => Set<AdmissionApproval>();
    public DbSet<AdmissionNumberSequence> AdmissionNumberSequences => Set<AdmissionNumberSequence>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<SiblingGroup> SiblingGroups => Set<SiblingGroup>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentStatusHistory> StudentStatusHistories => Set<StudentStatusHistory>();
    public DbSet<CustomFieldDefinition> CustomFieldDefinitions => Set<CustomFieldDefinition>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<FeeCharge> FeeCharges => Set<FeeCharge>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ReceiptSequence> ReceiptSequences => Set<ReceiptSequence>();
    public DbSet<PeriodConfig> PeriodConfigs => Set<PeriodConfig>();
    public DbSet<TimetableSlot> TimetableSlots => Set<TimetableSlot>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Substitution> Substitutions => Set<Substitution>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<MarksEntry> MarksEntries => Set<MarksEntry>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<TeacherSalary> TeacherSalaries => Set<TeacherSalary>();
    public DbSet<PortalRequest> PortalRequests => Set<PortalRequest>();
    public DbSet<StudentParent> StudentParents => Set<StudentParent>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(x => x.UserId).IsUnique();
        });
        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasOne(x => x.Role).WithMany(x => x.Permissions).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.RoleId, x.PermissionKey }).IsUnique();
        });
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasIndex(x => x.Timestamp);
            e.HasIndex(x => x.TableName);
        });
        modelBuilder.Entity<Enquiry>(e =>
        {
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.FollowUpDate);
        });
        modelBuilder.Entity<Domain.Entities.Application>(e =>
        {
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.EnquiryId);
        });
        modelBuilder.Entity<Document>(e =>
        {
            e.HasIndex(x => x.ApplicationId);
        });
        modelBuilder.Entity<AdmissionNumberSequence>(e =>
        {
            e.HasIndex(x => new { x.AcademicYearName, x.ClassCode }).IsUnique();
        });
        modelBuilder.Entity<Batch>(e =>
        {
            e.HasOne(x => x.Class).WithMany().HasForeignKey(x => x.ClassId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Student>(e =>
        {
            e.HasIndex(x => x.AdmissionNumber).IsUnique();
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.ClassId);
            e.HasIndex(x => x.BatchId);
        });
        modelBuilder.Entity<FeeCharge>(e =>
        {
            e.HasIndex(x => x.StudentId);
            e.HasIndex(x => new { x.StudentId, x.Period });
        });
        modelBuilder.Entity<Payment>(e =>
        {
            e.HasIndex(x => x.StudentId);
            e.HasIndex(x => x.ReceiptNumber).IsUnique();
        });
        modelBuilder.Entity<ReceiptSequence>(e =>
        {
            e.HasIndex(x => x.Prefix).IsUnique();
        });
        modelBuilder.Entity<TimetableSlot>(e =>
        {
            e.HasIndex(x => x.BatchId);
            e.HasIndex(x => new { x.BatchId, x.DayOfWeek, x.PeriodOrder });
        });
        modelBuilder.Entity<LeaveRequest>(e =>
        {
            e.HasIndex(x => x.TeacherUserId);
            e.HasIndex(x => x.Status);
        });
        modelBuilder.Entity<AttendanceRecord>(e =>
        {
            e.HasIndex(x => x.Date);
            e.HasIndex(x => x.StudentId);
            e.HasIndex(x => new { x.StudentId, x.Date });
        });
        modelBuilder.Entity<MarksEntry>(e =>
        {
            e.HasIndex(x => x.ExamId);
            e.HasIndex(x => new { x.ExamId, x.StudentId, x.Subject });
        });
        modelBuilder.Entity<Announcement>(e =>
        {
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.AudienceType);
        });
        modelBuilder.Entity<TeacherSalary>(e =>
        {
            e.HasIndex(x => x.TeacherUserId);
            e.HasIndex(x => x.EffectiveFrom);
        });
        modelBuilder.Entity<PortalRequest>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Role);
            e.HasIndex(x => x.Status);
        });
        modelBuilder.Entity<StudentParent>(e =>
        {
            e.HasIndex(x => x.ParentUserId);
            e.HasIndex(x => x.StudentId);
            e.HasIndex(x => new { x.StudentId, x.ParentUserId }).IsUnique();
        });
        modelBuilder.Entity<Notification>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.CreatedAt);
        });
    }
}
