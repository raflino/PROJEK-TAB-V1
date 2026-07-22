namespace astratech_apps_backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Nim { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? NoTelpon { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    public class UserProfile : User
    {
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class LoginResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public LoginData? Data { get; set; }
    }

    public class LoginData
    {
        public string Token { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public long ExpiresIn { get; set; } = 604800;
        public User User { get; set; } = new();
    }

    public class SecurityQuestion
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
    }

    public class RegisterResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ForgotPasswordResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Nama { get; set; }
        public QuestionInfo? Q1 { get; set; }
        public QuestionInfo? Q2 { get; set; }
        public QuestionInfo? Q3 { get; set; }
    }

    public class QuestionInfo
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
    }

    public class VerifyResetResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ApiResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ApiResponse<T> : ApiResponse
    {
        public T? Data { get; set; }
    }
}