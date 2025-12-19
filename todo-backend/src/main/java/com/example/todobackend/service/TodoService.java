package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import com.example.todobackend.model.Tag;
import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.repository.TodoRepository;
import com.example.todobackend.repository.TagRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
public class TodoService {

    private static final Logger log = LoggerFactory.getLogger(TodoService.class);
    private final TodoRepository repo;
    private final TagRepository tagRepo;

    @Autowired
    public TodoService(TodoRepository repo, TagRepository tagRepo) {
        this.repo = repo;
        this.tagRepo = tagRepo;
    }

    public List<Todo> findAll() {
        return repo.findAll();
    }

    public List<Todo> findAllByUsername(String username) {
        return repo.findAllByUsername(username);
    }

    public Optional<Todo> findById(Integer id) {
        return repo.findById(id);
    }

    public Optional<Todo> findByIdAndUsername(Integer id, String username) {
        return repo.findByIdAndUsername(id, username);
    }

    public Todo save(Todo todo) {
        Todo savedTodo = repo.save(todo);
        log.info("Saved Todo with id: {}", savedTodo.getId());
        return savedTodo;
    }

    public Todo saveFromRequest(TodoRequest dto, String username) {
        Set<Tag> tags = resolveTags(dto.getTags());
        Todo todo = Todo.builder()
            .title(dto.getTitle())
            .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
            .startDate(dto.getStartDate())
            .username(username)
            .activityType(dto.getActivityType())
            .endDate(dto.getEndDate())
            .tags(tags)
            .reminderAt(dto.getReminderAt())
            .reminderStatus(dto.getReminderAt() != null ? com.example.todobackend.model.ReminderStatus.PENDING : null)
            .build();
        Todo savedTodo = repo.save(todo);
        log.info("Saved Todo with id: {} (with tags and reminders)", savedTodo.getId());
        return savedTodo;
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        if (tagNames != null) {
            for (String rawName : tagNames) {
                String normName = rawName == null ? null : rawName.trim().toLowerCase();
                if (normName == null || normName.isEmpty()) continue;
                Tag tag = tagRepo.findByNameIgnoreCase(normName)
                        .orElseGet(() -> tagRepo.save(Tag.builder().name(normName).build()));
                tags.add(tag);
            }
        }
    return tags;
    }

    // Exposed method for controllers to resolve tag names without creating a new Todo
    public Set<Tag> resolveTagsFromNames(List<String> tagNames) {
        return resolveTags(tagNames);
    }

    public void deleteById(Integer id) {
        repo.deleteById(id);
        log.info("Deleted Todo with id: {}", id);
    }

    public void deleteByIdAndUsername(Integer id, String username) {
        repo.findByIdAndUsername(id, username).ifPresent(todo -> {
            repo.deleteById(id);
            log.info("Deleted Todo with id: {} for user {}", id, username);
        });
    }
}
