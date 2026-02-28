using Microsoft.EntityFrameworkCore;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class AdmissionNumberSequenceRepository
{
    private readonly ApplicationDbContext _db;

    public AdmissionNumberSequenceRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int> GetNextAndIncrementAsync(string academicYearName, string classCode, CancellationToken ct = default)
    {
        var seq = await _db.AdmissionNumberSequences
            .FirstOrDefaultAsync(x => x.AcademicYearName == academicYearName && x.ClassCode == classCode, ct);
        if (seq == null)
        {
            seq = new AdmissionNumberSequence
            {
                Id = Guid.NewGuid(),
                AcademicYearName = academicYearName,
                ClassCode = classCode,
                LastNumber = 0
            };
            _db.AdmissionNumberSequences.Add(seq);
        }
        seq.LastNumber++;
        await _db.SaveChangesAsync(ct);
        return seq.LastNumber;
    }
}
