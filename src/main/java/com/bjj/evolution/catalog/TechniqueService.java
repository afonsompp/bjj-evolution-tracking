package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TechniqueService {

    private static final Logger log = LoggerFactory.getLogger(TechniqueService.class);

    private final TechniqueRepository repository;

    public TechniqueService(TechniqueRepository repository) {
        this.repository = repository;
    }

    public TechniqueResponse create(TechniqueRequest request) {
        Technique saved = repository.save(request.toEntity());
        log.info("Technique created: id={} name='{}'", saved.getId(), saved.getName());
        return TechniqueResponse.fromEntity(saved);
    }

    public Page<TechniqueResponse> findAll(String query, Pageable pageable) {
        Page<Technique> techniques;

        if (query != null && !query.isBlank()) {
            log.debug("Searching techniques query='{}' page={} size={}", query, pageable.isPaged() ? pageable.getPageNumber() : "unpaged", pageable.isPaged() ? pageable.getPageSize() : "unpaged");
            techniques = repository.findByNameContainingIgnoreCaseOrAlternativeNameContainingIgnoreCase(
                    query, query, pageable);
        } else {
            log.debug("Listing all techniques page={} size={}", pageable.isPaged() ? pageable.getPageNumber() : "unpaged", pageable.isPaged() ? pageable.getPageSize() : "unpaged");
            techniques = repository.findAll(pageable);
        }

        return techniques.map(TechniqueResponse::fromEntity);
    }

    public TechniqueResponse findById(Long id) {
        log.debug("Fetching technique id={}", id);
        return repository.findById(id)
                .map(TechniqueResponse::fromEntity)
                .orElseThrow(() -> {
                    log.warn("Technique not found id={}", id);
                    return new ResourceNotFoundException("Technique", id);
                });
    }

    public TechniqueResponse update(Long id, TechniqueRequest request) {
        if (!repository.existsById(id)) {
            log.warn("Update failed: technique not found id={}", id);
            throw new ResourceNotFoundException("Technique", id);
        }
        Technique saved = repository.save(request.toEntity(id));
        log.info("Technique updated: id={} name='{}'", saved.getId(), saved.getName());
        return TechniqueResponse.fromEntity(saved);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            log.warn("Delete failed: technique not found id={}", id);
            throw new ResourceNotFoundException("Technique", id);
        }
        repository.deleteById(id);
        log.info("Technique deleted: id={}", id);
    }
}
