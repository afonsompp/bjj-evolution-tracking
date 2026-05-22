package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.GraduationHistory;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberRequest;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberResponse;
import com.bjj.evolution.academy.member.domain.dto.GraduationHistoryResponse;
import com.bjj.evolution.academy.member.domain.dto.GraduationRequest;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.audit.AuditAction;
import com.bjj.evolution.audit.annotation.Auditable;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ConflictException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AcademyMemberService {

    private final AcademyMemberRepository memberRepository;
    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;
    private final GraduationHistoryRepository graduationHistoryRepository;

    private static final Logger log = LoggerFactory.getLogger(AcademyMemberService.class);

    public AcademyMemberService(AcademyMemberRepository memberRepository,
                                AcademyRepository academyRepository,
                                UserProfileRepository userProfileRepository,
                                GraduationHistoryRepository graduationHistoryRepository) {
        this.memberRepository = memberRepository;
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
        this.graduationHistoryRepository = graduationHistoryRepository;
    }

    @Transactional
    public AcademyMemberResponse createMember(UUID academyId, AcademyMemberRequest request) {
        log.info("Adding member to academy={} user={} role={}", academyId, request.userId(), request.role());

        if (memberRepository.existsById(new AcademyMemberId(academyId, request.userId()))) {
            log.warn("Member creation failed: duplicate membership academy={} user={}", academyId, request.userId());
            throw new ConflictException("User is already a member of this academy.");
        }
        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> {
                    log.warn("Member creation failed: academy not found academy={}", academyId);
                    return new ResourceNotFoundException("Academy", academyId);
                });
        UserProfile user = userProfileRepository.findById(request.userId())
                .orElseThrow(() -> {
                    log.warn("Member creation failed: user profile not found user={}", request.userId());
                    return new ResourceNotFoundException("User", request.userId());
                });

        AcademyMember newMember = request.toEntity(academy, user);
        newMember.setStatus(MemberStatus.ACTIVE);

        if (request.belt() != null) {
            newMember.setBelt(request.belt());
            newMember.setBeltStripe(request.beltStripe() != null ? request.beltStripe() : 0);
            syncGlobalProfile(user, newMember.getBelt(), newMember.getBeltStripe());
        }

        AcademyMember saved = memberRepository.save(newMember);
        log.info("Member added: academy={} user={} role={} belt={}", academyId, request.userId(), saved.getRole(), saved.getBelt());
        return AcademyMemberResponse.fromEntity(saved);
    }

    @Transactional
    public AcademyMemberResponse joinAcademy(UUID academyId, UUID userId) {
        log.info("User requesting to join academy: user={} academy={}", userId, academyId);

        if (memberRepository.existsById(new AcademyMemberId(academyId, userId))) {
            log.warn("Join request failed: already a member or pending academy={} user={}", academyId, userId);
            throw new ConflictException("User is already a member or has a pending request.");
        }
        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> {
                    log.warn("Join request failed: academy not found academy={}", academyId);
                    return new ResourceNotFoundException("Academy", academyId);
                });
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("Join request failed: user profile not found user={}", userId);
                    return new ResourceNotFoundException("User", userId);
                });
        AcademyMember member = new AcademyMember(academy, user, MemberRole.STUDENT, MemberStatus.PENDING);
        member.setBelt(user.getBelt() != null ? user.getBelt() : Belt.WHITE);
        member.setBeltStripe(user.getBeltStripe() != null ? user.getBeltStripe() : 0);

        AcademyMember saved = memberRepository.save(member);
        log.info("Join request created: academy={} user={} status=PENDING", academyId, userId);
        return AcademyMemberResponse.fromEntity(saved);
    }

    @Transactional
    public AcademyMemberResponse updateMember(UUID academyId, UUID userId, AcademyMemberRequest request) {
        log.info("Updating member: academy={} user={} requestedRole={}", academyId, userId, request.role());

        AcademyMember member = findMemberOrThrow(academyId, userId);
        if (request.role() != null) {
            if (member.getRole() == MemberRole.OWNER && request.role() != MemberRole.OWNER) {
                log.warn("Member update blocked: downgrading sole owner academy={} user={}", academyId, userId);
                validateOwnerRemoval(academyId);
            }
            MemberRole oldRole = member.getRole();
            member.setRole(request.role());
            log.info("Member role changed: academy={} user={} {} -> {}", academyId, userId, oldRole, request.role());
        }
        return AcademyMemberResponse.fromEntity(memberRepository.save(member));
    }

    @Transactional
    @Auditable(action = AuditAction.MEMBER_GRADUATED, resourceType = "MEMBER", academyIdArg = 0, resourceIdArg = 1)
    public AcademyMemberResponse graduateMember(UUID academyId, UUID userId, GraduationRequest request, UUID promoterId) {
        log.info("Graduation requested: academy={} student={} newBelt={} newStripe={} promotedBy={}",
                academyId, userId, request.newBelt(), request.newStripe(), promoterId);

        AcademyMember member = findMemberOrThrow(academyId, userId);
        UserProfile user = member.getUser();
        UserProfile promoter = userProfileRepository.findById(promoterId)
                .orElseThrow(() -> {
                    log.warn("Graduation failed: promoter not found promoter={}", promoterId);
                    return new ResourceNotFoundException("Promoter", promoterId);
                });

        Belt oldBelt = member.getBelt();
        Integer oldStripe = member.getBeltStripe();

        member.setBelt(request.newBelt());
        member.setBeltStripe(request.newStripe() != null ? request.newStripe() : 0);

        GraduationHistory history = new GraduationHistory(
                member.getAcademy(),
                user,
                promoter,
                oldBelt,
                oldStripe,
                member.getBelt(),
                member.getBeltStripe()
        );
        graduationHistoryRepository.save(history);

        syncGlobalProfile(user, member.getBelt(), member.getBeltStripe());

        AcademyMember saved = memberRepository.save(member);
        log.info("Graduation completed: academy={} student={} {} beltStripe {} -> {} beltStripe {}",
                academyId, userId, oldBelt, oldStripe, saved.getBelt(), saved.getBeltStripe());
        return AcademyMemberResponse.fromEntity(saved);
    }

    @Transactional
    @Auditable(action = AuditAction.MEMBER_APPROVED, resourceType = "MEMBER", academyIdArg = 0, resourceIdArg = 1)
    public AcademyMemberResponse approveMember(UUID academyId, UUID userId) {
        log.info("Approving member: academy={} user={}", academyId, userId);

        AcademyMember member = findMemberOrThrow(academyId, userId);
        if (member.getStatus() != MemberStatus.PENDING) {
            log.warn("Approval failed: member not in PENDING status academy={} user={} currentStatus={}",
                    academyId, userId, member.getStatus());
            throw new BusinessRuleException("Member is not pending approval.");
        }
        member.setStatus(MemberStatus.ACTIVE);
        AcademyMember saved = memberRepository.save(member);
        log.info("Member approved: academy={} user={} status=ACTIVE", academyId, userId);
        return AcademyMemberResponse.fromEntity(saved);
    }

    @Transactional
    @Auditable(action = AuditAction.MEMBER_REJECTED, resourceType = "MEMBER", academyIdArg = 0, resourceIdArg = 1)
    public void rejectMember(UUID academyId, UUID userId) {
        log.info("Rejecting join request: academy={} user={}", academyId, userId);
        AcademyMember member = findMemberOrThrow(academyId, userId);
        if (member.getStatus() != MemberStatus.PENDING) {
            log.warn("Rejection failed: member is not PENDING academy={} user={} status={}",
                    academyId, userId, member.getStatus());
            throw new BusinessRuleException("Only pending join requests can be rejected.");
        }
        memberRepository.deleteById(member.getId());
        log.info("Join request rejected: academy={} user={}", academyId, userId);
    }

    @Transactional
    @Auditable(action = AuditAction.MEMBER_REMOVED, resourceType = "MEMBER", academyIdArg = 0, resourceIdArg = 1)
    public void removeMember(UUID academyId, UUID userId) {
        log.info("Removing member: academy={} user={}", academyId, userId);

        AcademyMember member = findMemberOrThrow(academyId, userId);
        if (member.getRole() == MemberRole.OWNER) {
            log.warn("Removal blocked: member is an owner academy={} user={}", academyId, userId);
            validateOwnerRemoval(academyId);
        }
        memberRepository.deleteById(member.getId());
        log.info("Member removed: academy={} user={}", academyId, userId);
    }

    @Transactional
    public void leaveAcademy(UUID academyId, UUID userId) {
        log.info("User leaving academy: academy={} user={}", academyId, userId);

        AcademyMember member = findMemberOrThrow(academyId, userId);
        if (member.getRole() == MemberRole.OWNER) {
            log.warn("Leave blocked: user is an owner academy={} user={}", academyId, userId);
            validateOwnerRemoval(academyId);
        }
        memberRepository.deleteById(member.getId());
        log.info("User left academy: academy={} user={}", academyId, userId);
    }

    @Transactional(readOnly = true)
    public Page<AcademyMemberResponse> findAll(UUID academyId, String query, MemberStatus status, Pageable pageable) {
        if (!academyRepository.existsById(academyId)) {
            log.warn("Member list failed: academy not found academy={}", academyId);
            throw new ResourceNotFoundException("Academy", academyId);
        }

        if (query != null && !query.isBlank() && status != null) {
            return memberRepository.findByAcademyIdAndUserNameAndStatus(academyId, query, status, pageable)
                    .map(AcademyMemberResponse::fromEntity);
        } else if (query != null && !query.isBlank()) {
            return memberRepository.findByAcademyIdAndUserName(academyId, query, pageable)
                    .map(AcademyMemberResponse::fromEntity);
        } else if (status != null) {
            return memberRepository.findAllByAcademyIdAndStatus(academyId, status, pageable)
                    .map(AcademyMemberResponse::fromEntity);
        }
        return memberRepository.findAllByAcademyId(academyId, pageable)
                .map(AcademyMemberResponse::fromEntity);
    }

    private AcademyMember findMemberOrThrow(UUID academyId, UUID userId) {
        return memberRepository.findById(new AcademyMemberId(academyId, userId))
                .orElseThrow(() -> {
                    log.warn("Member not found: academy={} user={}", academyId, userId);
                    return new ResourceNotFoundException("Member not found in academy");
                });
    }

    private void validateOwnerRemoval(UUID academyId) {
        long ownersCount = memberRepository.countByAcademyIdAndRole(academyId, MemberRole.OWNER);
        if (ownersCount <= 1) {
            log.warn("Owner removal blocked: only {} owner(s) in academy={}", ownersCount, academyId);
            throw new BusinessRuleException("Cannot remove or downgrade the only owner of the academy.");
        }
        log.debug("Owner removal allowed: {} owners remain in academy={}", ownersCount - 1, academyId);
    }

    private void syncGlobalProfile(UserProfile user, Belt newBelt, Integer newStripe) {
        boolean updated = false;
        if (newBelt != null && newBelt != user.getBelt()) {
            log.debug("Syncing global belt: user={} {} -> {}", user.getId(), user.getBelt(), newBelt);
            user.setBelt(newBelt);
            updated = true;
        }
        if (newStripe != null && !newStripe.equals(user.getBeltStripe())) {
            log.debug("Syncing global beltStripe: user={} {} -> {}", user.getId(), user.getBeltStripe(), newStripe);
            user.setBeltStripe(newStripe);
            updated = true;
        }
        if (updated) {
            userProfileRepository.save(user);
            log.info("Global profile synced: user={}", user.getId());
        }
    }

    @Transactional(readOnly = true)
    public Page<AcademyMemberResponse> findMyMemberships(UUID userId, MemberStatus status, Pageable pageable) {
        if (status != null) {
            return memberRepository.findAllByUserIdAndStatus(userId, status, pageable)
                    .map(AcademyMemberResponse::fromEntity);
        }
        return memberRepository.findAllByUserId(userId, pageable)
                .map(AcademyMemberResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AcademyMemberResponse findById(UUID academyId, UUID userId) {
        return AcademyMemberResponse.fromEntity(findMemberOrThrow(academyId, userId));
    }

    @Transactional(readOnly = true)
    public Page<GraduationHistoryResponse> findGraduationHistoryByMember(UUID academyId, UUID userId, Pageable pageable) {
        findMemberOrThrow(academyId, userId);
        return graduationHistoryRepository.findByStudentIdOrderByGraduationDateDesc(userId, pageable)
                .map(GraduationHistoryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<GraduationHistoryResponse> findGraduationHistoryByAcademy(UUID academyId, Pageable pageable) {
        if (!academyRepository.existsById(academyId)) {
            throw new ResourceNotFoundException("Academy", academyId);
        }
        return graduationHistoryRepository.findByAcademyIdOrderByGraduationDateDesc(academyId, pageable)
                .map(GraduationHistoryResponse::fromEntity);
    }
}
