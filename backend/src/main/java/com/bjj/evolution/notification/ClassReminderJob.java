package com.bjj.evolution.notification;

import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.notification.NotificationRecipientResolver.Recipient;
import com.bjj.evolution.notification.template.NotificationTemplates;
import com.bjj.evolution.notification.template.NotificationTemplates.Rendered;
import com.bjj.evolution.shared.notification.NotificationDispatcher;
import com.bjj.evolution.shared.notification.OutboundNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Periodically emails enrolled students a reminder for classes starting within
 * the configured window. Each class is reminded at most once — {@code reminderSentAt}
 * is stamped after dispatch (see {@link ClassReminderProperties}).
 */
@Component
public class ClassReminderJob {

    private static final Logger log = LoggerFactory.getLogger(ClassReminderJob.class);

    private static final List<CheckInStatus> ACTIVE_ATTENDANCE = List.of(CheckInStatus.REGISTERED, CheckInStatus.CONFIRMED);

    private final ScheduledClassRepository scheduledClassRepository;
    private final ClassAttendanceRepository classAttendanceRepository;
    private final NotificationRecipientResolver recipients;
    private final NotificationTemplates templates;
    private final NotificationDispatcher dispatcher;
    private final ClassReminderProperties properties;

    public ClassReminderJob(ScheduledClassRepository scheduledClassRepository,
                            ClassAttendanceRepository classAttendanceRepository,
                            NotificationRecipientResolver recipients,
                            NotificationTemplates templates,
                            NotificationDispatcher dispatcher,
                            ClassReminderProperties properties) {
        this.scheduledClassRepository = scheduledClassRepository;
        this.classAttendanceRepository = classAttendanceRepository;
        this.recipients = recipients;
        this.templates = templates;
        this.dispatcher = dispatcher;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${notification.class-reminder.fixed-delay-ms:300000}")
    @Transactional
    public void sendUpcomingReminders() {
        if (!properties.enabled()) {
            return;
        }
        Instant now = Instant.now();
        Instant until = now.plus(Duration.ofHours(properties.hoursBefore()));

        List<ScheduledClass> classes = scheduledClassRepository
                .findByStatusAndReminderSentAtIsNullAndStartTimeBetween(ClassStatus.PUBLISHED, now, until);
        if (classes.isEmpty()) {
            return;
        }

        int remindedClasses = 0;
        int emails = 0;
        for (ScheduledClass clazz : classes) {
            Rendered rendered = templates.classReminder(
                    clazz.getAcademy().getName(),
                    clazz.getStartTime(),
                    NotificationRecipientResolver.displayName(clazz.getInstructor()));

            List<ClassAttendance> attendances =
                    classAttendanceRepository.findByScheduledClassIdAndStatusIn(clazz.getId(), ACTIVE_ATTENDANCE);
            for (ClassAttendance attendance : attendances) {
                Recipient recipient = recipients.forProfile(attendance.getStudent());
                if (recipient.hasEmail()) {
                    dispatcher.dispatch(OutboundNotification.email(
                            recipient.userId(), recipient.email(), recipient.name(),
                            rendered.subject(), rendered.html(), rendered.text(), "CLASS_REMINDER"));
                    emails++;
                }
            }
            clazz.setReminderSentAt(now); // flushed by @Transactional — never reminded again
            remindedClasses++;
        }
        log.info("Class reminders sent: classes={} emails={}", remindedClasses, emails);
    }
}
