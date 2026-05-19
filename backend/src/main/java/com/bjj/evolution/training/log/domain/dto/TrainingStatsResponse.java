package com.bjj.evolution.training.log.domain.dto;

public record TrainingStatsResponse(
        long totalSessions,
        long totalMinutes,
        double avgCardioRating,
        double avgIntensityRating,
        int totalTaps,
        int totalSubmissions,
        int totalEscapes,
        int totalSweeps,
        int totalTakedowns,
        int totalGuardPasses,
        int totalRolls
) {
    public static TrainingStatsResponse fromProjection(Object[] row) {
        long count = row[0] != null ? ((Number) row[0]).longValue() : 0L;
        long nanos = row[10] != null ? ((Number) row[10]).longValue() : 0L;

        return new TrainingStatsResponse(
                count,
                nanos / 60_000_000_000L,      // nanoseconds → minutes
                row[8] != null ? ((Number) row[8]).doubleValue() : 0.0,
                row[9] != null ? ((Number) row[9]).doubleValue() : 0.0,
                row[1] != null ? ((Number) row[1]).intValue() : 0,
                row[2] != null ? ((Number) row[2]).intValue() : 0,
                row[3] != null ? ((Number) row[3]).intValue() : 0,
                row[4] != null ? ((Number) row[4]).intValue() : 0,
                row[5] != null ? ((Number) row[5]).intValue() : 0,
                row[6] != null ? ((Number) row[6]).intValue() : 0,
                row[7] != null ? ((Number) row[7]).intValue() : 0
        );
    }
}