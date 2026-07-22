namespace astratech_apps_backend.Models
{
    public class HistorySummary
    {
        public int Id { get; set; }
        public string DiagnosisType { get; set; } = string.Empty;
        public string FailureCode { get; set; } = string.Empty;
        public string UserNim { get; set; } = string.Empty;
        public string UserNama { get; set; } = string.Empty;
        public string DiagnosisTitle { get; set; } = string.Empty;
        public int TotalSteps { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class HistoryDetail
    {
        public int Id { get; set; }
        public string DiagnosisType { get; set; } = string.Empty;
        public string DiagnosisTitle { get; set; } = string.Empty;
        public string? SolutionText { get; set; }
        public string? Notes { get; set; }
        public int TotalSteps { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class HistoryListResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<HistorySummary> Data { get; set; } = new();
    }

    public class HistoryDetailResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<HistoryDetail> Data { get; set; } = new();
    }

    public class SaveHistoryResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}