package com.bjj.evolution.academy.member.domain.dto;

import com.bjj.evolution.catalog.domain.Belt;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record GraduationRequest(
        @NotNull
        Belt newBelt,
        @PositiveOrZero
        Integer newStripe
) {}
