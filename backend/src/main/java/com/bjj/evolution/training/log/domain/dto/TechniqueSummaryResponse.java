package com.bjj.evolution.training.log.domain.dto;

import com.bjj.evolution.catalog.domain.Technique;

public record TechniqueSummaryResponse(
        Long id,
        String name
) {

    public static TechniqueSummaryResponse fromEntity(Technique technique) {
        return new TechniqueSummaryResponse(
                technique.getId(),
                technique.getName()
        );
    }
}
