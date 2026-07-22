namespace astratech_apps_backend.Models
{
   
    public class SearchResult
    {
        public long Id { get; set; }
        public long? CaseId { get; set; }
        public string? CaseCode { get; set; }
        public string? Code { get; set; }
        public string? UserCode { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? TroubleDescription { get; set; }
        public string? MatchType { get; set; }
        public int? MatchRank { get; set; }
        public int? InputCount { get; set; }
        public string? SearchedKeyword { get; set; }
        public string? CaseStatus { get; set; }
        public string? ImageFilename { get; set; }
        public string? Message { get; set; }
    }

    public class SModeDetail
    {
        public CaseInfo CaseInfo { get; set; } = new();
        public List<GeneralCause> GeneralCauses { get; set; } = new();
        public List<CaseInputItem> CaseInputs { get; set; } = new();
    }

    public class CaseInfo
    {
        public long CaseId { get; set; }
        public string CaseCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public bool? IsParent { get; set; }
        public long? ParentCaseId { get; set; }
        public string? ImageFilename { get; set; }
    }

    public class GeneralCause
    {
        public long CauseId { get; set; }
        public string? Kind { get; set; }
        public string CauseText { get; set; } = string.Empty;
        public int SequenceNo { get; set; }
    }

    public class CaseInputItem
    {
        public long RowId { get; set; }
        public string RowType { get; set; } = string.Empty;
        public string RowText { get; set; } = string.Empty;
        public int SequenceNo { get; set; }
    }

    public class SModeAnalysisResult
    {
        public AnalysisSession? Session { get; set; }
        public List<SelectedInput> Inputs { get; set; } = new();
        public List<CauseRank> Rankings { get; set; } = new();
        public AnalysisConclusion? Conclusion { get; set; }
        public List<FinalAction> FinalActions { get; set; } = new();
        public string? Message { get; set; }
    }

    public class AnalysisSession
    {
        public long? SessionId { get; set; }
        public string? CaseCode { get; set; }
        public string? CaseTitle { get; set; }
        public string? MachineModel { get; set; }
        public string? SerialNumber { get; set; }
        public string? TechnicianName { get; set; }
        public string? Status { get; set; }
        public DateTime? StartedAt { get; set; }
    }

    public class SelectedInput
    {
        public long? RowId { get; set; }
        public string? RowType { get; set; }
        public string? RowText { get; set; }
        public int? SequenceNo { get; set; }
    }

    public class CauseRank
    {
        public int? RankNo { get; set; }
        public long? CaseCauseId { get; set; }
        public string? TroubleCandidate { get; set; }
        public int? SymbolCount { get; set; }
        public decimal? TotalScore { get; set; }
        public int? HighProbabilityCount { get; set; }
        public int? RelatedCount { get; set; }
        public int? ReferenceCount { get; set; }
        public string? RemedyText { get; set; }
        public string? ResultType { get; set; }
        public string? Message { get; set; }
    }

    public class AnalysisConclusion
    {
        public long? SessionId { get; set; }
        public string? SuspectedTrouble { get; set; }
        public string? RecommendedRemedy { get; set; }
        public string? ConfidenceNote { get; set; }
    }

    public class FinalAction
    {
        public long? CaseCauseId { get; set; }
        public string? CauseName { get; set; }
        public string? RemedyText { get; set; }
        public long? RowId { get; set; }
        public string? TroubleshootingStep { get; set; }
    }

    public class ModeDetail
    {
        public ModeHeader Header { get; set; } = new();
        public List<CauseStep> Causes { get; set; } = new();
    }

    public class ModeHeader
    {
        public int? Id { get; set; }
        public string? Code { get; set; }
        public string? UserCode { get; set; }
        public string? Description { get; set; }
        public string? ProblemAppears { get; set; }
        public string? ActionOfController { get; set; }
        public string? ComponentInCharge { get; set; }
        public string? Category { get; set; }
        public string? ContentsOfTrouble { get; set; }
        public string? RelatedInformation { get; set; }
        public string? ReferenceFile { get; set; }
        public string? ReferencePage { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? CaseId { get; set; }
        public string? CaseCode { get; set; }
        public string? Title { get; set; }
        public string? Mode { get; set; }
        public string? TroubleDescription { get; set; }
    }

    public class CauseStep
    {
        public int? Id { get; set; }
        public int? CauseNumber { get; set; }
        public string CauseDescription { get; set; } = string.Empty;
        public string? CheckMethod { get; set; }
        public string? StandardCondition { get; set; }
        public string? StandardValue { get; set; }
        public string? StandardUnit { get; set; }
        public int? Priority { get; set; }
        public string? SpecialMethod { get; set; }
        public string? ImageFilename { get; set; }
        public string? StandardImageFilename { get; set; }
        public string? ImageUrl { get; set; }
        public string? StandardImageUrl { get; set; }
        public string? Remedy { get; set; }
    }
}