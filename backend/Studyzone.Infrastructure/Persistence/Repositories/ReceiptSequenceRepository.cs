using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class ReceiptSequenceRepository : IReceiptSequenceRepository
{
    private readonly ApplicationDbContext _db;

    public ReceiptSequenceRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int> GetNextAsync(string prefix, CancellationToken ct = default)
    {
        var seq = await _db.ReceiptSequences.FirstOrDefaultAsync(x => x.Prefix == prefix, ct);
        if (seq == null)
        {
            seq = new ReceiptSequence { Id = Guid.NewGuid(), Prefix = prefix, LastNumber = 0 };
            _db.ReceiptSequences.Add(seq);
        }
        seq.LastNumber++;
        await _db.SaveChangesAsync(ct);
        return seq.LastNumber;
    }
}
