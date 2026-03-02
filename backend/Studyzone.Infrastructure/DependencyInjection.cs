using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Auth;
using Studyzone.Application.Administration;
using Studyzone.Application.Admission;
using Studyzone.Application.Students;
using Studyzone.Application.Fees;
using Studyzone.Application.Timetable;
using Studyzone.Application.Dashboard;
using Studyzone.Application.Attendance;
using Studyzone.Application.Exams;
using Studyzone.Application.Communication;
using Studyzone.Application.Portal;
using Studyzone.Application.ParentPortal;
using Studyzone.Application.Reports;
using Studyzone.Application.TeacherSalary;
using Studyzone.Application.Requests;
using Studyzone.Application.Notifications;
using Studyzone.Infrastructure.Persistence;
using Studyzone.Infrastructure.Persistence.Repositories;
using Studyzone.Infrastructure.Services;

namespace Studyzone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString, IConfiguration? configuration = null)
    {
        var useMinio = configuration != null
            && !string.IsNullOrWhiteSpace(configuration["MinIO:Endpoint"])
            && !string.IsNullOrWhiteSpace(configuration["MinIO:AccessKey"])
            && !string.IsNullOrWhiteSpace(configuration["MinIO:SecretKey"]);
        services.AddDbContext<ApplicationDbContext>(o =>
        {
            o.UseNpgsql(connectionString);
            o.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IVerifyProfileService, VerifyProfileService>();
        services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<ISchoolRepository, SchoolRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IAcademicYearService, AcademicYearService>();
        services.AddScoped<ISchoolProfileService, SchoolProfileService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IEnquiryRepository, EnquiryRepository>();
        services.AddScoped<IApplicationRepository, ApplicationRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IAdmissionApprovalRepository, AdmissionApprovalRepository>();
        if (useMinio)
            services.AddScoped<IFileStorageService, MinioStorageService>();
        else
            services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<AdmissionNumberSequenceRepository>();
        services.AddScoped<IAdmissionNumberGenerator, AdmissionNumberGenerator>();
        services.AddScoped<IEnquiryService, EnquiryService>();
        services.AddScoped<IApplicationService, AdmissionApplicationService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IClassRepository, ClassRepository>();
        services.AddScoped<IBatchRepository, BatchRepository>();
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IStudentEnrollmentRepository, StudentEnrollmentRepository>();
        services.AddScoped<IStudentParentRepository, StudentParentRepository>();
        services.AddScoped<IStudentStatusHistoryRepository, StudentStatusHistoryRepository>();
        services.AddScoped<ISiblingGroupRepository, SiblingGroupRepository>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<IClassService, ClassService>();
        services.AddScoped<IBatchService, BatchService>();
        services.AddScoped<IFeeStructureRepository, FeeStructureRepository>();
        services.AddScoped<IFeeChargeRepository, FeeChargeRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IReceiptSequenceRepository, ReceiptSequenceRepository>();
        services.AddScoped<IFeeService, FeeService>();
        services.AddScoped<IPeriodConfigRepository, PeriodConfigRepository>();
        services.AddScoped<ITimetableSlotRepository, TimetableSlotRepository>();
        services.AddScoped<ITimetableService, TimetableService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IMarksEntryRepository, MarksEntryRepository>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IReportsService, ReportsService>();
        services.AddScoped<IPortalService, PortalService>();
        services.AddScoped<IParentPortalService, ParentPortalService>();
        services.AddScoped<IParentManagementService, ParentManagementService>();
        services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<ITeacherSalaryRepository, TeacherSalaryRepository>();
        services.AddScoped<ITeacherSalaryService, TeacherSalaryService>();
        services.AddScoped<ITeacherSalaryPaymentRepository, TeacherSalaryPaymentRepository>();
        services.AddScoped<ITeacherSalaryPaymentLineRepository, TeacherSalaryPaymentLineRepository>();
        services.AddScoped<ITeacherSalaryPaymentService, TeacherSalaryPaymentService>();
        services.AddScoped<IPortalRequestRepository, PortalRequestRepository>();
        services.AddScoped<IRequestsService, RequestsService>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationService, NotificationService>();
        return services;
    }
}
