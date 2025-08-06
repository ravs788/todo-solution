package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import com.example.todobackend.repository.TodoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TodoService {

    private static final Logger log = LoggerFactory.getLogger(TodoService.class);
    private final TodoRepository repo;

    @Autowired
    public TodoService(TodoRepository repo) {
        this.repo = repo;
    }

    public List<Todo> findAll() {
        return repo.findAll();
    }

    public Optional<Todo> findById(Integer id) {
        return repo.findById(id);
    }

    public Todo save(Todo todo) {
        Todo savedTodo = repo.save(todo);
        log.info("Saved Todo with id: {}", savedTodo.getId());
        return savedTodo;
    }

    public void deleteById(Integer id) {
        repo.deleteById(id);
        log.info("Deleted Todo with id: {}", id);
    }
}
