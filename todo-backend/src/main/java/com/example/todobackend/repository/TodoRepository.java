package com.example.todobackend.repository;

import com.example.todobackend.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Integer> {
    // Basic CRUD supported out of the box
    java.util.List<Todo> findAllByUsername(String username);

    java.util.Optional<Todo> findByIdAndUsername(Integer id, String username);

    // Ordered retrieval for drag & drop
    java.util.List<Todo> findAllByUsernameOrderBySortIndexAsc(String username);

    java.util.Optional<Todo> findTopByUsernameOrderBySortIndexDesc(String username);

    java.util.List<Todo> findByIdInAndUsername(java.util.List<Integer> ids, String username);

    // Push notification related queries
    List<Todo> findByReminderAtBeforeAndReminderStatus(LocalDateTime reminderAt, String reminderStatus);
}
