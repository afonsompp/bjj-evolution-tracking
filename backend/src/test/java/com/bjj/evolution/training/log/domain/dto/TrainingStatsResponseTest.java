package com.bjj.evolution.training.log.domain.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TrainingStatsResponseTest {

    @Test
    @DisplayName("fromProjection should compute all fields correctly from a valid row")
    void fromProjection_shouldComputeAllFields() {
        // 42 sessions = 2520 min
        long durationMinutes = 2520L;
        Object[] row = {
                42L,                    // [0] count
                23L,                    // [1] taps
                156L,                   // [2] submissions
                89L,                    // [3] escapes
                45L,                    // [4] sweeps
                12L,                    // [5] takedowns
                67L,                    // [6] guardPasses
                210L,                   // [7] totalRolls
                3.5,                    // [8] avgCardioRating
                4.1,                    // [9] avgIntensityRating
                durationMinutes         // [10] sum duration (minutes)
        };

        TrainingStatsResponse result = TrainingStatsResponse.fromProjection(row);

        assertThat(result.totalSessions()).isEqualTo(42);
        assertThat(result.totalMinutes()).isEqualTo(2520);
        assertThat(result.avgCardioRating()).isEqualTo(3.5);
        assertThat(result.avgIntensityRating()).isEqualTo(4.1);
        assertThat(result.totalTaps()).isEqualTo(23);
        assertThat(result.totalSubmissions()).isEqualTo(156);
        assertThat(result.totalEscapes()).isEqualTo(89);
        assertThat(result.totalSweeps()).isEqualTo(45);
        assertThat(result.totalTakedowns()).isEqualTo(12);
        assertThat(result.totalGuardPasses()).isEqualTo(67);
        assertThat(result.totalRolls()).isEqualTo(210);
    }

    @Test
    @DisplayName("fromProjection should return zeros when all values are null")
    void fromProjection_whenAllNull_shouldReturnZeros() {
        Object[] row = new Object[11];

        TrainingStatsResponse result = TrainingStatsResponse.fromProjection(row);

        assertThat(result.totalSessions()).isZero();
        assertThat(result.totalMinutes()).isZero();
        assertThat(result.avgCardioRating()).isZero();
        assertThat(result.avgIntensityRating()).isZero();
        assertThat(result.totalTaps()).isZero();
        assertThat(result.totalSubmissions()).isZero();
        assertThat(result.totalEscapes()).isZero();
        assertThat(result.totalSweeps()).isZero();
        assertThat(result.totalTakedowns()).isZero();
        assertThat(result.totalGuardPasses()).isZero();
        assertThat(result.totalRolls()).isZero();
    }

    @Test
    @DisplayName("fromProjection should handle partial nulls gracefully")
    void fromProjection_whenPartialNulls_shouldHandleGracefully() {
        Object[] row = {
                5L,                     // [0] count
                null,                   // [1] taps — null
                30L,                    // [2] submissions
                null,                   // [3] escapes — null
                null,                   // [4] sweeps — null
                3L,                     // [5] takedowns
                null,                   // [6] guardPasses — null
                50L,                    // [7] totalRolls
                3.0,                    // [8] avgCardioRating
                null,                   // [9] avgIntensityRating — null
                5L                      // [10] 5 min
        };

        TrainingStatsResponse result = TrainingStatsResponse.fromProjection(row);

        assertThat(result.totalSessions()).isEqualTo(5);
        assertThat(result.totalMinutes()).isEqualTo(5);
        assertThat(result.avgCardioRating()).isEqualTo(3.0);
        assertThat(result.avgIntensityRating()).isZero();   // null → 0
        assertThat(result.totalTaps()).isZero();             // null → 0
        assertThat(result.totalSubmissions()).isEqualTo(30);
        assertThat(result.totalEscapes()).isZero();          // null → 0
        assertThat(result.totalSweeps()).isZero();           // null → 0
        assertThat(result.totalTakedowns()).isEqualTo(3);
        assertThat(result.totalGuardPasses()).isZero();      // null → 0
        assertThat(result.totalRolls()).isEqualTo(50);
    }

    @Test
    @DisplayName("fromProjection should convert minutes correctly")
    void fromProjection_shouldConvertMinutesCorrectly() {
        // 1 session, 90 min
        long minutes = 90L;
        Object[] row = { 1L, null, null, null, null, null, null, null, null, null, minutes };

        TrainingStatsResponse result = TrainingStatsResponse.fromProjection(row);

        assertThat(result.totalSessions()).isEqualTo(1);
        assertThat(result.totalMinutes()).isEqualTo(90);
    }

    @Test
    @DisplayName("fromProjection should handle minutes directly")
    void fromProjection_shouldHandleMinutesDirectly() {
        // 1 minute
        long minutes = 1L;
        Object[] row = { 1L, null, null, null, null, null, null, null, null, null, minutes };

        TrainingStatsResponse result = TrainingStatsResponse.fromProjection(row);

        assertThat(result.totalMinutes()).isEqualTo(1);
    }
}