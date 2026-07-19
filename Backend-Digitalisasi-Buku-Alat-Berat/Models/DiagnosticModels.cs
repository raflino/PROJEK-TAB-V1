using System;

namespace astractech_backend.Models
{
    public class FailureCode
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? UserCode { get; set; }
        public string? Description { get; set; }
        public string? ProblemAppears { get; set; }
        public string? ActionOfController { get; set; }
        public string? ComponentInCharge { get; set; }
        public string? Category { get; set; }
        public string? ReferenceFile { get; set; }
        public string? ReferencePage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class FailurePossibleCause
    {
        public int Id { get; set; }
        public int FailureCodeId { get; set; }
        public int CauseNumber { get; set; }
        public string CauseDescription { get; set; } = string.Empty;
        public string? CheckMethod { get; set; }
        public string? StandardValue { get; set; }
        public string? StandardCondition { get; set; }
        public string? StandardUnit { get; set; }
        public decimal? MinThreshold { get; set; }
        public decimal? MaxThreshold { get; set; }
        public int Priority { get; set; }
    }

    public class FailureRemedy
    {
        public int Id { get; set; }
        public int PossibleCauseId { get; set; }
        public string RemedyText { get; set; } = string.Empty;
        public string? RemedyDetail { get; set; }
        public string? PartsNeeded { get; set; }
    }

    public class FailureDiagnosticTool
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? PartNumber { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
    }

    public class FailureCheckResult
    {
        public int Id { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public int FailureCodeId { get; set; }
        public int? CauseNumber { get; set; }
        public DateTime CheckDate { get; set; }
        public string? MechanicName { get; set; }
        public string? UnitModel { get; set; }
        public string? UnitSerial { get; set; }
        public int? ServiceMeterHours { get; set; }
        public string? CheckResultValue { get; set; }
        public string? CheckStatus { get; set; }
        public bool IsCauseFound { get; set; }
        public string? Notes { get; set; }
    }

    // --- TAMBAHAN UNTUK RIWAYAT MAHASISWA & DOSEN ---
    public class FailureHistory
    {
        public int Id { get; set; } // Ini akan menjadi SessionId di Frontend
        public string FailureCode { get; set; } = string.Empty;
        public string UserNim { get; set; } = string.Empty;
        public string UserNama { get; set; } = string.Empty;
        public string? DiagnosisTitle { get; set; }
        public int TotalSteps { get; set; }
        public string? SolutionText { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}