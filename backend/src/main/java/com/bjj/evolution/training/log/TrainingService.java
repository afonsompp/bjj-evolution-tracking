package com.bjj.evolution.training.log;

import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.training.log.domain.dto.TrainingRequest;
import com.bjj.evolution.training.log.domain.dto.TrainingResponse;
import com.bjj.evolution.training.log.domain.dto.TrainingStatsResponse;
import com.bjj.evolution.training.log.domain.dto.DashboardResponse;
import com.bjj.evolution.training.log.domain.dto.TechniqueCount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TechniqueRepository techniqueRepository;
    private final UserProfileRepository userProfileRepository;

    private static final Logger log = LoggerFactory.getLogger(TrainingService.class);

    public TrainingService(TrainingRepository trainingRepository,
                           TechniqueRepository techniqueRepository,
                           UserProfileRepository userProfileRepository) {
        this.trainingRepository = trainingRepository;
        this.techniqueRepository = techniqueRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public TrainingResponse create(TrainingRequest request, UUID userId) {
        log.info("Creating training for user={} type={} class={}", userId, request.trainingType(), request.classType());

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("Training creation failed: user profile not found user={}", userId);
                    return new ResourceNotFoundException("User", userId);
                });

        List<Technique> techniques = resolveTechniques(request.techniqueIds());
        List<Technique> submissionTechniques = resolveTechniques(request.submissionTechniqueIds());
        List<Technique> submissionTechniquesAllowed = resolveTechniques(request.submissionTechniqueAllowedIds());

        log.debug("Techniques resolved for training: positions={} submissions={} allowed={}",
                techniques.size(), submissionTechniques.size(), submissionTechniquesAllowed.size());

        Training saved = trainingRepository.save(
                request.toEntity(techniques, submissionTechniques, submissionTechniquesAllowed, profile));
        log.info("Training created: id={} user={} date={}", saved.getId(), userId, saved.getSessionDate());
        return TrainingResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<TrainingResponse> findAll(
            UUID userId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        if (startDate != null && endDate != null) {
            return trainingRepository
                    .findAllByUserProfileIdAndSessionDateBetween(userId, startDate, endDate, pageable)
                    .map(TrainingResponse::fromEntity);
        }
        return trainingRepository
                .findAllByUserProfileId(userId, pageable)
                .map(TrainingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TrainingResponse findById(Long id, UUID userId) {
        log.debug("Fetching training id={} for user={}", id, userId);
        return trainingRepository.findByIdAndUserProfileId(id, userId)
                .map(TrainingResponse::fromEntity)
                .orElseThrow(() -> {
                    log.warn("Training not found: id={} user={}", id, userId);
                    return new ResourceNotFoundException("Training", id);
                });
    }

    @Transactional
    public TrainingResponse update(Long id, TrainingRequest request, UUID userId) {
        log.info("Updating training id={} for user={}", id, userId);

        Training existingTraining = trainingRepository.findByIdAndUserProfileId(id, userId)
                .orElseThrow(() -> {
                    log.warn("Training update failed: not found id={} user={}", id, userId);
                    return new ResourceNotFoundException("Training", id);
                });

        UserProfile profile = existingTraining.getUserProfile();
        List<Technique> techniques = resolveTechniques(request.techniqueIds());
        List<Technique> subTechniques = resolveTechniques(request.submissionTechniqueIds());
        List<Technique> subTechniquesAllowed = resolveTechniques(request.submissionTechniqueAllowedIds());

        Training updated = trainingRepository.save(
                request.toEntity(id, techniques, subTechniques, subTechniquesAllowed, profile));
        log.info("Training updated: id={} user={}", id, userId);
        return TrainingResponse.fromEntity(updated);
    }

    @Transactional
    public void delete(Long id, UUID userId) {
        log.info("Deleting training id={} for user={}", id, userId);
        if (!trainingRepository.existsByIdAndUserProfileId(id, userId)) {
            log.warn("Training deletion failed: not found id={} user={}", id, userId);
            throw new ResourceNotFoundException("Training", id);
        }
        trainingRepository.deleteById(id);
        log.info("Training deleted: id={}", id);
    }

    @Transactional(readOnly = true)
    public TrainingStatsResponse getStats(UUID userId, LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Computing stats for user={} start={} end={}", userId, startDate, endDate);
        List<Object[]> results = trainingRepository.computeStats(userId, startDate, endDate);
        Object[] row = results.isEmpty() ? new Object[11] : results.getFirst();
        return TrainingStatsResponse.fromProjection(row);
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardMetrics(UUID userId, int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentStart = now.minusDays(days);
        LocalDateTime previousEnd = currentStart;
        LocalDateTime previousStart = previousEnd.minusDays(days);

        TrainingStatsResponse current = getStats(userId, currentStart, now);
        TrainingStatsResponse previous = getStats(userId, previousStart, previousEnd);

        List<Object[]> attackRows = trainingRepository
                .findTopAttackTechniques(userId, currentStart, now);
        List<Object[]> defenseRows = trainingRepository
                .findTopDefenseTechniques(userId, currentStart, now);

        int maxAttackCount = attackRows.isEmpty() ? 0 : ((Number) attackRows.getFirst()[1]).intValue();
        int maxDefenseCount = defenseRows.isEmpty() ? 0 : ((Number) defenseRows.getFirst()[1]).intValue();

        List<TechniqueCount> topAttacks = attackRows.stream()
                .limit(3)
                .map(row -> TechniqueCount.fromRow(row, maxAttackCount))
                .toList();

        List<TechniqueCount> topDefenses = defenseRows.stream()
                .limit(3)
                .map(row -> TechniqueCount.fromRow(row, maxDefenseCount))
                .toList();

        return new DashboardResponse(current, previous, topAttacks, topDefenses);
    }

    private List<Technique> resolveTechniques(List<Long> techniqueIds) {
        if (techniqueIds == null || techniqueIds.isEmpty()) {
            return List.of();
        }
        log.debug("Resolving {} technique IDs", techniqueIds.size());
        List<Technique> techniques = techniqueRepository.findAllById(techniqueIds);
        if (techniques.size() != techniqueIds.size()) {
            log.warn("Technique resolution mismatch: requested={} found={}", techniqueIds.size(), techniques.size());
            throw new ResourceNotFoundException("One or more techniques not found");
        }
        return techniques;
    }
}
