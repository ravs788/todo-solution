package com.example.todobackend.controller;

import com.example.todobackend.model.Tag;
import com.example.todobackend.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@CrossOrigin(origins = "*")
public class TagController {
    private final TagRepository tagRepository;

    @Autowired
    public TagController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @GetMapping("/suggest")
    public List<String> suggestTags(@RequestParam(value = "search", required = false) String search) {
        if (search == null || search.trim().isEmpty()) {
            return List.of();
        }
        return tagRepository.findTop10ByNameContainingIgnoreCaseOrderByNameAsc(search.trim().toLowerCase())
                .stream()
                .map(Tag::getName)
                .toList();
    }
}
