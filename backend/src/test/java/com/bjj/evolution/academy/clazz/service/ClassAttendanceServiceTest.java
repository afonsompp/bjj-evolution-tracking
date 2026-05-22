package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassAttendanceServiceTest {

    @Mock
    private ClassAttendanceRepository attendanceRepository;

    @Mock
    private ScheduledClassRepository scheduledClassRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private ClassAttendanceService service;

    private UUID academyId;
    private Long classId;
    private UUID studentId;
    private Academy academy;
    private ScheduledClass publishedClass;
    private ScheduledClass draftClass;
    private ScheduledClass completedClass;
    private ScheduledClass canceledClass;
    private UserProfile student;
    private ClassAttendance sampleAttendance;

    @Captor
    private ArgumentCaptor<ClassAttendance> attendanceCaptor;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        classId = 1L;
        studentId = UUID.randomUUID();

        academy = new Academy("Gracie Barra", "123 Main St");
        // Set ID via reflection since Academy uses generated UUID
        // Use setId if available, otherwise use reflection
        // Academy has no setId — it's generated. Create with a known ID by setting the field.
        // We'll use the constructor and need to work around the generated ID.
        // Let's keep it simple: the Academy constructor doesn't setId, so we rely on
        // getScheduledClassAndValidateAcademy comparing scheduledClass.getAcademy().getId() with academyId.
        // In tests, we need to ensure the academy returned from the repo has the correct ID.
        // We'll use a test helper to create Academy with a specific ID.
    }

    /**
     * Creates an Academy with a known ID for testing, since Academy uses @GeneratedValue for its UUID.
     */
    private Academy createAcademy(UUID id, String name) {
        // Academy uses @GeneratedValue(GenerationType.UUID), so we can't set the ID
        // via constructor. Use setId after construction instead.
        Academy ac = new Academy(name, null);
        ac.setId(id);
        return ac;
    }

    private ScheduledClass createScheduledClass(Long id, Academy academy, UserProfile instructor, ClassStatus status) {
        ScheduledClass sc = ScheduledClass.builder()
                .academy(academy)
                .instructor(instructor)
                .startTime(Instant.parse("2025-06-01T10:00:00Z"))
                .duration(Duration.ofMinutes(90))
                .classType(com.bjj.evolution.catalog.domain.ClassType.REGULAR)
                .trainingType(com.bjj.evolution.catalog.domain.TrainingType.GI)
                .scheduledTechniques(List.of())
                .status(status)
                .build();
        if (id != null) {
            sc.setId(id);
        }
        return sc;
    }

    private UserProfile createStudent() {
        return new UserProfile(studentId, "Jane", "Doe", "jane_bjj",
                null, null, null, null);
    }

    private ClassAttendance createAttendance(ScheduledClass scheduledClass, UserProfile student,
                                              CheckInStatus status, Instant checkInTime) {
        ClassAttendance attendance = new ClassAttendance(scheduledClass, student, status);
        if (checkInTime != null) {
            attendance.setCheckInTime(checkInTime);
        }
        return attendance;
    }

    // -----------------------------------------------------------
    // register()
    // -----------------------------------------------------------

    @Nested
    @DisplayName("register()")
    class RegisterTests {

        @Test
        @DisplayName("should register student successfully for a published class")
        void shouldRegisterSuccessfully() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var student = createStudent();

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.empty());
            when(userProfileRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(attendanceRepository.save(any(ClassAttendance.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            var response = service.register(academyId, classId, studentId);

            assertThat(response.classId()).isEqualTo(classId);
            assertThat(response.status()).isEqualTo(CheckInStatus.REGISTERED);

            verify(attendanceRepository).save(attendanceCaptor.capture());
            ClassAttendance saved = attendanceCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(CheckInStatus.REGISTERED);
            assertThat(saved.getStudent()).isEqualTo(student);
            assertThat(saved.getScheduledClass()).isEqualTo(sClass);
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class is DRAFT")
        void shouldThrow_whenClassIsDraft() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.DRAFT);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("published");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class is COMPLETED")
        void shouldThrow_whenClassIsCompleted() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.COMPLETED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("published");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class is CANCELED")
        void shouldThrow_whenClassIsCanceled() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.CANCELED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("published");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when student is already registered")
        void shouldThrow_whenAlreadyRegistered() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(new ClassAttendance(sClass, createStudent(), CheckInStatus.REGISTERED)));

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("already registered");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when student already registered with CONFIRMED status")
        void shouldThrow_whenAlreadyConfirmed() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(new ClassAttendance(sClass, createStudent(), CheckInStatus.CONFIRMED)));

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("already registered");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when class does not exist")
        void shouldThrow_whenClassNotFound() {
            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Class");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when student profile does not exist")
        void shouldThrow_whenStudentNotFound() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.empty());
            when(userProfileRepository.findById(studentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Student");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class belongs to a different academy")
        void shouldThrow_whenAcademyMismatch() {
            var wrongAcademy = createAcademy(UUID.randomUUID(), "Wrong Academy");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, wrongAcademy, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.register(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("academy");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when academyId is null")
        void shouldThrow_whenAcademyIdNull() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.register(null, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("academy");

            verify(attendanceRepository, never()).save(any());
        }
    }

    // -----------------------------------------------------------
    // confirm()
    // -----------------------------------------------------------

    @Nested
    @DisplayName("confirm()")
    class ConfirmTests {

        @Test
        @DisplayName("should confirm attendance successfully when status is REGISTERED")
        void shouldConfirmSuccessfully() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var student = createStudent();
            var attendance = createAttendance(sClass, student, CheckInStatus.REGISTERED, null);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(attendance));
            when(attendanceRepository.save(any(ClassAttendance.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            var response = service.confirm(academyId, classId, studentId);

            assertThat(response.status()).isEqualTo(CheckInStatus.CONFIRMED);
            verify(attendanceRepository).save(attendanceCaptor.capture());
            assertThat(attendanceCaptor.getValue().getStatus()).isEqualTo(CheckInStatus.CONFIRMED);
            assertThat(attendanceCaptor.getValue().getCheckInTime()).isNotNull();
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when attendance does not exist")
        void shouldThrow_whenAttendanceNotFound() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.confirm(academyId, classId, studentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Attendance record not found");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when attendance is already CANCELED")
        void shouldThrow_whenAlreadyCanceled() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var student = createStudent();
            var attendance = createAttendance(sClass, student, CheckInStatus.CANCELED, null);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(attendance));

            assertThatThrownBy(() -> service.confirm(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("canceled");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class belongs to a different academy")
        void shouldThrow_whenAcademyMismatch() {
            var wrongAcademy = createAcademy(UUID.randomUUID(), "Wrong Academy");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, wrongAcademy, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.confirm(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("academy");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should confirm attendance successfully when status is already CONFIRMED (idempotent)")
        void shouldConfirm_whenAlreadyConfirmed() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var student = createStudent();
            var now = Instant.parse("2025-06-01T10:30:00Z");
            var attendance = createAttendance(sClass, student, CheckInStatus.CONFIRMED, now);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(attendance));
            when(attendanceRepository.save(any(ClassAttendance.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            var response = service.confirm(academyId, classId, studentId);

            assertThat(response.status()).isEqualTo(CheckInStatus.CONFIRMED);
            verify(attendanceRepository).save(attendanceCaptor.capture());
            assertThat(attendanceCaptor.getValue().getCheckInTime()).isNotNull();
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when class does not exist")
        void shouldThrow_whenClassNotFound() {
            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.confirm(academyId, classId, studentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Class");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }
    }

    // -----------------------------------------------------------
    // cancel()
    // -----------------------------------------------------------

    @Nested
    @DisplayName("cancel()")
    class CancelTests {

        @Test
        @DisplayName("should cancel attendance successfully")
        void shouldCancelSuccessfully() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var student = createStudent();
            var attendance = createAttendance(sClass, student, CheckInStatus.REGISTERED, null);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(attendance));
            when(attendanceRepository.save(any(ClassAttendance.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            var response = service.cancel(academyId, classId, studentId);

            assertThat(response.status()).isEqualTo(CheckInStatus.CANCELED);
            verify(attendanceRepository).save(attendanceCaptor.capture());
            assertThat(attendanceCaptor.getValue().getStatus()).isEqualTo(CheckInStatus.CANCELED);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when attendance does not exist")
        void shouldThrow_whenAttendanceNotFound() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.cancel(academyId, classId, studentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Attendance record not found");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class is already COMPLETED")
        void shouldThrow_whenClassIsCompleted() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.COMPLETED);
            var student = createStudent();
            var attendance = createAttendance(sClass, student, CheckInStatus.REGISTERED, null);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(attendance));

            assertThatThrownBy(() -> service.cancel(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("completed");

            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class belongs to a different academy")
        void shouldThrow_whenAcademyMismatch() {
            var wrongAcademy = createAcademy(UUID.randomUUID(), "Wrong Academy");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, wrongAcademy, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.cancel(academyId, classId, studentId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("academy");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }

        @Test
        @DisplayName("should cancel CONFIRMED attendance successfully")
        void shouldCancel_whenAlreadyConfirmed() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var student = createStudent();
            var attendance = createAttendance(sClass, student, CheckInStatus.CONFIRMED, Instant.now());

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId))
                    .thenReturn(Optional.of(attendance));
            when(attendanceRepository.save(any(ClassAttendance.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            var response = service.cancel(academyId, classId, studentId);

            assertThat(response.status()).isEqualTo(CheckInStatus.CANCELED);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when class does not exist")
        void shouldThrow_whenClassNotFound() {
            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.cancel(academyId, classId, studentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Class");

            verify(attendanceRepository, never()).findByScheduledClassIdAndStudentId(any(), any());
            verify(attendanceRepository, never()).save(any());
        }
    }

    // -----------------------------------------------------------
    // listByClass()
    // -----------------------------------------------------------

    @Nested
    @DisplayName("listByClass()")
    class ListByClassTests {

        @Test
        @DisplayName("should return paginated attendances")
        void shouldReturnPage() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var student = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var attendance = createAttendance(sClass, student, CheckInStatus.REGISTERED, null);
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> page = new PageImpl<>(List.of(attendance), pageable, 1);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findAllByScheduledClassId(classId, pageable)).thenReturn(page);

            var result = service.listByClass(academyId, classId, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).classId()).isEqualTo(classId);
            assertThat(result.getContent().get(0).status()).isEqualTo(CheckInStatus.REGISTERED);
        }

        @Test
        @DisplayName("should return empty page when no attendances exist")
        void shouldReturnEmptyPage() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));
            when(attendanceRepository.findAllByScheduledClassId(classId, pageable)).thenReturn(emptyPage);

            var result = service.listByClass(academyId, classId, pageable);

            assertThat(result.getTotalElements()).isZero();
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when class does not exist")
        void shouldThrow_whenClassNotFound() {
            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.listByClass(academyId, classId, PageRequest.of(0, 20)))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Class");

            verify(attendanceRepository, never()).findAllByScheduledClassId(any(), any());
        }

        @Test
        @DisplayName("should throw BusinessRuleException when class belongs to a different academy")
        void shouldThrow_whenAcademyMismatch() {
            var wrongAcademy = createAcademy(UUID.randomUUID(), "Wrong Academy");
            var instructor = createStudent();
            var sClass = createScheduledClass(classId, wrongAcademy, instructor, ClassStatus.PUBLISHED);

            when(scheduledClassRepository.findById(classId)).thenReturn(Optional.of(sClass));

            assertThatThrownBy(() -> service.listByClass(academyId, classId, PageRequest.of(0, 20)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("academy");

            verify(attendanceRepository, never()).findAllByScheduledClassId(any(), any());
        }
    }

    // -----------------------------------------------------------
    // findClassViewsByStudent()
    // -----------------------------------------------------------

    @Nested
    @DisplayName("findClassViewsByStudent()")
    class FindClassViewsByStudentTests {

        @Test
        @DisplayName("should return paginated results without status filter")
        void shouldReturnPageWithoutStatus() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var student = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var attendance = createAttendance(sClass, student, CheckInStatus.REGISTERED, null);
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> page = new PageImpl<>(List.of(attendance), pageable, 1);

            when(attendanceRepository.findByStudentId(studentId, pageable)).thenReturn(page);

            var result = service.findClassViewsByStudent(studentId, null, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).status()).isEqualTo(CheckInStatus.REGISTERED);

            verify(attendanceRepository).findByStudentId(studentId, pageable);
            verify(attendanceRepository, never()).findByStudentIdAndStatus(any(), any(), any());
        }

        @Test
        @DisplayName("should return paginated results with status filter")
        void shouldReturnPageWithStatus() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var student = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var attendance = createAttendance(sClass, student, CheckInStatus.CONFIRMED, Instant.now());
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> page = new PageImpl<>(List.of(attendance), pageable, 1);

            when(attendanceRepository.findByStudentIdAndStatus(studentId, CheckInStatus.CONFIRMED, pageable))
                    .thenReturn(page);

            var result = service.findClassViewsByStudent(studentId, CheckInStatus.CONFIRMED, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).status()).isEqualTo(CheckInStatus.CONFIRMED);

            verify(attendanceRepository).findByStudentIdAndStatus(studentId, CheckInStatus.CONFIRMED, pageable);
            verify(attendanceRepository, never()).findByStudentId(any(), any());
        }

        @Test
        @DisplayName("should return empty page when no attendances exist")
        void shouldReturnEmptyPage() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(attendanceRepository.findByStudentId(studentId, pageable)).thenReturn(emptyPage);

            var result = service.findClassViewsByStudent(studentId, null, pageable);

            assertThat(result.getTotalElements()).isZero();
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("should return empty page with status filter when no matching attendances")
        void shouldReturnEmptyPage_withStatus() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(attendanceRepository.findByStudentIdAndStatus(studentId, CheckInStatus.CONFIRMED, pageable))
                    .thenReturn(emptyPage);

            var result = service.findClassViewsByStudent(studentId, CheckInStatus.CONFIRMED, pageable);

            assertThat(result.getTotalElements()).isZero();
            assertThat(result.getContent()).isEmpty();
        }
    }

    // -----------------------------------------------------------
    // findClassViewsByStudentAndAcademy()
    // -----------------------------------------------------------

    @Nested
    @DisplayName("findClassViewsByStudentAndAcademy()")
    class FindClassViewsByStudentAndAcademyTests {

        @Test
        @DisplayName("should return paginated results without status filter")
        void shouldReturnPageWithoutStatus() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var student = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var attendance = createAttendance(sClass, student, CheckInStatus.REGISTERED, null);
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> page = new PageImpl<>(List.of(attendance), pageable, 1);

            when(attendanceRepository.findByStudentIdAndScheduledClassAcademyId(studentId, academyId, pageable))
                    .thenReturn(page);

            var result = service.findClassViewsByStudentAndAcademy(academyId, studentId, null, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).status()).isEqualTo(CheckInStatus.REGISTERED);

            verify(attendanceRepository).findByStudentIdAndScheduledClassAcademyId(studentId, academyId, pageable);
            verify(attendanceRepository, never()).findByStudentIdAndScheduledClassAcademyIdAndStatus(any(), any(), any(), any());
        }

        @Test
        @DisplayName("should return paginated results with status filter")
        void shouldReturnPageWithStatus() {
            var ac = createAcademy(academyId, "Gracie Barra");
            var instructor = createStudent();
            var student = createStudent();
            var sClass = createScheduledClass(classId, ac, instructor, ClassStatus.PUBLISHED);
            var attendance = createAttendance(sClass, student, CheckInStatus.CONFIRMED, Instant.now());
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> page = new PageImpl<>(List.of(attendance), pageable, 1);

            when(attendanceRepository.findByStudentIdAndScheduledClassAcademyIdAndStatus(
                    studentId, academyId, CheckInStatus.CONFIRMED, pageable))
                    .thenReturn(page);

            var result = service.findClassViewsByStudentAndAcademy(academyId, studentId, CheckInStatus.CONFIRMED, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).status()).isEqualTo(CheckInStatus.CONFIRMED);

            verify(attendanceRepository).findByStudentIdAndScheduledClassAcademyIdAndStatus(
                    studentId, academyId, CheckInStatus.CONFIRMED, pageable);
            verify(attendanceRepository, never()).findByStudentIdAndScheduledClassAcademyId(any(), any(), any());
        }

        @Test
        @DisplayName("should return empty page when no attendances exist")
        void shouldReturnEmptyPage() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<ClassAttendance> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(attendanceRepository.findByStudentIdAndScheduledClassAcademyId(studentId, academyId, pageable))
                    .thenReturn(emptyPage);

            var result = service.findClassViewsByStudentAndAcademy(academyId, studentId, null, pageable);

            assertThat(result.getTotalElements()).isZero();
            assertThat(result.getContent()).isEmpty();
        }
    }
}
