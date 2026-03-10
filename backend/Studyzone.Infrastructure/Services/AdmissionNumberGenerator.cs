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
        var num = await _seqRepo.GetNextAndIncrementAsync("Global", "", ct);
        return num.ToString("D3");
    }
}
