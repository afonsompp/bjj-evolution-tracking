package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AcademyService {

    private final AcademyRepository academyRepository;
    private final AcademyMemberRepository academyMemberRepository;
    private final UserProfileRepository userProfileRepository;

    public AcademyService(AcademyRepository academyRepository,
                          AcademyMemberRepository academyMemberRepository,
                          UserProfileRepository userProfileRepository) {
        this.academyRepository = academyRepository;
        this.academyMemberRepository = academyMemberRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public AcademyResponse create(AcademyRequest request, UUID ownerId) {
        UserProfile ownerProfile = userProfileRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (SecurityUtils.isNotAdminOrManager(ownerProfile) && !SecurityUtils.isAcademyOwner(ownerProfile)) {
            throw new AccessDeniedException("You do not have permission to create academies.");
        }

        Academy academy = new Academy(request.name(), request.address());
        Academy savedAcademy = academyRepository.save(academy);

        AcademyMember ownerMember = new AcademyMember(
                savedAcademy,
                ownerProfile,
                MemberRole.OWNER,
                MemberStatus.ACTIVE
        );
        academyMemberRepository.save(ownerMember);

        return AcademyResponse.fromEntity(savedAcademy);
    }

    @Transactional(readOnly = true)
    public Page<AcademyResponse> findAllPublic(String query, Pageable pageable) {
        if (query != null && !query.isBlank()) {
            return academyRepository.findByNameContainingIgnoreCase(query, pageable)
                    .map(AcademyResponse::fromEntity);
        }
        return academyRepository.findAll(pageable)
                .map(AcademyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AcademyResponse> findMyAcademies(UUID userId, Pageable pageable) {
        return academyRepository.findAllByUserId(userId, pageable)
                .map(AcademyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AcademyResponse findById(UUID id) {
        return academyRepository.findById(id)
                .map(AcademyResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found with id: " + id));
    }

    @Transactional
    public AcademyResponse update(UUID academyId, AcademyRequest request, UUID requesterId) {
        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found"));

        verifyPermission(academyId, requesterId, MemberRole.MANAGER, MemberRole.OWNER);

        academy.setName(request.name());
        academy.setAddress(request.address());

        return AcademyResponse.fromEntity(academyRepository.save(academy));
    }

    @Transactional
    public void delete(UUID academyId, UUID requesterId) {
        if (!academyRepository.existsById(academyId)) {
            throw new EntityNotFoundException("Academy not found");
        }

        verifyPermission(academyId, requesterId, MemberRole.OWNER);

        academyRepository.deleteById(academyId);
    }

    private void verifyPermission(UUID academyId, UUID userId, MemberRole... allowedRoles) {
        AcademyMember member = academyMemberRepository.findById(new AcademyMemberId(academyId, userId))
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this academy"));

        boolean hasPermission = false;
        for (MemberRole role : allowedRoles) {
            if (member.getRole() == role) {
                hasPermission = true;
                break;
            }
        }

        if (!hasPermission || member.getStatus() != MemberStatus.ACTIVE) {
            throw new AccessDeniedException("Insufficient permissions to perform this action.");
        }
    }
}
