package com.bjj.evolution.training.log.domain;

import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.AttributeOverride;
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

import java.time.Instant;
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
    private Instant sessionDate;
    @Column(nullable = false)
    private int durationMinutes;
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
    private int roundLengthMinutes;
    @Column(nullable = false)
    private int restLengthMinutes;
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
    private String description;

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

    public Instant getSessionDate() {
        return sessionDate;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public List<Technique> getTechnique() {
        return technique;
    }

    public Integer getTotalRolls() {
        return totalRolls;
    }

    public int getRoundLengthMinutes() {
        return roundLengthMinutes;
    }

    public int getRestLengthMinutes() {
        return restLengthMinutes;
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

    public String getDescription() {
        return description;
    }

    public List<Technique> getSubmissionTechniquesAllowed() {
        return submissionTechniquesAllowed;
    }
    private Training(Builder builder) {
        this.id = builder.id;
        this.classType = builder.classType;
        this.trainingType = builder.trainingType;
        this.sessionDate = builder.sessionDate;
        this.durationMinutes = builder.durationMinutes;
        this.technique = builder.technique;
        this.totalRolls = builder.totalRolls;
        this.roundLengthMinutes = builder.roundLengthMinutes;
        this.restLengthMinutes = builder.restLengthMinutes;
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
        this.description = builder.description;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private ClassType classType;
        private TrainingType trainingType;
        private Instant sessionDate;
        private int durationMinutes;
        private List<Technique> technique;
        private List<Technique> submissionTechniques;
        private List<Technique> submissionTechniquesAllowed;
        private Integer totalRolls;
        private int roundLengthMinutes;
        private int restLengthMinutes;
        private Rating cardioRating;
        private Rating intensityRating;
        private Integer taps;
        private Integer submissions;
        private Integer escapes;
        private Integer sweeps;
        private Integer takedowns;
        private Integer guardPasses;
        private UserProfile userProfile;
        private String description;

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

        public Builder sessionDate(Instant sessionDate) {
            this.sessionDate = sessionDate;
            return this;
        }

        public Builder durationMinutes(int durationMinutes) {
            this.durationMinutes = durationMinutes;
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

        public Builder roundLengthMinutes(int roundLengthMinutes) {
            this.roundLengthMinutes = roundLengthMinutes;
            return this;
        }

        public Builder restLengthMinutes(int restLengthMinutes) {
            this.restLengthMinutes = restLengthMinutes;
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

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Training build() {
            return new Training(this);
        }
    }

}
