namespace Studyzone.Application.Common.Interfaces;

public interface IAdmissionNumberGenerator
{
    Task<string> GenerateNextAsync(string academicYearName, string classCode, CancellationToken ct = default);
}
