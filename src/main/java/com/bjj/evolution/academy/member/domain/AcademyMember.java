package com.bjj.evolution.academy.member.domain;

import com.bjj.evolution.academy.domain.Academy;
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
    private MemberStatus status = MemberStatus.PENDING;

    public AcademyMember() {
    }

    public AcademyMember(Academy academy, UserProfile user, MemberRole role) {
        this.academy = academy;
        this.user = user;
        this.role = role;
        this.id = new AcademyMemberId(academy.getId(), user.getId());
    }

    public AcademyMember(Academy academy, UserProfile user, MemberRole role, MemberStatus status) {
        this.id = new AcademyMemberId(academy.getId(), user.getId());
        this.academy = academy;
        this.user = user;
        this.role = role;
        this.status = status;
    }

    public AcademyMemberId getId() {
        return id;
    }

    public Academy getAcademy() {
        return academy;
    }

    public UserProfile getUser() {
        return user;
    }

    public MemberRole getRole() {
        return role;
    }

    public MemberStatus getStatus() {
        return status;
    }

    public void setId(AcademyMemberId id) {
        this.id = id;
    }

    public void setAcademy(Academy academy) {
        this.academy = academy;
    }

    public void setUser(UserProfile user) {
        this.user = user;
    }

    public void setRole(MemberRole role) {
        this.role = role;
    }

    public void setStatus(MemberStatus status) {
        this.status = status;
    }
}
