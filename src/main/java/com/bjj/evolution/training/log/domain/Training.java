package com.bjj.evolution.training.log.domain;

import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
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
import jakarta.persistence.OneToMany;
import jakarta.validation.OverridesAttribute;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class Training {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(nullable = false)
    private Long id;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ClassType classType;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TrainingType trainingType;
    @Column(nullable = false)
    private LocalDateTime sessionDate;
    @Column(nullable = false)
    private Duration duration;
    @ManyToMany
    @JoinTable(
            name = "training_technique",
            joinColumns = @JoinColumn(name = "training_id"),
            inverseJoinColumns = @JoinColumn(name = "technique_id")
    )
    private List<Technique> technique;
    @Column(nullable = false)
    private Integer totalRolls;
    @Column(nullable = false)
    private Integer totalRounds;
    @Column(nullable = false)
    private Duration roundLength;
    @Column(nullable = false)
    private Duration restLength;
    @Embedded
    @AttributeOverride(
            name = "value",
            column = @Column(name = "cardio_rating")
    )
    private Rating cardioRating;
    @Embedded
    @AttributeOverride(
            name = "value",
            column = @Column(name = "intensity_rating")
    )
    private Rating intensityRating;
    @Column(nullable = false)
    private Integer taps;
    @Column(nullable = false)
    private Integer submissions;
    @Column(nullable = false)
    private Integer escapes;
    @Column(nullable = false)
    private Integer sweeps;
    @Column(nullable = false)
    private Integer takedowns;
    @Column(nullable = false)
    private Integer guardPasses;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", nullable = false)
    private UserProfile userProfile;
    @ManyToMany
    @JoinTable(
            name = "training_submission_technique",
            joinColumns = @JoinColumn(name = "training_id"),
            inverseJoinColumns = @JoinColumn(name = "technique_id")
    )
    private List<Technique> submissionTechniques;
    @ManyToMany
    @JoinTable(
            name = "training_submission_technique_allowed",
            joinColumns = @JoinColumn(name = "training_id"),
            inverseJoinColumns = @JoinColumn(name = "technique_id")
    )
    private List<Technique> submissionTechniquesAllowed;

    public Training() {
    }

    public Long getId() {
        return id;
    }

    public ClassType getClassType() {
        return classType;
    }

    public TrainingType getTrainingType() {
        return trainingType;
    }

    public LocalDateTime getSessionDate() {
        return sessionDate;
    }

    public Duration getDuration() {
        return duration;
    }

    public List<Technique> getTechnique() {
        return technique;
    }

    public Integer getTotalRolls() {
        return totalRolls;
    }

    public Integer getTotalRounds() {
        return totalRounds;
    }

    public Duration getRoundLength() {
        return roundLength;
    }

    public Duration getRestLength() {
        return restLength;
    }

    public Rating getCardioRating() {
        return cardioRating;
    }

    public Rating getIntensityRating() {
        return intensityRating;
    }

    public Integer getTaps() {
        return taps;
    }

    public Integer getSubmissions() {
        return submissions;
    }

    public Integer getEscapes() {
        return escapes;
    }

    public Integer getSweeps() {
        return sweeps;
    }

    public Integer getTakedowns() {
        return takedowns;
    }

    public Integer getGuardPasses() {
        return guardPasses;
    }

    public UserProfile getUserProfile() {
        return userProfile;
    }

    public List<Technique> getSubmissionTechniques() {
        return submissionTechniques;
    }

    public List<Technique> getSubmissionTechniquesAllowed() {
        return submissionTechniquesAllowed;
    }
    private Training(Builder builder) {
        this.id = builder.id;
        this.classType = builder.classType;
        this.trainingType = builder.trainingType;
        this.sessionDate = builder.sessionDate;
        this.duration = builder.duration;
        this.technique = builder.technique;
        this.totalRolls = builder.totalRolls;
        this.totalRounds = builder.totalRounds;
        this.roundLength = builder.roundLength;
        this.restLength = builder.restLength;
        this.cardioRating = builder.cardioRating;
        this.intensityRating = builder.intensityRating;
        this.taps = builder.taps;
        this.submissions = builder.submissions;
        this.escapes = builder.escapes;
        this.sweeps = builder.sweeps;
        this.takedowns = builder.takedowns;
        this.guardPasses = builder.guardPasses;
        this.userProfile = builder.userProfile;
        this.submissionTechniques = builder.submissionTechniques;
        this.submissionTechniquesAllowed = builder.submissionTechniquesAllowed;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private ClassType classType;
        private TrainingType trainingType;
        private LocalDateTime sessionDate;
        private Duration duration;
        private List<Technique> technique;
        private List<Technique> submissionTechniques;
        private List<Technique> submissionTechniquesAllowed;
        private Integer totalRolls;
        private Integer totalRounds;
        private Duration roundLength;
        private Duration restLength;
        private Rating cardioRating;
        private Rating intensityRating;
        private Integer taps;
        private Integer submissions;
        private Integer escapes;
        private Integer sweeps;
        private Integer takedowns;
        private Integer guardPasses;
        private UserProfile userProfile;

        public Builder id(Long id) {
            this.id = id;
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

        public Builder userProfile(UserProfile userProfile) {
            this.userProfile = userProfile;
            return this;
        }

        public Builder sessionDate(LocalDateTime sessionDate) {
            this.sessionDate = sessionDate;
            return this;
        }

        public Builder duration(Duration duration) {
            this.duration = duration;
            return this;
        }

        public Builder technique(List<Technique> technique) {
            this.technique = technique;
            return this;
        }

        public Builder totalRolls(Integer totalRolls) {
            this.totalRolls = totalRolls;
            return this;
        }

        public Builder totalRounds(Integer totalRounds) {
            this.totalRounds = totalRounds;
            return this;
        }

        public Builder roundLength(Duration roundLength) {
            this.roundLength = roundLength;
            return this;
        }

        public Builder restLength(Duration restLength) {
            this.restLength = restLength;
            return this;
        }

        public Builder cardioRating(Rating cardioRating) {
            this.cardioRating = cardioRating;
            return this;
        }

        public Builder intensityRating(Rating intensityRating) {
            this.intensityRating = intensityRating;
            return this;
        }

        public Builder taps(Integer taps) {
            this.taps = taps;
            return this;
        }

        public Builder submissions(Integer submissions) {
            this.submissions = submissions;
            return this;
        }

        public Builder escapes(Integer escapes) {
            this.escapes = escapes;
            return this;
        }

        public Builder sweeps(Integer sweeps) {
            this.sweeps = sweeps;
            return this;
        }

        public Builder takedowns(Integer takedowns) {
            this.takedowns = takedowns;
            return this;
        }

        public Builder guardPasses(Integer guardPasses) {
            this.guardPasses = guardPasses;
            return this;
        }

        public Builder submissionsTechniques(List<Technique> submissionTechniques) {
            this.submissionTechniques = submissionTechniques;
            return this;
        }

        public Builder submissionsTechniquesAllowed(List<Technique> submissionTechniquesAllowed) {
            this.submissionTechniquesAllowed = submissionTechniquesAllowed;
            return this;
        }

        public Training build() {
            return new Training(this);
        }
    }

}
