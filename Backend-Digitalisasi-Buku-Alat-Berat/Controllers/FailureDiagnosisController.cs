using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using astratech_apps_backend.DTOs;
using astratech_apps_backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace astratech_apps_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FailureDiagnosisController : ControllerBase
    {
        private readonly IFailureDiagnosisService _service;

        public FailureDiagnosisController(IFailureDiagnosisService service)
        {
            _service = service;
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

            try
            {
                var result = await _service.GetDetailAsync(mode, id);
                if (result == null)
                    return NotFound(new { message = "Data tidak ditemukan." });
                return Ok(result);
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