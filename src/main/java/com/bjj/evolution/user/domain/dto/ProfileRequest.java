package com.bjj.evolution.user.domain.dto;

import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record ProfileRequest(
        @NotBlank
        String name,
        String secondName,
        @NotBlank
        String nickname,
        Belt belt,
        Integer stripe,
        LocalDate startsIn
) {

    public UserProfile toEntity(UUID id){
        return new UserProfile(id, name, secondName, nickname, belt, stripe, startsIn, UserRole.CUSTOMER);
    }
}
