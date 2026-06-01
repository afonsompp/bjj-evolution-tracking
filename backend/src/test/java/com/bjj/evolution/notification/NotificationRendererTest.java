package com.bjj.evolution.notification;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.notification.NotificationRecipientResolver.Recipient;
import com.bjj.evolution.notification.event.ClassCanceledEvent;
import com.bjj.evolution.notification.event.MemberApprovedEvent;
import com.bjj.evolution.notification.template.NotificationTemplates;
import com.bjj.evolution.shared.notification.NotificationChannel;
import com.bjj.evolution.shared.notification.OutboundNotification;
import com.bjj.evolution.user.domain.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationRendererTest {

    @Mock
    private AcademyRepository academyRepository;
    @Mock
    private AcademyMemberRepository academyMemberRepository;
    @Mock
    private ScheduledClassRepository scheduledClassRepository;
    @Mock
    private ClassAttendanceRepository classAttendanceRepository;
    @Mock
    private NotificationRecipientResolver recipients;

    // Real templates so we verify the rendered subject/body content.
    private final NotificationTemplates templates = new NotificationTemplates();

    private NotificationRenderer renderer;

    @BeforeEach
    void setUp() {
        renderer = new NotificationRenderer(academyRepository, academyMemberRepository,
                scheduledClassRepository, classAttendanceRepository, recipients, templates);
    }

    @Test
    void memberApproved_buildsSingleEmailToStudent() {
        UUID academyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(academyRepository.findById(academyId)).thenReturn(Optional.of(new Academy("Gracie Barra", "addr")));
        when(recipients.forUser(userId)).thenReturn(Optional.of(new Recipient(userId, "student@x.com", "João")));

        List<OutboundNotification> result = renderer.render(new MemberApprovedEvent(academyId, userId));

        assertThat(result).hasSize(1);
        OutboundNotification n = result.get(0);
        assertThat(n.channel()).isEqualTo(NotificationChannel.EMAIL);
        assertThat(n.type()).isEqualTo("MEMBER_APPROVED");
        assertThat(n.toEmail()).isEqualTo("student@x.com");
        assertThat(n.subject()).contains("Gracie Barra");
        assertThat(n.text()).contains("João");
        assertThat(n.html()).contains("João");
    }

    @Test
    void memberApproved_skipsWhenRecipientHasNoEmail() {
        UUID academyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(academyRepository.findById(academyId)).thenReturn(Optional.of(new Academy("Gracie Barra", "addr")));
        when(recipients.forUser(userId)).thenReturn(Optional.of(new Recipient(userId, null, "João")));

        assertThat(renderer.render(new MemberApprovedEvent(academyId, userId))).isEmpty();
    }

    @Test
    void classCanceled_fansOutOnlyToAttendeesWithEmail() {
        Long classId = 1L;
        Academy academy = new Academy("Gracie Barra", "addr");
        UserProfile instructor = profile("Professor", "prof@x.com");
        ScheduledClass clazz = ScheduledClass.builder()
                .academy(academy)
                .instructor(instructor)
                .startTime(Instant.parse("2026-06-04T22:30:00Z"))
                .durationMinutes(60)
                .status(ClassStatus.PUBLISHED)
                .build();
        clazz.setId(classId);
        when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(clazz));

        UserProfile withEmail = profile("Aluno Um", "aluno1@x.com");
        UserProfile withoutEmail = profile("Aluno Dois", null);
        when(recipients.forUser(withEmail.getId()))
                .thenReturn(Optional.of(new Recipient(withEmail.getId(), "aluno1@x.com", "Aluno Um")));
        when(recipients.forUser(withoutEmail.getId()))
                .thenReturn(Optional.of(new Recipient(withoutEmail.getId(), null, "Aluno Dois")));

        List<OutboundNotification> result =
                renderer.render(new ClassCanceledEvent(classId, List.of(withEmail.getId(), withoutEmail.getId())));

        assertThat(result).hasSize(1);
        OutboundNotification n = result.get(0);
        assertThat(n.toEmail()).isEqualTo("aluno1@x.com");
        assertThat(n.type()).isEqualTo("CLASS_CANCELED");
        assertThat(n.subject()).contains("Gracie Barra");
    }

    private static UserProfile profile(String name, String email) {
        UserProfile p = new UserProfile();
        p.setId(UUID.randomUUID());
        p.setName(name);
        p.setNickname("nick-" + UUID.randomUUID());
        p.setEmail(email);
        return p;
    }
}
