package com.bjj.evolution.academy.clazz.domain.dto;

import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.time.LocalDateTime;

public record CheckInResponse(
        Long id,
        Long classId,
        ProfileResponse student,
        CheckInStatus status,
        LocalDateTime checkInTime
) {
    public static CheckInResponse fromEntity(ClassAttendance entity) {
        return new CheckInResponse(
                entity.getId(),
                entity.getScheduledClass().getId(),
                ProfileResponse.fromEntity(entity.getStudent()),
                entity.getStatus(),
                entity.getCheckInTime()
        );
    }
}
