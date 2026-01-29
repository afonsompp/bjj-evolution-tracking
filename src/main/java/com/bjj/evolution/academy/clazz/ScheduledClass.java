package com.bjj.evolution.academy.clazz;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class ScheduledClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academy_id", nullable = false)
    private Academy academy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private UserProfile instructor;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private Duration duration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClassType classType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingType trainingType;

    @ManyToMany
    @JoinTable(
            name = "scheduled_class_technique",
            joinColumns = @JoinColumn(name = "scheduled_class_id"),
            inverseJoinColumns = @JoinColumn(name = "technique_id")
    )
    private List<Technique> scheduledTechniques;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClassStatus status = ClassStatus.SCHEDULED;


    public ScheduledClass() {
    }

    

    public Long getId() {
        return id;
    }

    public Academy getAcademy() {
        return academy;
    }

    public UserProfile getInstructor() {
        return instructor;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public Duration getDuration() {
        return duration;
    }

    public ClassType getClassType() {
        return classType;
    }

    public TrainingType getTrainingType() {
        return trainingType;
    }

    public List<Technique> getScheduledTechniques() {
        return scheduledTechniques;
    }

    public ClassStatus getStatus() {
        return status;
    }
}
