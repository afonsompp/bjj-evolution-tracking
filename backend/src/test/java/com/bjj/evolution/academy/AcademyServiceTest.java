package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademyServiceTest {

    @Mock
    private AcademyRepository academyRepository;

    @Mock
    private AcademyMemberRepository academyMemberRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private AcademyService academyService;

    @Test
    void create_whenUserIsAdmin_shouldCreateAcademyAndOwner() {
        // Arrange
        UUID ownerId = UUID.randomUUID();
        AcademyRequest request = new AcademyRequest("Test Academy", "123 Test St");
        UserProfile adminProfile = createUserProfile(ownerId, UserRole.ADMIN);

        Academy savedAcademy = new Academy(request.name(), request.address());
        savedAcademy.setId(UUID.randomUUID());

        when(userProfileRepository.findById(ownerId)).thenReturn(Optional.of(adminProfile));
        when(academyRepository.save(any(Academy.class))).thenReturn(savedAcademy);

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {
            mocked.when(() -> SecurityUtils.isNotAdminOrPlatformManager(adminProfile)).thenReturn(false);

            // Act
            AcademyResponse response = academyService.create(request, ownerId);

            // Assert
            assertNotNull(response);
            assertEquals(savedAcademy.getId(), response.id());
            assertEquals(request.name(), response.name());

            verify(academyRepository).save(any(Academy.class));
            ArgumentCaptor<AcademyMember> memberCaptor = ArgumentCaptor.forClass(AcademyMember.class);
            verify(academyMemberRepository).save(memberCaptor.capture());
            assertEquals(MemberRole.OWNER, memberCaptor.getValue().getRole());
            assertEquals(ownerId, memberCaptor.getValue().getUser().getId());
        }
    }

    @Test
    void create_whenUserIsNotFound_shouldThrowResourceNotFoundException() {
        // Arrange
        UUID ownerId = UUID.randomUUID();
        AcademyRequest request = new AcademyRequest("Test Academy", "123 Test St");
        when(userProfileRepository.findById(ownerId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> academyService.create(request, ownerId));
        verify(academyRepository, never()).save(any());
        verify(academyMemberRepository, never()).save(any());
    }

    @Test
    void create_whenUserIsNotAuthorized_shouldThrowAccessDeniedException() {
        // Arrange
        UUID ownerId = UUID.randomUUID();
        AcademyRequest request = new AcademyRequest("Test Academy", "123 Test St");
        UserProfile userProfile = createUserProfile(ownerId, UserRole.CUSTOMER);

        when(userProfileRepository.findById(ownerId)).thenReturn(Optional.of(userProfile));

        try (MockedStatic<SecurityUtils> mocked = mockStatic(SecurityUtils.class)) {
            mocked.when(() -> SecurityUtils.isNotAdminOrPlatformManager(userProfile)).thenReturn(true);

            // Act & Assert
            assertThrows(ForbiddenException.class, () -> academyService.create(request, ownerId));
            verify(academyRepository, never()).save(any());
            verify(academyMemberRepository, never()).save(any());
        }
    }

    @Test
    void findAllPublic_whenNoQuery_shouldReturnAllAcademies() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Academy academy = new Academy("Test Academy", "123 Test St");
        Page<Academy> academyPage = new PageImpl<>(List.of(academy));
        when(academyRepository.findAll(pageable)).thenReturn(academyPage);

        // Act
        Page<AcademyResponse> response = academyService.findAllPublic(null, pageable);

        // Assert
        assertEquals(1, response.getTotalElements());
        assertEquals("Test Academy", response.getContent().get(0).name());
        verify(academyRepository).findAll(pageable);
        verify(academyRepository, never()).findByNameContainingIgnoreCase(anyString(), any(Pageable.class));
    }

    @Test
    void findAllPublic_whenQueryProvided_shouldReturnFilteredAcademies() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        String query = "Test";
        Academy academy = new Academy("Test Academy", "123 Test St");
        Page<Academy> academyPage = new PageImpl<>(List.of(academy));
        when(academyRepository.findByNameContainingIgnoreCase(query, pageable)).thenReturn(academyPage);

        // Act
        Page<AcademyResponse> response = academyService.findAllPublic(query, pageable);

        // Assert
        assertEquals(1, response.getTotalElements());
        assertEquals("Test Academy", response.getContent().get(0).name());
        verify(academyRepository, never()).findAll(pageable);
        verify(academyRepository).findByNameContainingIgnoreCase(query, pageable);
    }

    @Test
    void findMyAcademies_shouldReturnUserAcademies() {
        // Arrange
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        Academy academy = new Academy("My Academy", "123 My St");
        Page<Academy> academyPage = new PageImpl<>(List.of(academy));
        when(academyRepository.findAllByUserId(userId, pageable)).thenReturn(academyPage);

        // Act
        Page<AcademyResponse> response = academyService.findMyAcademies(userId, pageable);

        // Assert
        assertEquals(1, response.getTotalElements());
        assertEquals("My Academy", response.getContent().get(0).name());
        verify(academyRepository).findAllByUserId(userId, pageable);
    }

    @Test
    void findById_whenAcademyExists_shouldReturnAcademy() {
        // Arrange
        UUID academyId = UUID.randomUUID();
        Academy academy = new Academy("Test Academy", "123 Test St");
        academy.setId(academyId);
        when(academyRepository.findById(academyId)).thenReturn(Optional.of(academy));

        // Act
        AcademyResponse response = academyService.findById(academyId);

        // Assert
        assertNotNull(response);
        assertEquals(academyId, response.id());
    }

    @Test
    void findById_whenAcademyDoesNotExist_shouldThrowResourceNotFoundException() {
        // Arrange
        UUID academyId = UUID.randomUUID();
        when(academyRepository.findById(academyId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> academyService.findById(academyId));
    }

    @Test
    void update_whenAcademyExists_shouldUpdateAndReturnAcademy() {
        // Arrange
        UUID academyId = UUID.randomUUID();
        AcademyRequest request = new AcademyRequest("Updated Name", "Updated Address");
        Academy existingAcademy = new Academy("Old Name", "Old Address");
        existingAcademy.setId(academyId);

        when(academyRepository.findById(academyId)).thenReturn(Optional.of(existingAcademy));
        when(academyRepository.save(any(Academy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        AcademyResponse response = academyService.update(academyId, request);

        // Assert
        assertNotNull(response);
        assertEquals(academyId, response.id());
        assertEquals("Updated Name", response.name());
        assertEquals("Updated Address", response.address());

        ArgumentCaptor<Academy> academyCaptor = ArgumentCaptor.forClass(Academy.class);
        verify(academyRepository).save(academyCaptor.capture());
        assertEquals("Updated Name", academyCaptor.getValue().getName());
        assertEquals("Updated Address", academyCaptor.getValue().getAddress());
    }

    @Test
    void update_whenAcademyDoesNotExist_shouldThrowEntityNotFoundException() {
        // Arrange
        UUID academyId = UUID.randomUUID();
        AcademyRequest request = new AcademyRequest("Updated Name", "Updated Address");
        when(academyRepository.findById(academyId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> academyService.update(academyId, request));
        verify(academyRepository, never()).save(any());
    }

    @Test
    void delete_whenAcademyExists_shouldDeleteAcademy() {
        // Arrange
        UUID academyId = UUID.randomUUID();
        when(academyRepository.existsById(academyId)).thenReturn(true);
        doNothing().when(academyRepository).deleteById(academyId);

        // Act
        academyService.delete(academyId);

        // Assert
        verify(academyRepository).existsById(academyId);
        verify(academyRepository).deleteById(academyId);
    }

    @Test
    void delete_whenAcademyDoesNotExist_shouldThrowEntityNotFoundException() {
        // Arrange
        UUID academyId = UUID.randomUUID();
        when(academyRepository.existsById(academyId)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> academyService.delete(academyId));
        verify(academyRepository, never()).deleteById(any());
    }

    private UserProfile createUserProfile(UUID id, UserRole role) {
        UserProfile userProfile = new UserProfile();
        userProfile.setId(id);
        userProfile.setRole(role);
        userProfile.setBelt(Belt.BLACK);
        userProfile.setBeltStripe(4);
        return userProfile;
    }
}
