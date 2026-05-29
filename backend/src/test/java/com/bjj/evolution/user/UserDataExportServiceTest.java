package com.bjj.evolution.user;

import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.GraduationHistoryRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.GraduationHistory;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.training.log.TrainingRepository;
import com.bjj.evolution.training.log.domain.Rating;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import com.bjj.evolution.user.domain.dto.UserDataExportResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDataExportServiceTest {

    @Mock private UserProfileRepository profileRepository;
    @Mock private TrainingRepository trainingRepository;
    @Mock private AcademyMemberRepository memberRepository;
    @Mock private GraduationHistoryRepository graduationRepository;
    @Mock private ClassAttendanceRepository attendanceRepository;

    @InjectMocks
    private UserDataExportService service;

    private UUID userId;
    private Jwt jwt;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());

        profile = new UserProfile(userId, "John", "Doe", "john_doe",
                Belt.BLUE, 2, LocalDate.of(2020, 1, 1), UserRole.CUSTOMER);
    }

    @Test
    void export_shouldThrow_whenProfileNotFound() {
        when(profileRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.export(jwt));
    }

    @Test
    void export_shouldReturnAllSections() {
        when(profileRepository.findById(userId)).thenReturn(Optional.of(profile));

        Training training = Training.builder()
                .id(1L)
                .classType(ClassType.REGULAR)
                .trainingType(TrainingType.GI)
                .sessionDate(Instant.now())
                .durationMinutes(90)
                .technique(List.of())
                .submissionsTechniques(List.of())
                .submissionsTechniquesAllowed(List.of())
                .totalRolls(5)
                .roundLengthMinutes(6)
                .restLengthMinutes(1)
                .cardioRating(Rating.of(4))
                .intensityRating(Rating.of(3))
                .taps(2).submissions(1).escapes(3).sweeps(1).takedowns(0).guardPasses(2)
                .userProfile(profile)
                .build();
        when(trainingRepository.findAllByUserProfileId(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(training)));

        Academy academy = mock(Academy.class);
        when(academy.getId()).thenReturn(UUID.randomUUID());
        when(academy.getName()).thenReturn("BJJ Academy");

        AcademyMember member = mock(AcademyMember.class);
        AcademyMemberId memberId = new AcademyMemberId(academy.getId(), userId);
        when(member.getId()).thenReturn(memberId);
        when(member.getAcademy()).thenReturn(academy);
        when(member.getRole()).thenReturn(MemberRole.STUDENT);
        when(member.getStatus()).thenReturn(MemberStatus.ACTIVE);
        when(memberRepository.findAllByUserId(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(member)));

        GraduationHistory graduation = mock(GraduationHistory.class);
        when(graduation.getAcademy()).thenReturn(academy);
        when(graduation.getOldBelt()).thenReturn(Belt.WHITE);
        when(graduation.getOldStripe()).thenReturn(4);
        when(graduation.getNewBelt()).thenReturn(Belt.BLUE);
        when(graduation.getNewStripe()).thenReturn(0);
        when(graduation.getGraduationDate()).thenReturn(Instant.now());
        when(graduationRepository.findByStudentIdOrderByGraduationDateDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(graduation)));

        ScheduledClass scheduledClass = mock(ScheduledClass.class);
        when(scheduledClass.getId()).thenReturn(10L);
        when(scheduledClass.getAcademy()).thenReturn(academy);
        when(scheduledClass.getStartTime()).thenReturn(Instant.now());

        ClassAttendance attendance = mock(ClassAttendance.class);
        when(attendance.getScheduledClass()).thenReturn(scheduledClass);
        when(attendance.getStatus()).thenReturn(CheckInStatus.CONFIRMED);
        when(attendance.getCheckInTime()).thenReturn(Instant.now());
        when(attendanceRepository.findByStudentId(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(attendance)));

        UserDataExportResponse result = service.export(jwt);

        assertThat(result.exportedAt()).isNotNull();
        assertThat(result.profile().id()).isEqualTo(userId);
        assertThat(result.profile().nickname()).isEqualTo("john_doe");
        assertThat(result.trainings()).hasSize(1);
        assertThat(result.trainings().get(0).classType()).isEqualTo(ClassType.REGULAR);
        assertThat(result.memberships()).hasSize(1);
        assertThat(result.memberships().get(0).academyName()).isEqualTo("BJJ Academy");
        assertThat(result.graduations()).hasSize(1);
        assertThat(result.graduations().get(0).newBelt()).isEqualTo(Belt.BLUE);
        assertThat(result.attendances()).hasSize(1);
        assertThat(result.attendances().get(0).status()).isEqualTo(CheckInStatus.CONFIRMED);
    }
}
