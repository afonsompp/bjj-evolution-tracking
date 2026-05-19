package com.bjj.evolution.academy.member.domain;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class AcademyMemberId implements Serializable {
    private UUID academyId;
    private UUID userId;

    public AcademyMemberId() {
    }

    public AcademyMemberId(UUID academyId, UUID userId) {
        this.academyId = academyId;
        this.userId = userId;
    }

    public UUID getAcademyId() {
        return academyId;
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AcademyMemberId that = (AcademyMemberId) o;
        return Objects.equals(academyId, that.academyId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(academyId, userId);
    }
}
