package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberRequest;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberResponse;
import com.bjj.evolution.academy.member.domain.dto.GraduationRequest;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.EntityNotFoundException;
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

    public AcademyMemberService(AcademyMemberRepository memberRepository,
                                AcademyRepository academyRepository,
                                UserProfileRepository userProfileRepository) {
        this.memberRepository = memberRepository;
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public AcademyMemberResponse createMember(UUID academyId, AcademyMemberRequest request) {
        if (memberRepository.existsById(new AcademyMemberId(academyId, request.userId()))) {
            throw new IllegalArgumentException("User is already a member of this academy.");
        }

        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found"));

        UserProfile user = userProfileRepository.findById(request.userId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Criação manual já define status ACTIVE por padrão, a menos que especificado
        AcademyMember newMember = request.toEntity(academy, user);
        newMember.setStatus(MemberStatus.ACTIVE); // Força ativo pois foi criado por instrutor

        // Se informou faixa na criação, já sincroniza
        if (request.belt() != null) {
            newMember.setBelt(request.belt());
            newMember.setStripe(request.stripe() != null ? request.stripe() : 0);
            syncGlobalProfile(user, newMember.getBelt(), newMember.getStripe());
        }

        return AcademyMemberResponse.fromEntity(memberRepository.save(newMember));
    }

    @Transactional
    public AcademyMemberResponse joinAcademy(UUID academyId, UUID userId) {
        if (memberRepository.existsById(new AcademyMemberId(academyId, userId))) {
            throw new IllegalArgumentException("User is already a member or has a pending request.");
        }

        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found"));

        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        AcademyMember member = new AcademyMember(academy, user, MemberRole.STUDENT, MemberStatus.PENDING);

        // Usa a faixa atual do usuário como base
        member.setBelt(user.getBelt() != null ? user.getBelt() : Belt.WHITE);
        member.setStripe(user.getStripe() != null ? user.getStripe() : 0);

        return AcademyMemberResponse.fromEntity(memberRepository.save(member));
    }

    @Transactional
    public AcademyMemberResponse updateMember(UUID academyId, UUID userId, AcademyMemberRequest request) {
        AcademyMember member = findMemberOrThrow(academyId, userId);

        // Atualiza apenas dados administrativos (Role)
        // Não altera faixa/grau aqui (use graduateMember)
        // Não altera status aqui (use approveMember)

        if (request.role() != null) {
            // Regra opcional: Impedir alterar role do único OWNER
            if (member.getRole() == MemberRole.OWNER && request.role() != MemberRole.OWNER) {
                validateOwnerRemoval(academyId);
            }
            member.setRole(request.role());
        }

        return AcademyMemberResponse.fromEntity(memberRepository.save(member));
    }

    @Transactional
    public AcademyMemberResponse graduateMember(UUID academyId, UUID userId, GraduationRequest request) {
        AcademyMember member = findMemberOrThrow(academyId, userId);
        UserProfile user = member.getUser();

        member.setBelt(request.newBelt());
        member.setStripe(request.newStripe() != null ? request.newStripe() : 0);

        // Sincroniza sempre (Permite correção/downgrade conforme solicitado)
        syncGlobalProfile(user, member.getBelt(), member.getStripe());

        return AcademyMemberResponse.fromEntity(memberRepository.save(member));
    }

    @Transactional
    public AcademyMemberResponse approveMember(UUID academyId, UUID userId) {
        AcademyMember member = findMemberOrThrow(academyId, userId);

        if (member.getStatus() != MemberStatus.PENDING) {
            throw new IllegalStateException("Member is not pending approval.");
        }

        member.setStatus(MemberStatus.ACTIVE);
        return AcademyMemberResponse.fromEntity(memberRepository.save(member));
    }

    @Transactional
    public void removeMember(UUID academyId, UUID userId) {
        AcademyMember member = findMemberOrThrow(academyId, userId);

        if (member.getRole() == MemberRole.OWNER) {
            validateOwnerRemoval(academyId);
        }

        memberRepository.deleteById(member.getId());
    }

    // --- Helpers ---

    private AcademyMember findMemberOrThrow(UUID academyId, UUID userId) {
        return memberRepository.findById(new AcademyMemberId(academyId, userId))
                .orElseThrow(() -> new EntityNotFoundException("Member not found"));
    }

    private void validateOwnerRemoval(UUID academyId) {
        long ownersCount = memberRepository.countByAcademyIdAndRole(academyId, MemberRole.OWNER);
        if (ownersCount <= 1) {
            throw new IllegalStateException("Cannot remove or downgrade the only owner of the academy.");
        }
    }

    private void syncGlobalProfile(UserProfile user, Belt newBelt, Integer newStripe) {
        boolean updated = false;

        if (newBelt != null && newBelt != user.getBelt()) {
            user.setBelt(newBelt);
            updated = true;
        }

        if (newStripe != null && !newStripe.equals(user.getStripe())) {
            user.setStripe(newStripe);
            updated = true;
        }

        if (updated) {
            userProfileRepository.save(user);
        }
    }

    // --- Finders (Mantidos) ---
    @Transactional(readOnly = true)
    public Page<AcademyMemberResponse> findAll(UUID academyId, String query, Pageable pageable) {
        if (!academyRepository.existsById(academyId)) {
            throw new EntityNotFoundException("Academy not found");
        }
        if (query != null && !query.isBlank()) {
            return memberRepository.findByAcademyIdAndUserName(academyId, query, pageable)
                    .map(AcademyMemberResponse::fromEntity);
        }
        return memberRepository.findAllByAcademyId(academyId, pageable)
                .map(AcademyMemberResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AcademyMemberResponse findById(UUID academyId, UUID userId) {
        return AcademyMemberResponse.fromEntity(findMemberOrThrow(academyId, userId));
    }
}
