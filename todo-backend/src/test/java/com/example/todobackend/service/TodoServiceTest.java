package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import com.example.todobackend.repository.TodoRepository;
import com.example.todobackend.repository.TagRepository;
import com.example.todobackend.model.Tag;
import com.example.todobackend.dto.TodoRequest;
import java.util.HashSet;
import java.util.Set;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;
import java.io.IOException;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;

@ExtendWith(MockitoExtension.class)
@Epic("Todo Service")
@Feature("Todo Service Tests")
public class TodoServiceTest {

    @Mock
    private TodoRepository todoRepository;

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TodoService todoService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private Todo loadTodoFromFile(String filename) throws IOException {
        try (java.io.InputStream is = getClass().getClassLoader().getResourceAsStream("test-data/" + filename)) {
            if (is == null)
                throw new java.io.FileNotFoundException("test-data/" + filename + " not found in classpath");
            return objectMapper.readValue(is, Todo.class);
        }
    }

    @Test
    @Story("Save Todo with new tags")
    @Description("Test saving a todo with a new tag; tag is created and linked")
    @Severity(SeverityLevel.CRITICAL)
    void testSaveFromRequest_WithNewTag() {
        // Arrange
        TodoRequest req = TodoRequest.builder()
                .title("Test Todo with Tag")
                .completed(false)
                .tags(List.of("newtag"))
                .build();

        Tag newTag = Tag.builder().id(10).name("newtag").build();

        when(tagRepository.findByNameIgnoreCase("newtag")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenReturn(newTag);

        Todo savedTodo = Todo.builder()
                .id(1)
                .title("Test Todo with Tag")
                .completed(false)
                .tags(Set.of(newTag))
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(savedTodo);

        // Act
        Todo result = todoService.saveFromRequest(req, "user1");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTags().size());
        assertTrue(result.getTags().stream().anyMatch(tag -> "newtag".equals(tag.getName())));
        verify(tagRepository).save(any(Tag.class));
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    @Story("Save Todo with existing tag")
    @Description("Test saving a todo with an existing tag is linked but not duplicated")
    @Severity(SeverityLevel.CRITICAL)
    void testSaveFromRequest_WithExistingTag() {
        // Arrange
        Tag existingTag = Tag.builder().id(20).name("urgent").build();
        TodoRequest req = TodoRequest.builder()
                .title("Todo Existing Tag")
                .completed(false)
                .tags(List.of("urgent"))
                .build();

        when(tagRepository.findByNameIgnoreCase("urgent")).thenReturn(Optional.of(existingTag));

        Todo savedTodo = Todo.builder()
                .id(2)
                .title("Todo Existing Tag")
                .completed(false)
                .tags(Set.of(existingTag))
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(savedTodo);

        // Act
        Todo result = todoService.saveFromRequest(req, "userB");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTags().size());
        assertEquals("urgent", result.getTags().iterator().next().getName());
        verify(tagRepository, never()).save(any(Tag.class));
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    @Story("Find All Todos")
    @Description("Test finding all todos")
    @Severity(SeverityLevel.NORMAL)
    void testFindAll() throws IOException {
        // Arrange
        Todo todo1 = loadTodoFromFile("todo1.json");
        Todo todo2 = loadTodoFromFile("todo2.json");

        when(todoRepository.findAll()).thenReturn(Arrays.asList(todo1, todo2));

        // Act
        List<Todo> result = todoService.findAll();

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(todo1));
        assertTrue(result.contains(todo2));
        verify(todoRepository, times(1)).findAll();
    }

    @Test
    @Story("Find Todo By Id")
    @Description("Test finding todo by id when it exists")
    @Severity(SeverityLevel.NORMAL)
    void testFindById_Found() throws IOException {
        // Arrange
        Todo todo = loadTodoFromFile("todo1.json");

        when(todoRepository.findById(1)).thenReturn(Optional.of(todo));

        // Act
        Optional<Todo> result = todoService.findById(1);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(todo, result.get());
        verify(todoRepository, times(1)).findById(1);
    }

    @Test
    @Story("Find Todo By Id")
    @Description("Test finding todo by id when it doesn't exist")
    @Severity(SeverityLevel.NORMAL)
    void testFindById_NotFound() {
        // Arrange
        when(todoRepository.findById(1)).thenReturn(Optional.empty());

        // Act
        Optional<Todo> result = todoService.findById(1);

        // Assert
        assertTrue(result.isEmpty());
        verify(todoRepository, times(1)).findById(1);
    }

    @Test
    @Story("Save Todo")
    @Description("Test saving a todo")
    @Severity(SeverityLevel.NORMAL)
    void testSave() throws IOException {
        // Arrange
        Todo todo = loadTodoFromFile("todo1.json");

        when(todoRepository.save(any(Todo.class))).thenReturn(todo);

        // Act
        Todo result = todoService.save(todo);

        // Assert
        assertNotNull(result);
        assertEquals(todo, result);
        verify(todoRepository, times(1)).save(any(Todo.class));
    }

    @Test
    @Story("Delete Todo By Id")
    @Description("Test deleting todo by id")
    @Severity(SeverityLevel.NORMAL)
    void testDeleteById() {
        // Act
        todoService.deleteById(1);

        // Assert
        verify(todoRepository, times(1)).deleteById(1);
    }

    @Test
    @Story("Save From Request - Error Handling")
    @Description("Test error handling when tag repository fails")
    @Severity(SeverityLevel.CRITICAL)
    void testSaveFromRequest_TagRepositoryError() {
        // Arrange
        TodoRequest req = TodoRequest.builder()
                .title("Test Todo with Tag")
                .completed(false)
                .tags(List.of("newtag"))
                .build();

        when(tagRepository.findByNameIgnoreCase("newtag")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> todoService.saveFromRequest(req, "user1"));
        verify(tagRepository, times(1)).save(any(Tag.class));
        verify(todoRepository, never()).save(any(Todo.class));
    }

    @Test
    @Story("Save From Request - Empty Tags")
    @Description("Test saving todo with empty tags list")
    @Severity(SeverityLevel.NORMAL)
    void testSaveFromRequest_EmptyTags() {
        // Arrange
        TodoRequest req = TodoRequest.builder()
                .title("Todo with Empty Tags")
                .completed(false)
                .tags(List.of())
                .build();

        Todo savedTodo = Todo.builder()
                .id(3)
                .title("Todo with Empty Tags")
                .completed(false)
                .tags(Set.of())
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(savedTodo);

        // Act
        Todo result = todoService.saveFromRequest(req, "user1");

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getTags().size());
        verify(tagRepository, never()).findByNameIgnoreCase(anyString());
        verify(tagRepository, never()).save(any(Tag.class));
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    @Story("Save From Request - Null Tags")
    @Description("Test saving todo with null tags")
    @Severity(SeverityLevel.NORMAL)
    void testSaveFromRequest_NullTags() {
        // Arrange
        TodoRequest req = TodoRequest.builder()
                .title("Todo with Null Tags")
                .completed(false)
                .tags(null)
                .build();

        Todo savedTodo = Todo.builder()
                .id(4)
                .title("Todo with Null Tags")
                .completed(false)
                .tags(Set.of())
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(savedTodo);

        // Act
        Todo result = todoService.saveFromRequest(req, "user1");

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getTags().size());
        verify(tagRepository, never()).findByNameIgnoreCase(anyString());
        verify(tagRepository, never()).save(any(Tag.class));
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    @Story("Find All Todos - Repository Error")
    @Description("Test error handling when repository fails")
    @Severity(SeverityLevel.NORMAL)
    void testFindAll_RepositoryError() {
        // Arrange
        when(todoRepository.findAll()).thenThrow(new RuntimeException("Database connection failed"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> todoService.findAll());
        verify(todoRepository, times(1)).findAll();
    }

    @Test
    @Story("Find By Id - Repository Error")
    @Description("Test error handling when findById fails")
    @Severity(SeverityLevel.NORMAL)
    void testFindById_RepositoryError() {
        // Arrange
        when(todoRepository.findById(1)).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> todoService.findById(1));
        verify(todoRepository, times(1)).findById(1);
    }

    @Test
    @Story("Save Todo - Repository Error")
    @Description("Test error handling when save fails")
    @Severity(SeverityLevel.NORMAL)
    void testSave_RepositoryError() throws IOException {
        // Arrange
        Todo todo = loadTodoFromFile("todo1.json");
        when(todoRepository.save(any(Todo.class))).thenThrow(new RuntimeException("Save failed"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> todoService.save(todo));
        verify(todoRepository, times(1)).save(any(Todo.class));
    }

    @Test
    @Story("Delete By Id - Repository Error")
    @Description("Test error handling when delete fails")
    @Severity(SeverityLevel.NORMAL)
    void testDeleteById_RepositoryError() {
        // Arrange
        doThrow(new RuntimeException("Delete failed")).when(todoRepository).deleteById(1);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> todoService.deleteById(1));
        verify(todoRepository, times(1)).deleteById(1);
    }

    @Test
    @Story("Save From Request - Multiple New Tags")
    @Description("Test saving todo with multiple new tags")
    @Severity(SeverityLevel.NORMAL)
    void testSaveFromRequest_MultipleNewTags() {
        // Arrange
        TodoRequest req = TodoRequest.builder()
                .title("Todo with Multiple New Tags")
                .completed(false)
                .tags(List.of("tag1", "tag2", "tag3"))
                .build();

        Tag tag1 = Tag.builder().id(10).name("tag1").build();
        Tag tag2 = Tag.builder().id(11).name("tag2").build();
        Tag tag3 = Tag.builder().id(12).name("tag3").build();

        when(tagRepository.findByNameIgnoreCase("tag1")).thenReturn(Optional.empty());
        when(tagRepository.findByNameIgnoreCase("tag2")).thenReturn(Optional.empty());
        when(tagRepository.findByNameIgnoreCase("tag3")).thenReturn(Optional.empty());

        when(tagRepository.save(any(Tag.class))).thenReturn(tag1, tag2, tag3);

        Todo savedTodo = Todo.builder()
                .id(5)
                .title("Todo with Multiple New Tags")
                .completed(false)
                .tags(Set.of(tag1, tag2, tag3))
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(savedTodo);

        // Act
        Todo result = todoService.saveFromRequest(req, "user1");

        // Assert
        assertNotNull(result);
        assertEquals(3, result.getTags().size());
        verify(tagRepository, times(3)).save(any(Tag.class));
        verify(todoRepository).save(any(Todo.class));
    }

    @Test
    @Story("Save From Request - Mixed Existing and New Tags")
    @Description("Test saving todo with mix of existing and new tags")
    @Severity(SeverityLevel.NORMAL)
    void testSaveFromRequest_MixedTags() {
        // Arrange
        TodoRequest req = TodoRequest.builder()
                .title("Todo with Mixed Tags")
                .completed(false)
                .tags(List.of("existing", "new"))
                .build();

        Tag existingTag = Tag.builder().id(20).name("existing").build();
        Tag newTag = Tag.builder().id(21).name("new").build();

        when(tagRepository.findByNameIgnoreCase("existing")).thenReturn(Optional.of(existingTag));
        when(tagRepository.findByNameIgnoreCase("new")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenReturn(newTag);

        Todo savedTodo = Todo.builder()
                .id(6)
                .title("Todo with Mixed Tags")
                .completed(false)
                .tags(Set.of(existingTag, newTag))
                .build();

        when(todoRepository.save(any(Todo.class))).thenReturn(savedTodo);

        // Act
        Todo result = todoService.saveFromRequest(req, "user1");

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTags().size());
        verify(tagRepository, times(1)).save(any(Tag.class)); // Only save the new tag
        verify(todoRepository).save(any(Todo.class));
    }
}
