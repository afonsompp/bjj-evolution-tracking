package com.bjj.evolution.academy.member.domain.dto;

import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.util.UUID;

public record AcademyMemberResponse(
        UUID academyId,
        ProfileResponse user,
        MemberRole role,
        MemberStatus status,
        Belt belt,
        Integer stripe
) {
    public static AcademyMemberResponse fromEntity(AcademyMember entity) {
        return new AcademyMemberResponse(
                entity.getId().getAcademyId(),
                ProfileResponse.fromEntity(entity.getUser()),
                entity.getRole(),
                entity.getStatus(),
                entity.getBelt(),
                entity.getStripe()
        );
    }
}
