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

        public string GenerateToken(string nim, string nama, string role)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "komatsu_diagnostic_secret_key_2024";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "komatsu-backend";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "komatsu-mobile-app";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, nim),
                new Claim(ClaimTypes.Name, nama),
                new Claim("nim", nim),      
                new Claim("nama", nama),     
                new Claim("role", role),     
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        
        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var jwtKey = _configuration["Jwt:Key"] ?? "komatsu_diagnostic_secret_key_2024";
                var jwtIssuer = _configuration["Jwt:Issuer"] ?? "komatsu-backend";
                var jwtAudience = _configuration["Jwt:Audience"] ?? "komatsu-mobile-app";

                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(jwtKey);

                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}