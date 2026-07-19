using astratech_apps_backend.Models;
using astratech_apps_backend.Repositories.Interfaces;
using Microsoft.Data.SqlClient;

namespace astratech_apps_backend.Repositories.Implementations
{
    public class FailureCodeRepository : IFailureCodeRepository
    {
        private readonly string _connectionString;

        public FailureCodeRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb");
        }

        private SqlConnection CreateConnection() => new SqlConnection(_connectionString);

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
                       check_method, standard_value, standard_condition, standard_unit,
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
                    StandardCondition = reader.IsDBNull(6) ? null : reader.GetString(6),
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
    }
}