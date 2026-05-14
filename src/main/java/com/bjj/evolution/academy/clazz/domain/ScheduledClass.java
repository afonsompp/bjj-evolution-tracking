package com.bjj.evolution.academy.clazz.domain;

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
    private ClassStatus status = ClassStatus.PUBLISHED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ClassTemplate template;


    protected ScheduledClass() {
    }

    private ScheduledClass(Builder builder) {
        this.academy = builder.academy;
        this.instructor = builder.instructor;
        this.startTime = builder.startTime;
        this.duration = builder.duration;
        this.classType = builder.classType;
        this.trainingType = builder.trainingType;
        this.scheduledTechniques = builder.scheduledTechniques;
        this.status = builder.status != null ? builder.status : ClassStatus.PUBLISHED;
        this.template = builder.template;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Academy academy;
        private UserProfile instructor;
        private LocalDateTime startTime;
        private Duration duration;
        private ClassType classType;
        private TrainingType trainingType;
        private List<Technique> scheduledTechniques;
        private ClassStatus status;
        private ClassTemplate template;

        private Builder() {
        }

        public Builder academy(Academy academy) {
            this.academy = academy;
            return this;
        }

        public Builder instructor(UserProfile instructor) {
            this.instructor = instructor;
            return this;
        }

        public Builder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder duration(Duration duration) {
            this.duration = duration;
            return this;
        }

        public Builder classType(ClassType classType) {
            this.classType = classType;
            return this;
        }

        public Builder trainingType(TrainingType trainingType) {
            this.trainingType = trainingType;
            return this;
        }

        public Builder scheduledTechniques(List<Technique> scheduledTechniques) {
            this.scheduledTechniques = scheduledTechniques;
            return this;
        }

        public Builder status(ClassStatus status) {
            this.status = status;
            return this;
        }

        public Builder template(ClassTemplate template) {
            this.template = template;
            return this;
        }

        public ScheduledClass build() {
            return new ScheduledClass(this);
        }
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

    public void setId(Long id) {
        this.id = id;
    }

    public void setAcademy(Academy academy) {
        this.academy = academy;
    }

    public void setInstructor(UserProfile instructor) {
        this.instructor = instructor;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void setDuration(Duration duration) {
        this.duration = duration;
    }

    public void setClassType(ClassType classType) {
        this.classType = classType;
    }

    public void setTrainingType(TrainingType trainingType) {
        this.trainingType = trainingType;
    }

    public void setScheduledTechniques(List<Technique> scheduledTechniques) {
        this.scheduledTechniques = scheduledTechniques;
    }

    public void setStatus(ClassStatus status) {
        this.status = status;
    }

    public void setTemplate(ClassTemplate template) {
        this.template = template;
    }
}
