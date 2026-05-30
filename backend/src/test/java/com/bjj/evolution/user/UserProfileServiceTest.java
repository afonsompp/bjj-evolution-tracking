package com.bjj.evolution.user;

import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.shared.exception.ConflictException;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import com.bjj.evolution.user.domain.dto.ProfileRequest;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
import com.bjj.evolution.user.domain.dto.SearchProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserProfileRepository repository;

    @InjectMocks
    private UserProfileService service;

    private Jwt jwt;
    private UUID userId;
    private ProfileRequest profileRequest;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        lenient().when(jwt.getSubject()).thenReturn(userId.toString());
        profileRequest = new ProfileRequest("Test", "User", "testuser", Belt.WHITE, 0, LocalDate.now());
    }

    @Test
    void saveOrUpdate_shouldCreateNewProfile_whenUserDoesNotExist() {
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(false);
        when(repository.findById(userId)).thenReturn(Optional.empty());
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileResponse response = service.saveOrUpdate(jwt, profileRequest);

        ArgumentCaptor<UserProfile> userProfileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(userProfileCaptor.capture());

        UserProfile savedProfile = userProfileCaptor.getValue();
        assertThat(savedProfile.getId()).isEqualTo(userId);
        assertThat(savedProfile.getNickname()).isEqualTo(profileRequest.nickname());
        assertThat(response.nickname()).isEqualTo(profileRequest.nickname());
    }

    @Test
    void saveOrUpdate_shouldUpdateExistingProfile_whenUserExists() {
        UserProfile existingProfile = new UserProfile();
        existingProfile.setId(userId);
        existingProfile.setNickname("oldnickname");

        when(repository.findById(userId)).thenReturn(Optional.of(existingProfile));
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(false);
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileResponse response = service.saveOrUpdate(jwt, profileRequest);

        ArgumentCaptor<UserProfile> userProfileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(userProfileCaptor.capture());

        UserProfile savedProfile = userProfileCaptor.getValue();
        assertThat(savedProfile.getId()).isEqualTo(userId);
        assertThat(savedProfile.getNickname()).isEqualTo(profileRequest.nickname());
        assertThat(response.nickname()).isEqualTo(profileRequest.nickname());
    }

    @Test
    void saveOrUpdate_shouldThrowException_whenNicknameIsTakenOnCreate() {
        when(repository.findById(userId)).thenReturn(Optional.empty());
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(true);

        var exception = assertThrows(ConflictException.class, () -> service.saveOrUpdate(jwt, profileRequest));
        assertThat(exception.getMessage()).isEqualTo("Nickname is already taken.");
    }

    @Test
    void saveOrUpdate_shouldThrowException_whenNicknameIsTakenOnUpdate() {
        UserProfile existingProfile = new UserProfile();
        existingProfile.setId(userId);
        existingProfile.setNickname("oldnickname");

        when(repository.findById(userId)).thenReturn(Optional.of(existingProfile));
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(true);

        var exception = assertThrows(ConflictException.class, () -> service.saveOrUpdate(jwt, profileRequest));
        assertThat(exception.getMessage()).isEqualTo("Nickname is already taken.");
    }

    @Test
    void saveOrUpdate_shouldUpdateProfile_whenNicknameIsUnchanged() {
        // The request updates the belt, but the nickname is the same as the existing profile.
        ProfileRequest updateRequest = new ProfileRequest("Test", "User", "testuser", Belt.BLUE, 1, LocalDate.now());

        UserProfile existingProfile = new UserProfile();
        existingProfile.setId(userId);
        existingProfile.setNickname("testuser");
        existingProfile.setBelt(Belt.WHITE);

        when(repository.findById(userId)).thenReturn(Optional.of(existingProfile));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.saveOrUpdate(jwt, updateRequest);

        // Verify that the nickname uniqueness check was correctly skipped
        verify(repository, never()).existsByNickname(anyString());

        ArgumentCaptor<UserProfile> userProfileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(userProfileCaptor.capture());
        UserProfile savedProfile = userProfileCaptor.getValue();

        assertThat(savedProfile.getBelt()).isEqualTo(Belt.BLUE);
        assertThat(savedProfile.getNickname()).isEqualTo("testuser");
    }

    @Test
    void updateRole_shouldSucceed_whenUserIsAdmin() {
        UUID targetUserId = UUID.randomUUID();
        UserProfile adminUser = createUserProfile(userId, "admin", UserRole.ADMIN);
        UserProfile targetUser = createUserProfile(targetUserId, "target", UserRole.PLATFORM_MANAGER);

        when(repository.findById(userId)).thenReturn(Optional.of(adminUser));
        when(repository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateRole(jwt, targetUserId, UserRole.PLATFORM_MANAGER);

        ArgumentCaptor<UserProfile> userProfileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(userProfileCaptor.capture());

        assertThat(userProfileCaptor.getValue().getRole()).isEqualTo(UserRole.PLATFORM_MANAGER);
    }

    @Test
    void updateRole_shouldThrowException_whenManagerPromotesToAdmin() {
        UUID targetUserId = UUID.randomUUID();
        UserProfile managerUser = createUserProfile(userId, "manager", UserRole.PLATFORM_MANAGER);

        when(repository.findById(userId)).thenReturn(Optional.of(managerUser));

        var exception = assertThrows(ForbiddenException.class, () -> service.updateRole(jwt, targetUserId, UserRole.ADMIN));
        assertThat(exception.getMessage()).isEqualTo("Only admins can assign the ADMIN role.");
    }

    @Test
    void updateRole_shouldThrowException_whenUserIsNotAdminOrManager() {
        UserProfile normalUser = createUserProfile(userId, "user", UserRole.CUSTOMER);

        when(repository.findById(userId)).thenReturn(Optional.of(normalUser));

        var exception = assertThrows(ForbiddenException.class, () -> service.updateRole(jwt, userId, UserRole.PLATFORM_MANAGER));
        assertThat(exception.getMessage()).isEqualTo("Only admins or platform managers can update user roles.");
    }

    @Test
    void updateRole_shouldThrowException_whenAdminDemotesThemselves() {
        UserProfile adminUser = createUserProfile(userId, "admin", UserRole.ADMIN);
        when(repository.findById(userId)).thenReturn(Optional.of(adminUser));

        var exception = assertThrows(ForbiddenException.class,
                () -> service.updateRole(jwt, userId, UserRole.CUSTOMER));
        assertThat(exception.getMessage()).isEqualTo("Admins cannot remove their own admin role.");
        verify(repository, never()).save(any());
    }

    @Test
    void updateRole_shouldSucceed_whenAdminKeepsOwnAdminRole() {
        UserProfile adminUser = createUserProfile(userId, "admin", UserRole.ADMIN);
        when(repository.findById(userId)).thenReturn(Optional.of(adminUser));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Re-applying ADMIN to self is a no-op, not a demotion, so it must be allowed.
        service.updateRole(jwt, userId, UserRole.ADMIN);

        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(UserRole.ADMIN);
    }

    @Test
    void getMyProfile_shouldReturnProfile_whenExists() {
        UserProfile userProfile = createUserProfile(userId, "test", UserRole.PLATFORM_MANAGER);
        when(repository.findActiveById(userId)).thenReturn(Optional.of(userProfile));

        Optional<ProfileResponse> response = service.getMyProfile(jwt);

        assertThat(response).isPresent();
        assertThat(response.get().id()).isEqualTo(userId);
    }

    @Test
    void getMyProfile_shouldReturnEmpty_whenNotExists() {
        when(repository.findActiveById(userId)).thenReturn(Optional.empty());

        Optional<ProfileResponse> response = service.getMyProfile(jwt);

        assertThat(response).isNotPresent();
    }

    @Test
    void getMyProfile_shouldReturnEmpty_whenProfileIsAnonymized() {
        when(repository.findActiveById(userId)).thenReturn(Optional.empty());

        Optional<ProfileResponse> response = service.getMyProfile(jwt);

        assertThat(response).isNotPresent();
    }

    @Test
    void searchProfile_shouldReturnPagedResults() {
        String query = "test";
        Pageable pageable = PageRequest.of(0, 10);
        UserProfile user = createUserProfile(UUID.randomUUID(), "testuser", UserRole.PLATFORM_MANAGER);
        Page<UserProfile> userPage = new PageImpl<>(Collections.singletonList(user), pageable, 1);

        when(repository.searchByTerm(query, pageable)).thenReturn(userPage);

        Page<SearchProfileResponse> result = service.searchProfile(query, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).nickname()).isEqualTo("testuser");
    }

    @Test
    void deleteMyProfile_shouldAnonymizeProfile() {
        UserProfile profile = createUserProfile(userId, "testuser", UserRole.CUSTOMER);
        profile.setName("John");
        when(repository.findById(userId)).thenReturn(Optional.of(profile));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.deleteMyProfile(jwt);

        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(captor.capture());
        verify(repository, never()).deleteById(any());

        UserProfile saved = captor.getValue();
        assertThat(saved.isAnonymized()).isTrue();
        assertThat(saved.getAnonymizedAt()).isNotNull();
        assertThat(saved.getName()).isEqualTo("[deleted]");
        assertThat(saved.getSecondName()).isNull();
        assertThat(saved.getNickname()).startsWith("deleted_");
        assertThat(saved.getBelt()).isNull();
        assertThat(saved.getStartsIn()).isNull();
    }

    @Test
    void deleteMyProfile_shouldThrow_whenProfileNotFound() {
        when(repository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteMyProfile(jwt));
        verify(repository, never()).save(any());
    }

    @Test
    void saveOrUpdate_shouldResurrectProfile_whenPreviouslyAnonymized() {
        UserProfile anonymized = createUserProfile(userId, "deleted_abc123", UserRole.CUSTOMER);
        anonymized.anonymize();

        when(repository.findById(userId)).thenReturn(Optional.of(anonymized));
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(false);
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileResponse response = service.saveOrUpdate(jwt, profileRequest);

        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(captor.capture());

        UserProfile saved = captor.getValue();
        assertThat(saved.isAnonymized()).isFalse();
        assertThat(saved.getAnonymizedAt()).isNull();
        assertThat(saved.getNickname()).isEqualTo(profileRequest.nickname());
        assertThat(response.nickname()).isEqualTo(profileRequest.nickname());
    }

    private UserProfile createUserProfile(UUID id, String nickname, UserRole role) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setNickname(nickname);
        profile.setRole(role);
        return profile;
    }
}
