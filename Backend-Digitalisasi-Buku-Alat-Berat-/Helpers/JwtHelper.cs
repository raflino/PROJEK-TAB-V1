using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace astratech_apps_backend.Helpers
{
    public class JwtHelper
    {
        private readonly IConfiguration _configuration;

        public JwtHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(string nim, string nama, string kelas)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("komatsu_diagnostic_secret_key_2024"));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, nim),
                new Claim(ClaimTypes.Name, nama),
                new Claim("Nim", nim),
                new Claim("Nama", nama),
                new Claim("Kelas", kelas)
            };

            var token = new JwtSecurityToken(
                issuer: "komatsu-backend",
                audience: "komatsu-mobile-app",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}