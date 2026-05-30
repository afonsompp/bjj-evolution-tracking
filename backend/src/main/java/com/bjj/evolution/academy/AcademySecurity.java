package com.bjj.evolution.academy;

import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("academySecurity")
public class AcademySecurity {

    private final AcademyMemberRepository memberRepository;
    private final UserProfileRepository userProfileRepository;

    private static final Logger log = LoggerFactory.getLogger(AcademySecurity.class);

    public AcademySecurity(AcademyMemberRepository memberRepository,
                           UserProfileRepository userProfileRepository) {
        this.memberRepository = memberRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public boolean hasAccess(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        log.debug("hasAccess check: user={} academy={}", userId, academyId);
        boolean result = memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE)
                .orElse(false);
        if (!result) {
            log.warn("hasAccess denied: user={} academy={}", userId, academyId);
        }
        return result;
    }

    public boolean isSameUser(Authentication authentication, UUID userId) {
        UUID authenticatedUserId = extractUserId(authentication);
        boolean result = authenticatedUserId.equals(userId);
        if (!result) {
            log.warn("isSameUser denied: authenticated={} target={}", authenticatedUserId, userId);
        }
        return result;
    }

    public boolean isAdmin(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        log.debug("isAdmin check: user={} academy={}", userId, academyId);
        boolean result = memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE &&
                        (member.getRole() == MemberRole.MANAGER || member.getRole() == MemberRole.OWNER))
                .orElse(false);
        if (!result) {
            log.warn("isAdmin denied: user={} academy={}", userId, academyId);
        }
        return result;
    }

    public boolean isInstructorOrAdmin(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        log.debug("isInstructorOrAdmin check: user={} academy={}", userId, academyId);
        boolean result = memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE &&
                        (member.getRole() == MemberRole.INSTRUCTOR ||
                                member.getRole() == MemberRole.MANAGER ||
                                member.getRole() == MemberRole.OWNER))
                .orElse(false);
        if (!result) {
            log.warn("isInstructorOrAdmin denied: user={} academy={}", userId, academyId);
        }
        return result;
    }

    public boolean isOwner(Authentication authentication, UUID academyId) {
        UUID userId = extractUserId(authentication);
        log.debug("isOwner check: user={} academy={}", userId, academyId);
        boolean result = memberRepository.findById(new AcademyMemberId(academyId, userId))
                .map(member -> member.getStatus() == MemberStatus.ACTIVE && member.getRole() == MemberRole.OWNER)
                .orElse(false);
        if (!result) {
            log.warn("isOwner denied: user={} academy={}", userId, academyId);
        }
        return result;
    }

    public boolean isPlatformManager(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return userProfileRepository.findById(userId)
                .map(p -> p.getRole() == UserRole.PLATFORM_MANAGER || p.getRole() == UserRole.ADMIN)
                .orElse(false);
    }

    public boolean isStudent(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        log.debug("isStudent check: user={}", userId);
        boolean result = memberRepository.existsByUserIdAndRole(userId, MemberRole.STUDENT);
        if (!result) {
            log.warn("isStudent denied: user={}", userId);
        }
        return result;
    }

    private UUID extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID userId = UUID.fromString(jwt.getSubject());
        log.trace("Extracted userId={} from JWT", userId);
        return userId;
    }
}
