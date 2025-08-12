package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import com.example.todobackend.repository.TodoRepository;
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

    @InjectMocks
    private TodoService todoService;

    private final ObjectMapper objectMapper = new ObjectMapper()
        .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private Todo loadTodoFromFile(String filename) throws IOException {
        try (java.io.InputStream is = getClass().getClassLoader().getResourceAsStream("test-data/" + filename)) {
            if (is == null) throw new java.io.FileNotFoundException("test-data/" + filename + " not found in classpath");
            return objectMapper.readValue(is, Todo.class);
        }
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
}
