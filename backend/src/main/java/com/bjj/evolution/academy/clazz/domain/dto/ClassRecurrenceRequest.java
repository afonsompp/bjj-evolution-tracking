package com.bjj.evolution.academy.clazz.domain.dto;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record ClassRecurrenceRequest(
        @NotNull DayOfWeek dayOfWeek,
        @NotNull LocalTime startTime
) {}
