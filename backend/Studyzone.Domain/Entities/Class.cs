namespace Studyzone.Domain.Entities;

public class Class
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SeatLimit { get; set; }
    public DateTime CreatedAt { get; set; }
}
