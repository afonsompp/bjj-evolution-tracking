package com.bjj.evolution.academy.clazz.domain.dto;

import com.bjj.evolution.academy.clazz.domain.ClassTemplate;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.util.List;
import java.util.UUID;

public record ClassTemplateResponse(
        UUID id,
        String name,
        ProfileResponse instructor,
        long durationMinutes,
        ClassType classType,
        TrainingType trainingType,
        List<TechniqueResponse> techniques,
        List<ClassRecurrenceRequest> recurrenceRules
) {
    public static ClassTemplateResponse fromEntity(ClassTemplate entity) {
        return new ClassTemplateResponse(
                entity.getId(),
                entity.getName(),
                ProfileResponse.fromEntity(entity.getInstructor()),
                entity.getDuration().toMinutes(),
                entity.getClassType(),
                entity.getTrainingType(),
                entity.getDefaultTechniques().stream().map(TechniqueResponse::fromEntity).toList(),
                entity.getRecurrenceRules().stream()
                        .map(r -> new ClassRecurrenceRequest(r.getDayOfWeek(), r.getStartTime()))
                        .toList()
        );
    }
}
