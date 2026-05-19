package com.bjj.evolution.academy.clazz.domain.dto;

import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ScheduledClassResponse(
        Long id,
        UUID academyId,
        String academyName,
        ProfileResponse instructor,
        LocalDateTime startTime,
        long durationMinutes,
        ClassType classType,
        TrainingType trainingType,
        List<TechniqueResponse> techniques,
        ClassStatus status
) {
    public static ScheduledClassResponse fromEntity(ScheduledClass entity) {
        return new ScheduledClassResponse(
                entity.getId(),
                entity.getAcademy().getId(),
                entity.getAcademy().getName(),
                ProfileResponse.fromEntity(entity.getInstructor()),
                entity.getStartTime(),
                entity.getDuration().toMinutes(),
                entity.getClassType(),
                entity.getTrainingType(),
                entity.getScheduledTechniques().stream().map(TechniqueResponse::fromEntity).toList(),
                entity.getStatus()
        );
    }
}
