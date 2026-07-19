using astratech_apps_backend.DTOs; 
using astratech_apps_backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace astratech_apps_backend.Repositories.Interfaces
{
    public interface IFailureCodeRepository
    {
        // ==========================================
        // EXISTING FEATURES (Tetap Dipertahankan)
        // ==========================================
        Task<List<FailureCode>> SearchFailureCode(string keyword);
        Task<FailureCode?> GetFailureCodeByCode(string code);
        Task<List<FailurePossibleCause>> GetPossibleCauses(int failureCodeId);
        Task<List<FailureRemedy>> GetRemediesByCauseId(int possibleCauseId);
        Task<List<FailureDiagnosticTool>> GetToolsForFailureCode(int failureCodeId);
        Task<List<FailureCode>> GetAllFailureCodes();
        Task<bool> SaveCheckResult(FailureCheckResult checkResult);

        // ==========================================
        // CENTRAL SEARCH DYNAMIC (Mendukung CODE, E, H, S)
        // ==========================================
        Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword);
        
        // ==========================================
        // S-MODE SPECIFIC DETAILS & ANALYSIS
        // ==========================================
        Task<DiagnosticCaseDetailResponse?> GetSModeDetailAsync(long caseId);
        Task<Dictionary<string, object?>> AnalyzeDiagnosticFlowAsync(DiagnosticAnalyzeRequest request);
    }
}