using astratech_apps_backend.DTOs;

namespace astratech_apps_backend.Services.Interfaces
{
    public interface IFailureDiagnosisService
    {
        Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword);
        Task<DiagnosticCaseDetailResponse?> GetSModeDetailAsync(long caseId);
        Task<object?> GetDetailAsync(string mode, long id);
        Task<Dictionary<string, object?>> AnalyzeDiagnosticFlowAsync(DiagnosticAnalyzeRequest request);
    }
}