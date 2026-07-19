using astratech_apps_backend.Models;
using System.Collections.Generic;

namespace astratech_apps_backend.DTOs
{
    // ════════════════════════════════════════════════════════════════
    // AUTH
    // ════════════════════════════════════════════════════════════════

    public class RegisterRequest
    {
        public string Nim { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;  // "student" | "lecturer"

        // 3 Security Questions
        public int Q1Id { get; set; }
        public string A1 { get; set; } = string.Empty;
        public int Q2Id { get; set; }
        public string A2 { get; set; } = string.Empty;
        public int Q3Id { get; set; }
        public string A3 { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Nim { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // Dipertahankan agar tidak ada yang break
    public class FailureLoginRequest
    {
        public string Nim { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class FailureLoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public FailureUserDto User { get; set; } = new FailureUserDto();
    }

    public class FailureUserDto
    {
        public string Nim { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    // ════════════════════════════════════════════════════════════════
    // SECURITY QUESTIONS
    // ════════════════════════════════════════════════════════════════

    public class SecurityQuestionDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
    }

    /// <summary>Request lupa password langkah 1: cari user by NIM</summary>
    public class ForgotPasswordRequest
    {
        public string Nim { get; set; } = string.Empty;
    }

    /// <summary>Request lupa password langkah 2: verifikasi jawaban + setel password baru sekaligus</summary>
    public class VerifyAndResetRequest
    {
        public string Nim { get; set; } = string.Empty;
        public int A1Id { get; set; }
        public string A1 { get; set; } = string.Empty;
        public int A2Id { get; set; }
        public string A2 { get; set; } = string.Empty;
        public int A3Id { get; set; }
        public string A3 { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    // ════════════════════════════════════════════════════════════════
    // FAILURE CODE (tidak berubah)
    // ════════════════════════════════════════════════════════════════

    public class FailureCodeDetailResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? UserCode { get; set; }
        public string? Trouble { get; set; }
        public string? ProblemAppears { get; set; }
        public string? ActionOfController { get; set; }
        public string? ComponentInCharge { get; set; }
        public string? Category { get; set; }
        public string? ReferenceFile { get; set; }
        public string? ReferencePage { get; set; }
        public List<FailurePossibleCause>? PossibleCauses { get; set; }
        public List<FailureDiagnosticTool>? Tools { get; set; }
    }

    public class FailureRecommendationRequest
    {
        public List<int> CheckedCauses { get; set; } = new List<int>();
    }

    public class FailureRecommendationResponse
    {
        public int CauseNumber { get; set; }
        public string CauseDescription { get; set; } = string.Empty;
        public string? RemedyText { get; set; }
        public string? RemedyDetail { get; set; }
    }

    public class FailureSaveResultRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string FailureCode { get; set; } = string.Empty;
        public string MechanicNim { get; set; } = string.Empty;
        public int CauseFound { get; set; }
        public string? Notes { get; set; }
    }

    // ════════════════════════════════════════════════════════════════
    // DIAGNOSTIC S-MODE (BARU DITAMBAHKAN)
    // ════════════════════════════════════════════════════════════════

    /// <summary>Wrapper utama untuk menampilkan Detail S-Mode (Header, Causes, Inputs)</summary>
    public class DiagnosticCaseDetailResponse
    {
        public CaseInfoDTO CaseInfo { get; set; } = new CaseInfoDTO();
        public List<GeneralCauseDTO> GeneralCauses { get; set; } = new List<GeneralCauseDTO>();
        public List<CaseInputDTO> CaseInputs { get; set; } = new List<CaseInputDTO>();
    }

    public class CaseInfoDTO
    {
        public long CaseId { get; set; }
        public string CaseCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public bool? IsParent { get; set; } 
        public long? ParentCaseId { get; set; }
        public string? ImageFilename { get; set; }
    }

    public class GeneralCauseDTO
    {
        public long CauseId { get; set; }
        public string? Kind { get; set; }
        public string CauseText { get; set; } = string.Empty;
        public int SequenceNo { get; set; }
    }

    public class CaseInputDTO
    {
        public long RowId { get; set; }
        public string RowType { get; set; } = string.Empty;
        public string RowText { get; set; } = string.Empty;
        public int SequenceNo { get; set; }
    }

    /// <summary>Request Body untuk tahap Analisis S-Mode</summary>
    public class DiagnosticAnalyzeRequest
    {
        public string CaseCode { get; set; } = string.Empty;
        public string SelectedRowIds { get; set; } = string.Empty; // Format comma-separated (contoh: "78,79,82")
        public string? MachineModel { get; set; }
        public string? SerialNumber { get; set; }
        public string? TechnicianName { get; set; }
    }
}