namespace Studyzone.Application.Fees;

public class FeeStructureDto
{
    public string Id { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string? AcademicYearName { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Frequency { get; set; } = string.Empty;
    public DateTime EffectiveFrom { get; set; }
}

public class CreateFeeStructureRequest
{
    public string ClassId { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Frequency { get; set; } = "Monthly";
}

public class UpdateFeeStructureRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Frequency { get; set; } = "Monthly";
}

public class AddChargeRequest
{
    public string StudentId { get; set; } = string.Empty;
    public string FeeStructureId { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty; // e.g. "2024-04"
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}

public class PaymentDto
{
    public string Id { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public string? Reference { get; set; }
    public string? FeeType { get; set; }
}

public class RecordPaymentRequest
{
    public string StudentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "Cash";
    public string? Reference { get; set; }
    public string? Remarks { get; set; }
    /// <summary>Optional: specify which fee type to pay (Tuition, Bus, Admission). If null, pays across all outstanding.</summary>
    public string? FeeType { get; set; }
}

public class FeeLedgerDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public decimal TotalCharges { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal Balance { get; set; }
    /// <summary>First month (1-12) from which fees are due for this student's enrollment. Null = not set.</summary>
    public int? FeePaymentStartMonth { get; set; }
    /// <summary>First year from which fees are due. Null = not set.</summary>
    public int? FeePaymentStartYear { get; set; }
    public IReadOnlyList<FeeChargeDto> Charges { get; set; } = Array.Empty<FeeChargeDto>();
    public IReadOnlyList<PaymentDto> Payments { get; set; } = Array.Empty<PaymentDto>();
}

public class FeeChargeDto
{
    public string Id { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }
    public string? Description { get; set; }
    /// <summary>Fee type / particular name (e.g. Admission Fee, Tuition).</summary>
    public string? ParticularName { get; set; }
}

public class AddAdmissionFeeRequest
{
    public string StudentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool RecordPayment { get; set; }
    public string PaymentMode { get; set; } = "Cash";
}

public class AddAdmissionFeeResult
{
    public string ChargeId { get; set; } = string.Empty;
    public string? PaymentId { get; set; }
    public string? ReceiptNumber { get; set; }
}

public class GenerateChargesRequest
{
    public string StudentId { get; set; } = string.Empty;
    public string? AcademicYearId { get; set; }
    public int? UpToYear { get; set; }
    public int? UpToMonth { get; set; }
}

public class GenerateChargesResult
{
    public int ChargesAdded { get; set; }
}

public class FeeReceiptParticularDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class FeeReceiptHistoryItemDto
{
    public string PaymentId { get; set; } = string.Empty;
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime SubmissionDate { get; set; }
    public string? FeeTerm { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal Deposit { get; set; }
    public decimal Due { get; set; }
}

public class StudentFeeOfferDto
{
    public string Id { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public string AcademicYearId { get; set; } = string.Empty;
    public string? AcademicYearName { get; set; }
    public string OfferType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string? Reason { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class CreateFeeOfferRequest
{
    public string StudentId { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string OfferType { get; set; } = "PercentageDiscount";
    public decimal Value { get; set; }
    public string? Reason { get; set; }
}

public class FeeReceiptDto
{
    public string PaymentId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? GuardianName { get; set; }
    public string? ClassName { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public string? FeeTerm { get; set; }
    public string CurrencySymbol { get; set; } = "AED ";
    public decimal TotalCharges { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal Balance { get; set; }
    public decimal Deposit { get; set; }
    public decimal RemainingBalance { get; set; }
    public IReadOnlyList<FeeReceiptParticularDto> Particulars { get; set; } = Array.Empty<FeeReceiptParticularDto>();
    public IReadOnlyList<FeeReceiptHistoryItemDto> History { get; set; } = Array.Empty<FeeReceiptHistoryItemDto>();
}
