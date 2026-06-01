package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TechniqueServiceTest {

    @Mock
    private TechniqueRepository techniqueRepository;

    @InjectMocks
    private TechniqueService techniqueService;

    @Test
    void create_shouldSaveAndReturnTechniqueResponse() {
        // Arrange
        TechniqueRequest request = new TechniqueRequest("Armbar", "Juji Gatame", null, null);
        Technique savedTechnique = request.toEntity(1L);

        when(techniqueRepository.save(any(Technique.class))).thenReturn(savedTechnique);

        // Act
        TechniqueResponse result = techniqueService.create(request);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Armbar", result.name());
        verify(techniqueRepository, times(1)).save(any(Technique.class));
    }

    @Test
    void findAll_whenQueryIsPresent_shouldCallFindByQuery() {
        // Arrange
        Pageable pageable = Pageable.unpaged();
        Technique technique = new Technique(1L, "Armbar", null, null, null);
        Page<Technique> techniquePage = new PageImpl<>(List.of(technique));
        String query = "arm";

        when(techniqueRepository.findByNameContainingIgnoreCaseOrAlternativeNameContainingIgnoreCase(query, query, pageable))
                .thenReturn(techniquePage);

        // Act
        Page<TechniqueResponse> result = techniqueService.findAll(query, pageable);

        // Assert
        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals("Armbar", result.getContent().get(0).name());
        verify(techniqueRepository, never()).findAll(pageable);
    }

    @Test
    void findAll_whenQueryIsBlank_shouldCallFindAll() {
        // Arrange
        Pageable pageable = Pageable.unpaged();
        Technique technique = new Technique(1L, "Armbar", null, null, null);
        Page<Technique> techniquePage = new PageImpl<>(List.of(technique));

        when(techniqueRepository.findAll(pageable)).thenReturn(techniquePage);

        // Act
        Page<TechniqueResponse> result = techniqueService.findAll("", pageable);

        // Assert
        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        verify(techniqueRepository, times(1)).findAll(pageable);
        verify(techniqueRepository, never()).findByNameContainingIgnoreCaseOrAlternativeNameContainingIgnoreCase(anyString(), anyString(), any());
    }

    @Test
    void findById_whenTechniqueExists_shouldReturnTechniqueResponse() {
        // Arrange
        long id = 1L;
        Technique technique = new Technique(id, "Kimura", null, null, null);
        when(techniqueRepository.findById(id)).thenReturn(Optional.of(technique));

        // Act
        TechniqueResponse result = techniqueService.findById(id);

        // Assert
        assertNotNull(result);
        assertEquals(id, result.id());
        assertEquals("Kimura", result.name());
    }

    @Test
    void findById_whenTechniqueDoesNotExist_shouldThrowEntityNotFoundException() {
        // Arrange
        long id = 1L;
        when(techniqueRepository.findById(id)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> techniqueService.findById(id));
    }

    @Test
    void update_whenTechniqueExists_shouldUpdateAndReturnTechniqueResponse() {
        // Arrange
        long id = 1L;
        TechniqueRequest request = new TechniqueRequest("Updated Name", null, null, null);
        Technique updatedTechnique = request.toEntity(id);

        when(techniqueRepository.existsById(id)).thenReturn(true);
        when(techniqueRepository.save(any(Technique.class))).thenReturn(updatedTechnique);

        // Act
        TechniqueResponse result = techniqueService.update(id, request);

        // Assert
        assertNotNull(result);
        assertEquals(id, result.id());
        assertEquals("Updated Name", result.name());
        verify(techniqueRepository, times(1)).save(any(Technique.class));
    }

    @Test
    void update_whenTechniqueDoesNotExist_shouldThrowEntityNotFoundException() {
        // Arrange
        long id = 1L;
        TechniqueRequest request = new TechniqueRequest("name", null, null, null);
        when(techniqueRepository.existsById(id)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> techniqueService.update(id, request));
        verify(techniqueRepository, never()).save(any());
    }

    @Test
    void delete_whenTechniqueExists_shouldCallDeleteById() {
        // Arrange
        long id = 1L;
        when(techniqueRepository.existsById(id)).thenReturn(true);
        doNothing().when(techniqueRepository).deleteById(id);

        // Act
        techniqueService.delete(id);

        // Assert
        verify(techniqueRepository, times(1)).deleteById(id);
    }

    @Test
    void delete_whenTechniqueDoesNotExist_shouldThrowEntityNotFoundException() {
        // Arrange
        long id = 1L;
        when(techniqueRepository.existsById(id)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> techniqueService.delete(id));
        verify(techniqueRepository, never()).deleteById(anyLong());
    }
}
