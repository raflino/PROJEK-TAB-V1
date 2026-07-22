using astratech_apps_backend.DTOs;
using astratech_apps_backend.Repositories.Interfaces;
using astratech_apps_backend.Services.Interfaces;

namespace astratech_apps_backend.Services.Implementations
{
    public class FailureDiagnosisService : IFailureDiagnosisService
    {
        private readonly IDiagnosticRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FailureDiagnosisService(
            IDiagnosticRepository repository, 
            IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword)
        {
            return await _repository.SearchCentralAsync(mode, keyword);
        }

        public async Task<DiagnosticCaseDetailResponse?> GetSModeDetailAsync(long caseId)
        {
            return await _repository.GetSModeDetailAsync(caseId);
        }

        public async Task<object?> GetDetailAsync(string mode, long id)
        {
            string currentMode = mode.Trim().ToUpper();

            if (currentMode == "S")
            {
                return await _repository.GetSModeDetailAsync(id);
            }
            else
            {
                var (header, causes) = await _repository.GetDiagnosticDetailByIdAsync(currentMode, (int)id);
                
                if (header == null)
                    return null;

                string imageBaseUrl = GetImageBaseUrl(currentMode);
                
                var mappedCauses = causes.Select(cause =>
                {
                    var mapped = new Dictionary<string, object?>();
                    foreach (var kvp in cause)
                    {
                        mapped[kvp.Key] = kvp.Value;
                    }

                    if (cause.ContainsKey("image_filename") && cause["image_filename"] != null)
                    {
                        mapped["image_url"] = imageBaseUrl + cause["image_filename"]?.ToString();
                    }
                    if (cause.ContainsKey("standard_image_filename") && cause["standard_image_filename"] != null)
                    {
                        mapped["standard_image_url"] = imageBaseUrl + cause["standard_image_filename"]?.ToString();
                    }

                    if (cause.ContainsKey("special_method"))
                    {
                        mapped["special_method"] = cause["special_method"]?.ToString()?.Trim().ToLower() ?? "tidak";
                    }

                    return mapped;
                }).ToList();

                return new { header, causes = mappedCauses };
            }
        }

        public async Task<Dictionary<string, object?>> AnalyzeDiagnosticFlowAsync(DiagnosticAnalyzeRequest request)
        {
            return await _repository.AnalyzeDiagnosticFlowAsync(request);
        }

        private string GetImageBaseUrl(string mode)
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}{request?.PathBase}";

            return mode switch
            {
                "E" => $"{baseUrl}/images/E-MODE/",
                "H" => $"{baseUrl}/images/H-MODE/",
                _ => $"{baseUrl}/images/troubleshooting/"
            };
        }
    }
}