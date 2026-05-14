package com.bjj.evolution.academy.member.domain.dto;

import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassResponse;

import java.time.LocalDateTime;

public record AcademyMenberClassViewResponse(
        Long id,
        ScheduledClassResponse scheduledClass,
        CheckInStatus status,
        LocalDateTime checkInTime
) {
    public static AcademyMenberClassViewResponse fromEntity(ClassAttendance entity) {
        return new AcademyMenberClassViewResponse(
                entity.getId(),
                ScheduledClassResponse.fromEntity(entity.getScheduledClass()),
                entity.getStatus(),
                entity.getCheckInTime()
        );
    }
}
