package com.bjj.evolution.training.log.domain.dto;

import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.user.domain.dto.ProfileResponse;

import java.time.LocalDateTime;
import java.util.List;

public record TrainingResponse(
        Long id,
        ClassType classType,
        TrainingType trainingType,
        LocalDateTime sessionDate,
        long durationMinutes,
        List<TechniqueSummaryResponse> techniques,
        Integer totalRolls,
        Integer totalRounds,
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
        ProfileResponse profile
) {

        public static TrainingResponse fromEntity(Training entity) {
                return new TrainingResponse(
                        entity.getId(),
                        entity.getClassType(),
                        entity.getTrainingType(),
                        entity.getSessionDate(),
                        entity.getDuration().toMinutesPart() + entity.getDuration().toHours() * 60,
                        entity.getTechnique().stream()
                                .map(TechniqueSummaryResponse::fromEntity)
                                .toList(),
                        entity.getTotalRolls(),
                        entity.getTotalRounds(),
                        entity.getRoundLength().toMinutes(),
                        entity.getRestLength().toMinutes(),
                        entity.getCardioRating().getValue(),
                        entity.getIntensityRating().getValue(),
                        entity.getTaps(),
                        entity.getSubmissions(),
                        entity.getEscapes(),
                        entity.getSweeps(),
                        entity.getTakedowns(),
                        entity.getGuardPasses(),
                        ProfileResponse.fromEntity(entity.getUserProfile())
                );
        }
}
