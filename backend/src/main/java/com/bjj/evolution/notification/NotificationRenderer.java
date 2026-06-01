package com.bjj.evolution.notification;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.notification.NotificationRecipientResolver.Recipient;
import com.bjj.evolution.notification.event.ClassCanceledEvent;
import com.bjj.evolution.notification.event.ClassUpdatedEvent;
import com.bjj.evolution.notification.event.MemberApprovedEvent;
import com.bjj.evolution.notification.event.MemberJoinRequestedEvent;
import com.bjj.evolution.notification.event.MemberRejectedEvent;
import com.bjj.evolution.notification.event.NotificationEvent;
import com.bjj.evolution.notification.template.NotificationTemplates;
import com.bjj.evolution.notification.template.NotificationTemplates.Rendered;
import com.bjj.evolution.shared.notification.OutboundNotification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Turns a {@link NotificationEvent} into the concrete {@link OutboundNotification}s
 * to dispatch. Reloads fresh data through repositories (the async listener has no
 * open persistence session), resolving recipients and rendering content.
 */
@Component
public class NotificationRenderer {

    private static final List<MemberRole> STAFF_ROLES = List.of(MemberRole.OWNER, MemberRole.MANAGER);
    private static final List<CheckInStatus> ACTIVE_ATTENDANCE = List.of(CheckInStatus.REGISTERED, CheckInStatus.CONFIRMED);

    private final AcademyRepository academyRepository;
    private final AcademyMemberRepository academyMemberRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final ClassAttendanceRepository classAttendanceRepository;
    private final NotificationRecipientResolver recipients;
    private final NotificationTemplates templates;

    public NotificationRenderer(AcademyRepository academyRepository,
                                AcademyMemberRepository academyMemberRepository,
                                ScheduledClassRepository scheduledClassRepository,
                                ClassAttendanceRepository classAttendanceRepository,
                                NotificationRecipientResolver recipients,
                                NotificationTemplates templates) {
        this.academyRepository = academyRepository;
        this.academyMemberRepository = academyMemberRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.classAttendanceRepository = classAttendanceRepository;
        this.recipients = recipients;
        this.templates = templates;
    }

    @Transactional(readOnly = true)
    public List<OutboundNotification> render(NotificationEvent event) {
        return switch (event) {
            case MemberApprovedEvent e -> memberApproved(e);
            case MemberRejectedEvent e -> memberRejected(e);
            case MemberJoinRequestedEvent e -> joinRequested(e);
            case ClassUpdatedEvent e -> classUpdated(e);
            case ClassCanceledEvent e -> classCanceled(e);
        };
    }

    private List<OutboundNotification> memberApproved(MemberApprovedEvent e) {
        Academy academy = academyRepository.findById(e.academyId()).orElse(null);
        Recipient recipient = recipients.forUser(e.userId()).orElse(null);
        if (academy == null || recipient == null || !recipient.hasEmail()) {
            return List.of();
        }
        return List.of(email(recipient, templates.memberApproved(academy.getName(), recipient.name()), "MEMBER_APPROVED"));
    }

    private List<OutboundNotification> memberRejected(MemberRejectedEvent e) {
        Academy academy = academyRepository.findById(e.academyId()).orElse(null);
        Recipient recipient = recipients.forUser(e.userId()).orElse(null);
        if (academy == null || recipient == null || !recipient.hasEmail()) {
            return List.of();
        }
        return List.of(email(recipient, templates.memberRejected(academy.getName(), recipient.name()), "MEMBER_REJECTED"));
    }

    private List<OutboundNotification> joinRequested(MemberJoinRequestedEvent e) {
        Academy academy = academyRepository.findById(e.academyId()).orElse(null);
        if (academy == null) {
            return List.of();
        }
        Recipient requester = recipients.forUser(e.requesterUserId()).orElse(null);
        String requesterName = requester != null ? requester.name() : "Um usuário";
        Rendered rendered = templates.memberJoinRequested(academy.getName(), requesterName);

        List<AcademyMember> staff =
                academyMemberRepository.findByAcademyIdAndRoleInAndStatus(e.academyId(), STAFF_ROLES, MemberStatus.ACTIVE);
        List<OutboundNotification> out = new ArrayList<>();
        for (AcademyMember member : staff) {
            Recipient recipient = recipients.forProfile(member.getUser());
            if (recipient.hasEmail()) {
                out.add(email(recipient, rendered, "MEMBER_JOIN_REQUESTED"));
            }
        }
        return out;
    }

    private List<OutboundNotification> classUpdated(ClassUpdatedEvent e) {
        ScheduledClass clazz = scheduledClassRepository.findById(e.classId()).orElse(null);
        if (clazz == null) {
            return List.of();
        }
        Rendered rendered = templates.classUpdated(
                clazz.getAcademy().getName(),
                clazz.getStartTime(),
                NotificationRecipientResolver.displayName(clazz.getInstructor()));
        return attendeeNotifications(clazz, rendered, "CLASS_UPDATED");
    }

    private List<OutboundNotification> classCanceled(ClassCanceledEvent e) {
        ScheduledClass clazz = scheduledClassRepository.findById(e.classId()).orElse(null);
        if (clazz == null) {
            return List.of();
        }
        Rendered rendered = templates.classCanceled(clazz.getAcademy().getName(), clazz.getStartTime());
        // Recipients were captured at cancellation time — their check-ins are no
        // longer active, so we resolve them by id instead of re-querying attendance.
        List<OutboundNotification> out = new ArrayList<>();
        for (UUID studentId : e.recipientStudentIds()) {
            recipients.forUser(studentId)
                    .filter(Recipient::hasEmail)
                    .ifPresent(recipient -> out.add(email(recipient, rendered, "CLASS_CANCELED")));
        }
        return out;
    }

    private List<OutboundNotification> attendeeNotifications(ScheduledClass clazz, Rendered rendered, String type) {
        List<ClassAttendance> attendances =
                classAttendanceRepository.findByScheduledClassIdAndStatusIn(clazz.getId(), ACTIVE_ATTENDANCE);
        List<OutboundNotification> out = new ArrayList<>();
        for (ClassAttendance attendance : attendances) {
            Recipient recipient = recipients.forProfile(attendance.getStudent());
            if (recipient.hasEmail()) {
                out.add(email(recipient, rendered, type));
            }
        }
        return out;
    }

    private static OutboundNotification email(Recipient recipient, Rendered rendered, String type) {
        return OutboundNotification.email(
                recipient.userId(), recipient.email(), recipient.name(),
                rendered.subject(), rendered.html(), rendered.text(), type);
    }
}
