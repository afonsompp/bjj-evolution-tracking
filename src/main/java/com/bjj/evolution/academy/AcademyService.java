package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.shared.utils.SecurityUtils;
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
public class AcademyService {

    private static final Logger log = LoggerFactory.getLogger(AcademyService.class);

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
        log.debug("Attempting to create a new academy '{}' by user {}", request.name(), ownerId);
        UserProfile ownerProfile = userProfileRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", ownerId));

        if (SecurityUtils.isNotAdminOrManager(ownerProfile) && !SecurityUtils.isAcademyOwner(ownerProfile)) {
            log.warn("User {} attempted to create an academy without sufficient privileges", ownerId);
            throw new ForbiddenException("You do not have permission to create academies.");
        }

        Academy academy = new Academy(request.name(), request.address());
        Academy savedAcademy = academyRepository.save(academy);
        log.info("Successfully created academy '{}' with ID {}", savedAcademy.getName(), savedAcademy.getId());

        AcademyMember ownerMember = new AcademyMember(
                savedAcademy,
                ownerProfile,
                ownerProfile.getBelt(),
                ownerProfile.getStripe(),
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
                .orElseThrow(() -> new ResourceNotFoundException("Academy", id));
    }

    @Transactional
    public AcademyResponse update(UUID academyId, AcademyRequest request) {
        log.debug("Updating academy with ID {}", academyId);
        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> new ResourceNotFoundException("Academy", academyId));

        academy.setName(request.name());
        academy.setAddress(request.address());

        log.info("Successfully updated academy with ID {}", academyId);
        return AcademyResponse.fromEntity(academyRepository.save(academy));
    }

    @Transactional
    public void delete(UUID academyId) {
        log.debug("Attempting to delete academy with ID {}", academyId);
        if (!academyRepository.existsById(academyId)) {
            throw new ResourceNotFoundException("Academy", academyId);
        }
        academyRepository.deleteById(academyId);
        log.info("Successfully deleted academy with ID {}", academyId);
    }
}
