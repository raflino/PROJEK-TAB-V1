using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using astractech_backend.DTOs; // Menggunakan namespace DTO sesuai permintaan
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System;

namespace astratech_apps_backend.Controllers 
{
    [Route("api/[controller]")]
    [ApiController]
    public class FailureDiagnosisController : ControllerBase
    {
        private readonly string _connectionString;

        public FailureDiagnosisController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb") ?? "";
        }

        // ==========================================
        // 1. ENDPOINT RIWAYAT (HISTORY)
        // ==========================================

        // --- Ambil Riwayat berdasarkan NIM ---
        [HttpGet("history/{nim}")]
        public IActionResult GetHistory(string nim)
        {
            List<FailureHistoryResponse> historyList = new List<FailureHistoryResponse>();
            try 
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    SqlCommand cmd = new SqlCommand("sp_GetDiagnosisHistory", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@user_nim", nim);
                    
                    conn.Open();
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            historyList.Add(new FailureHistoryResponse {
                                FailureCode = reader["failure_code"].ToString() ?? "",
                                DiagnosisTitle = reader["diagnosis_title"].ToString() ?? "",
                                DateDisplay = reader["date_display"].ToString() ?? "",
                                TotalSteps = Convert.ToInt32(reader["total_steps"]),
                                StepsDisplay = reader["steps_display"].ToString() ?? "",
                                SolutionText = reader["solution_text"] == DBNull.Value ? null : reader["solution_text"].ToString(),
                                Notes = reader["notes"].ToString(),
                                MechanicName = reader["mechanic_name"].ToString() ?? "",
                                MechanicNim = reader["mechanic_nim"].ToString() ?? "",
                                SessionId = reader["session_id"].ToString() ?? ""
                            });
                        }
                    }
                }
                return Ok(historyList);
            }
            catch (Exception ex) {
                return BadRequest(new { message = ex.Message });
            }
        }

        // --- Simpan atau Update Riwayat ---
        [HttpPost("history/save")]
        public IActionResult SaveHistory([FromBody] FailureSaveHistoryRequest req)
        {
            try {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    SqlCommand cmd = new SqlCommand("sp_SaveDiagnosisHistory", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@failure_code", req.FailureCode);
                    cmd.Parameters.AddWithValue("@user_nim", req.UserNim);
                    cmd.Parameters.AddWithValue("@diagnosis_title", req.DiagnosisTitle ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@total_steps", req.TotalSteps);
                    cmd.Parameters.AddWithValue("@solution_text", req.SolutionText ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@notes", req.Notes ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@session_id", req.SessionId ?? (object)DBNull.Value);

                    conn.Open();
                    // Menggunakan ExecuteScalar karena SP mengembalikan SELECT session_id
                    var result = cmd.ExecuteScalar();
                    string returnSessionId = result?.ToString() ?? "";
                    
                    return Ok(new { message = "Success", session_id = returnSessionId });
                }
            }
            catch (Exception ex) {
                return BadRequest(new { message = ex.Message });
            }
        }

        // --- Hapus Riwayat ---
        [HttpDelete("history/{sessionId}")]
        public IActionResult DeleteHistory(string sessionId)
        {
            try {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    SqlCommand cmd = new SqlCommand("sp_DeleteDiagnosisHistory", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@session_id", sessionId);
                    conn.Open();
                    cmd.ExecuteNonQuery();
                }
                return Ok(new { message = "Data berhasil dihapus" });
            }
            catch (Exception ex) {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==========================================
        // 2. ENDPOINT DIAGNOSIS (KODE ERROR)
        // ==========================================

        // Endpoint Utama Chatbot untuk mencari Detail Kode Error dan Langkahnya
        [HttpGet("{code}")]
        public IActionResult GetDiagnostics(string code)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    // Query untuk ambil detail Failure Code
                    // Menyesuaikan dengan nama tabel failure_codes (sesuai struktur awal Anda)
                    string queryDetail = "SELECT * FROM failure_codes WHERE code = @code OR user_code = @code";
                    SqlCommand cmd = new SqlCommand(queryDetail, conn);
                    cmd.Parameters.AddWithValue("@code", code);

                    conn.Open();
                    SqlDataAdapter da = new SqlDataAdapter(cmd);
                    DataTable dt = new DataTable();
                    da.Fill(dt);

                    if (dt.Rows.Count > 0)
                    {
                        var row = dt.Rows[0];
                        int failureId = Convert.ToInt32(row["id"]);

                        // Query untuk ambil langkah-langkah penyebab (Possible Causes)
                        string queryCauses = "SELECT * FROM failure_possible_causes WHERE failure_code_id = @fid ORDER BY priority ASC";
                        SqlCommand cmdCauses = new SqlCommand(queryCauses, conn);
                        cmdCauses.Parameters.AddWithValue("@fid", failureId);
                        
                        SqlDataAdapter daCauses = new SqlDataAdapter(cmdCauses);
                        DataTable dtCauses = new DataTable();
                        daCauses.Fill(dtCauses);

                        var causesList = new List<object>();
                        foreach (DataRow r in dtCauses.Rows)
                        {
                            causesList.Add(new
                            {
                                cause_description = r["cause_description"].ToString(),
                                check_method = r["check_method"].ToString(),
                                special_method = r["special_method"]?.ToString() 
                            });
                        }

                        // Response gabungan untuk Frontend Chat
                        var result = new
                        {
                            detail = new
                            {
                                code = row["code"].ToString(),
                                user_code = row["user_code"].ToString(),
                                description = row["description"].ToString(),
                                problem_appears = row["problem_appears"].ToString(),
                                action_of_controller = row["action_of_controller"].ToString(),
                                contents_of_trouble = row["contents_of_trouble"]?.ToString() ?? "-",
                                component_in_charge = row["component_in_charge"].ToString(),
                                category = row["category"].ToString(),
                                related_information = row["related_information"]?.ToString() ?? "-"
                            },
                            causes = causesList
                        };

                        return Ok(result);
                    }
                    else
                    {
                        return NotFound(new { message = "Kode tidak ditemukan" });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}