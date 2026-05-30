package com.bjj.evolution.user;

import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.GraduationHistoryRepository;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.training.log.TrainingRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
import com.bjj.evolution.user.domain.dto.UserDataExportResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserDataExportService {

    private final UserProfileRepository profileRepository;
    private final TrainingRepository trainingRepository;
    private final AcademyMemberRepository memberRepository;
    private final GraduationHistoryRepository graduationRepository;
    private final ClassAttendanceRepository attendanceRepository;

    public UserDataExportService(UserProfileRepository profileRepository,
                                 TrainingRepository trainingRepository,
                                 AcademyMemberRepository memberRepository,
                                 GraduationHistoryRepository graduationRepository,
                                 ClassAttendanceRepository attendanceRepository) {
        this.profileRepository = profileRepository;
        this.trainingRepository = trainingRepository;
        this.memberRepository = memberRepository;
        this.graduationRepository = graduationRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Transactional(readOnly = true)
    public UserDataExportResponse export(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());

        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", userId));

        var trainings = trainingRepository
                .findAllByUserProfileId(userId, Pageable.unpaged())
                .stream()
                .map(UserDataExportResponse.TrainingEntry::fromEntity)
                .toList();

        var memberships = memberRepository
                .findAllByUserId(userId, Pageable.unpaged())
                .stream()
                .map(UserDataExportResponse.MembershipEntry::fromEntity)
                .toList();

        var graduations = graduationRepository
                .findByStudentIdOrderByGraduationDateDesc(userId, Pageable.unpaged())
                .stream()
                .map(UserDataExportResponse.GraduationEntry::fromEntity)
                .toList();

        var attendances = attendanceRepository
                .findByStudentId(userId, Pageable.unpaged())
                .stream()
                .map(UserDataExportResponse.AttendanceEntry::fromEntity)
                .toList();

        return new UserDataExportResponse(
                Instant.now(),
                ProfileResponse.fromEntity(profile),
                trainings,
                memberships,
                graduations,
                attendances
        );
    }
}
