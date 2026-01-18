package com.bjj.evolution.catalog;


import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TechniqueService {

    private final TechniqueRepository repository;

    public TechniqueService(TechniqueRepository repository) {
        this.repository = repository;
    }

    public TechniqueResponse create(TechniqueRequest request) {
        Technique technique = request.toEntity();

        Technique saved = repository.save(technique);

        return TechniqueResponse.fromEntity(saved);
    }

    public List<TechniqueResponse> findAll() {
        return repository.findAll().stream()
                .map(TechniqueResponse::fromEntity)
                .toList();
    }

    public TechniqueResponse findById(Long id) {
        return repository.findById(id)
                .map(TechniqueResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Technique not found with id: " + id));
    }

    public TechniqueResponse update(Long id, TechniqueRequest request) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Technique not found with id: " + id);
        }

        Technique updatedEntity = request.toEntity(id);

        Technique saved = repository.save(updatedEntity);
        return TechniqueResponse.fromEntity(saved);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Technique not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
