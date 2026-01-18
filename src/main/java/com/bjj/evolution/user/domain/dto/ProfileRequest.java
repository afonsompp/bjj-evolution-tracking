package com.bjj.evolution.user.domain.dto;

import com.bjj.evolution.catalog.domain.Belt;

import java.time.LocalDate;

public record ProfileRequest(
        String name,
        String secondName,
        Belt belt,
        Integer stripe,
        LocalDate startsIn
) {}
