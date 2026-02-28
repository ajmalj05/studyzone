namespace Studyzone.Application.ParentPortal;

public interface IParentManagementService
{
    Task<IReadOnlyList<ParentWithLinksDto>> GetParentsWithLinksAsync(CancellationToken ct = default);
    Task LinkStudentAsync(string parentUserId, string studentId, CancellationToken ct = default);
    Task UnlinkStudentAsync(string parentUserId, string studentId, CancellationToken ct = default);
}
