package com.bjj.evolution.academy.member.domain;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class GraduationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academy_id", nullable = false)
    private Academy academy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserProfile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promoted_by_id", nullable = false)
    private UserProfile promotedBy;

    @Enumerated(EnumType.STRING)
    private Belt oldBelt;
    private Integer oldBeltStripe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Belt newBelt;
    private Integer newBeltStripe;

    @Column(nullable = false)
    private Instant graduationDate;

    // Construtor vazio para JPA
    public GraduationHistory() {}

    public GraduationHistory(Academy academy, UserProfile student, UserProfile promotedBy,
                             Belt oldBelt, Integer oldBeltStripe, Belt newBelt, Integer newBeltStripe) {
        this.academy = academy;
        this.student = student;
        this.promotedBy = promotedBy;
        this.oldBelt = oldBelt;
        this.oldBeltStripe = oldBeltStripe;
        this.newBelt = newBelt;
        this.newBeltStripe = newBeltStripe;
        this.graduationDate = Instant.now();
    }

    public Long getId() { return id; }
    public Academy getAcademy() { return academy; }
    public UserProfile getStudent() { return student; }
    public UserProfile getPromotedBy() { return promotedBy; }
    public Belt getOldBelt() { return oldBelt; }
    public Integer getOldStripe() { return oldBeltStripe; }
    public Belt getNewBelt() { return newBelt; }
    public Integer getNewStripe() { return newBeltStripe; }
    public Instant getGraduationDate() { return graduationDate; }
}
