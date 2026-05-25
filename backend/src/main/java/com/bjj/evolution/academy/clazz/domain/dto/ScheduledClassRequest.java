package com.bjj.evolution.academy.clazz.domain.dto;

import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ScheduledClassRequest(
        @NotNull UUID academyId,
        @NotNull UUID instructorId,
        @NotNull Instant startTime,
        @NotNull @Positive Integer durationMinutes,
        @NotNull ClassType classType,
        @NotNull TrainingType trainingType,
        List<Long> techniqueIds,
        UUID templateId,
        ClassStatus status
) {}
