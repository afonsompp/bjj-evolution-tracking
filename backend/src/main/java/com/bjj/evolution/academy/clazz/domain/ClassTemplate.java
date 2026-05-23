package com.bjj.evolution.academy.clazz.domain;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
public class ClassTemplate {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Column(nullable = false)
        private String name;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "academy_id", nullable = false)
        private Academy academy;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "instructor_id", nullable = false)
        private UserProfile instructor;

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
                name = "class_template_technique",
                joinColumns = @JoinColumn(name = "template_id"),
                inverseJoinColumns = @JoinColumn(name = "technique_id")
        )
        private List<Technique> defaultTechniques;

        @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<ClassRecurrenceRule> recurrenceRules = new ArrayList<>();


        public UUID getId() {
                return id;
        }

        public void setId(UUID id) {
                this.id = id;
        }

        public String getName() {
                return name;
        }

        public void setName(String name) {
                this.name = name;
        }

        public Academy getAcademy() {
                return academy;
        }

        public void setAcademy(Academy academy) {
                this.academy = academy;
        }

        public UserProfile getInstructor() {
                return instructor;
        }

        public void setInstructor(UserProfile instructor) {
                this.instructor = instructor;
        }

        public Duration getDuration() {
                return duration;
        }

        public void setDuration(Duration duration) {
                this.duration = duration;
        }

        public ClassType getClassType() {
                return classType;
        }

        public void setClassType(ClassType classType) {
                this.classType = classType;
        }

        public TrainingType getTrainingType() {
                return trainingType;
        }

        public void setTrainingType(TrainingType trainingType) {
                this.trainingType = trainingType;
        }

        public List<Technique> getDefaultTechniques() {
                return defaultTechniques;
        }

        public void setDefaultTechniques(List<Technique> defaultTechniques) {
                this.defaultTechniques = defaultTechniques;
        }

        public List<ClassRecurrenceRule> getRecurrenceRules() {
                return recurrenceRules;
        }

        public void setRecurrenceRules(List<ClassRecurrenceRule> recurrenceRules) {
                this.recurrenceRules = recurrenceRules;
        }
}
