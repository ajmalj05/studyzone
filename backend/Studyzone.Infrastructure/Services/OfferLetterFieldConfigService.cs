using Microsoft.EntityFrameworkCore;
using Studyzone.Application.TeacherOfferLetter;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Services;

public class OfferLetterFieldConfigService : IOfferLetterFieldConfigService
{
    private readonly ApplicationDbContext _db;

    public OfferLetterFieldConfigService(ApplicationDbContext db)
    {
        _db = db;
    }

    private static OfferLetterFieldConfigDto ToDto(Domain.Entities.OfferLetterFieldConfig e) => new()
    {
        Id = e.Id.ToString(),
        FieldKey = e.FieldKey,
        Label = e.Label,
        DefaultValue = e.DefaultValue,
        IsVisible = e.IsVisible,
        ShowInPdf = e.ShowInPdf,
        IsRequired = e.IsRequired,
        DisplayOrder = e.DisplayOrder,
        FieldType = e.FieldType,
        Section = e.Section,
        CreatedAt = e.CreatedAt.ToString("o"),
        UpdatedAt = e.UpdatedAt?.ToString("o"),
    };

    public async Task<IReadOnlyList<OfferLetterFieldConfigDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _db.OfferLetterFieldConfigs
            .OrderBy(x => x.Section)
            .ThenBy(x => x.DisplayOrder)
            .ToListAsync(ct);
        return list.Select(ToDto).ToList();
    }

    public async Task<OfferLetterFieldConfigDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _db.OfferLetterFieldConfigs.FindAsync(new object[] { guid }, ct);
        return e == null ? null : ToDto(e);
    }

    public async Task<OfferLetterFieldConfigDto> CreateAsync(CreateOfferLetterFieldConfigRequest request, CancellationToken ct = default)
    {
        var e = new Domain.Entities.OfferLetterFieldConfig
        {
            Id = Guid.NewGuid(),
            FieldKey = request.FieldKey,
            Label = request.Label,
            DefaultValue = request.DefaultValue,
            IsVisible = request.IsVisible,
            ShowInPdf = request.ShowInPdf,
            IsRequired = request.IsRequired,
            DisplayOrder = request.DisplayOrder,
            FieldType = request.FieldType,
            Section = request.Section,
            CreatedAt = DateTime.UtcNow,
        };
        _db.OfferLetterFieldConfigs.Add(e);
        await _db.SaveChangesAsync(ct);
        return ToDto(e);
    }

    public async Task<OfferLetterFieldConfigDto> UpdateAsync(string id, UpdateOfferLetterFieldConfigRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) throw new ArgumentException("Invalid id");
        var e = await _db.OfferLetterFieldConfigs.FindAsync(new object[] { guid }, ct)
            ?? throw new ArgumentException("Not found");

        e.FieldKey = request.FieldKey;
        e.Label = request.Label;
        e.DefaultValue = request.DefaultValue;
        e.IsVisible = request.IsVisible;
        e.ShowInPdf = request.ShowInPdf;
        e.IsRequired = request.IsRequired;
        e.DisplayOrder = request.DisplayOrder;
        e.FieldType = request.FieldType;
        e.Section = request.Section;
        e.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ToDto(e);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) throw new ArgumentException("Invalid id");
        var e = await _db.OfferLetterFieldConfigs.FindAsync(new object[] { guid }, ct)
            ?? throw new ArgumentException("Not found");
        _db.OfferLetterFieldConfigs.Remove(e);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ResetToDefaultsAsync(CancellationToken ct = default)
    {
        var existing = await _db.OfferLetterFieldConfigs.ToListAsync(ct);
        _db.OfferLetterFieldConfigs.RemoveRange(existing);
        await _db.SaveChangesAsync(ct);
        await SeedDefaultsAsync(ct);
    }

    public async Task SeedDefaultsAsync(CancellationToken ct = default)
    {
        var existingKeys = await _db.OfferLetterFieldConfigs.Select(x => x.FieldKey).ToListAsync(ct);
        var defaults = GetDefaultConfigs();
        var toAdd = defaults.Where(x => !existingKeys.Contains(x.FieldKey)).ToList();
        
        if (toAdd.Any())
        {
            _db.OfferLetterFieldConfigs.AddRange(toAdd);
            await _db.SaveChangesAsync(ct);
        }
    }

    private static List<Domain.Entities.OfferLetterFieldConfig> GetDefaultConfigs()
    {
        var defaults = new List<Domain.Entities.OfferLetterFieldConfig>
        {
            // Candidate Details Section
            new() { FieldKey = "gender", Label = "Title", FieldType = "select", Section = "candidate", DisplayOrder = 1, IsVisible = true, ShowInPdf = true, DefaultValue = "Mr" },
            new() { FieldKey = "candidateName", Label = "Full Name", FieldType = "text", Section = "candidate", DisplayOrder = 2, IsVisible = true, ShowInPdf = true, IsRequired = true },
            new() { FieldKey = "candidateAddress", Label = "Address / Location", FieldType = "text", Section = "candidate", DisplayOrder = 3, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "passportId", Label = "Passport / ID No.", FieldType = "text", Section = "candidate", DisplayOrder = 4, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "registerNumber", Label = "Register No. (Login ID)", FieldType = "text", Section = "candidate", DisplayOrder = 5, IsVisible = true, ShowInPdf = true, IsRequired = true },
            new() { FieldKey = "designation", Label = "Designation / Post", FieldType = "text", Section = "candidate", DisplayOrder = 6, IsVisible = true, ShowInPdf = true, DefaultValue = "Teacher" },
            new() { FieldKey = "subject", Label = "Subject", FieldType = "text", Section = "candidate", DisplayOrder = 7, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "phone", Label = "Phone", FieldType = "text", Section = "candidate", DisplayOrder = 8, IsVisible = true, ShowInPdf = true, IsRequired = true },
            new() { FieldKey = "letterDate", Label = "Letter Date", FieldType = "date", Section = "candidate", DisplayOrder = 9, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "refNumber", Label = "Ref. Number", FieldType = "text", Section = "candidate", DisplayOrder = 10, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "interviewDate", Label = "Interview Date", FieldType = "date", Section = "candidate", DisplayOrder = 11, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "joiningDate", Label = "Date of Joining", FieldType = "date", Section = "candidate", DisplayOrder = 12, IsVisible = true, ShowInPdf = true, IsRequired = true },
            
            // Salary Section
            new() { FieldKey = "basicSalary", Label = "Basic Salary (₹)", FieldType = "number", Section = "salary", DisplayOrder = 1, IsVisible = true, ShowInPdf = true, IsRequired = true },
            new() { FieldKey = "housingAllowance", Label = "Housing Allowance (₹)", FieldType = "number", Section = "salary", DisplayOrder = 2, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "transportAllowance", Label = "Transport Allowance (₹)", FieldType = "number", Section = "salary", DisplayOrder = 3, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "otherAllowances", Label = "Other Allowances (₹)", FieldType = "number", Section = "salary", DisplayOrder = 4, IsVisible = true, ShowInPdf = true },
            new() { FieldKey = "visaStatus", Label = "Visa Status", FieldType = "text", Section = "salary", DisplayOrder = 5, IsVisible = true, ShowInPdf = true },
            
            // Terms Section
            new() { FieldKey = "medical", Label = "2. Medical", FieldType = "textarea", Section = "terms", DisplayOrder = 1, IsVisible = true, ShowInPdf = true, DefaultValue = "Medical insurance for yourself and family." },
            new() { FieldKey = "leave", Label = "3. Leave", FieldType = "textarea", Section = "terms", DisplayOrder = 2, IsVisible = true, ShowInPdf = true, DefaultValue = "30 calendar days of paid leave after completion of 12 calendar months of work. Leave ticket – economy class air ticket to country of origin for yourself and family." },
            new() { FieldKey = "joiningExpenses", Label = "4. Joining Expenses", FieldType = "textarea", Section = "terms", DisplayOrder = 3, IsVisible = true, ShowInPdf = true, DefaultValue = "Currently non-anticipated." },
            new() { FieldKey = "probationPeriod", Label = "5. Probation Period", FieldType = "textarea", Section = "terms", DisplayOrder = 4, IsVisible = true, ShowInPdf = true, DefaultValue = "You will be on probation for a period of 6 months effective from the date of joining." },
            new() { FieldKey = "additionalNotes", Label = "Additional Notes (optional)", FieldType = "textarea", Section = "terms", DisplayOrder = 5, IsVisible = true, ShowInPdf = true },
        };

        // Set IDs
        foreach (var item in defaults)
        {
            item.Id = Guid.NewGuid();
            item.CreatedAt = DateTime.UtcNow;
        }

        return defaults;
    }
}