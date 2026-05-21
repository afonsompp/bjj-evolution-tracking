package com.bjj.evolution.user.domain.dto;

import com.bjj.evolution.user.domain.UserRole;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(
        @NotNull(message = "Role is required")
        UserRole role
) {}
