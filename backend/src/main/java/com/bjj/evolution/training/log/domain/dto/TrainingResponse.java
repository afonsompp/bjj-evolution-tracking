package com.bjj.evolution.training.log.domain.dto;

import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.time.Instant;
import java.util.List;

public record TrainingResponse(
        Long id,
        ClassType classType,
        TrainingType trainingType,
        Instant sessionDate,
        long durationMinutes,
        List<TechniqueSummaryResponse> techniques,
        List<TechniqueSummaryResponse> submissionTechniques,
        List<TechniqueSummaryResponse> submissionTechniquesAllowed,
        Integer totalRolls,
        long roundLengthMinutes,
        long restLengthMinutes,
        Integer cardioRating,
        Integer intensityRating,
        Integer taps,
        Integer submissions,
        Integer escapes,
        Integer sweeps,
        Integer takedowns,
        Integer guardPasses,
        ProfileResponse profile,
        String description) {

        public static TrainingResponse fromEntity(Training entity) {
                return new TrainingResponse(
                        entity.getId(),
                        entity.getClassType(),
                        entity.getTrainingType(),
                        entity.getSessionDate(),
                        entity.getDurationMinutes(),
                        entity.getTechnique().stream()
                                .map(TechniqueSummaryResponse::fromEntity)
                                .toList(),
                        entity.getSubmissionTechniques().stream()
                                .map(TechniqueSummaryResponse::fromEntity)
                                .toList(),
                        entity.getSubmissionTechniquesAllowed().stream()
                                .map(TechniqueSummaryResponse::fromEntity)
                                .toList(),
                        entity.getTotalRolls(),
                        entity.getRoundLengthMinutes(),
                        entity.getRestLengthMinutes(),
                        entity.getCardioRating().getValue(),
                        entity.getIntensityRating().getValue(),
                        entity.getTaps(),
                        entity.getSubmissions(),
                        entity.getEscapes(),
                        entity.getSweeps(),
                        entity.getTakedowns(),
                        entity.getGuardPasses(),
                        ProfileResponse.fromEntity(entity.getUserProfile()),
                        entity.getDescription()
                );
        }
}
