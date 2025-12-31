package com.example.todobackend.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TodoRequestEqualityTest {

    private TodoRequest base() {
        return TodoRequest.builder()
                .title("Title")
                .completed(Boolean.FALSE)
                .startDate(LocalDateTime.of(2025, 1, 1, 10, 0))
                .activityType("WORK")
                .endDate(LocalDateTime.of(2025, 1, 2, 12, 0))
                .tags(List.of("a", "b"))
                .reminderAt(LocalDateTime.of(2025, 1, 1, 11, 0))
                .build();
    }

    private TodoRequest sameAsBase() {
        return TodoRequest.builder()
                .title("Title")
                .completed(Boolean.FALSE)
                .startDate(LocalDateTime.of(2025, 1, 1, 10, 0))
                .activityType("WORK")
                .endDate(LocalDateTime.of(2025, 1, 2, 12, 0))
                .tags(List.of("a", "b"))
                .reminderAt(LocalDateTime.of(2025, 1, 1, 11, 0))
                .build();
    }

    @Test
    void equals_self_true() {
        TodoRequest a = base();
        assertEquals(a, a);
    }

    @Test
    void equals_null_false() {
        TodoRequest a = base();
        assertNotEquals(a, null);
    }

    @Test
    void equals_otherType_false() {
        TodoRequest a = base();
        assertNotEquals(a, "not-a-todo");
    }

    @Test
    void equals_identical_true_and_hashCode_equal() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equals_diff_title_false_and_hashCode_mayDiffer() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setTitle("Different");
        assertNotEquals(a, b);
    }

    @Test
    void equals_diff_completed_false() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setCompleted(Boolean.TRUE);
        assertNotEquals(a, b);
    }

    @Test
    void equals_diff_startDate_false() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setStartDate(LocalDateTime.of(2025, 1, 3, 10, 0));
        assertNotEquals(a, b);
    }

    @Test
    void equals_diff_activityType_false() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setActivityType("HOME");
        assertNotEquals(a, b);
    }

    @Test
    void equals_diff_endDate_false() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setEndDate(LocalDateTime.of(2025, 1, 5, 10, 0));
        assertNotEquals(a, b);
    }

    @Test
    void equals_diff_tags_false() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setTags(List.of("x", "y"));
        assertNotEquals(a, b);
    }

    @Test
    void equals_diff_reminderAt_false() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        b.setReminderAt(LocalDateTime.of(2025, 1, 1, 12, 30));
        assertNotEquals(a, b);
    }

    // Cover null-vs-non-null branches for each field

    @Test
    void equals_title_null_branch() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        a.setTitle(null);
        assertNotEquals(a, b);
        b.setTitle(null);
        assertEquals(a, b);
    }

    @Test
    void equals_activityType_null_branch() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        a.setActivityType(null);
        assertNotEquals(a, b);
        b.setActivityType(null);
        assertEquals(a, b);
    }

    @Test
    void equals_startDate_null_branch() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        a.setStartDate(null);
        assertNotEquals(a, b);
        b.setStartDate(null);
        assertEquals(a, b);
    }

    @Test
    void equals_endDate_null_branch() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        a.setEndDate(null);
        assertNotEquals(a, b);
        b.setEndDate(null);
        assertEquals(a, b);
    }

    @Test
    void equals_tags_null_branch() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        a.setTags(null);
        assertNotEquals(a, b);
        b.setTags(null);
        assertEquals(a, b);
    }

    @Test
    void equals_reminderAt_null_branch() {
        TodoRequest a = base();
        TodoRequest b = sameAsBase();
        a.setReminderAt(null);
        assertNotEquals(a, b);
        b.setReminderAt(null);
        assertEquals(a, b);
    }

    @Test
    void toString_nonEmpty() {
        String s = base().toString();
        assertNotNull(s);
        assertFalse(s.isBlank());
    }
}
