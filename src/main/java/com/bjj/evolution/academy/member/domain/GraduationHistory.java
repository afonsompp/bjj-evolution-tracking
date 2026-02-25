package com.bjj.evolution.academy.member.domain;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.*;
import java.time.LocalDateTime;

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
    private Integer oldStripe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Belt newBelt;
    private Integer newStripe;

    @Column(nullable = false)
    private LocalDateTime graduationDate;

    // Construtor vazio para JPA
    public GraduationHistory() {}

    public GraduationHistory(Academy academy, UserProfile student, UserProfile promotedBy,
                             Belt oldBelt, Integer oldStripe, Belt newBelt, Integer newStripe) {
        this.academy = academy;
        this.student = student;
        this.promotedBy = promotedBy;
        this.oldBelt = oldBelt;
        this.oldStripe = oldStripe;
        this.newBelt = newBelt;
        this.newStripe = newStripe;
        this.graduationDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Academy getAcademy() { return academy; }
    public UserProfile getStudent() { return student; }
    public UserProfile getPromotedBy() { return promotedBy; }
    public Belt getOldBelt() { return oldBelt; }
    public Integer getOldStripe() { return oldStripe; }
    public Belt getNewBelt() { return newBelt; }
    public Integer getNewStripe() { return newStripe; }
    public LocalDateTime getGraduationDate() { return graduationDate; }
}
