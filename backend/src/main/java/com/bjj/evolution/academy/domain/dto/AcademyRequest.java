package com.bjj.evolution.academy.domain.dto;

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
){}
