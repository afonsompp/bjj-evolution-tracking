package com.bjj.evolution.user;

import com.bjj.evolution.user.domain.Belt;
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
        when(jwt.getSubject()).thenReturn(userId.toString());
        profileRequest = new ProfileRequest("Test", "User", "testuser", Belt.WHITE, 0, "GI");
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
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(true);

        var exception = assertThrows(IllegalArgumentException.class, () -> service.saveOrUpdate(jwt, profileRequest));
        assertThat(exception.getMessage()).isEqualTo("Nickname is already taken.");
    }

    @Test
    void saveOrUpdate_shouldThrowException_whenNicknameIsTakenOnUpdate() {
        UserProfile existingProfile = new UserProfile();
        existingProfile.setId(userId);
        existingProfile.setNickname("oldnickname");

        when(repository.findById(userId)).thenReturn(Optional.of(existingProfile));
        when(repository.existsByNickname(profileRequest.nickname())).thenReturn(true);

        var exception = assertThrows(IllegalArgumentException.class, () -> service.saveOrUpdate(jwt, profileRequest));
        assertThat(exception.getMessage()).isEqualTo("Nickname is already taken.");
    }

    @Test
    void updateRole_shouldSucceed_whenUserIsAdmin() {
        UUID targetUserId = UUID.randomUUID();
        UserProfile adminUser = createUserProfile(userId, "admin", UserRole.ADMIN);
        UserProfile targetUser = createUserProfile(targetUserId, "target", UserRole.USER);

        when(repository.findById(userId)).thenReturn(Optional.of(adminUser));
        when(repository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateRole(jwt, targetUserId, UserRole.MANAGER);

        ArgumentCaptor<UserProfile> userProfileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(repository).save(userProfileCaptor.capture());

        assertThat(userProfileCaptor.getValue().getRole()).isEqualTo(UserRole.MANAGER);
    }

    @Test
    void updateRole_shouldThrowException_whenManagerPromotesToAdmin() {
        UUID targetUserId = UUID.randomUUID();
        UserProfile managerUser = createUserProfile(userId, "manager", UserRole.MANAGER);

        when(repository.findById(userId)).thenReturn(Optional.of(managerUser));

        var exception = assertThrows(SecurityException.class, () -> service.updateRole(jwt, targetUserId, UserRole.ADMIN));
        assertThat(exception.getMessage()).isEqualTo("Only admins can set new admins");
    }

    @Test
    void updateRole_shouldThrowException_whenUserIsNotAdminOrManager() {
        UUID targetUserId = UUID.randomUUID();
        UserProfile normalUser = createUserProfile(userId, "user", UserRole.USER);

        when(repository.findById(userId)).thenReturn(Optional.of(normalUser));

        var exception = assertThrows(SecurityException.class, () -> service.updateRole(jwt, targetUserId, UserRole.MANAGER));
        assertThat(exception.getMessage()).isEqualTo("Only admins or managers can update user roles");
    }

    @Test
    void getMyProfile_shouldReturnProfile_whenExists() {
        UserProfile userProfile = createUserProfile(userId, "test", UserRole.USER);
        when(repository.findById(userId)).thenReturn(Optional.of(userProfile));

        Optional<ProfileResponse> response = service.getMyProfile(jwt);

        assertThat(response).isPresent();
        assertThat(response.get().id()).isEqualTo(userId);
    }

    @Test
    void getMyProfile_shouldReturnEmpty_whenNotExists() {
        when(repository.findById(userId)).thenReturn(Optional.empty());

        Optional<ProfileResponse> response = service.getMyProfile(jwt);

        assertThat(response).isNotPresent();
    }

    @Test
    void searchProfile_shouldReturnPagedResults() {
        String query = "test";
        Pageable pageable = PageRequest.of(0, 10);
        UserProfile user = createUserProfile(UUID.randomUUID(), "testuser", UserRole.USER);
        Page<UserProfile> userPage = new PageImpl<>(Collections.singletonList(user), pageable, 1);

        when(repository.searchByTerm(query, pageable)).thenReturn(userPage);

        Page<SearchProfileResponse> result = service.searchProfile(query, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).nickname()).isEqualTo("testuser");
    }

    @Test
    void deleteMyProfile_shouldCallRepositoryDelete() {
        doNothing().when(repository).deleteById(userId);

        service.deleteMyProfile(jwt);

        verify(repository, times(1)).deleteById(userId);
    }

    private UserProfile createUserProfile(UUID id, String nickname, UserRole role) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setNickname(nickname);
        profile.setRole(role);
        return profile;
    }
}
