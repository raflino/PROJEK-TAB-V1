using astratech_apps_backend.DTOs;
using astratech_apps_backend.Repositories.Interfaces;
using Microsoft.Data.SqlClient;
using System.Data;

namespace astratech_apps_backend.Repositories.Implementations
{
    public class HistoryRepository : IHistoryRepository
    {
        private readonly string _connectionString;

        public HistoryRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb");
        }

        private SqlConnection CreateConnection() => new SqlConnection(_connectionString);


        #region === GET history summary ===
        public async Task<IEnumerable<HistorySummaryDto>> GetHistorySummaryAsync(string diagnosisType)
        {
          var results = new List<HistorySummaryDto>();

          await using var conn = new SqlConnection(_connectionString);
          await using var cmd = new SqlCommand("sp_GetHistorySummary", conn)
        {
           CommandType = CommandType.StoredProcedure
        };

        cmd.Parameters.AddWithValue("@diagnosis_type", diagnosisType);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            results.Add(new HistorySummaryDto
            {
             IdHistory = reader.GetInt32(reader.GetOrdinal("id_history")),
             Code = reader.IsDBNull(reader.GetOrdinal("code"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("code")),
             Title = reader.GetString(reader.GetOrdinal("title")), 
             TotalSearch = reader.GetInt32(reader.GetOrdinal("total_search"))
            });
        }
        return results;
        }

        #endregion

        #region === GET history detail ======
        public async Task<IEnumerable<HistoryDetailDto>> GetHistoryDetailAsync(string diagnosisType, int idItem)
        {
          var results = new List<HistoryDetailDto>();

          await using var conn = new SqlConnection(_connectionString);
          await using var cmd = new SqlCommand("sp_GetHistoryDetail", conn)
        {
           CommandType = CommandType.StoredProcedure
        };

        cmd.Parameters.AddWithValue("@diagnosis_type", diagnosisType);
        cmd.Parameters.AddWithValue("@item_id", idItem);

        await conn.OpenAsync();
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            results.Add(new HistoryDetailDto
            {
             Nim = reader.GetString(reader.GetOrdinal("nim")),
             NamaMahasiswa = reader.GetString(reader.GetOrdinal("nama")),
             TotalSearch = reader.GetInt32(reader.GetOrdinal("total_search")),
             FirstSearch = reader.GetDateTime(reader.GetOrdinal("first_search")),
             LastSearch = reader.GetDateTime(reader.GetOrdinal("last_search"))
            });
        }
        return results;
        }
        #endregion

        #region === SAVE DIAGNOSIS HISTORY ===

        public async Task SaveDiagnosisHistoryAsync(SaveDiagnosisHistoryDto dto)
        {
            await using var conn = new SqlConnection(_connectionString);

            await using var cmd = new SqlCommand("dbo.sp_SaveDiagnosisHistory", conn);

            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("@diagnosis_type", dto.DiagnosisType);
            cmd.Parameters.AddWithValue("@failure_code_id", (object?)dto.FailureCodeId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@troubleshooting_case_id", (object?)dto.TroubleshootingCaseId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@user_nim", dto.UserNim);
            cmd.Parameters.AddWithValue("@diagnosis_title", dto.DiagnosisTitle);

            await conn.OpenAsync();

            await cmd.ExecuteNonQueryAsync();

        }
        #endregion
    }
}
