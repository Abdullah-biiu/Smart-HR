namespace SmartHR.Models
{
    public class UserSession
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        public DateTime StartedAtUtc { get; set; }

        public DateTime ExpiresAtUtc { get; set; }

        public DateTime? EndedAtUtc { get; set; }

        public bool IsActive { get; set; } = true;
    }
}