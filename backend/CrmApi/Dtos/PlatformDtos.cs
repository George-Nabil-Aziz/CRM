using System.ComponentModel.DataAnnotations;

namespace CrmApi.Dtos;

public record CreateDepartmentRequest([Required, MinLength(1)] string Name);
public record DepartmentResponse(Guid Id, string Name);

public record CreateBranchRequest([Required, MinLength(1)] string Name, [Required, MinLength(1)] string Location);
public record BranchResponse(Guid Id, string Name, string Location);

public record UpdateBrandingRequest(string? LogoUrl, string? PrimaryColor, string? SecondaryColor);
public record BrandingResponse(string? LogoUrl, string PrimaryColor, string SecondaryColor);
