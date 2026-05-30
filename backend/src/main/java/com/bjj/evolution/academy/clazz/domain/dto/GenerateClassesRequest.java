package com.bjj.evolution.academy.clazz.domain.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record GenerateClassesRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {}
