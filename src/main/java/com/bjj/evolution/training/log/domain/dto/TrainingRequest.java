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

        List<Long> submissionTechniqueIds,

        List<Long> submissionTechniqueAllowedIds,

        @NotNull
        @PositiveOrZero
        Integer totalRolls,

        String description,

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
        @NotNull @PositiveOrZero Integer guardPasses,
        Duration duration) {

        public Training toEntity(Long id, List<Technique> techniques, List<Technique> submissionTechniques, List<Technique> submissionTechniqueAllowed,UserProfile profile) {
                return Training.builder()
                        .id(id)
                        .userProfile(profile)
                        .classType(classType)
                        .trainingType(trainingType)
                        .sessionDate(sessionDate)
                        .duration(Duration.ofMinutes(durationMinutes))
                        .technique(techniques)
                        .totalRolls(totalRolls)
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
                        .submissionsTechniques(submissionTechniques)
                        .submissionsTechniquesAllowed(submissionTechniqueAllowed)
                        .description(description)
                        .build();
        }

        public Training toEntity(List<Technique> techniques, List<Technique> submissionTechniques, List<Technique> submissionTechniquesAllowed, UserProfile profile) {
                return toEntity(null, techniques, submissionTechniques, submissionTechniquesAllowed, profile);
        }
}
