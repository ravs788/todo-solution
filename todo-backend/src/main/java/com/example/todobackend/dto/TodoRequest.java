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
}
