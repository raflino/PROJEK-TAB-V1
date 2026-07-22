using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using astratech_apps_backend.DTOs;
using astratech_apps_backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace astratech_apps_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FailureDiagnosisController : ControllerBase
    {
        private readonly IFailureDiagnosisService _service;
        private readonly string _connectionString;

        public FailureDiagnosisController(IFailureDiagnosisService service, IConfiguration configuration)
        {
            _service = service;
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
        public async Task<IActionResult> Search([FromQuery] string mode, [FromQuery] string keyword)
        {
            if (string.IsNullOrEmpty(mode) || string.IsNullOrEmpty(keyword))
                return BadRequest(new { message = "Mode dan Keyword tidak boleh kosong" });

            try
            {
                var results = await _service.SearchCentralAsync(mode, keyword);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("detail")]
        public async Task<IActionResult> GetDetail([FromQuery] string mode, [FromQuery] long id)
        {
            if (string.IsNullOrEmpty(mode))
                return BadRequest(new { message = "Parameter mode wajib diisi." });

            string currentMode = mode.Trim().ToUpper();

            try
            {
                if (currentMode == "S")
                {
                    var result = await _service.GetSModeDetailAsync(id);
                    if (result == null)
                        return NotFound(new { message = "Data S-Mode tidak ditemukan." });
                    return Ok(result);
                }
                else
                {
                    string imageBaseUrl = currentMode switch
                    {
                        "E" => $"{Request.Scheme}://{Request.Host}{Request.PathBase}/images/E-MODE/",
                        "H" => $"{Request.Scheme}://{Request.Host}{Request.PathBase}/images/H-MODE/",
                        _ => $"{Request.Scheme}://{Request.Host}{Request.PathBase}/images/troubleshooting/"
                    };

                    dynamic? header = null;
                    List<object?> causes = new List<object?>();

                    using (var conn = new SqlConnection(_connectionString))
                    {
                        await conn.OpenAsync();
                        var cmd = new SqlCommand("sp_GetDiagnosticDetailById", conn);
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@mode", currentMode);
                        cmd.Parameters.AddWithValue("@id", Convert.ToInt32(id));

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                var headerDict = new Dictionary<string, object?>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    headerDict.Add(reader.GetName(i), 
                                        reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i));
                                }
                                header = headerDict;
                            }

                            if (await reader.NextResultAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    causes.Add(new
                                    {
                                        id = HasColumn(reader, "id") ? reader["id"] : null,
                                        cause_number = HasColumn(reader, "cause_number") ? reader["cause_number"] : null,
                                        cause_description = HasColumn(reader, "cause_description") ? reader["cause_description"]?.ToString() ?? "" : "",
                                        check_method = HasColumn(reader, "check_method") ? reader["check_method"]?.ToString() ?? "" : "",
                                        standard_condition = HasColumn(reader, "standard_condition") ? reader["standard_condition"]?.ToString() : null,
                                        standard_value = HasColumn(reader, "standard_value") ? reader["standard_value"]?.ToString() : null,
                                        priority = HasColumn(reader, "priority") ? reader["priority"] : null,
                                        special_method = (HasColumn(reader, "special_method") && reader["special_method"] != DBNull.Value)
                                                            ? reader["special_method"]?.ToString()?.Trim().ToLower() : "tidak",
                                        image_url = (HasColumn(reader, "image_filename") && reader["image_filename"] != DBNull.Value) ?
                                                    imageBaseUrl + reader["image_filename"].ToString() : null,
                                        standard_image_url = (HasColumn(reader, "standard_image_filename") && reader["standard_image_filename"] != DBNull.Value) ?
                                                             imageBaseUrl + reader["standard_image_filename"].ToString() : null,
                                        remedy = HasColumn(reader, "remedy") ? reader["remedy"]?.ToString() : null
                                    });
                                }
                            }
                        }
                    }

                    if (header == null) return NotFound(new { message = "Data tidak ditemukan." });
                    return Ok(new { header, causes });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("s-mode/analyze")]
        public async Task<IActionResult> AnalyzeDiagnosticFlow([FromBody] DiagnosticAnalyzeRequest request)
        {
            if (string.IsNullOrEmpty(request.CaseCode) || string.IsNullOrEmpty(request.SelectedRowIds))
                return BadRequest(new { message = "CaseCode dan SelectedRowIds wajib diisi." });

            try
            {
                var result = await _service.AnalyzeDiagnosticFlowAsync(request);
                return Ok(result);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Terjadi kesalahan internal server.", details = ex.Message });
            }
        }
    }
}