package com.bjj.evolution.academy.clazz.domain.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CheckInRequest(
        @NotNull UUID studentId
) {}
