using astratech_apps_backend.DTOs;

namespace astratech_apps_backend.Repositories.Interfaces
{
    public interface IHistoryRepository
    {
        Task<IEnumerable<HistorySummaryDto>> GetHistorySummaryAsync(string diagnosisType);
        Task<IEnumerable<HistoryDetailDto>> GetHistoryDetailAsync(string diagnosisType, int idItem);
        Task SaveDiagnosisHistoryAsync(SaveDiagnosisHistoryDto dto);

    }
}