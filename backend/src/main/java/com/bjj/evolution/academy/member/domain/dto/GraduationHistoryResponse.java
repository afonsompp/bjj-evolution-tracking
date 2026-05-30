package com.bjj.evolution.academy.member.domain.dto;

import com.bjj.evolution.academy.member.domain.GraduationHistory;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.time.Instant;
import java.util.UUID;

public record GraduationHistoryResponse(
        Long id,
        UUID academyId,
        String academyName,
        ProfileResponse student,
        ProfileResponse promotedBy,
        Belt oldBelt,
        Integer oldStripe,
        Belt newBelt,
        Integer newStripe,
        Instant graduationDate
) {
    public static GraduationHistoryResponse fromEntity(GraduationHistory entity) {
        return new GraduationHistoryResponse(
                entity.getId(),
                entity.getAcademy().getId(),
                entity.getAcademy().getName(),
                ProfileResponse.fromEntity(entity.getStudent()),
                ProfileResponse.fromEntity(entity.getPromotedBy()),
                entity.getOldBelt(),
                entity.getOldStripe(),
                entity.getNewBelt(),
                entity.getNewStripe(),
                entity.getGraduationDate()
        );
    }
}
