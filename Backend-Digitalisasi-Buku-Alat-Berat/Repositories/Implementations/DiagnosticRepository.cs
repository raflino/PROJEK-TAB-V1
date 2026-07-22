using System.Data;
using Microsoft.Data.SqlClient;
using astratech_apps_backend.DTOs;
using astratech_apps_backend.Repositories.Interfaces;
using Microsoft.Extensions.Configuration;

namespace astratech_apps_backend.Repositories.Implementations
{
    public class DiagnosticRepository : IDiagnosticRepository
    {
        private readonly string _connectionString;

        public DiagnosticRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb")
                ?? throw new InvalidOperationException("Connection string 'LocalEquipmentDb' tidak ditemukan.");
        }

        private SqlConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }

        private object? GetSafeValue(SqlDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                {
                    return reader.IsDBNull(i) ? null : reader.GetValue(i);
                }
            }
            return null;
        }

        public async Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword)
        {
            var results = new List<Dictionary<string, object?>>();

            using var connection = CreateConnection();
            using var command = new SqlCommand("sp_CentralDiagnosticSearch", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@mode", mode.Trim().ToUpper());
            command.Parameters.AddWithValue("@keyword", keyword.Trim());
            command.Parameters.AddWithValue("@case_id", DBNull.Value);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var item = new Dictionary<string, object?>();
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    item.Add(reader.GetName(i), reader.IsDBNull(i) ? null : reader.GetValue(i));
                }
                results.Add(item);
            }
            return results;
        }

        public async Task<DiagnosticCaseDetailResponse?> GetSModeDetailAsync(long caseId)
        {
            var response = new DiagnosticCaseDetailResponse();
            bool headerFound = false;

            using var connection = CreateConnection();
            using var command = new SqlCommand("sp_CentralDiagnosticSearch", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@mode", DBNull.Value);
            command.Parameters.AddWithValue("@keyword", DBNull.Value);
            command.Parameters.AddWithValue("@case_id", caseId);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                headerFound = true;
                response.CaseInfo.CaseId = Convert.ToInt64(GetSafeValue(reader, "case_id") ?? 0);
                response.CaseInfo.CaseCode = GetSafeValue(reader, "case_code")?.ToString() ?? "";
                response.CaseInfo.Title = GetSafeValue(reader, "title")?.ToString() ?? "";
                response.CaseInfo.IsParent = GetSafeValue(reader, "is_parent") != null ? Convert.ToBoolean(GetSafeValue(reader, "is_parent")) : false;
                response.CaseInfo.ParentCaseId = GetSafeValue(reader, "parent_case_id") != null ? Convert.ToInt64(GetSafeValue(reader, "parent_case_id")) : null;
            }

            if (!headerFound) return null;

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    response.GeneralCauses.Add(new GeneralCauseDTO
                    {
                        CauseId = Convert.ToInt64(GetSafeValue(reader, "cause_id") ?? 0),
                        Kind = GetSafeValue(reader, "kind")?.ToString(),
                        CauseText = GetSafeValue(reader, "cause_text")?.ToString() ?? "",
                        SequenceNo = Convert.ToInt32(GetSafeValue(reader, "sequence_no") ?? 0)
                    });
                }
            }

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    response.CaseInputs.Add(new CaseInputDTO
                    {
                        RowId = Convert.ToInt64(GetSafeValue(reader, "row_id") ?? 0),
                        RowType = GetSafeValue(reader, "row_type")?.ToString() ?? "",
                        RowText = GetSafeValue(reader, "row_text")?.ToString() ?? "",
                        SequenceNo = Convert.ToInt32(GetSafeValue(reader, "sequence_no") ?? 0)
                    });
                }
            }

            return response;
        }

        public async Task<Dictionary<string, object?>> AnalyzeDiagnosticFlowAsync(DiagnosticAnalyzeRequest request)
        {
            var finalResult = new Dictionary<string, object?>();

            dynamic? sessionInfo = null;
            var selectedInputs = new List<object?>();
            var causeRankings = new List<object?>();
            dynamic? conclusion = null;
            var finalActions = new List<object?>();

            using var connection = CreateConnection();
            using var command = new SqlCommand("usp_RunDiagnosticFlow", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@case_code", request.CaseCode);
            command.Parameters.AddWithValue("@selected_row_ids", request.SelectedRowIds);
            command.Parameters.AddWithValue("@machine_model", (object?)request.MachineModel ?? DBNull.Value);
            command.Parameters.AddWithValue("@serial_number", (object?)request.SerialNumber ?? DBNull.Value);
            command.Parameters.AddWithValue("@technician_name", (object?)request.TechnicianName ?? DBNull.Value);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                sessionInfo = new
                {
                    session_id = GetSafeValue(reader, "session_id"),
                    case_code = GetSafeValue(reader, "case_code")?.ToString(),
                    case_title = GetSafeValue(reader, "case_title")?.ToString(),
                    machine_model = GetSafeValue(reader, "machine_model")?.ToString(),
                    serial_number = GetSafeValue(reader, "serial_number")?.ToString(),
                    technician_name = GetSafeValue(reader, "technician_name")?.ToString(),
                    status = GetSafeValue(reader, "status")?.ToString(),
                    started_at = GetSafeValue(reader, "started_at")
                };
            }

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    selectedInputs.Add(new
                    {
                        row_id = GetSafeValue(reader, "row_id"),
                        row_type = GetSafeValue(reader, "row_type")?.ToString(),
                        row_text = GetSafeValue(reader, "row_text")?.ToString(),
                        sequence_no = GetSafeValue(reader, "sequence_no")
                    });
                }
            }

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (GetSafeValue(reader, "result_type")?.ToString() == "NO_CAUSE_RANKING")
                    {
                        finalResult["session"] = sessionInfo;
                        finalResult["inputs"] = selectedInputs;
                        finalResult["message"] = GetSafeValue(reader, "message")?.ToString();
                        return finalResult;
                    }

                    causeRankings.Add(new
                    {
                        rank_no = GetSafeValue(reader, "rank_no"),
                        case_cause_id = GetSafeValue(reader, "case_cause_id"),
                        trouble_candidate = GetSafeValue(reader, "trouble_candidate")?.ToString(),
                        symbol_count = GetSafeValue(reader, "symbol_count"),
                        total_score = GetSafeValue(reader, "total_score"),
                        remedy_text = GetSafeValue(reader, "remedy_text")?.ToString()
                    });
                }
            }

            if (await reader.NextResultAsync() && await reader.ReadAsync())
            {
                conclusion = new
                {
                    suspected_trouble = GetSafeValue(reader, "suspected_trouble")?.ToString(),
                    recommended_remedy = GetSafeValue(reader, "recommended_remedy")?.ToString(),
                    confidence_note = GetSafeValue(reader, "confidence_note")?.ToString()
                };
            }

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    finalActions.Add(new
                    {
                        case_cause_id = GetSafeValue(reader, "case_cause_id"),
                        cause_name = GetSafeValue(reader, "cause_name")?.ToString(),
                        remedy_text = GetSafeValue(reader, "remedy_text")?.ToString(),
                        row_id = GetSafeValue(reader, "row_id"),
                        troubleshooting_step = GetSafeValue(reader, "troubleshooting_step")?.ToString()
                    });
                }
            }

            finalResult["session"] = sessionInfo;
            finalResult["inputs"] = selectedInputs;
            finalResult["rankings"] = causeRankings;
            finalResult["conclusion"] = conclusion;
            finalResult["final_actions"] = finalActions;

            return finalResult;
        }

        public async Task<(Dictionary<string, object?>? header, List<Dictionary<string, object?>> causes)> GetDiagnosticDetailByIdAsync(string mode, int id)
        {
            Dictionary<string, object?>? header = null;
            var causes = new List<Dictionary<string, object?>>();

            using var connection = CreateConnection();
            using var command = new SqlCommand("sp_GetDiagnosticDetailById", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@mode", mode);
            command.Parameters.AddWithValue("@id", id);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                header = new Dictionary<string, object?>();
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    header[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                }
            }

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    var cause = new Dictionary<string, object?>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        cause[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                    }
                    causes.Add(cause);
                }
            }

            return (header, causes);
        }
    }
}