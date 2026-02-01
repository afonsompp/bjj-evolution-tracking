package com.bjj.evolution.academy.member.domain;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
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
}
