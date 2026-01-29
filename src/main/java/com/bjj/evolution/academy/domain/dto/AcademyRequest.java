package com.bjj.evolution.academy.domain.dto;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AcademyRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Address is required")
        String address,

        @NotNull(message = "Owner ID is required")
        UUID ownerId
) {
    public Academy toEntity(UserProfile owner) {
        return new Academy(name, address, owner);
    }
}
