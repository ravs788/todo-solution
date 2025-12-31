package com.example.todobackend.controller;

import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Todo;
import com.example.todobackend.service.TodoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TodoControllerTest {

    private final TodoService todoService = mock(TodoService.class);
    private final TodoController controller = new TodoController(todoService);

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    // helpers

    private void setAuthenticated(String username) {
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        TestingAuthenticationToken auth = new TestingAuthenticationToken(username, "pw");
        auth.setAuthenticated(true);
        ctx.setAuthentication(auth);
        SecurityContextHolder.setContext(ctx);
    }

    // getAllTodos

    @Test
    void getAllTodos_returnsEmpty_when_unauthenticated_or_blank() {
        // unauthenticated
        SecurityContextHolder.clearContext();
        assertTrue(controller.getAllTodos().isEmpty());

        // blank principal
        setAuthenticated("   ");
        assertTrue(controller.getAllTodos().isEmpty());
    }

    @Test
    void getAllTodos_returnsList_when_authenticated() {
        setAuthenticated("alice");
        when(todoService.findAllByUsername("alice")).thenReturn(List.of(new Todo(), new Todo()));
        List<Todo> list = controller.getAllTodos();
        assertEquals(2, list.size());
        verify(todoService).findAllByUsername("alice");
    }

    // getTodoById

    @Test
    void getTodoById_returns404_when_not_found() {
        setAuthenticated("bob");
        when(todoService.findByIdAndUsername(1, "bob")).thenReturn(Optional.empty());
        ResponseEntity<Todo> resp = controller.getTodoById(1);
        assertEquals(404, resp.getStatusCode().value());
    }

    @Test
    void getTodoById_returns200_when_found() {
        setAuthenticated("bob");
        Todo t = new Todo();
        t.setId(1);
        when(todoService.findByIdAndUsername(1, "bob")).thenReturn(Optional.of(t));
        ResponseEntity<Todo> resp = controller.getTodoById(1);
        assertEquals(200, resp.getStatusCode().value());
        assertSame(t, resp.getBody());
    }

    // createTodo

    @Test
    void createTodo_returns401_when_unauthenticated() {
        SecurityContextHolder.clearContext();
        TodoRequest req = TodoRequest.builder().title("X").build();
        ResponseEntity<Todo> resp = controller.createTodo(req);
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void createTodo_returns400_when_title_missing() {
        setAuthenticated("carol");
        TodoRequest req = TodoRequest.builder().title("  ").build();
        ResponseEntity<Todo> resp = controller.createTodo(req);
        assertEquals(400, resp.getStatusCode().value());
    }

    @Test
    void createTodo_returns200_when_valid_and_calls_service() {
        setAuthenticated("carol");
        TodoRequest req = TodoRequest.builder().title("Task").build();
        Todo created = new Todo();
        created.setId(10);
        when(todoService.saveFromRequest(req, "carol")).thenReturn(created);

        ResponseEntity<Todo> resp = controller.createTodo(req);
        assertEquals(200, resp.getStatusCode().value());
        assertSame(created, resp.getBody());
        verify(todoService).saveFromRequest(req, "carol");
    }

    // updateTodo

    @Test
    void updateTodo_returns401_when_unauthenticated() {
        SecurityContextHolder.clearContext();
        ResponseEntity<Todo> resp = controller.updateTodo(1, TodoRequest.builder().build());
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void updateTodo_returns404_when_not_found() {
        setAuthenticated("dave");
        when(todoService.findByIdAndUsername(1, "dave")).thenReturn(Optional.empty());
        ResponseEntity<Todo> resp = controller.updateTodo(1, TodoRequest.builder().build());
        assertEquals(404, resp.getStatusCode().value());
    }

    @Test
    void updateTodo_returns200_when_found_and_updates_fields() {
        setAuthenticated("dave");
        Todo existing = new Todo();
        existing.setId(1);
        existing.setTitle("Old");
        existing.setCompleted(false);
        existing.setTags(new java.util.HashSet<>()); // ensure tags not null later
        when(todoService.findByIdAndUsername(1, "dave")).thenReturn(Optional.of(existing));

        TodoRequest req = TodoRequest.builder()
                .title("New")
                .completed(true)
                .activityType("WORK")
                .endDate(LocalDateTime.of(2025, 1, 1, 10, 0))
                .tags(List.of("t1", "t2"))
                .reminderAt(LocalDateTime.of(2025, 1, 2, 9, 0))
                .build();

        // resolveTagsFromNames used when tags present
        when(todoService.resolveTagsFromNames(List.of("t1", "t2"))).thenReturn(Set.of());

        when(todoService.save(any(Todo.class))).thenAnswer(inv -> inv.getArgument(0, Todo.class));

        ResponseEntity<Todo> resp = controller.updateTodo(1, req);
        assertEquals(200, resp.getStatusCode().value());
        Todo updated = resp.getBody();
        assertNotNull(updated);
        assertEquals("New", updated.getTitle());
        assertTrue(updated.getCompleted());
        assertEquals("WORK", updated.getActivityType());
        assertEquals(LocalDateTime.of(2025, 1, 1, 10, 0), updated.getEndDate());
        assertEquals(LocalDateTime.of(2025, 1, 2, 9, 0), updated.getReminderAt());
        verify(todoService).resolveTagsFromNames(List.of("t1", "t2"));
        verify(todoService).save(existing);
    }

    // deleteTodo

    @Test
    void deleteTodo_returns404_when_not_found() {
        setAuthenticated("erin");
        when(todoService.findByIdAndUsername(5, "erin")).thenReturn(Optional.empty());
        ResponseEntity<Void> resp = controller.deleteTodo(5);
        assertEquals(404, resp.getStatusCode().value());
        verify(todoService, never()).deleteByIdAndUsername(anyInt(), anyString());
    }

    @Test
    void deleteTodo_returns204_when_found_and_calls_service() {
        setAuthenticated("erin");
        when(todoService.findByIdAndUsername(5, "erin")).thenReturn(Optional.of(new Todo()));
        ResponseEntity<Void> resp = controller.deleteTodo(5);
        assertEquals(204, resp.getStatusCode().value());
        verify(todoService).deleteByIdAndUsername(5, "erin");
    }

    // reorderTodos

    @Test
    void reorderTodos_returns401_when_unauthenticated() {
        SecurityContextHolder.clearContext();
        ResponseEntity<List<Todo>> resp = controller.reorderTodos(List.of(1, 2, 3));
        assertEquals(401, resp.getStatusCode().value());
        assertNotNull(resp.getBody());
        assertTrue(resp.getBody().isEmpty());
    }

    @Test
    void reorderTodos_returns200_and_calls_service() {
        setAuthenticated("frank");
        when(todoService.reorderTodos("frank", List.of(3, 2, 1))).thenReturn(List.of(new Todo()));
        ResponseEntity<List<Todo>> resp = controller.reorderTodos(List.of(3, 2, 1));
        assertEquals(200, resp.getStatusCode().value());
        assertEquals(1, resp.getBody().size());
        verify(todoService).reorderTodos("frank", List.of(3, 2, 1));
    }
}
