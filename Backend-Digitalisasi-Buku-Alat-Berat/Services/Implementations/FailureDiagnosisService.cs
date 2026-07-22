using astratech_apps_backend.DTOs;
using astratech_apps_backend.Repositories.Interfaces;

namespace astratech_apps_backend.Services
{
    public class FailureDiagnosisService : IFailureDiagnosisService
    {
        private readonly IDiagnosticRepository _repository;
        private readonly ILogger<FailureDiagnosisService> _logger;

        public FailureDiagnosisService(IDiagnosticRepository repository, ILogger<FailureDiagnosisService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword)
        {
            try
            {
                _logger.LogInformation($"Searching central with mode: {mode}, keyword: {keyword}");
                return await _repository.SearchCentralAsync(mode, keyword);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching central with mode: {mode}, keyword: {keyword}");
                throw;
            }
        }

        public async Task<DiagnosticCaseDetailResponse?> GetSModeDetailAsync(long caseId)
        {
            try
            {
                _logger.LogInformation($"Getting S-Mode detail for case ID: {caseId}");
                return await _repository.GetSModeDetailAsync(caseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting S-Mode detail for case ID: {caseId}");
                throw;
            }
        }

        public async Task<Dictionary<string, object?>> AnalyzeDiagnosticFlowAsync(DiagnosticAnalyzeRequest request)
        {
            try
            {
                _logger.LogInformation($"Analyzing diagnostic flow for case: {request.CaseCode}");
                return await _repository.AnalyzeDiagnosticFlowAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error analyzing diagnostic flow for case: {request.CaseCode}");
                throw;
            }
        }
    }
}