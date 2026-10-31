using System.Text.Json.Serialization;

namespace SmartHR.Models
{
    public class Designation
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        [JsonIgnore]
        public ICollection<Employee> Employees { get; set; }
            = new List<Employee>();
    }
}