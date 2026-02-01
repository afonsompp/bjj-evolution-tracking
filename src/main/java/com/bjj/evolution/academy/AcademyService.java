package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.academy.member.AcademyMemberRepository;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.MemberRole;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import com.nimbusds.jwt.JWT;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AcademyService {

    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;
    private final AcademyMemberRepository academyMemberRepository;

    public AcademyService(AcademyRepository academyRepository, UserProfileRepository userProfileRepository, AcademyMemberRepository academyMemberRepository) {
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
        this.academyMemberRepository = academyMemberRepository;
    }

    @Transactional
    public AcademyResponse create(Jwt jwt, AcademyRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());

        UserProfile currentUser = userProfileRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (SecurityUtils.isNotAdminOrManager(currentUser) || !SecurityUtils.isAcademyOwner(currentUser)) {
            throw new SecurityException("User must be an admin, manager or academy owner to create an academy");
        }
        UserProfile user = userProfileRepository.findById(request.ownerId())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        Academy academy = new Academy(request.name(), request.address());
        academy = academyRepository.save(academy);

        AcademyMember ownerMember = new AcademyMember(
                academy,
                user,
                MemberRole.OWNER,
                MemberStatus.ACTIVE
        );
        academyMemberRepository.save(ownerMember);

        return AcademyResponse.fromEntity(academy);
    }

    @Transactional(readOnly = true)
    public Page<AcademyResponse> findAll(String query, Pageable pageable) {
        if (query != null && !query.isBlank()) {
            return academyRepository.findByNameContainingIgnoreCase(query, pageable)
                    .map(AcademyResponse::fromEntity);
        }
        return academyRepository.findAll(pageable)
                .map(AcademyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AcademyResponse findById(UUID id) {
        return academyRepository.findById(id)
                .map(AcademyResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found with id: " + id));
    }

    @Transactional
    public AcademyResponse update(UUID id, AcademyRequest request) {
        Academy existingAcademy = academyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found with id: " + id));

        existingAcademy.setName(request.name());
        existingAcademy.setAddress(request.address());

        Academy updated = academyRepository.save(existingAcademy);
        return AcademyResponse.fromEntity(updated);
    }

    @Transactional
    public void delete(UUID id) {
        if (!academyRepository.existsById(id)) {
            throw new EntityNotFoundException("Academy not found with id: " + id);
        }
        academyRepository.deleteById(id);
    }
}
