package com.example.todobackend.controller;

import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Todo;
import com.example.todobackend.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*") // For development: allow all origins
public class TodoController {

    private final TodoService todoService;

    @Autowired
    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        return todoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Todo> getTodoById(@PathVariable Integer id) {
        Optional<Todo> todo = todoService.findById(id);
        return todo.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Todo> createTodo(@RequestBody TodoRequest dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Todo created = todoService.save(
            Todo.builder()
                .title(dto.getTitle())
                .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
                .startDate(dto.getStartDate())
                .build()
        );
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Integer id, @RequestBody TodoRequest todoRequest) {
        Optional<Todo> existing = todoService.findById(id);
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
        if (todoService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        todoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
