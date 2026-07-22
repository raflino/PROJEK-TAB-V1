using astratech_apps_backend.DTOs;

namespace astratech_apps_backend.Services
{
    public interface IFailureDiagnosisService
    {
        Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword);
        Task<DiagnosticCaseDetailResponse?> GetSModeDetailAsync(long caseId);
        Task<Dictionary<string, object?>> AnalyzeDiagnosticFlowAsync(DiagnosticAnalyzeRequest request);
    }
}