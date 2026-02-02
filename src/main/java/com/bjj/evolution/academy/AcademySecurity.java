package com.bjj.evolution.academy;

import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("academySecurity")
public class AcademySecurity {

    private final AcademyMemberRepository memberRepository;

    public AcademySecurity(AcademyMemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public boolean hasAccess(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        return memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE)
                .orElse(false);
    }

    public boolean isAdmin(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        return memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE && (isAdmin(authentication,academyId) || isOwner(authentication,academyId)))
                .orElse(false);
    }

    public boolean isInstructorOrAdmin(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        return memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE &&
                        (member.getRole() == MemberRole.INSTRUCTOR || member.getRole() == MemberRole.MANAGER))
                .orElse(false);
    }

    public boolean isOwner(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        return memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE && member.getRole() == MemberRole.OWNER)
                .orElse(false);
    }

    private UUID extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return UUID.fromString(jwt.getSubject());
    }
}
