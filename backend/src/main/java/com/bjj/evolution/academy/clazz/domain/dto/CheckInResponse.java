package com.bjj.evolution.academy.clazz.domain.dto;

import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.time.Instant;

public record CheckInResponse(
        Long id,
        Long classId,
        ProfileResponse student,
        CheckInStatus status,
        Instant checkInTime
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
