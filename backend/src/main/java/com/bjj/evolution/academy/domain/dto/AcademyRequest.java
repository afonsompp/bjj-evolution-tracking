package com.bjj.evolution.academy.domain.dto;

import jakarta.validation.constraints.NotBlank;

public record AcademyRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Address is required")
        String address
){}
