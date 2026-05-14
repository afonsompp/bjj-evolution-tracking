package com.bjj.evolution.academy.clazz.domain;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

@Entity
public class ClassRecurrenceRule {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ClassTemplate template;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    public ClassRecurrenceRule() {
    }

    public ClassRecurrenceRule(ClassTemplate template, DayOfWeek dayOfWeek, LocalTime startTime) {
        this.template = template;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
    }

    public UUID getId() {
        return id;
    }

    public ClassTemplate getTemplate() {
        return template;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setTemplate(ClassTemplate template) {
        this.template = template;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
}
