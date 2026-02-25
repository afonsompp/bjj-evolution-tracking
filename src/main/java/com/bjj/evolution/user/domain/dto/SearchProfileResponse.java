package com.bjj.evolution.user.domain.dto;

import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;

import java.time.LocalDate;
import java.util.UUID;

public record SearchProfileResponse(
        UUID id,
        String name,
        String secondName,
        String nickname,
        Belt belt,
        Integer stripe,
        LocalDate startsIn
) {
    public static SearchProfileResponse fromEntity(UserProfile entity) {
        return new SearchProfileResponse(
                entity.getId(),
                entity.getName(),
                entity.getSecondName(),
                entity.getNickname(),
                entity.getBelt(),
                entity.getStripe(),
                entity.getStartsIn()
        );
    }
}
