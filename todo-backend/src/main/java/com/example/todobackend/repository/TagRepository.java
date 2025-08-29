package com.example.todobackend.repository;

import com.example.todobackend.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Integer> {
    Optional<Tag> findByNameIgnoreCase(String name);
    List<Tag> findTop10ByNameContainingIgnoreCaseOrderByNameAsc(String search);
}
