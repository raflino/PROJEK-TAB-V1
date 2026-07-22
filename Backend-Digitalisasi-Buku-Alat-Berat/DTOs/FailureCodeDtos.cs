namespace astratech_apps_backend.DTOs
{
    public class DiagnosticCaseDetailResponse
    {
        public CaseInfoDTO CaseInfo { get; set; } = new();
        public List<GeneralCauseDTO> GeneralCauses { get; set; } = new();
        public List<CaseInputDTO> CaseInputs { get; set; } = new();
    }

    public class CaseInfoDTO
    {
        public long CaseId { get; set; }
        public string CaseCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public bool? IsParent { get; set; }
        public long? ParentCaseId { get; set; }
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

    public class DiagnosticAnalyzeRequest
    {
        public string CaseCode { get; set; } = string.Empty;
        public string SelectedRowIds { get; set; } = string.Empty;
        public string? MachineModel { get; set; }
        public string? SerialNumber { get; set; }
        public string? TechnicianName { get; set; }
    }
}