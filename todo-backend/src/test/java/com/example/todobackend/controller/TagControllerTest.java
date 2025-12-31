package com.example.todobackend.controller;

import com.example.todobackend.model.Tag;
import com.example.todobackend.repository.TagRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TagControllerTest {

    private final TagRepository tagRepository = mock(TagRepository.class);
    private final TagController controller = new TagController(tagRepository);

    @Test
    void suggestTags_returnsEmpty_when_search_is_null_or_blank() {
        // null
        List<String> resultNull = controller.suggestTags(null);
        assertNotNull(resultNull);
        assertTrue(resultNull.isEmpty());

        // blank
        List<String> resultBlank = controller.suggestTags("   ");
        assertNotNull(resultBlank);
        assertTrue(resultBlank.isEmpty());

        verifyNoInteractions(tagRepository);
    }

    @Test
    void suggestTags_trims_and_lowercases_and_returns_names() {
        Tag t1 = new Tag();
        t1.setName("alpha");
        Tag t2 = new Tag();
        t2.setName("Beta");

        // Expect the repository to be called with trimmed-lowercased string "query"
        when(tagRepository.findTop10ByNameContainingIgnoreCaseOrderByNameAsc(eq("query")))
                .thenReturn(List.of(t1, t2));

        List<String> result = controller.suggestTags("  QuErY  ");

        assertEquals(2, result.size());
        assertEquals(List.of("alpha", "Beta"), result);
        verify(tagRepository, times(1))
                .findTop10ByNameContainingIgnoreCaseOrderByNameAsc(eq("query"));
    }
}
