using System;
using System.Collections.Generic;

namespace Studyzone.Domain.Entities;

public class StaffSalaryPayment
{
    public Guid Id { get; set; }
    public Guid StaffUserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal BaseAmount { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Pending, Paid
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StaffSalaryPaymentLine> Lines { get; set; } = new List<StaffSalaryPaymentLine>();
}
