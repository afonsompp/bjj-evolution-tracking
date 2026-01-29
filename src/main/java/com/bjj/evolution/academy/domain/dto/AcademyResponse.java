package com.bjj.evolution.academy.domain.dto;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.util.UUID;

public record AcademyResponse(
        UUID id,
        String name,
        String address,
        ProfileResponse owner
) {
    public static AcademyResponse fromEntity(Academy academy) {
        return new AcademyResponse(
                academy.getId(),
                academy.getName(),
                academy.getAddress(),
                academy.getOwner() != null ? ProfileResponse.fromEntity(academy.getOwner()) : null
        );
    }
}
