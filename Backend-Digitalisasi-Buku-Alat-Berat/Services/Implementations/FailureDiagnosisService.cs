using astratech_apps_backend.DTOs;
using astratech_apps_backend.Models;
using astratech_apps_backend.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace astratech_apps_backend.Services
{
    public class FailureDiagnosisService : IFailureDiagnosisService
    {
        private readonly IFailureCodeRepository _repository;

        public FailureDiagnosisService(IFailureCodeRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<FailureCode>> SearchFailureCode(string keyword)
        {
            return await _repository.SearchFailureCode(keyword);
        }

        public async Task<FailureCodeDetailResponse?> GetFailureCodeDetail(string code)
        {
            var failureCode = await _repository.GetFailureCodeByCode(code);
            if (failureCode == null) return null;

            var possibleCauses = await _repository.GetPossibleCauses(failureCode.Id);
            var tools = await _repository.GetToolsForFailureCode(failureCode.Id);

            return new FailureCodeDetailResponse
            {
                Id = failureCode.Id,
                Code = failureCode.Code,
                UserCode = failureCode.UserCode,
                Trouble = failureCode.Description,
                ProblemAppears = failureCode.ProblemAppears,
                ActionOfController = failureCode.ActionOfController,
                ComponentInCharge = failureCode.ComponentInCharge,
                Category = failureCode.Category,
                ReferenceFile = failureCode.ReferenceFile,
                ReferencePage = failureCode.ReferencePage,
                PossibleCauses = possibleCauses,
                Tools = tools
            };
        }

        public async Task<List<FailureCode>> GetAllFailureCodes()
        {
            return await _repository.GetAllFailureCodes();
        }

        public async Task<List<FailureRecommendationResponse>> GetDiagnosisRecommendation(string code, List<int> checkedCauses)
        {
            var result = new List<FailureRecommendationResponse>();
            var failureCode = await _repository.GetFailureCodeByCode(code);
            if (failureCode == null) return result;

            var possibleCauses = await _repository.GetPossibleCauses(failureCode.Id);
            var filteredCauses = possibleCauses.Where(pc => checkedCauses.Contains(pc.CauseNumber)).ToList();

            foreach (var cause in filteredCauses)
            {
                var remedies = await _repository.GetRemediesByCauseId(cause.Id);
                var remedy = remedies.FirstOrDefault();

                result.Add(new FailureRecommendationResponse
                {
                    CauseNumber = cause.CauseNumber,
                    CauseDescription = cause.CauseDescription,
                    RemedyText = remedy?.RemedyText,
                    RemedyDetail = remedy?.RemedyDetail
                });
            }
            return result.OrderBy(r => r.CauseNumber).ToList();
        }

        public async Task<bool> SaveDiagnosisResult(FailureSaveResultRequest request)
        {
            var failureCode = await _repository.GetFailureCodeByCode(request.FailureCode);
            if (failureCode == null) return false;

            var checkResult = new FailureCheckResult
            {
                SessionId = request.SessionId,
                FailureCodeId = failureCode.Id,
                CauseNumber = request.CauseFound,
                CheckDate = System.DateTime.Now,
                MechanicName = request.MechanicNim,
                UnitModel = "PC200-8",
                CheckStatus = "COMPLETED",
                IsCauseFound = true,
                Notes = request.Notes
            };
            return await _repository.SaveCheckResult(checkResult);
        }
    }
}