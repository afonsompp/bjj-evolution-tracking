package com.bjj.evolution.academy.domain;

import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;

@Entity
public class AcademyMember {

    @EmbeddedId
    private AcademyMemberId id = new AcademyMemberId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("academyId")
    @JoinColumn(name = "academy_id")
    private Academy academy;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private UserProfile user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role;

    @Column(nullable = false)
    private boolean active = true;

    public AcademyMember() {
    }

    public AcademyMember(Academy academy, UserProfile user, MemberRole role) {
        this.academy = academy;
        this.user = user;
        this.role = role;
        this.id = new AcademyMemberId(academy.getId(), user.getId());
    }

}
