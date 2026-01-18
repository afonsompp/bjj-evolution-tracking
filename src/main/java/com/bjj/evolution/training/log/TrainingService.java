package com.bjj.evolution.training.log;

import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.user.UserProfileRepository; // Assumindo o pacote do seu repositório de perfil
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.training.log.domain.dto.TrainingRequest;
import com.bjj.evolution.training.log.domain.dto.TrainingResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TechniqueRepository techniqueRepository;
    private final UserProfileRepository userProfileRepository;

    public TrainingService(TrainingRepository trainingRepository,
                           TechniqueRepository techniqueRepository,
                           UserProfileRepository userProfileRepository) {
        this.trainingRepository = trainingRepository;
        this.techniqueRepository = techniqueRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public TrainingResponse create(TrainingRequest request, UUID userId) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("UserProfile not found with id: " + userId));

        List<Technique> techniques = resolveTechniques(request.techniqueIds());

        Training saved = trainingRepository.save(request.toEntity(techniques, profile));
        return TrainingResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TrainingResponse> findAll(UUID userId) {
        return trainingRepository.findAllByUserProfileId(userId).stream()
                .map(TrainingResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrainingResponse findById(Long id, UUID userId) {
        // Verifica se o treino existe E pertence ao usuário
        return trainingRepository.findByIdAndUserProfileId(id, userId)
                .map(TrainingResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Training not found for user: " + userId));
    }

    @Transactional
    public TrainingResponse update(Long id, TrainingRequest request, UUID userId) {
        // Validação de existência e propriedade antes de atualizar
        Training existingTraining = trainingRepository.findByIdAndUserProfileId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Training not found or access denied"));

        UserProfile profile = existingTraining.getUserProfile();
        List<Technique> techniques = resolveTechniques(request.techniqueIds());

        Training updated = trainingRepository.save(request.toEntity(id, techniques, profile));
        return TrainingResponse.fromEntity(updated);
    }

    @Transactional
    public void delete(Long id, UUID userId) {
        if (!trainingRepository.existsByIdAndUserProfileId(id, userId)) {
            throw new EntityNotFoundException("Training not found or access denied");
        }
        trainingRepository.deleteById(id);
    }

    private List<Technique> resolveTechniques(List<Long> techniqueIds) {
        if (techniqueIds == null || techniqueIds.isEmpty()) {
            return List.of();
        }
        List<Technique> techniques = techniqueRepository.findAllById(techniqueIds);
        if (techniques.size() != techniqueIds.size()) {
            throw new EntityNotFoundException("One or more techniques not found");
        }
        return techniques;
    }
}
