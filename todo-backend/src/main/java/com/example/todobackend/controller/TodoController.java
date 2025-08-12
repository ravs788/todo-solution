package com.example.todobackend.controller;

import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Todo;
import com.example.todobackend.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*") // For development: allow all origins
public class TodoController {

    private final TodoService todoService;

    @Autowired
    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        String username = getCurrentUsername();
        System.out.println("DEBUG: getAllTodos for username=" + username);
        return todoService.findAllByUsername(username);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable Integer id) {
        String username = getCurrentUsername();
        Optional<Todo> todo = todoService.findByIdAndUsername(id, username);
        return todo.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Todo> createTodo(@RequestBody TodoRequest dto) {
        String username = getCurrentUsername();
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Todo created = todoService.save(
            Todo.builder()
                .title(dto.getTitle())
                .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
                .startDate(dto.getStartDate())
                .username(username)
                .build()
        );
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Integer id, @RequestBody TodoRequest todoRequest) {
        String username = getCurrentUsername();
        Optional<Todo> existing = todoService.findByIdAndUsername(id, username);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Todo up = existing.get();
        up.setTitle(todoRequest.getTitle() != null ? todoRequest.getTitle() : up.getTitle());
        up.setCompleted(todoRequest.getCompleted() != null ? todoRequest.getCompleted() : up.getCompleted());
        Todo updated = todoService.save(up);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Integer id) {
        String username = getCurrentUsername();
        if (todoService.findByIdAndUsername(id, username).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        todoService.deleteByIdAndUsername(id, username);
        return ResponseEntity.noContent().build();
    }
}
