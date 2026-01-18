package com.bjj.evolution.catalog.domain.dto;

import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;

public record TechniqueResponse(
        Long id,
        String name,
        String alternativeName,
        TechniqueType type,
        TechniqueTarget target
) {
    public static TechniqueResponse fromEntity(Technique technique) {
        return new TechniqueResponse(
                technique.getId(),
                technique.getName(),
                technique.getAlternativeName(),
                technique.getType(),
                technique.getTarget()
        );
    }
}
