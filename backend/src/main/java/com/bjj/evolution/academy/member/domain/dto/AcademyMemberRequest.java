package com.bjj.evolution.academy.member.domain.dto;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AcademyMemberRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        @NotNull(message = "Role is required")
        MemberRole role,

        MemberStatus status,

        Belt belt,
        Integer stripe
) {
    public AcademyMember toEntity(Academy academy, UserProfile user) {
        Belt initialBelt = (belt != null) ? belt : (user.getBelt() != null ? user.getBelt() : Belt.WHITE);
        Integer initialStripe = (stripe != null) ? stripe : 0;

        AcademyMember member = new AcademyMember(academy, user, role);
        member.setBelt(initialBelt);
        member.setStripe(initialStripe);

        if (status != null) {
            member.setStatus(status);
        }

        return member;
    }
}
