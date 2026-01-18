package com.bjj.evolution.catalog.domain.dto;

import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TechniqueRequest(
        @NotBlank(message = "Name cannot be empty")
        @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
        String name,

        @Size(max = 100, message = "Alternative name is too long")
        String alternativeName,

        @NotNull(message = "Technique type is required")
        TechniqueType type,

        @NotNull(message = "Technique type is required")
        TechniqueTarget target
) {
    public Technique toEntity(Long id) {
        return new Technique(
                id,
                this.name(),
                this.alternativeName(),
                this.type(),
                this.target()
        );
    }

    public Technique toEntity() {
        return toEntity(null);
    }
}
