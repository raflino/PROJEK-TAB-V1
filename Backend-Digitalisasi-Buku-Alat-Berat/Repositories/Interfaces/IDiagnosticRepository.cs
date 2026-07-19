using astratech_apps_backend.Dtos;

namespace astratech_apps_backend.Repositories.Interfaces;

public interface IDiagnosticRepository
{
    Task<IReadOnlyList<TroubleshootingCaseDto>> GetCasesAsync();

    Task<CaseInputsResponseDto> GetCaseInputsAsync(string caseKey);

    Task<RunDiagnosticResponseDto> RunDiagnosticFlowAsync(RunDiagnosticRequestDto request);

    Task<ConfirmDiagnosticResponseDto> ConfirmDiagnosticCauseAsync(ConfirmDiagnosticRequestDto request);

    Task<IReadOnlyList<CauseRankingDto>> GetDiagnosticScoresAsync(long sessionId);
}