using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace astratech_apps_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FailureCodeController : ControllerBase
    {
        private readonly string _connectionString;

        public FailureCodeController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb") ?? "";
        }

        private bool HasColumn(SqlDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals(columnName, StringComparison.InvariantCultureIgnoreCase))
                    return true;
            }
            return false;
        }

        [HttpGet("search")]
        public IActionResult Search([FromQuery] string mode, [FromQuery] string keyword)
        {
            if (string.IsNullOrEmpty(mode) || string.IsNullOrEmpty(keyword))
                return BadRequest(new { message = "Mode dan Keyword tidak boleh kosong" });

            try
            {
                // Gunakan object? (nullable) agar bisa menerima null
                List<object?> results = new List<object?>();

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    SqlCommand cmd = new SqlCommand("sp_CentralDiagnosticSearch", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@mode", mode.Trim().ToUpper());
                    cmd.Parameters.AddWithValue("@keyword", keyword.Trim());

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            // Dictionary value diubah ke object?
                            var item = new Dictionary<string, object?>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                item.Add(reader.GetName(i), reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i));
                            }
                            results.Add(item);
                        }
                    }
                }
                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("detail")]
        public IActionResult GetDetail([FromQuery] string mode, [FromQuery] int id)
        {
            try
            {
                string baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/images/troubleshooting/";
                // Tambahkan tanda tanya (?) pada dynamic agar boleh null
                dynamic? header = null;
                List<object?> causes = new List<object?>();

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    SqlCommand cmd = new SqlCommand("sp_GetDiagnosticDetailById", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@mode", mode.Trim().ToUpper());
                    cmd.Parameters.AddWithValue("@id", id);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var headerDict = new Dictionary<string, object?>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                headerDict.Add(reader.GetName(i), reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i));
                            }
                            header = headerDict;
                        }

                        if (reader.NextResult()) 
                        {
                            while (reader.Read())
                            {
                                causes.Add(new {
                                    id = reader["id"],
                                    cause_number = reader["cause_number"],
                                    cause_description = reader["cause_description"]?.ToString() ?? "",
                                    check_method = reader["check_method"]?.ToString() ?? "",
                                    standard_condition = reader["standard_condition"]?.ToString() ?? "",
                                    priority = reader["priority"],
                                    special_method = reader["special_method"]?.ToString()?.Trim().ToLower() ?? "tidak",
                                    
                                    image_url = (HasColumn(reader, "image_filename") && reader["image_filename"] != DBNull.Value) ? 
                                                baseUrl + reader["image_filename"].ToString() : null,
                                    standard_image_url = (HasColumn(reader, "standard_image_filename") && reader["standard_image_filename"] != DBNull.Value) ? 
                                                         baseUrl + reader["standard_image_filename"].ToString() : null,

                                    remedy = HasColumn(reader, "remedy") ? reader["remedy"]?.ToString() : null
    
                                });
                            }
                        }
                    }
                }

                if (header == null) return NotFound(new { message = "Data tidak ditemukan." });

                return Ok(new { header, causes });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{kode}")]
        public IActionResult GetFailureDetail(string kode)
        {
            if (string.IsNullOrEmpty(kode)) 
                return BadRequest(new { message = "Kode tidak boleh kosong" });

            try
            {
                string baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}/images/troubleshooting/";

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    SqlCommand cmd1 = new SqlCommand("sp_GetFailureCodeByCode", conn);
                    cmd1.CommandType = CommandType.StoredProcedure;
                    cmd1.Parameters.AddWithValue("@code", kode.Trim().ToUpper());

                    // Inisialisasi sebagai nullable object
                    object? finalResult = null;

                    using (SqlDataReader reader1 = cmd1.ExecuteReader())
                    {
                        if (reader1.Read())
                        {
                            finalResult = new {
                                id = reader1["id"],
                                code = reader1["code"]?.ToString()?.Trim() ?? "",
                                user_code = reader1["user_code"]?.ToString()?.Trim() ?? "",
                                description = reader1["description"]?.ToString() ?? "",
                                problem_appears = reader1["problem_appears"]?.ToString() ?? "",
                                action_of_controller = reader1["action_of_controller"]?.ToString() ?? "",
                                component_in_charge = reader1["component_in_charge"]?.ToString() ?? "",
                                category = reader1["category"]?.ToString() ?? "",
                                contents_of_trouble = reader1["contents_of_trouble"]?.ToString() ?? "",
                                related_information = reader1["related_information"]?.ToString() ?? "",
                            };
                        }
                        else return NotFound(new { message = "Kode tidak ditemukan." });
                    }

                    List<object?> causesList = new List<object?>();
                    SqlCommand cmd2 = new SqlCommand("sp_GetPossibleCauseByCode", conn);
                    cmd2.CommandType = CommandType.StoredProcedure;
                    cmd2.Parameters.AddWithValue("@code", kode.Trim().ToUpper());

                    using (SqlDataReader reader2 = cmd2.ExecuteReader())
                    {
                        while (reader2.Read())
                        {
                            causesList.Add(new {
                                cause_description = reader2["cause_description"]?.ToString() ?? "",
                                check_method = reader2["check_method"]?.ToString() ?? "",
                                standard_condition = reader2["standard_condition"]?.ToString() ?? "",
                                special_method = reader2["special_method"]?.ToString()?.Trim().ToLower() ?? "tidak",
                                image_url = (HasColumn(reader2, "image_filename") && reader2["image_filename"] != DBNull.Value) ? 
                                            baseUrl + reader2["image_filename"].ToString() : null,
                                standard_image_url = (HasColumn(reader2, "standard_image_filename") && reader2["standard_image_filename"] != DBNull.Value) ? 
                                                     baseUrl + reader2["standard_image_filename"].ToString() : null
                            });
                        }
                    }

                    // Gunakan operator ! (null-forgiving) karena kita sudah cek di atas bahwa ia tidak null
                    var response = (dynamic)finalResult!;
                    return Ok(new {
                        id = response.id, code = response.code, user_code = response.user_code,
                        description = response.description, problem_appears = response.problem_appears,
                        action_of_controller = response.action_of_controller, component_in_charge = response.component_in_charge,
                        category = response.category, contents_of_trouble = response.contents_of_trouble,
                        related_information = response.related_information,
                        causes = causesList 
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}