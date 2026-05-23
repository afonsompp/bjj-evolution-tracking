package com.bjj.evolution.academy.clazz.domain;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"scheduled_class_id", "student_id"}))
public class ClassAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_class_id", nullable = false)
    private ScheduledClass scheduledClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserProfile student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckInStatus status;

    private Instant checkInTime;

    protected ClassAttendance() {}

    public ClassAttendance(ScheduledClass scheduledClass, UserProfile student, CheckInStatus status) {
        this.scheduledClass = scheduledClass;
        this.student = student;
        this.status = status;
    }

    public Long getId() { return id; }

    public ScheduledClass getScheduledClass() { return scheduledClass; }

    public UserProfile getStudent() { return student; }

    public CheckInStatus getStatus() { return status; }

    public void setStatus(CheckInStatus status) { this.status = status; }

    public Instant getCheckInTime() { return checkInTime; }

    public void setCheckInTime(Instant checkInTime) { this.checkInTime = checkInTime; }
}
