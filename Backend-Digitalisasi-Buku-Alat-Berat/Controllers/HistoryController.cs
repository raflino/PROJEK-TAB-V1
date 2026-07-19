using astratech_apps_backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;
using astratech_apps_backend.DTOs;

namespace astratech_apps_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private readonly IHistoryRepository _historyRepository;

        public HistoryController(IHistoryRepository historyRepository)
        {
            _historyRepository = historyRepository;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetHistorySummary(
            [FromQuery] string diagnosisType)
        {
            try
            {
                var data = await _historyRepository
                    .GetHistorySummaryAsync(diagnosisType);

                return Ok(new
                {
                    success = data.Any(),
                    message = data.Any()
                        ? "SUCCESS"
                        : $"Belum ada riwayat untuk {diagnosisType}",
                    data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = ex.Message
                });
            }
        }
    
        [HttpGet("detail")]
        public async Task<IActionResult> GetHistoryDetail(
            [FromQuery] string diagnosisType,
            [FromQuery] int idItem)
        {
            try
            {
                var data = await _historyRepository
                    .GetHistoryDetailAsync(diagnosisType, idItem);

                return Ok(new
                {
                    success = data.Any(),
                    message = "SUCCESS",
                    data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = ex.Message
                });
            }
        }
        //

        [HttpPost("save")]
        public async Task<IActionResult> SaveDiagnosisHistory(
            [FromBody] SaveDiagnosisHistoryDto request)
        {
            try
            {
                await _historyRepository.SaveDiagnosisHistoryAsync(request);

                return Ok(new
                {
                    success = true,
                    message = "SUCCESS"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
 
    }
}