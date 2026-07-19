using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using astratech_apps_backend.DTOs;
using astratech_apps_backend.Helpers;
using System.Data;

namespace astratech_apps_backend.Controllers
{
    /// <summary>
    /// Auth Controller: Register, Login, Lupa Password via Security Questions.
    /// Route: api/failure-auth
    /// </summary>
    [Route("api/failure-auth")]
    [ApiController]
    public class FailureAuthController : ControllerBase
    {
        private readonly JwtHelper _jwtHelper;
        private readonly string _connectionString;

        public FailureAuthController(JwtHelper jwtHelper, IConfiguration configuration)
        {
            _jwtHelper = jwtHelper;
            _connectionString = configuration.GetConnectionString("LocalEquipmentDb") ?? "";
        }

        // ════════════════════════════════════════════════════════════
        // GET api/failure-auth/security-questions
        // Ambil daftar pertanyaan keamanan untuk dropdown di frontend
        // ════════════════════════════════════════════════════════════
        [HttpGet("security-questions")]
        public async Task<IActionResult> GetSecurityQuestions()
        {
            try
            {
                var list = new List<SecurityQuestionDto>();

                using SqlConnection conn = new SqlConnection(_connectionString);
                SqlCommand cmd = new SqlCommand("sp_GetSecurityQuestions", conn);
                cmd.CommandType = CommandType.StoredProcedure;

                await conn.OpenAsync();
                using SqlDataReader reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(new SecurityQuestionDto
                    {
                        Id = Convert.ToInt32(reader["id"]),
                        Question = reader["question"]?.ToString() ?? ""
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Database Error: " + ex.Message });
            }
        }

        // ════════════════════════════════════════════════════════════
        // POST api/failure-auth/register
        // Body: { nim, nama, password, role, q1Id, a1, q2Id, a2, q3Id, a3 }
        // ════════════════════════════════════════════════════════════
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (req == null)
                return BadRequest(new { success = false, message = "Request tidak valid." });
            if (string.IsNullOrWhiteSpace(req.Nim))
                return BadRequest(new { success = false, message = "NIM wajib diisi." });
            if (string.IsNullOrWhiteSpace(req.Nama))
                return BadRequest(new { success = false, message = "Nama lengkap wajib diisi." });
            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
                return BadRequest(new { success = false, message = "Password minimal 6 karakter." });
            if (req.Role != "student" && req.Role != "lecturer")
                return BadRequest(new { success = false, message = "Role tidak valid." });
            if (req.Q1Id <= 0 || req.Q2Id <= 0 || req.Q3Id <= 0)
                return BadRequest(new { success = false, message = "Pilih 3 pertanyaan keamanan." });
            if (string.IsNullOrWhiteSpace(req.A1) || string.IsNullOrWhiteSpace(req.A2) || string.IsNullOrWhiteSpace(req.A3))
                return BadRequest(new { success = false, message = "Semua jawaban keamanan wajib diisi." });
            if (req.Q1Id == req.Q2Id || req.Q1Id == req.Q3Id || req.Q2Id == req.Q3Id)
                return BadRequest(new { success = false, message = "Pilih 3 pertanyaan yang berbeda." });

            try
            {
                // Password disimpan plaintext
                string hashedPassword = req.Password;
                // Jawaban tetap di-lowercase dan di-trim agar tidak case-sensitive
                string a1Hash = req.A1.Trim().ToLower();
                string a2Hash = req.A2.Trim().ToLower();
                string a3Hash = req.A3.Trim().ToLower();

                using SqlConnection conn = new SqlConnection(_connectionString);
                SqlCommand cmd = new SqlCommand("sp_RegisterUser", conn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@nim", req.Nim.Trim());
                cmd.Parameters.AddWithValue("@nama", req.Nama.Trim());
                cmd.Parameters.AddWithValue("@password", hashedPassword);
                cmd.Parameters.AddWithValue("@role", req.Role.Trim());
                cmd.Parameters.AddWithValue("@q1_id", req.Q1Id);
                cmd.Parameters.AddWithValue("@a1_hash", a1Hash);
                cmd.Parameters.AddWithValue("@q2_id", req.Q2Id);
                cmd.Parameters.AddWithValue("@a2_hash", a2Hash);
                cmd.Parameters.AddWithValue("@q3_id", req.Q3Id);
                cmd.Parameters.AddWithValue("@a3_hash", a3Hash);

                await conn.OpenAsync();
                using SqlDataReader reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    bool success = Convert.ToBoolean(reader["success"]);
                    string message = reader["message"]?.ToString() ?? "";
                    if (!success) return Conflict(new { success = false, message });
                    return Ok(new { success = true, message });
                }

                return StatusCode(500, new { success = false, message = "Registrasi gagal." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Database Error: " + ex.Message });
            }
        }

        // ════════════════════════════════════════════════════════════
        // POST api/failure-auth/login
        // Body: { nim, password }
        // ════════════════════════════════════════════════════════════
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Nim))
                return BadRequest(new { success = false, message = "NIM wajib diisi." });
            if (string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { success = false, message = "Password wajib diisi." });

            try
            {
                // Password plaintext langsung dibandingkan
                string hashedPassword = req.Password;

                using SqlConnection conn = new SqlConnection(_connectionString);
                SqlCommand cmd = new SqlCommand("sp_LoginUser", conn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@nim", req.Nim.Trim());
                cmd.Parameters.AddWithValue("@password", hashedPassword);

                await conn.OpenAsync();
                using SqlDataReader reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var user = new FailureUserDto
                    {
                        Nim = reader["nim"]?.ToString()?.Trim() ?? "",
                        Nama = reader["nama"]?.ToString()?.Trim() ?? "",
                        Role = reader["role"]?.ToString()?.Trim() ?? ""
                    };
                    string token = _jwtHelper.GenerateToken(user.Nim, user.Nama, user.Role);
                    return Ok(new
                    {
                        success = true,
                        message = "Login berhasil.",
                        data = new { Token = token, User = user }
                    });
                }

                return Unauthorized(new { success = false, message = "NIM atau password salah." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Database Error: " + ex.Message });
            }
        }

        // ════════════════════════════════════════════════════════════
        // POST api/failure-auth/forgot-password   [Langkah 1]
        // Body: { nim }
        // Kembalikan: nama user + 3 pertanyaan keamanannya
        // ════════════════════════════════════════════════════════════
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Nim))
                return BadRequest(new { success = false, message = "NIM wajib diisi." });

            try
            {
                using SqlConnection conn = new SqlConnection(_connectionString);
                SqlCommand cmd = new SqlCommand("sp_GetUserSecurityQuestions", conn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@nim", req.Nim.Trim());

                await conn.OpenAsync();
                using SqlDataReader reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    bool success = Convert.ToBoolean(reader["success"]);
                    string message = reader["message"]?.ToString() ?? "";

                    if (!success)
                        return NotFound(new { success = false, message });

                    return Ok(new
                    {
                        success = true,
                        message = "User ditemukan.",
                        nama = reader["nama"]?.ToString()?.Trim() ?? "",
                        q1 = new { id = Convert.ToInt32(reader["q1_id"]), text = reader["q1_text"]?.ToString() ?? "" },
                        q2 = new { id = Convert.ToInt32(reader["q2_id"]), text = reader["q2_text"]?.ToString() ?? "" },
                        q3 = new { id = Convert.ToInt32(reader["q3_id"]), text = reader["q3_text"]?.ToString() ?? "" },
                    });
                }

                return NotFound(new { success = false, message = "NIM tidak ditemukan." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Database Error: " + ex.Message });
            }
        }

        // ════════════════════════════════════════════════════════════
        // POST api/failure-auth/verify-reset   [Langkah 2]
        // Body: { nim, a1Id, a1, a2Id, a2, a3Id, a3, newPassword, confirmPassword }
        // Verifikasi jawaban + reset password sekaligus (tanpa OTP)
        // ════════════════════════════════════════════════════════════
        [HttpPost("verify-reset")]
        public async Task<IActionResult> VerifyAndReset([FromBody] VerifyAndResetRequest req)
        {
            if (req == null)
                return BadRequest(new { success = false, message = "Request tidak valid." });
            if (string.IsNullOrWhiteSpace(req.Nim))
                return BadRequest(new { success = false, message = "NIM wajib diisi." });
            if (string.IsNullOrWhiteSpace(req.A1) || string.IsNullOrWhiteSpace(req.A2) || string.IsNullOrWhiteSpace(req.A3))
                return BadRequest(new { success = false, message = "Semua jawaban wajib diisi." });
            if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
                return BadRequest(new { success = false, message = "Password baru minimal 6 karakter." });
            if (req.NewPassword != req.ConfirmPassword)
                return BadRequest(new { success = false, message = "Konfirmasi password tidak cocok." });

            try
            {
                // Jawaban di-lowercase untuk case-insensitive, password plaintext
                string a1Hash = req.A1.Trim().ToLower();
                string a2Hash = req.A2.Trim().ToLower();
                string a3Hash = req.A3.Trim().ToLower();
                string newPassHash = req.NewPassword;

                using SqlConnection conn = new SqlConnection(_connectionString);
                SqlCommand cmd = new SqlCommand("sp_VerifyAndResetPassword", conn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@nim", req.Nim.Trim());
                cmd.Parameters.AddWithValue("@a1_id", req.A1Id);
                cmd.Parameters.AddWithValue("@a1_hash", a1Hash);
                cmd.Parameters.AddWithValue("@a2_id", req.A2Id);
                cmd.Parameters.AddWithValue("@a2_hash", a2Hash);
                cmd.Parameters.AddWithValue("@a3_id", req.A3Id);
                cmd.Parameters.AddWithValue("@a3_hash", a3Hash);
                cmd.Parameters.AddWithValue("@newPassword", newPassHash);

                await conn.OpenAsync();
                using SqlDataReader reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    bool success = Convert.ToBoolean(reader["success"]);
                    string message = reader["message"]?.ToString() ?? "";
                    if (success) return Ok(new { success = true, message });
                    return BadRequest(new { success = false, message });
                }

                return BadRequest(new { success = false, message = "Verifikasi gagal." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Database Error: " + ex.Message });
            }
        }

    }
}