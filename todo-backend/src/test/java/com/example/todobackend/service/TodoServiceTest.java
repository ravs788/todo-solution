package com.example.todobackend.service;

import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Tag;
import com.example.todobackend.model.Todo;
import com.example.todobackend.repository.TagRepository;
import com.example.todobackend.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TodoServiceTest {

    @Mock
    private TodoRepository repo;
    @Mock
    private TagRepository tagRepo;

    private TodoService service;

    @BeforeEach
    void setUp() {
        service = new TodoService(repo, tagRepo);
    }

    @Test
    void saveFromRequest_setsSortIndex_basedOnLast_and_setsReminder_and_resolvesTags() {
        String username = "alice";
        // last with sortIndex = 5
        Todo last = new Todo();
        last.setSortIndex(5);
        when(repo.findTopByUsernameOrderBySortIndexDesc(username)).thenReturn(Optional.of(last));

        // tag resolution: one existing, one new (normalized)
        Tag existing = Tag.builder().id(10).name("home").build();
        when(tagRepo.findByNameIgnoreCase("home")).thenReturn(Optional.of(existing));
        when(tagRepo.findByNameIgnoreCase("work")).thenReturn(Optional.empty());
        when(tagRepo.save(any(Tag.class))).thenAnswer(inv -> {
            Tag t = inv.getArgument(0, Tag.class);
            t.setId(99);
            return t;
        });

        LocalDateTime now = LocalDateTime.now();
        TodoRequest dto = TodoRequest.builder()
                .title("Task 1")
                .completed(false)
                .startDate(now.minusHours(1))
                .activityType("regular")
                .endDate(null)
                .tags(Arrays.asList("  Work", "HOME "))
                .reminderAt(now.plusDays(1))
                .build();

        when(repo.save(any(Todo.class))).thenAnswer(inv -> {
            Todo t = inv.getArgument(0, Todo.class);
            t.setId(123);
            return t;
        });

        Todo saved = service.saveFromRequest(dto, username);
        assertNotNull(saved);
        ArgumentCaptor<Todo> cap = ArgumentCaptor.forClass(Todo.class);
        verify(repo).save(cap.capture());
        Todo toPersist = cap.getValue();
        assertEquals("Task 1", toPersist.getTitle());
        assertEquals(6, toPersist.getSortIndex()); // last(5) + 1
        assertEquals(com.example.todobackend.model.ReminderStatus.PENDING, toPersist.getReminderStatus());
        assertNotNull(toPersist.getTags());
        assertEquals(2, toPersist.getTags().size());
        // ensure lower-case normalization happened via repository lookups
        assertTrue(toPersist.getTags().stream().anyMatch(t -> "work".equals(t.getName())));
        assertTrue(toPersist.getTags().stream().anyMatch(t -> "home".equals(t.getName())));
    }

    @Test
    void saveFromRequest_whenNoLast_setsSortIndexZero_and_nullReminderStatus() {
        String username = "bob";
        when(repo.findTopByUsernameOrderBySortIndexDesc(username)).thenReturn(Optional.empty());

        TodoRequest dto = TodoRequest.builder()
                .title("Task 2")
                .completed(null)
                .startDate(null)
                .activityType(null)
                .endDate(null)
                .tags(null)
                .reminderAt(null)
                .build();

        when(repo.save(any(Todo.class))).thenAnswer(inv -> inv.getArgument(0, Todo.class));

        Todo saved = service.saveFromRequest(dto, username);
        assertNotNull(saved);
        ArgumentCaptor<Todo> cap = ArgumentCaptor.forClass(Todo.class);
        verify(repo).save(cap.capture());
        Todo toPersist = cap.getValue();
        assertEquals(0, toPersist.getSortIndex());
        assertNull(toPersist.getReminderStatus());
        assertEquals(Boolean.FALSE, toPersist.getCompleted()); // defaults to false
    }

    @Test
    void resolveTagsFromNames_ignoresNullAndBlank_and_returnsOnlyValidTags() {
        Tag x = Tag.builder().id(1).name("x").build();
        when(tagRepo.findByNameIgnoreCase("x")).thenReturn(Optional.of(x));

        Set<Tag> tags = service.resolveTagsFromNames(Arrays.asList(" ", null, "x"));
        assertEquals(1, tags.size());
        assertTrue(tags.stream().anyMatch(t -> "x".equals(t.getName())));
    }

    @Test
    void reorderTodos_whenNullOrEmpty_returnsFindAllByUsername() {
        String user = "carol";
        List<Todo> existing = List.of(new Todo());
        when(repo.findAllByUsernameOrderBySortIndexAsc(user)).thenReturn(existing);

        List<Todo> result = service.reorderTodos(user, null);
        assertSame(existing, result);

        result = service.reorderTodos(user, Collections.emptyList());
        assertSame(existing, result);
    }

    @Test
    void reorderTodos_assignsIndicesInProvidedOrder_andPersists_andReturnsOrderedList() {
        String user = "dave";
        Todo t2 = new Todo();
        t2.setId(2);
        Todo t3 = new Todo();
        t3.setId(3);

        // Only todos belonging to user and in the list are returned
        when(repo.findByIdInAndUsername(Arrays.asList(3, 2, 1), user)).thenReturn(Arrays.asList(t2, t3));

        Todo ordered0 = new Todo();
        ordered0.setId(3);
        ordered0.setSortIndex(0);
        Todo ordered1 = new Todo();
        ordered1.setId(2);
        ordered1.setSortIndex(1);
        when(repo.findAllByUsernameOrderBySortIndexAsc(user)).thenReturn(Arrays.asList(ordered0, ordered1));

        List<Todo> result = service.reorderTodos(user, Arrays.asList(3, 2, 1));

        // ensure indices assigned
        assertEquals(0, t3.getSortIndex());
        assertEquals(1, t2.getSortIndex());
        // persisted
        verify(repo).saveAll(Arrays.asList(t2, t3));
        // returned fresh ordered list
        assertEquals(2, result.size());
        assertEquals(3, result.get(0).getId());
        assertEquals(2, result.get(1).getId());
    }

    @Test
    void deleteByIdAndUsername_deletesWhenPresent_and_noopWhenAbsent() {
        String user = "erin";
        // present
        Todo t = new Todo();
        t.setId(5);
        when(repo.findByIdAndUsername(5, user)).thenReturn(Optional.of(t));
        service.deleteByIdAndUsername(5, user);
        verify(repo).deleteById(5);

        // absent
        reset(repo);
        when(repo.findByIdAndUsername(6, user)).thenReturn(Optional.empty());
        service.deleteByIdAndUsername(6, user);
        verify(repo, never()).deleteById(anyInt());
    }
}
