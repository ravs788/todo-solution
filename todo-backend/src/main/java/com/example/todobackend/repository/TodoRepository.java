package com.example.todobackend.repository;

import com.example.todobackend.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Integer> {
    // Basic CRUD supported out of the box
    java.util.List<Todo> findAllByUsername(String username);
    java.util.Optional<Todo> findByIdAndUsername(Integer id, String username);
}
