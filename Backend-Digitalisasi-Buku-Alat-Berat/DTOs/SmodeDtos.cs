namespace astratech_apps_backend.Dtos;

public class TroubleshootingCaseDto
{
    public long CaseId { get; set; }
    public string? CaseCode { get; set; }
    public string? Title { get; set; }
    public int? SequenceNo { get; set; }
}

public class CaseLookupRowDto
{
    public string? ResultType { get; set; }
    public long? CaseId { get; set; }
    public string? CaseCode { get; set; }
    public string? Title { get; set; }
    public string? CaseTitle { get; set; }
    public string? SearchedKeyword { get; set; }
    public string? MatchType { get; set; }
    public int? MatchRank { get; set; }
    public int? InputCount { get; set; }
    public string? CaseStatus { get; set; }
    public int? SequenceNo { get; set; }
    public string? Message { get; set; }
}

public class CaseInputDto
{
    public string? ResultType { get; set; }
    public long RowId { get; set; }
    public string? CaseCode { get; set; }
    public string? CaseTitle { get; set; }
    public string? RowType { get; set; }
    public string? RowText { get; set; }
    public int? SequenceNo { get; set; }
}

public class CaseInputsResponseDto
{
    public string? ResultType { get; set; }
    public List<CaseLookupRowDto> Matches { get; set; } = new();
    public List<CaseInputDto> Inputs { get; set; } = new();
    public string? Message { get; set; }
}

public class RunDiagnosticRequestDto
{
    public string CaseCode { get; set; } = string.Empty;
    public List<long> SelectedRowIds { get; set; } = new();
    public string? MachineModel { get; set; }
    public string? SerialNumber { get; set; }
    public string? TechnicianName { get; set; }
}

public class SessionResultDto
{
    public string? ResultType { get; set; }
    public long SessionId { get; set; }
    public string? CaseCode { get; set; }
    public string? CaseTitle { get; set; }
    public string? MachineModel { get; set; }
    public string? SerialNumber { get; set; }
    public string? TechnicianName { get; set; }
    public string? Status { get; set; }
    public DateTime? StartedAt { get; set; }
}

public class SelectedInputDto
{
    public string? ResultType { get; set; }
    public long RowId { get; set; }
    public string? RowType { get; set; }
    public string? RowText { get; set; }
    public int? SequenceNo { get; set; }
}

public class CauseRankingDto
{
    public string? ResultType { get; set; }
    public long? SessionId { get; set; }
    public string? Message { get; set; }
    public int? RankNo { get; set; }
    public long? CaseCauseId { get; set; }
    public string? TroubleCandidate { get; set; }
    public int? SymbolCount { get; set; }
    public decimal? TotalScore { get; set; }
    public int? HighProbabilityCount { get; set; }
    public int? RelatedCount { get; set; }
    public int? ReferenceCount { get; set; }
    public string? RemedyText { get; set; }
}

public class ConclusionDto
{
    public string? ResultType { get; set; }
    public long SessionId { get; set; }
    public string? CaseCode { get; set; }
    public string? CaseTitle { get; set; }
    public int? RankNo { get; set; }
    public long? CaseCauseId { get; set; }
    public string? SuspectedTrouble { get; set; }
    public int? SymbolCount { get; set; }
    public decimal? TotalScore { get; set; }
    public int? HighProbabilityCount { get; set; }
    public int? RelatedCount { get; set; }
    public int? ReferenceCount { get; set; }
    public string? RecommendedRemedy { get; set; }
    public string? ConfidenceNote { get; set; }
}

public class TroubleshootingStepDto
{
    public string? ResultType { get; set; }
    public long RowId { get; set; }
    public string? RowType { get; set; }
    public string? TroubleshootingStep { get; set; }
    public int? SequenceNo { get; set; }
}

public class RemedyDto
{
    public long CaseCauseId { get; set; }
    public string? CauseName { get; set; }
    public string? RemedyText { get; set; }
    public int? SequenceNo { get; set; }
    public int? ColumnNo { get; set; }
}

public class RunDiagnosticResponseDto
{
    public SessionResultDto? Session { get; set; }
    public List<SelectedInputDto> SelectedInputs { get; set; } = new();
    public List<CauseRankingDto> CauseRankings { get; set; } = new();
    public ConclusionDto? Conclusion { get; set; }
    public List<TroubleshootingStepDto> TroubleshootingSteps { get; set; } = new();
    public List<RemedyDto> Remedies { get; set; } = new();
    public string? Message { get; set; }
}

public class ConfirmDiagnosticRequestDto
{
    public long SessionId { get; set; }
    public long CaseCauseId { get; set; }
    public bool IsConfirmed { get; set; }
    public string? Note { get; set; }
}

public class CheckResultDto
{
    public string? ResultType { get; set; }
    public long? SessionId { get; set; }
    public long? RejectedCaseCauseId { get; set; }
    public string? Message { get; set; }
}

public class FinalResultDto
{
    public string? ResultType { get; set; }
    public long SessionId { get; set; }
    public string? CaseCode { get; set; }
    public string? CaseTitle { get; set; }
    public long CaseCauseId { get; set; }
    public string? FinalTrouble { get; set; }
    public string? RecommendedRemedy { get; set; }
    public string? Status { get; set; }
    public DateTime? FinishedAt { get; set; }
}

public class ConfirmDiagnosticResponseDto
{
    public CheckResultDto? CheckResult { get; set; }
    public FinalResultDto? FinalResult { get; set; }
    public List<CauseRankingDto> NextCauseRankings { get; set; } = new();
    public List<TroubleshootingStepDto> NextTroubleshootingSteps { get; set; } = new();
    public List<RemedyDto> Remedies { get; set; } = new();
    public string? Message { get; set; }
}