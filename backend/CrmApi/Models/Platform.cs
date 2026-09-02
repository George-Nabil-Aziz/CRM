namespace CrmApi.Models;

public class Department
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class Branch
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}

public class BrandingConfig
{
    public int Id { get; set; } = 1;
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#6D28D9";
    public string SecondaryColor { get; set; } = "#1F2937";
}
