using System.ComponentModel.DataAnnotations;

namespace CrmApi.Dtos;

public record CreateRoleRequest(
    [Required, MinLength(1)] string Name,
    List<string>? Permissions
);

public record RoleResponse(Guid Id, string Name, List<string> Permissions);

public record CreateUserRequest(
    [Required, MinLength(1)] string Name,
    [Required, EmailAddress] string Email,
    [Required] Guid RoleId
);

public record UserResponse(Guid Id, string Name, string Email, Guid RoleId, string RoleName, DateTime CreatedAt);

public record UpdatePermissionsRequest(
    [Required] List<string> Permissions
);

public record AuditLogResponse(Guid Id, Guid? ActorId, string Action, string TargetType, Guid TargetId, DateTime Timestamp);

public record UpsertSettingRequest(
    [Required, MinLength(1)] string Key,
    [Required] string Value
);

public record SettingResponse(string Key, string Value);
