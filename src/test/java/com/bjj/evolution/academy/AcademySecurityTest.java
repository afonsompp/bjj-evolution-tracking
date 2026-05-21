package com.bjj.evolution.academy;

import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademySecurityTest {

    @Mock
    private AcademyMemberRepository memberRepository;

    @InjectMocks
    private AcademySecurity academySecurity;

    private UUID testAcademyId;
    private UUID testUserId;
    private Authentication mockAuthentication;

    @BeforeEach
    void setUp() {
        testAcademyId = UUID.randomUUID();
        testUserId = UUID.randomUUID();
        mockAuthentication = mockAuthentication(testUserId);
    }

    // --- Helper methods to create mocks and objects ---

    private Authentication mockAuthentication(UUID userId) {
        Authentication authentication = mock(Authentication.class);
        Jwt jwt = Jwt.withTokenValue("mock-jwt")
                .header("alg", "RS256")
                .claim("sub", userId.toString())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(authentication.getPrincipal()).thenReturn(jwt);
        return authentication;
    }

    private AcademyMember createAcademyMember(UUID academyId, UUID userId, MemberRole role, MemberStatus status) {
        // AcademyMember does not have a public constructor.
        // We'll mock the necessary parts or ensure the builder pattern can be used if available.
        // Based on the summary of AcademyMember, it has a constructor:
        // AcademyMember(Academy academy, UserProfile user, Belt belt, Integer stripe, MemberRole role, MemberStatus status)
        // For testing security, we only need a mock that returns the correct role and status.
        AcademyMember mockMember = mock(AcademyMember.class);
        lenient().when(mockMember.getRole()).thenReturn(role);
        lenient().when(mockMember.getStatus()).thenReturn(status);
        return mockMember;
    }

    // --- Test cases for hasAccess ---

    @Test
    @DisplayName("hasAccess should return true for an active member")
    void hasAccess_whenMemberIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.STUDENT, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean hasAccess = academySecurity.hasAccess(mockAuthentication, testAcademyId);

        assertTrue(hasAccess);
        verify(memberRepository).findById(new AcademyMemberId(testAcademyId, testUserId));
    }

    @Test
    @DisplayName("hasAccess should return false for an inactive member")
    void hasAccess_whenMemberIsInactive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.STUDENT, MemberStatus.INACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean hasAccess = academySecurity.hasAccess(mockAuthentication, testAcademyId);

        assertFalse(hasAccess);
        verify(memberRepository).findById(new AcademyMemberId(testAcademyId, testUserId));
    }

    @Test
    @DisplayName("hasAccess should return false when member not found")
    void hasAccess_whenMemberNotFound_shouldReturnFalse() {
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.empty());

        boolean hasAccess = academySecurity.hasAccess(mockAuthentication, testAcademyId);

        assertFalse(hasAccess);
        verify(memberRepository).findById(new AcademyMemberId(testAcademyId, testUserId));
    }

    // --- Test cases for isSameUser ---

    @Test
    @DisplayName("isSameUser should return true if authenticated user ID matches provided user ID")
    void isSameUser_whenUserIdsMatch_shouldReturnTrue() {
        boolean isSame = academySecurity.isSameUser(mockAuthentication, testUserId);
        assertTrue(isSame);
    }

    @Test
    @DisplayName("isSameUser should return false if authenticated user ID does not match provided user ID")
    void isSameUser_whenUserIdsDoNotMatch_shouldReturnFalse() {
        UUID otherUserId = UUID.randomUUID();
        boolean isSame = academySecurity.isSameUser(mockAuthentication, otherUserId);
        assertFalse(isSame);
    }

    // --- Test cases for isAdmin ---

    @Test
    @DisplayName("isAdmin should return true for an active OWNER")
    void isAdmin_whenOwnerIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.OWNER, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isAdmin = academySecurity.isAdmin(mockAuthentication, testAcademyId);
        assertTrue(isAdmin);
    }

    @Test
    @DisplayName("isAdmin should return true for an active MANAGER")
    void isAdmin_whenManagerIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.MANAGER, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isAdmin = academySecurity.isAdmin(mockAuthentication, testAcademyId);
        assertTrue(isAdmin);
    }

    @Test
    @DisplayName("isAdmin should return false for an active INSTRUCTOR")
    void isAdmin_whenInstructorIsActive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.INSTRUCTOR, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isAdmin = academySecurity.isAdmin(mockAuthentication, testAcademyId);
        assertFalse(isAdmin);
    }

    @Test
    @DisplayName("isAdmin should return false for an active STUDENT")
    void isAdmin_whenStudentIsActive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.STUDENT, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isAdmin = academySecurity.isAdmin(mockAuthentication, testAcademyId);
        assertFalse(isAdmin);
    }

    @Test
    @DisplayName("isAdmin should return false for an inactive OWNER or MANAGER")
    void isAdmin_whenAdminIsInactive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.MANAGER, MemberStatus.INACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isAdmin = academySecurity.isAdmin(mockAuthentication, testAcademyId);
        assertFalse(isAdmin);
    }

    @Test
    @DisplayName("isAdmin should return false when member not found")
    void isAdmin_whenMemberNotFound_shouldReturnFalse() {
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.empty());

        boolean isAdmin = academySecurity.isAdmin(mockAuthentication, testAcademyId);
        assertFalse(isAdmin);
    }

    // --- Test cases for isInstructorOrAdmin ---

    @Test
    @DisplayName("isInstructorOrAdmin should return true for an active OWNER")
    void isInstructorOrAdmin_whenOwnerIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.OWNER, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isInstructorOrAdmin = academySecurity.isInstructorOrAdmin(mockAuthentication, testAcademyId);
        assertTrue(isInstructorOrAdmin);
    }

    @Test
    @DisplayName("isInstructorOrAdmin should return true for an active MANAGER")
    void isInstructorOrAdmin_whenManagerIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.MANAGER, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isInstructorOrAdmin = academySecurity.isInstructorOrAdmin(mockAuthentication, testAcademyId);
        assertTrue(isInstructorOrAdmin);
    }

    @Test
    @DisplayName("isInstructorOrAdmin should return true for an active INSTRUCTOR")
    void isInstructorOrAdmin_whenInstructorIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.INSTRUCTOR, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isInstructorOrAdmin = academySecurity.isInstructorOrAdmin(mockAuthentication, testAcademyId);
        assertTrue(isInstructorOrAdmin);
    }

    @Test
    @DisplayName("isInstructorOrAdmin should return false for an active STUDENT")
    void isInstructorOrAdmin_whenStudentIsActive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.STUDENT, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isInstructorOrAdmin = academySecurity.isInstructorOrAdmin(mockAuthentication, testAcademyId);
        assertFalse(isInstructorOrAdmin);
    }

    @Test
    @DisplayName("isInstructorOrAdmin should return false for an inactive INSTRUCTOR, MANAGER, or OWNER")
    void isInstructorOrAdmin_whenPrivilegedRoleIsInactive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.INSTRUCTOR, MemberStatus.INACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isInstructorOrAdmin = academySecurity.isInstructorOrAdmin(mockAuthentication, testAcademyId);
        assertFalse(isInstructorOrAdmin);
    }

    @Test
    @DisplayName("isInstructorOrAdmin should return false when member not found")
    void isInstructorOrAdmin_whenMemberNotFound_shouldReturnFalse() {
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.empty());

        boolean isInstructorOrAdmin = academySecurity.isInstructorOrAdmin(mockAuthentication, testAcademyId);
        assertFalse(isInstructorOrAdmin);
    }

    // --- Test cases for isOwner ---

    @Test
    @DisplayName("isOwner should return true for an active OWNER")
    void isOwner_whenOwnerIsActive_shouldReturnTrue() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.OWNER, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isOwner = academySecurity.isOwner(mockAuthentication, testAcademyId);
        assertTrue(isOwner);
    }

    @Test
    @DisplayName("isOwner should return false for an active MANAGER")
    void isOwner_whenManagerIsActive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.MANAGER, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isOwner = academySecurity.isOwner(mockAuthentication, testAcademyId);
        assertFalse(isOwner);
    }

    @Test
    @DisplayName("isOwner should return false for an active INSTRUCTOR")
    void isOwner_whenInstructorIsActive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.INSTRUCTOR, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isOwner = academySecurity.isOwner(mockAuthentication, testAcademyId);
        assertFalse(isOwner);
    }

    @Test
    @DisplayName("isOwner should return false for an active STUDENT")
    void isOwner_whenStudentIsActive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.STUDENT, MemberStatus.ACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isOwner = academySecurity.isOwner(mockAuthentication, testAcademyId);
        assertFalse(isOwner);
    }

    @Test
    @DisplayName("isOwner should return false for an inactive OWNER")
    void isOwner_whenOwnerIsInactive_shouldReturnFalse() {
        AcademyMember mockMember = createAcademyMember(testAcademyId, testUserId, MemberRole.OWNER, MemberStatus.INACTIVE);
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.of(mockMember));

        boolean isOwner = academySecurity.isOwner(mockAuthentication, testAcademyId);
        assertFalse(isOwner);
    }

    @Test
    @DisplayName("isOwner should return false when member not found")
    void isOwner_whenMemberNotFound_shouldReturnFalse() {
        when(memberRepository.findById(new AcademyMemberId(testAcademyId, testUserId))).thenReturn(Optional.empty());

        boolean isOwner = academySecurity.isOwner(mockAuthentication, testAcademyId);
        assertFalse(isOwner);
    }

    // --- Test cases for isStudent ---

    @Test
    @DisplayName("isStudent should return true if user is a student in any academy")
    void isStudent_whenUserExistsAsStudent_shouldReturnTrue() {
        when(memberRepository.existsByUserIdAndRole(testUserId, MemberRole.STUDENT)).thenReturn(true);

        boolean isStudent = academySecurity.isStudent(mockAuthentication);
        assertTrue(isStudent);
        verify(memberRepository).existsByUserIdAndRole(testUserId, MemberRole.STUDENT);
    }

    @Test
    @DisplayName("isStudent should return false if user is not a student in any academy")
    void isStudent_whenUserDoesNotExistAsStudent_shouldReturnFalse() {
        when(memberRepository.existsByUserIdAndRole(testUserId, MemberRole.STUDENT)).thenReturn(false);

        boolean isStudent = academySecurity.isStudent(mockAuthentication);
        assertFalse(isStudent);
        verify(memberRepository).existsByUserIdAndRole(testUserId, MemberRole.STUDENT);
    }

    @Test
    @DisplayName("isStudent should return false if memberRepository indicates no student role")
    void isStudent_whenNoStudentRole_shouldReturnFalse() {
        when(memberRepository.existsByUserIdAndRole(testUserId, MemberRole.STUDENT)).thenReturn(false);
        boolean result = academySecurity.isStudent(mockAuthentication);
        assertFalse(result);
    }
}
