package com.bjj.evolution.user.domain.dto;

import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;

import java.time.LocalDate;
import java.util.UUID;

public record ProfileResponse(
        UUID id,
        String name,
        String secondName,
        Belt belt,
        Integer stripe,
        LocalDate startsIn
) {
    public static ProfileResponse fromEntity(UserProfile entity) {
        return new ProfileResponse(
                entity.getId(),
                entity.getName(),
                entity.getSecondName(),
                entity.getBelt(),
                entity.getStripe(),
                entity.getStartsIn()
        );
    }
}
