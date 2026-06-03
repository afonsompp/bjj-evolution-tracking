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

import java.time.Instant;
import java.util.List;

public record TrainingRequest(

        @NotNull
        ClassType classType,

        @NotNull
        TrainingType trainingType,

        @NotNull
        Instant sessionDate,

        @NotNull
        @PositiveOrZero
        Integer durationMinutes,

        List<Long> techniqueIds,

        List<Long> appliedTechniqueIds,

        List<Long> sufferedTechniqueIds,

        @PositiveOrZero
        Integer totalRolls,

        String description,

        @PositiveOrZero
        Integer roundLengthMinutes,

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

        @PositiveOrZero Integer taps,
        @PositiveOrZero Integer submissions,
        @PositiveOrZero Integer escapes,
        @PositiveOrZero Integer sweeps,
        @PositiveOrZero Integer takedowns,
        @PositiveOrZero Integer guardPasses) {

        public Training toEntity(Long id, List<Technique> techniques, List<Technique> appliedTechniques, List<Technique> sufferedTechniques,UserProfile profile) {
                return Training.builder()
                        .id(id)
                        .userProfile(profile)
                        .classType(classType)
                        .trainingType(trainingType)
                        .sessionDate(sessionDate)
                        .durationMinutes(durationMinutes)
                        .technique(techniques)
                        .totalRolls(totalRolls)
                        .roundLengthMinutes(roundLengthMinutes)
                        .restLengthMinutes(restLengthMinutes)
                        .cardioRating(Rating.of(cardioRating))
                        .intensityRating(Rating.of(intensityRating))
                        .taps(taps)
                        .submissions(submissions)
                        .escapes(escapes)
                        .sweeps(sweeps)
                        .takedowns(takedowns)
                        .guardPasses(guardPasses)
                        .appliedTechniques(appliedTechniques)
                        .sufferedTechniques(sufferedTechniques)
                        .description(description)
                        .build();
        }

        public Training toEntity(List<Technique> techniques, List<Technique> appliedTechniques, List<Technique> sufferedTechniques, UserProfile profile) {
                return toEntity(null, techniques, appliedTechniques, sufferedTechniques, profile);
        }
}
