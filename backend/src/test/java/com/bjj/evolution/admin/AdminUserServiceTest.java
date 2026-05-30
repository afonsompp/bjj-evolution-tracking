package com.bjj.evolution.admin;

import com.bjj.evolution.admin.domain.dto.AdminUserResponse;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserProfileRepository repository;

    @InjectMocks
    private AdminUserService service;

    private Jwt jwt;
    private UUID callerId;

    @BeforeEach
    void setUp() {
        callerId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        lenient().when(jwt.getSubject()).thenReturn(callerId.toString());
    }

    @Test
    void searchUsers_shouldReturnMappedPage_whenCallerIsAdmin() {
        Pageable pageable = PageRequest.of(0, 20);
        when(repository.findById(callerId))
                .thenReturn(Optional.of(createUserProfile(callerId, "admin", UserRole.ADMIN)));
        UserProfile match = createUserProfile(UUID.randomUUID(), "student", UserRole.CUSTOMER);
        Page<UserProfile> page = new PageImpl<>(Collections.singletonList(match), pageable, 1);
        when(repository.searchForAdmin("john", pageable)).thenReturn(page);

        Page<AdminUserResponse> result = service.searchUsers(jwt, "john", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).nickname()).isEqualTo("student");
        assertThat(result.getContent().get(0).role()).isEqualTo(UserRole.CUSTOMER);
    }

    @Test
    void searchUsers_shouldTrimAndNullSafeQuery() {
        Pageable pageable = PageRequest.of(0, 20);
        when(repository.findById(callerId))
                .thenReturn(Optional.of(createUserProfile(callerId, "admin", UserRole.ADMIN)));
        when(repository.searchForAdmin("", pageable)).thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));

        service.searchUsers(jwt, null, pageable);

        verify(repository).searchForAdmin("", pageable);
    }

    @Test
    void searchUsers_shouldThrowForbidden_whenCallerIsNotAdmin() {
        when(repository.findById(callerId))
                .thenReturn(Optional.of(createUserProfile(callerId, "manager", UserRole.PLATFORM_MANAGER)));

        var exception = assertThrows(ForbiddenException.class,
                () -> service.searchUsers(jwt, "john", PageRequest.of(0, 20)));
        assertThat(exception.getMessage()).isEqualTo("Only admins can manage users.");
        verify(repository, never()).searchForAdmin(any(), any());
    }

    @Test
    void searchUsers_shouldThrowNotFound_whenCallerProfileMissing() {
        when(repository.findById(callerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.searchUsers(jwt, "john", PageRequest.of(0, 20)));
        verify(repository, never()).searchForAdmin(any(), any());
    }

    private UserProfile createUserProfile(UUID id, String nickname, UserRole role) {
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setNickname(nickname);
        profile.setRole(role);
        return profile;
    }
}
