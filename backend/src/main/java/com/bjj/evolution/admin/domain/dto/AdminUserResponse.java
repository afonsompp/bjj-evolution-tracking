package com.bjj.evolution.admin.domain.dto;

import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;

import java.util.UUID;

/**
 * User row shown in the admin user-management screen. Unlike the public
 * SearchProfileResponse, this exposes email and role so an admin can identify
 * a user and see/change their current role.
 */
public record AdminUserResponse(
        UUID id,
        String name,
        String secondName,
        String nickname,
        String email,
        Belt belt,
        Integer beltStripe,
        String photoUrl,
        UserRole role
) {
    public static AdminUserResponse fromEntity(UserProfile entity) {
        return new AdminUserResponse(
                entity.getId(),
                entity.getName(),
                entity.getSecondName(),
                entity.getNickname(),
                entity.getEmail(),
                entity.getBelt(),
                entity.getBeltStripe(),
                entity.getPhotoUrl(),
                entity.getRole()
        );
    }
}
