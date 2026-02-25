package com.bjj.evolution.academy.domain.dto;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.domain.AcademyMember;

import java.util.UUID;

public record AcademyResponse(
        UUID id,
        String name,
        String address,
        AcademyMember owner
) {
    public static AcademyResponse fromEntity(Academy academy, AcademyMember owner) {
        return new AcademyResponse(
                academy.getId(),
                academy.getName(),
                academy.getAddress(),
                owner
        );
    }

    public static AcademyResponse fromEntity(Academy academy) {
        return fromEntity(academy, null);
    }
}
