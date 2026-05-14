package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TechniqueController.class)
class TechniqueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TechniqueService techniqueService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void create_shouldReturnCreatedTechnique() throws Exception {
        TechniqueRequest request = new TechniqueRequest("Armbar", "Juji Gatame", TechniqueType.SUBMISSION, TechniqueTarget.ARM);
        TechniqueResponse response = new TechniqueResponse(1L, "Armbar", "Juji Gatame", TechniqueType.SUBMISSION, TechniqueTarget.ARM);

        when(techniqueService.create(any(TechniqueRequest.class))).thenReturn(response);

        mockMvc.perform(post("/techniques")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Armbar")))
                .andExpect(jsonPath("$.alternativeName", is("Juji Gatame")))
                .andExpect(jsonPath("$.type", is("SUBMISSION")))
                .andExpect(jsonPath("$.target", is("ARM")));

        verify(techniqueService).create(any(TechniqueRequest.class));
    }

    @Test
    void getAll_shouldReturnPageOfTechniques() throws Exception {
        List<TechniqueResponse> techniques = List.of(
                new TechniqueResponse(1L, "Armbar", "Juji Gatame", TechniqueType.SUBMISSION, TechniqueTarget.ARM),
                new TechniqueResponse(2L, "Kimura", "Ude Garami", TechniqueType.SUBMISSION, TechniqueTarget.SHOULDER)
        );
        Page<TechniqueResponse> page = new PageImpl<>(techniques);

        when(techniqueService.findAll(any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/techniques"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name", is("Armbar")))
                .andExpect(jsonPath("$.content[1].name", is("Kimura")));
    }

    @Test
    void getById_whenTechniqueExists_shouldReturnTechnique() throws Exception {
        TechniqueResponse response = new TechniqueResponse(1L, "Armbar", "Juji Gatame", TechniqueType.SUBMISSION, TechniqueTarget.ARM);
        when(techniqueService.findById(1L)).thenReturn(response);

        mockMvc.perform(get("/techniques/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Armbar")));
    }

    @Test
    void getById_whenTechniqueNotFound_shouldReturnNotFound() throws Exception {
        when(techniqueService.findById(99L)).thenThrow(new EntityNotFoundException("Technique not found"));

        mockMvc.perform(get("/techniques/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_whenTechniqueExists_shouldReturnUpdatedTechnique() throws Exception {
        TechniqueRequest request = new TechniqueRequest("Triangle Choke", "Sankaku Jime", TechniqueType.SUBMISSION, TechniqueTarget.NECK);
        TechniqueResponse response = new TechniqueResponse(1L, "Triangle Choke", "Sankaku Jime", TechniqueType.SUBMISSION, TechniqueTarget.NECK);

        when(techniqueService.update(eq(1L), any(TechniqueRequest.class))).thenReturn(response);

        mockMvc.perform(put("/techniques/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Triangle Choke")));
    }

    @Test
    void update_whenTechniqueNotFound_shouldReturnNotFound() throws Exception {
        TechniqueRequest request = new TechniqueRequest("Triangle Choke", "Sankaku Jime", TechniqueType.SUBMISSION, TechniqueTarget.NECK);
        when(techniqueService.update(eq(99L), any(TechniqueRequest.class))).thenThrow(new EntityNotFoundException("Technique not found"));

        mockMvc.perform(put("/techniques/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_whenTechniqueExists_shouldReturnNoContent() throws Exception {
        doNothing().when(techniqueService).delete(1L);

        mockMvc.perform(delete("/techniques/1"))
                .andExpect(status().isNoContent());

        verify(techniqueService).delete(1L);
    }

    @Test
    void delete_whenTechniqueNotFound_shouldReturnNotFound() throws Exception {
        doThrow(new EntityNotFoundException("Technique not found")).when(techniqueService).delete(99L);

        mockMvc.perform(delete("/techniques/99"))
                .andExpect(status().isNotFound());
    }
}
