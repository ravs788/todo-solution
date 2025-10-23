package com.example.todobackend.controller;

import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Todo;
import com.example.todobackend.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import com.example.todobackend.model.Tag;
import java.time.LocalDateTime;
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
        // If unauthenticated or username missing, do not leak data
        if (username == null || username.trim().isEmpty()) {
            return java.util.List.of();
        }
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
        if (username == null || username.trim().isEmpty()) {
            // Return 401 if authentication context is missing
            return ResponseEntity.status(401).body(null);
        }
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Todo created = todoService.saveFromRequest(dto, username);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Integer id, @RequestBody TodoRequest todoRequest) {
        String username = getCurrentUsername();
        if (username == null || username.trim().isEmpty()) {
            // Return 401 if authentication context is missing
            return ResponseEntity.status(401).body(null);
        }
        Optional<Todo> existing = todoService.findByIdAndUsername(id, username);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Todo up = existing.get();
        Boolean wasCompleted = up.getCompleted();
        Boolean willBeCompleted = todoRequest.getCompleted() != null ? todoRequest.getCompleted() : up.getCompleted();
        up.setTitle(todoRequest.getTitle() != null ? todoRequest.getTitle() : up.getTitle());
        up.setCompleted(willBeCompleted);
        if (todoRequest.getActivityType() != null) {
            up.setActivityType(todoRequest.getActivityType());
        }
        if (todoRequest.getEndDate() != null) {
            up.setEndDate(todoRequest.getEndDate());
        }
        // Handle tags update: if tags list provided in request, update tags accordingly
        if (todoRequest.getTags() != null) {
            Set<Tag> tags = todoService.resolveTagsFromNames(todoRequest.getTags());
            // Replace existing tag links properly to avoid duplicate key errors in join table
            if (up.getTags() == null) {
                up.setTags(new java.util.HashSet<>());
            }
            up.getTags().clear();
            up.getTags().addAll(tags);
        }
        // Auto set endDate if marking completed (transition from false->true)
        if ((wasCompleted == null || !wasCompleted) && willBeCompleted) {
            up.setEndDate(LocalDateTime.now());
        }
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
