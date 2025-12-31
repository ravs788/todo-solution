package com.example.todobackend.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Fast coverage gains targeting model POJOs and Lombok-generated code:
 * - Todo.equals/hashCode/toString and builder.toString
 * - Tag getters/setters and builder.toString
 * - PushSubscription getters/setters
 */
public class ModelPojoTests {

    @Test
    void todo_equals_hashcode_and_toString_cover_branches() {
        LocalDateTime now = LocalDateTime.now();
        Set<Tag> tags = new HashSet<>();

        Todo t1 = Todo.builder()
                .id(1)
                .title("Task A")
                .completed(true)
                .startDate(now.minusDays(1))
                .username("user1")
                .activityType("regular")
                .endDate(now)
                .tags(tags)
                .reminderAt(now.plusDays(1))
                // reminderStatus can be null or any enum; null is fine for equality consistency
                .reminderStatus(null)
                .sortIndex(10)
                .build();

        // Self equality
        assertEquals(t1, t1);
        // Null and different-class checks
        assertNotEquals(t1, null);
        assertNotEquals(t1, "not-a-todo");

        // Same values => equals true and hashCode equal
        Todo t2 = Todo.builder()
                .id(1)
                .title("Task A")
                .completed(true)
                .startDate(now.minusDays(1))
                .username("user1")
                .activityType("regular")
                .endDate(now)
                .tags(tags)
                .reminderAt(now.plusDays(1))
                .reminderStatus(null)
                .sortIndex(10)
                .build();
        assertEquals(t1, t2);
        assertEquals(t1.hashCode(), t2.hashCode());

        // One differing field breaks equality
        Todo t3 = Todo.builder()
                .id(1)
                .title("Task B") // changed
                .completed(true)
                .startDate(now.minusDays(1))
                .username("user1")
                .activityType("regular")
                .endDate(now)
                .tags(tags)
                .reminderAt(now.plusDays(1))
                .reminderStatus(null)
                .sortIndex(10)
                .build();
        assertNotEquals(t1, t3);

        // toString coverage (Lombok @Data)
        String s = t1.toString();
        assertNotNull(s);
        assertTrue(s.contains("Todo"));
    }

    @Test
    void todo_builder_toString_is_not_null() {
        String builderStr = Todo.builder().toString();
        assertNotNull(builderStr);
        assertTrue(builderStr.contains("Todo"));
    }

    @Test
    void tag_getters_setters_and_builder_toString() {
        Set<Todo> todos = new HashSet<>();
        Tag tag = Tag.builder()
                .id(1)
                .name("work")
                .todos(todos)
                .build();

        assertEquals(1, tag.getId());
        assertEquals("work", tag.getName());
        assertSame(todos, tag.getTodos());

        // Exercise getTodos and setTodos branches
        Tag tag2 = new Tag();
        tag2.setId(2);
        tag2.setName("home");
        assertNull(tag2.getTodos());
        tag2.setTodos(new HashSet<>());
        assertNotNull(tag2.getTodos());

        // Cover Tag$TagBuilder.toString (Lombok-generated)
        String builderStr = Tag.builder().toString();
        assertNotNull(builderStr);
        assertTrue(builderStr.contains("Tag"));
    }

    @Test
    void pushSubscription_getters_setters() {
        PushSubscription ps = new PushSubscription();
        User u = new User();
        u.setId(100L);
        u.setUsername("u1");

        ps.setId(10L);
        ps.setUser(u);
        ps.setEndpoint("https://example.com/endpoint");
        ps.setP256dhKey("p256dh");
        ps.setAuthKey("auth");

        assertEquals(10L, ps.getId());
        assertSame(u, ps.getUser());
        assertEquals("https://example.com/endpoint", ps.getEndpoint());
        assertEquals("p256dh", ps.getP256dhKey());
        assertEquals("auth", ps.getAuthKey());
    }
}
