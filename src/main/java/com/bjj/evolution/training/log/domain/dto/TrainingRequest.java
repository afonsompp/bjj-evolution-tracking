package com.bjj.evolution.training.log.domain.dto;


import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.training.log.domain.Rating;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

public record TrainingRequest(

        @NotNull
        ClassType classType,

        @NotNull
        TrainingType trainingType,

        @NotNull
        LocalDateTime sessionDate,

        @NotNull
        @PositiveOrZero
        Integer durationMinutes,

        List<Long> techniqueIds,

        @NotNull
        @PositiveOrZero
        Integer totalRolls,

        @NotNull
        @PositiveOrZero
        Integer totalRounds,

        @NotNull
        @PositiveOrZero
        Integer roundLengthMinutes,

        @NotNull
        @PositiveOrZero
        Integer restLengthMinutes,

        @NotNull
        @Min(1)
        @Max(5)
        Integer cardioRating,

        @NotNull
        @Min(1)
        @Max(5)
        Integer intensityRating,

        @NotNull @PositiveOrZero Integer taps,
        @NotNull @PositiveOrZero Integer submissions,
        @NotNull @PositiveOrZero Integer escapes,
        @NotNull @PositiveOrZero Integer sweeps,
        @NotNull @PositiveOrZero Integer takedowns,
        @NotNull @PositiveOrZero Integer guardPasses
) {

        public Training toEntity(Long id, List<Technique> techniques, UserProfile profile) {
                return Training.builder()
                        .id(id)
                        .userProfile(profile) // Novo parâmetro associado aqui
                        .classType(classType)
                        .trainingType(trainingType)
                        .sessionDate(sessionDate)
                        .duration(Duration.ofMinutes(durationMinutes))
                        .technique(techniques)
                        .totalRolls(totalRolls)
                        .totalRounds(totalRounds)
                        .roundLength(Duration.ofMinutes(roundLengthMinutes))
                        .restLength(Duration.ofMinutes(restLengthMinutes))
                        .cardioRating(Rating.of(cardioRating))
                        .intensityRating(Rating.of(intensityRating))
                        .taps(taps)
                        .submissions(submissions)
                        .escapes(escapes)
                        .sweeps(sweeps)
                        .takedowns(takedowns)
                        .guardPasses(guardPasses)
                        .build();
        }

        public Training toEntity(List<Technique> techniques, UserProfile profile) {
                return toEntity(null, techniques, profile);
        }
}
