package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AcademyService {

    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;

    public AcademyService(AcademyRepository academyRepository, UserProfileRepository userProfileRepository) {
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public AcademyResponse create(AcademyRequest request) {
        UserProfile owner = userProfileRepository.findById(request.ownerId())
                .orElseThrow(() -> new EntityNotFoundException("Owner (UserProfile) not found with id: " + request.ownerId()));

        Academy academy = request.toEntity(owner);
        Academy saved = academyRepository.save(academy);

        return AcademyResponse.fromEntity(saved);
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

        if (!existingAcademy.getOwner().getId().equals(request.ownerId())) {
            UserProfile newOwner = userProfileRepository.findById(request.ownerId())
                    .orElseThrow(() -> new EntityNotFoundException("Owner (UserProfile) not found with id: " + request.ownerId()));
            existingAcademy.setOwner(newOwner);
        }

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
