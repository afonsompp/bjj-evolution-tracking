package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TechniqueService {

    private final TechniqueRepository repository;

    public TechniqueService(TechniqueRepository repository) {
        this.repository = repository;
    }

    public TechniqueResponse create(TechniqueRequest request) {
        Technique saved = repository.save(request.toEntity());
        return TechniqueResponse.fromEntity(saved);
    }

    public Page<TechniqueResponse> findAll(String query, Pageable pageable) {
        Page<Technique> techniques;

        if (query != null && !query.isBlank()) {
            techniques = repository.findByNameContainingIgnoreCaseOrAlternativeNameContainingIgnoreCase(
                    query, query, pageable);
        } else {
            techniques = repository.findAll(pageable);
        }

        return techniques.map(TechniqueResponse::fromEntity);
    }

    public TechniqueResponse findById(Long id) {
        return repository.findById(id)
                .map(TechniqueResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Technique", id));
    }

    public TechniqueResponse update(Long id, TechniqueRequest request) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Technique", id);
        }
        Technique saved = repository.save(request.toEntity(id));
        return TechniqueResponse.fromEntity(saved);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Technique", id);
        }
        repository.deleteById(id);
    }
}
