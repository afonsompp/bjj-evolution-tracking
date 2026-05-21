package com.bjj.evolution.training.log.domain.dto;

public record TechniqueCount(
        String name,
        int count,
        double percentage
) {

    public static TechniqueCount fromRow(Object[] row, int maxCount) {
        String name = (String) row[0];
        long count = ((Number) row[1]).longValue();
        double percentage = maxCount > 0 ? (count * 100.0) / maxCount : 0.0;
        return new TechniqueCount(name, (int) count, percentage);
    }
}
