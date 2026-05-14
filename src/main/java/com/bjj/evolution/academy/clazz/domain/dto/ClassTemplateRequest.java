package com.bjj.evolution.academy.clazz.domain.dto;

import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public record ClassTemplateRequest(
        @NotBlank String name,
        @NotNull UUID instructorId,
        @NotNull @Positive Integer durationMinutes,
        @NotNull ClassType classType,
        @NotNull TrainingType trainingType,
        List<Long> techniqueIds,
        List<ClassRecurrenceRequest> recurrenceRules
) {}
