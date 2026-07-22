namespace astratech_apps_backend.DTOs
{
    public class RegisterRequest
    {
        public string Nim { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int Q1Id { get; set; }
        public string A1 { get; set; } = string.Empty;
        public int Q2Id { get; set; }
        public string A2 { get; set; } = string.Empty;
        public int Q3Id { get; set; }
        public string A3 { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Nim { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class FailureUserDto
    {
        public string Nim { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class SecurityQuestionDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequest
    {
        public string Nim { get; set; } = string.Empty;
    }

    public class VerifyAndResetRequest
    {
        public string Nim { get; set; } = string.Empty;
        public int A1Id { get; set; }
        public string A1 { get; set; } = string.Empty;
        public int A2Id { get; set; }
        public string A2 { get; set; } = string.Empty;
        public int A3Id { get; set; }
        public string A3 { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}