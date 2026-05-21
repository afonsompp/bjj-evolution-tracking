package com.bjj.evolution.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Technique {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(nullable = false)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String alternativeName;

    @Column(nullable = false)
    private TechniqueType type;

    @Column(nullable = false)
    private TechniqueTarget target;

    public Technique() {
    }

    public Technique(Long id, String name, String alternativeName, TechniqueType type, TechniqueTarget target) {
        this.id = id;
        this.name = name;
        this.alternativeName = alternativeName;
        this.type = type;
        this.target = target;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getAlternativeName() {
        return alternativeName;
    }

    public TechniqueType getType() {
        return type;
    }

    public TechniqueTarget getTarget() {
        return target;
    }
}
