package com.bjj.evolution.academy.member.domain.dto;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AcademyMemberRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        @NotNull(message = "Role is required")
        MemberRole role,

        MemberStatus status
) {
    public AcademyMember toEntityWithStatus(Academy academy, UserProfile user) {
        return new AcademyMember(academy, user, role, status);
    }
    public AcademyMember toEntity(Academy academy, UserProfile user) {
        return new AcademyMember(academy, user, role);
    }
}
