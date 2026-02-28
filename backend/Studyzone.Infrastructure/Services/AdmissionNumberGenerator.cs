using Studyzone.Application.Common.Interfaces;
using Studyzone.Infrastructure.Persistence.Repositories;

namespace Studyzone.Infrastructure.Services;

public class AdmissionNumberGenerator : IAdmissionNumberGenerator
{
    private readonly AdmissionNumberSequenceRepository _seqRepo;

    public AdmissionNumberGenerator(AdmissionNumberSequenceRepository seqRepo)
    {
        _seqRepo = seqRepo;
    }

    public async Task<string> GenerateNextAsync(string academicYearName, string classCode, CancellationToken ct = default)
    {
        var yearShort = academicYearName.Length >= 4 ? academicYearName[^2..] : academicYearName.Replace("-", "").Replace("/", "").Trim();
        if (yearShort.Length > 4) yearShort = yearShort[^4..];
        var num = await _seqRepo.GetNextAndIncrementAsync(academicYearName, classCode, ct);
        return $"STZ-{yearShort}-{classCode}-{num:D3}";
    }
}
