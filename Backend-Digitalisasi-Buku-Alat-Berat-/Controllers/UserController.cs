using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace astratech_apps_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly string _connectionString;

        public UserController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb") ?? "";
        }

        [HttpGet("GetProfile/{nim}")]
        public IActionResult GetProfile(string nim)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    // Gunakan SP baru yang return email & no_telpon
                    SqlCommand cmd = new SqlCommand("sp_GetUserProfile", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@nim", nim);

                    conn.Open();
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return Ok(new
                            {
                                id = reader["id"],
                                nim = reader["nim"]?.ToString()?.Trim() ?? "",
                                nama = reader["nama"]?.ToString()?.Trim() ?? "",
                                email = reader["email"]?.ToString()?.Trim() ?? "",
                                no_telpon = reader["no_telpon"]?.ToString()?.Trim() ?? "",
                                role = reader["role"]?.ToString()?.Trim() ?? ""
                            });
                        }
                    }
                    return NotFound(new { message = "User tidak ditemukan." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database Error", detail = ex.Message });
            }
        }
    }
}