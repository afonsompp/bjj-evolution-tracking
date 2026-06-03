package com.bjj.evolution.user.domain.dto;

import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.GraduationHistory;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.training.log.domain.Training;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserDataExportResponse(
        Instant exportedAt,
        ProfileResponse profile,
        List<TrainingEntry> trainings,
        List<MembershipEntry> memberships,
        List<GraduationEntry> graduations,
        List<AttendanceEntry> attendances
) {

    public record TrainingEntry(
            Long id,
            Instant sessionDate,
            ClassType classType,
            TrainingType trainingType,
            int durationMinutes,
            List<String> techniques,
            List<String> appliedTechniques,
            List<String> sufferedTechniques,
            Integer totalRolls,
            Integer roundLengthMinutes,
            Integer restLengthMinutes,
            Integer cardioRating,
            Integer intensityRating,
            Integer taps,
            Integer submissions,
            Integer escapes,
            Integer sweeps,
            Integer takedowns,
            Integer guardPasses,
            String description
    ) {
        public static TrainingEntry fromEntity(Training t) {
            return new TrainingEntry(
                    t.getId(),
                    t.getSessionDate(),
                    t.getClassType(),
                    t.getTrainingType(),
                    t.getDurationMinutes(),
                    t.getTechnique().stream().map(te -> te.getName()).toList(),
                    t.getAppliedTechniques().stream().map(te -> te.getName()).toList(),
                    t.getSufferedTechniques().stream().map(te -> te.getName()).toList(),
                    t.getTotalRolls(),
                    t.getRoundLengthMinutes(),
                    t.getRestLengthMinutes(),
                    t.getCardioRating().getValue(),
                    t.getIntensityRating().getValue(),
                    t.getTaps(),
                    t.getSubmissions(),
                    t.getEscapes(),
                    t.getSweeps(),
                    t.getTakedowns(),
                    t.getGuardPasses(),
                    t.getDescription()
            );
        }
    }

    public record MembershipEntry(
            UUID academyId,
            String academyName,
            MemberRole role,
            MemberStatus status,
            Belt belt,
            Integer beltStripe
    ) {
        public static MembershipEntry fromEntity(AcademyMember m) {
            return new MembershipEntry(
                    m.getId().getAcademyId(),
                    m.getAcademy().getName(),
                    m.getRole(),
                    m.getStatus(),
                    m.getBelt(),
                    m.getBeltStripe()
            );
        }
    }

    public record GraduationEntry(
            UUID academyId,
            String academyName,
            Belt oldBelt,
            Integer oldBeltStripe,
            Belt newBelt,
            Integer newBeltStripe,
            Instant graduationDate
    ) {
        public static GraduationEntry fromEntity(GraduationHistory g) {
            return new GraduationEntry(
                    g.getAcademy().getId(),
                    g.getAcademy().getName(),
                    g.getOldBelt(),
                    g.getOldStripe(),
                    g.getNewBelt(),
                    g.getNewStripe(),
                    g.getGraduationDate()
            );
        }
    }

    public record AttendanceEntry(
            Long scheduledClassId,
            UUID academyId,
            String academyName,
            Instant classStartTime,
            CheckInStatus status,
            Instant checkInTime
    ) {
        public static AttendanceEntry fromEntity(ClassAttendance a) {
            return new AttendanceEntry(
                    a.getScheduledClass().getId(),
                    a.getScheduledClass().getAcademy().getId(),
                    a.getScheduledClass().getAcademy().getName(),
                    a.getScheduledClass().getStartTime(),
                    a.getStatus(),
                    a.getCheckInTime()
            );
        }
    }
}
