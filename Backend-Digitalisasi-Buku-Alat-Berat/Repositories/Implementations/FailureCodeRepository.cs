using astratech_apps_backend.DTOs; 
using astratech_apps_backend.Models;
using astratech_apps_backend.Repositories.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace astratech_apps_backend.Repositories.Implementations
{
    public class FailureCodeRepository : IFailureCodeRepository
    {
        private readonly string _connectionString;

        public FailureCodeRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb") ?? "";
        }

        private SqlConnection CreateConnection() => new SqlConnection(_connectionString);

        // Helper anti-crash untuk pembacaan kolom dinamis S-Mode
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

        // ====================================================================
        // EXISTING METHODS (Fungsi Lama Tetap Utuh)
        // ====================================================================

        public async Task<List<FailureCode>> SearchFailureCode(string keyword)
        {
            var results = new List<FailureCode>();
            var searchPattern = $"%{keyword}%";

            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                SELECT id, code, user_code, description, problem_appears, 
                       action_of_controller, component_in_charge, category, 
                       reference_file, reference_page, created_at, updated_at
                FROM failure_code
                WHERE code = @keyword OR user_code = @keyword OR description LIKE @searchPattern
                ORDER BY code", connection);

            command.Parameters.AddWithValue("@keyword", keyword);
            command.Parameters.AddWithValue("@searchPattern", searchPattern);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new FailureCode
                {
                    Id = reader.GetInt32(0),
                    Code = reader.GetString(1),
                    UserCode = reader.IsDBNull(2) ? null : reader.GetString(2),
                    Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                    ProblemAppears = reader.IsDBNull(4) ? null : reader.GetString(4),
                    ActionOfController = reader.IsDBNull(5) ? null : reader.GetString(5),
                    ComponentInCharge = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Category = reader.IsDBNull(7) ? null : reader.GetString(7),
                    ReferenceFile = reader.IsDBNull(8) ? null : reader.GetString(8),
                    ReferencePage = reader.IsDBNull(9) ? null : reader.GetString(9),
                    CreatedAt = reader.GetDateTime(10),
                    UpdatedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11)
                });
            }
            return results;
        }

        public async Task<FailureCode?> GetFailureCodeByCode(string code)
        {
            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                SELECT id, code, user_code, description, problem_appears, 
                       action_of_controller, component_in_charge, category, 
                       reference_file, reference_page, created_at, updated_at
                FROM failure_code WHERE code = @code", connection);

            command.Parameters.AddWithValue("@code", code);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new FailureCode
                {
                    Id = reader.GetInt32(0),
                    Code = reader.GetString(1),
                    UserCode = reader.IsDBNull(2) ? null : reader.GetString(2),
                    Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                    ProblemAppears = reader.IsDBNull(4) ? null : reader.GetString(4),
                    ActionOfController = reader.IsDBNull(5) ? null : reader.GetString(5),
                    ComponentInCharge = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Category = reader.IsDBNull(7) ? null : reader.GetString(7),
                    ReferenceFile = reader.IsDBNull(8) ? null : reader.GetString(8),
                    ReferencePage = reader.IsDBNull(9) ? null : reader.GetString(9),
                    CreatedAt = reader.GetDateTime(10),
                    UpdatedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11)
                };
            }
            return null;
        }

        public async Task<List<FailurePossibleCause>> GetPossibleCauses(int failureCodeId)
        {
            var results = new List<FailurePossibleCause>();

            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                SELECT id, failure_code_id, cause_number, cause_description, 
                       check_method, standard_value, standard_unit,
                       min_threshold, max_threshold, priority
                FROM possible_cause WHERE failure_code_id = @failureCodeId
                ORDER BY cause_number", connection);

            command.Parameters.AddWithValue("@failureCodeId", failureCodeId);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new FailurePossibleCause
                {
                    Id = reader.GetInt32(0),
                    FailureCodeId = reader.GetInt32(1),
                    CauseNumber = reader.GetInt32(2),
                    CauseDescription = reader.GetString(3),
                    CheckMethod = reader.IsDBNull(4) ? null : reader.GetString(4),
                    StandardValue = reader.IsDBNull(5) ? null : reader.GetString(5),
                    StandardUnit = reader.IsDBNull(7) ? null : reader.GetString(7),
                    MinThreshold = reader.IsDBNull(8) ? null : reader.GetDecimal(8),
                    MaxThreshold = reader.IsDBNull(9) ? null : reader.GetDecimal(9),
                    Priority = reader.GetInt32(10)
                });
            }
            return results;
        }

        public async Task<List<FailureRemedy>> GetRemediesByCauseId(int possibleCauseId)
        {
            var results = new List<FailureRemedy>();

            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                SELECT id, possible_cause_id, remedy_text, remedy_detail, parts_needed
                FROM remedy WHERE possible_cause_id = @possibleCauseId", connection);

            command.Parameters.AddWithValue("@possibleCauseId", possibleCauseId);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new FailureRemedy
                {
                    Id = reader.GetInt32(0),
                    PossibleCauseId = reader.GetInt32(1),
                    RemedyText = reader.GetString(2),
                    RemedyDetail = reader.IsDBNull(3) ? null : reader.GetString(3),
                    PartsNeeded = reader.IsDBNull(4) ? null : reader.GetString(4)
                });
            }
            return results;
        }

        public async Task<List<FailureDiagnosticTool>> GetToolsForFailureCode(int failureCodeId)
        {
            var results = new List<FailureDiagnosticTool>();

            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                SELECT DISTINCT t.id, t.name, t.part_number, t.description, t.category
                FROM diagnostic_tool t
                JOIN failure_tool ft ON t.id = ft.tool_id
                WHERE ft.failure_code_id = @failureCodeId", connection);

            command.Parameters.AddWithValue("@failureCodeId", failureCodeId);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new FailureDiagnosticTool
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    PartNumber = reader.IsDBNull(2) ? null : reader.GetString(2),
                    Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                    Category = reader.IsDBNull(4) ? null : reader.GetString(4)
                });
            }
            return results;
        }

        public async Task<List<FailureCode>> GetAllFailureCodes()
        {
            var results = new List<FailureCode>();

            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                SELECT id, code, user_code, description, problem_appears, 
                       action_of_controller, component_in_charge, category, 
                       reference_file, reference_page, created_at, updated_at
                FROM failure_code ORDER BY code", connection);

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new FailureCode
                {
                    Id = reader.GetInt32(0),
                    Code = reader.GetString(1),
                    UserCode = reader.IsDBNull(2) ? null : reader.GetString(2),
                    Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                    ProblemAppears = reader.IsDBNull(4) ? null : reader.GetString(4),
                    ActionOfController = reader.IsDBNull(5) ? null : reader.GetString(5),
                    ComponentInCharge = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Category = reader.IsDBNull(7) ? null : reader.GetString(7),
                    ReferenceFile = reader.IsDBNull(8) ? null : reader.GetString(8),
                    ReferencePage = reader.IsDBNull(9) ? null : reader.GetString(9),
                    CreatedAt = reader.GetDateTime(10),
                    UpdatedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11)
                });
            }
            return results;
        }

        public async Task<bool> SaveCheckResult(FailureCheckResult checkResult)
        {
            using var connection = CreateConnection();
            using var command = new SqlCommand(@"
                INSERT INTO check_result (session_id, failure_code_id, cause_number, 
                    check_date, mechanic_name, unit_model, unit_serial, service_meter_hours,
                    check_result_value, check_status, is_cause_found, notes)
                VALUES (@sessionId, @failureCodeId, @causeNumber, @checkDate, 
                    @mechanicName, @unitModel, @unitSerial, @serviceMeterHours,
                    @checkResultValue, @checkStatus, @isCauseFound, @notes)", connection);

            command.Parameters.AddWithValue("@sessionId", checkResult.SessionId);
            command.Parameters.AddWithValue("@failureCodeId", checkResult.FailureCodeId);
            command.Parameters.AddWithValue("@causeNumber", checkResult.CauseNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@checkDate", checkResult.CheckDate);
            command.Parameters.AddWithValue("@mechanicName", checkResult.MechanicName ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@unitModel", checkResult.UnitModel ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@unitSerial", checkResult.UnitSerial ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@serviceMeterHours", checkResult.ServiceMeterHours ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@checkResultValue", checkResult.CheckResultValue ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@checkStatus", checkResult.CheckStatus ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@isCauseFound", checkResult.IsCauseFound);
            command.Parameters.AddWithValue("@notes", checkResult.Notes ?? (object)DBNull.Value);

            await connection.OpenAsync();
            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        // ====================================================================
        // CENTRAL SEARCH DYNAMIC: Mendukung CODE, E, H, maupun S
        // ====================================================================
        public async Task<List<Dictionary<string, object?>>> SearchCentralAsync(string mode, string keyword)
        {
            var results = new List<Dictionary<string, object?>>();

            using var connection = CreateConnection();
            using var command = new SqlCommand("sp_CentralDiagnosticSearch", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@mode", mode.Trim().ToUpper());
            command.Parameters.AddWithValue("@keyword", keyword.Trim());
            command.Parameters.AddWithValue("@case_id", DBNull.Value); // Null karena ini fungsi Search List

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

        // ====================================================================
        // S-MODE SPECIFIC DETAILS & ANALYSIS
        // ====================================================================

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
                        finalResult.Add("session", sessionInfo);
                        finalResult.Add("inputs", selectedInputs);
                        finalResult.Add("message", GetSafeValue(reader, "message")?.ToString());
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

            finalResult.Add("session", sessionInfo);
            finalResult.Add("inputs", selectedInputs);
            finalResult.Add("rankings", causeRankings);
            finalResult.Add("conclusion", conclusion);
            finalResult.Add("final_actions", finalActions);

            return finalResult;
        }
    }
}