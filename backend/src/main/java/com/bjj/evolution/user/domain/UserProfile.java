package com.bjj.evolution.user.domain;

import com.bjj.evolution.catalog.domain.Belt;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
public class UserProfile {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String secondName;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Enumerated(EnumType.STRING)
    private Belt belt;

    private Integer beltStripe;

    private LocalDate startsIn;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.CUSTOMER;

    @Column(name = "anonymized_at")
    private Instant anonymizedAt;

    public UserProfile() {
    }

    public UserProfile(UUID id, String name, String secondName, String nickname, Belt belt, Integer beltStripe, LocalDate startsIn, UserRole role) {
        this.id = id;
        this.name = name;
        this.secondName = secondName;
        this.nickname = nickname;
        this.belt = belt;
        this.beltStripe = beltStripe;
        this.startsIn = startsIn;
        this.role = role != null ? role : UserRole.CUSTOMER;
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

    public Integer getBeltStripe() {
        return beltStripe;
    }

    public LocalDate getStartsIn() {
        return startsIn;
    }

    public UserRole getRole() {
            return role;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSecondName(String secondName) {
        this.secondName = secondName;
    }

    public void setBelt(Belt belt) {
        this.belt = belt;
    }

    public void setBeltStripe(Integer beltStripe) {
        this.beltStripe = beltStripe;
    }

    public void setStartsIn(LocalDate startsIn) {
        this.startsIn = startsIn;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public Instant getAnonymizedAt() {
        return anonymizedAt;
    }

    public void setAnonymizedAt(Instant anonymizedAt) {
        this.anonymizedAt = anonymizedAt;
    }

    public boolean isAnonymized() {
        return anonymizedAt != null;
    }

    public void anonymize() {
        this.name = "[deleted]";
        this.secondName = null;
        this.nickname = "deleted_" + UUID.randomUUID().toString().replace("-", "");
        this.belt = null;
        this.beltStripe = null;
        this.startsIn = null;
        this.anonymizedAt = Instant.now();
    }
}
