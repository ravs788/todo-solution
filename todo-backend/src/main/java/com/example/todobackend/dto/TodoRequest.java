package com.example.todobackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoRequest {
    private String title;
    private Boolean completed;
    private LocalDateTime startDate;
    // New fields for extended todo details
    private String activityType; // "regular" or "definite"
    private LocalDateTime endDate;

    // Tags for this todo (list of tag names; can be empty)
    private List<String> tags;

    // Due date reminders
    private LocalDateTime reminderAt;

    private String priority; // "HIGH", "MEDIUM", "LOW" or null

    // Convenience constructor matching older tests (without reminderAt)
    public TodoRequest(String title, Boolean completed, LocalDateTime startDate, String activityType,
            LocalDateTime endDate, List<String> tags) {
        this.title = title;
        this.completed = completed;
        this.startDate = startDate;
        this.activityType = activityType;
        this.endDate = endDate;
        this.tags = tags;
        this.reminderAt = null;
        this.priority = null;
    }
}
