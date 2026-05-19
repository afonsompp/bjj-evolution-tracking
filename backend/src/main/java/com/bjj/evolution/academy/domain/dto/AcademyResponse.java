package com.bjj.evolution.academy.domain.dto;

import com.bjj.evolution.academy.domain.Academy;

import java.util.UUID;

public record AcademyResponse(
        UUID id,
        String name,
        String address
) {
    public static AcademyResponse fromEntity(Academy academy) {
        return new AcademyResponse(
                academy.getId(),
                academy.getName(),
                academy.getAddress()
        );
    }
}