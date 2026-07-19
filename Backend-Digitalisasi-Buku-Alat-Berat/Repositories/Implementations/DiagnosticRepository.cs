using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using astratech_apps_backend.Dtos;
using astratech_apps_backend.Repositories.Interfaces;

namespace astratech_apps_backend.Repositories.Implementations;

public class DiagnosticRepository : IDiagnosticRepository
{
    private readonly string _connectionString;

    public DiagnosticRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("LocalEquipmentDb")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' tidak ditemukan.");
    }

    private SqlConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    public async Task<IReadOnlyList<TroubleshootingCaseDto>> GetCasesAsync()
    {
        await using var connection = CreateConnection();

        var result = await connection.QueryAsync<TroubleshootingCaseDto>(
            "dbo.usp_ListTroubleshootingCases",
            commandType: CommandType.StoredProcedure
        );

        return result.ToList();
    }

    public async Task<CaseInputsResponseDto> GetCaseInputsAsync(string caseKey)
    {
        await using var connection = CreateConnection();

        var response = new CaseInputsResponseDto();

        using var grid = await connection.QueryMultipleAsync(
            "dbo.usp_GetCaseInputs",
            new
            {
                case_key = caseKey
            },
            commandType: CommandType.StoredProcedure
        );

        var firstResult = (await grid.ReadAsync<CaseLookupRowDto>()).ToList();

        response.Matches = firstResult;
        response.ResultType = firstResult.FirstOrDefault()?.ResultType;
        response.Message = firstResult.FirstOrDefault()?.Message;

        if (grid.IsConsumed)
        {
            return response;
        }

        if (response.ResultType == "CASE_SELECTED")
        {
            var inputs = await grid.ReadAsync<CaseInputDto>();
            response.Inputs = inputs.ToList();
            return response;
        }

        var secondResult = (await grid.ReadAsync<CaseLookupRowDto>()).ToList();
        response.Matches.AddRange(secondResult);

        var message = secondResult
            .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.Message))
            ?.Message;

        if (!string.IsNullOrWhiteSpace(message))
        {
            response.Message = message;
        }

        return response;
    }

    public async Task<RunDiagnosticResponseDto> RunDiagnosticFlowAsync(RunDiagnosticRequestDto request)
    {
        if (request.SelectedRowIds == null || request.SelectedRowIds.Count == 0)
        {
            throw new ArgumentException("SelectedRowIds tidak boleh kosong.");
        }

        var selectedRowIdsText = string.Join(",", request.SelectedRowIds);

        await using var connection = CreateConnection();

        var response = new RunDiagnosticResponseDto();

        using var grid = await connection.QueryMultipleAsync(
            "dbo.usp_RunDiagnosticFlow",
            new
            {
                case_code = request.CaseCode,
                selected_row_ids = selectedRowIdsText,
                machine_model = request.MachineModel,
                serial_number = request.SerialNumber,
                technician_name = request.TechnicianName
            },
            commandType: CommandType.StoredProcedure
        );

        response.Session = (await grid.ReadAsync<SessionResultDto>()).FirstOrDefault();

        if (grid.IsConsumed)
        {
            return response;
        }

        response.SelectedInputs = (await grid.ReadAsync<SelectedInputDto>()).ToList();

        if (grid.IsConsumed)
        {
            return response;
        }

        var rankings = (await grid.ReadAsync<CauseRankingDto>()).ToList();

        if (rankings.Any(x => x.ResultType == "NO_CAUSE_RANKING"))
        {
            response.Message = rankings.FirstOrDefault()?.Message;
            response.CauseRankings = rankings;
            return response;
        }

        response.CauseRankings = rankings;

        if (!grid.IsConsumed)
        {
            response.Conclusion = (await grid.ReadAsync<ConclusionDto>()).FirstOrDefault();
        }

        if (!grid.IsConsumed)
        {
            response.TroubleshootingSteps = (await grid.ReadAsync<TroubleshootingStepDto>()).ToList();
        }

        if (!grid.IsConsumed)
        {
            response.Remedies = (await grid.ReadAsync<RemedyDto>()).ToList();
        }

        return response;
    }

    public async Task<ConfirmDiagnosticResponseDto> ConfirmDiagnosticCauseAsync(ConfirmDiagnosticRequestDto request)
    {
        await using var connection = CreateConnection();

        var response = new ConfirmDiagnosticResponseDto();

        using var grid = await connection.QueryMultipleAsync(
            "dbo.usp_ConfirmDiagnosticCause",
            new
            {
                session_id = request.SessionId,
                case_cause_id = request.CaseCauseId,
                is_confirmed = request.IsConfirmed,
                note = request.Note
            },
            commandType: CommandType.StoredProcedure
        );

        if (request.IsConfirmed)
        {
            response.FinalResult = (await grid.ReadAsync<FinalResultDto>()).FirstOrDefault();

            if (!grid.IsConsumed)
            {
                response.Remedies = (await grid.ReadAsync<RemedyDto>()).ToList();
            }

            return response;
        }

        response.CheckResult = (await grid.ReadAsync<CheckResultDto>()).FirstOrDefault();

        if (grid.IsConsumed)
        {
            return response;
        }

        var nextRankings = (await grid.ReadAsync<CauseRankingDto>()).ToList();

        if (nextRankings.Any(x => x.ResultType == "NO_NEXT_CAUSE"))
        {
            response.Message = nextRankings.FirstOrDefault()?.Message;
            response.NextCauseRankings = nextRankings;
            return response;
        }

        response.NextCauseRankings = nextRankings;

        if (!grid.IsConsumed)
        {
            response.NextTroubleshootingSteps = (await grid.ReadAsync<TroubleshootingStepDto>()).ToList();
        }

        if (!grid.IsConsumed)
        {
            response.Remedies = (await grid.ReadAsync<RemedyDto>()).ToList();
        }

        return response;
    }

    public async Task<IReadOnlyList<CauseRankingDto>> GetDiagnosticScoresAsync(long sessionId)
    {
        await using var connection = CreateConnection();

        var result = await connection.QueryAsync<CauseRankingDto>(
            "dbo.usp_GetDiagnosticScores",
            new
            {
                session_id = sessionId
            },
            commandType: CommandType.StoredProcedure
        );

        return result.ToList();
    }
}