using Microsoft.EntityFrameworkCore;
using Studyzone.Application.TeacherOfferLetter;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Services;

public class TeacherOfferLetterService : ITeacherOfferLetterService
{
    private readonly ApplicationDbContext _db;

    public TeacherOfferLetterService(ApplicationDbContext db)
    {
        _db = db;
    }

    private static TeacherOfferLetterDto ToDto(Domain.Entities.TeacherOfferLetter e) => new()
    {
        Id = e.Id.ToString(),
        CandidateName = e.CandidateName,
        Gender = e.Gender,
        CandidateAddress = e.CandidateAddress,
        PassportId = e.PassportId,
        Designation = e.Designation,
        Subject = e.Subject,
        Phone = e.Phone,
        RegisterNumber = e.RegisterNumber,
        RefNumber = e.RefNumber,
        LetterDate = e.LetterDate?.ToString("yyyy-MM-dd"),
        InterviewDate = e.InterviewDate?.ToString("yyyy-MM-dd"),
        JoiningDate = e.JoiningDate?.ToString("yyyy-MM-dd"),
        BasicSalary = e.BasicSalary,
        HousingAllowance = e.HousingAllowance,
        TransportAllowance = e.TransportAllowance,
        OtherAllowances = e.OtherAllowances,
        GrossSalary = e.BasicSalary + e.HousingAllowance + e.TransportAllowance + e.OtherAllowances,
        VisaStatus = e.VisaStatus,
        Medical = e.Medical,
        Leave = e.Leave,
        JoiningExpenses = e.JoiningExpenses,
        ProbationPeriod = e.ProbationPeriod,
        AdditionalNotes = e.AdditionalNotes,
        TeacherUserId = e.TeacherUserId?.ToString(),
        CreatedAt = e.CreatedAt.ToString("o"),
        UpdatedAt = e.UpdatedAt?.ToString("o"),
    };

    public async Task<IReadOnlyList<TeacherOfferLetterDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _db.TeacherOfferLetters
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
        return list.Select(ToDto).ToList();
    }

    public async Task<TeacherOfferLetterDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _db.TeacherOfferLetters.FindAsync(new object[] { guid }, ct);
        return e == null ? null : ToDto(e);
    }

    public async Task<TeacherOfferLetterDto> CreateAsync(CreateTeacherOfferLetterRequest request, CancellationToken ct = default)
    {
        var e = new Domain.Entities.TeacherOfferLetter
        {
            Id = Guid.NewGuid(),
            CandidateName = request.CandidateName,
            Gender = request.Gender,
            CandidateAddress = request.CandidateAddress,
            PassportId = request.PassportId,
            Designation = request.Designation,
            Subject = request.Subject,
            Phone = request.Phone,
            RegisterNumber = request.RegisterNumber,
            RefNumber = request.RefNumber,
            LetterDate = ParseDate(request.LetterDate),
            InterviewDate = ParseDate(request.InterviewDate),
            JoiningDate = ParseDate(request.JoiningDate),
            BasicSalary = request.BasicSalary,
            HousingAllowance = request.HousingAllowance,
            TransportAllowance = request.TransportAllowance,
            OtherAllowances = request.OtherAllowances,
            VisaStatus = request.VisaStatus,
            Medical = request.Medical,
            Leave = request.Leave,
            JoiningExpenses = request.JoiningExpenses,
            ProbationPeriod = request.ProbationPeriod,
            AdditionalNotes = request.AdditionalNotes,
            TeacherUserId = Guid.TryParse(request.TeacherUserId, out var tid) ? tid : null,
            CreatedAt = DateTime.UtcNow,
        };
        _db.TeacherOfferLetters.Add(e);
        await _db.SaveChangesAsync(ct);
        return ToDto(e);
    }

    public async Task<TeacherOfferLetterDto> UpdateAsync(string id, UpdateTeacherOfferLetterRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) throw new ArgumentException("Invalid id");
        var e = await _db.TeacherOfferLetters.FindAsync(new object[] { guid }, ct)
            ?? throw new ArgumentException("Not found");

        e.CandidateName = request.CandidateName;
        e.Gender = request.Gender;
        e.CandidateAddress = request.CandidateAddress;
        e.PassportId = request.PassportId;
        e.Designation = request.Designation;
        e.Subject = request.Subject;
        e.Phone = request.Phone;
        e.RegisterNumber = request.RegisterNumber;
        e.RefNumber = request.RefNumber;
        e.LetterDate = ParseDate(request.LetterDate);
        e.InterviewDate = ParseDate(request.InterviewDate);
        e.JoiningDate = ParseDate(request.JoiningDate);
        e.BasicSalary = request.BasicSalary;
        e.HousingAllowance = request.HousingAllowance;
        e.TransportAllowance = request.TransportAllowance;
        e.OtherAllowances = request.OtherAllowances;
        e.VisaStatus = request.VisaStatus;
        e.Medical = request.Medical;
        e.Leave = request.Leave;
        e.JoiningExpenses = request.JoiningExpenses;
        e.ProbationPeriod = request.ProbationPeriod;
        e.AdditionalNotes = request.AdditionalNotes;
        e.TeacherUserId = Guid.TryParse(request.TeacherUserId, out var tid) ? tid : null;
        e.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ToDto(e);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) throw new ArgumentException("Invalid id");
        var e = await _db.TeacherOfferLetters.FindAsync(new object[] { guid }, ct)
            ?? throw new ArgumentException("Not found");
        _db.TeacherOfferLetters.Remove(e);
        await _db.SaveChangesAsync(ct);
    }

    private static DateTime? ParseDate(string? s)
        => DateTime.TryParse(s, out var d) ? DateTime.SpecifyKind(d, DateTimeKind.Utc) : null;
}
