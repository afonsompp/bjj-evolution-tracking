package com.bjj.evolution.user.domain;

import com.bjj.evolution.catalog.domain.Belt;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.util.UUID;

@Entity
public class UserProfile {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String secondName;

    @Enumerated(EnumType.STRING)
    private Belt belt;

    private Integer stripe;

    private LocalDate startsIn;

    public UserProfile() {
    }

    public UserProfile(UUID id, String name, String secondName, Belt belt, Integer stripe, LocalDate startsIn) {
        this.id = id;
        this.name = name;
        this.secondName = secondName;
        this.belt = belt;
        this.stripe = stripe;
        this.startsIn = startsIn;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSecondName() {
        return secondName;
    }

    public Belt getBelt() {
        return belt;
    }

    public Integer getStripe() {
        return stripe;
    }

    public LocalDate getStartsIn() {
        return startsIn;
    }
}
