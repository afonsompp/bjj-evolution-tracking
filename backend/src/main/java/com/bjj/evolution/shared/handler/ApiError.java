package com.bjj.evolution.shared.handler;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String error,
        String message,
        Instant timestamp,
        List<FieldViolation> violations
) {
    public record FieldViolation(String field, String message) {}

    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, Instant.now(), null);
    }

    public static ApiError of(int status, String error, String message, List<FieldViolation> violations) {
        return new ApiError(status, error, message, Instant.now(), violations);
    }
}
