package com.bjj.evolution.training.log.domain.dto;

import java.util.List;

public record DashboardResponse(
        TrainingStatsResponse current,
        TrainingStatsResponse previous,
        List<TechniqueCount> topAttacks,
        List<TechniqueCount> topDefenses
) {}
