using astratech_apps_backend.DTOs;
using astratech_apps_backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace astratech_apps_backend.Services
{
    public interface IFailureDiagnosisService
    {
        Task<List<FailureCode>> SearchFailureCode(string keyword);
        Task<FailureCodeDetailResponse?> GetFailureCodeDetail(string code);
        Task<List<FailureCode>> GetAllFailureCodes();
        Task<List<FailureRecommendationResponse>> GetDiagnosisRecommendation(string code, List<int> checkedCauses);
        Task<bool> SaveDiagnosisResult(FailureSaveResultRequest request);
    }
}