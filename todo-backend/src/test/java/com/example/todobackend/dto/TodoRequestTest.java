package com.example.todobackend.dto;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TodoRequest DTO Tests")
public class TodoRequestTest {

    @Nested
    @DisplayName("Builder Pattern Tests")
    class BuilderTests {

        @Test
        @DisplayName("Should build TodoRequest with all fields")
        void shouldBuildTodoRequestWithAllFields() {
            // Given
            String title = "Test Title";
            Boolean completed = true;
            LocalDateTime startDate = LocalDateTime.now();
            String activityType = "regular";
            LocalDateTime endDate = LocalDateTime.now().plusHours(1);
            List<String> tags = List.of("tag1", "tag2");

            // When
            TodoRequest request = TodoRequest.builder()
                    .title(title)
                    .completed(completed)
                    .startDate(startDate)
                    .activityType(activityType)
                    .endDate(endDate)
                    .tags(tags)
                    .build();

            // Then
            assertEquals(title, request.getTitle());
            assertEquals(completed, request.getCompleted());
            assertEquals(startDate, request.getStartDate());
            assertEquals(activityType, request.getActivityType());
            assertEquals(endDate, request.getEndDate());
            assertEquals(tags, request.getTags());
        }

        @Test
        @DisplayName("Should build TodoRequest with minimal fields")
        void shouldBuildTodoRequestWithMinimalFields() {
            // Given
            String title = "Minimal Title";

            // When
            TodoRequest request = TodoRequest.builder()
                    .title(title)
                    .build();

            // Then
            assertEquals(title, request.getTitle());
            assertNull(request.getCompleted());
            assertNull(request.getStartDate());
            assertNull(request.getActivityType());
            assertNull(request.getEndDate());
            assertNull(request.getTags());
        }

        @Test
        @DisplayName("Should allow method chaining in builder")
        void shouldAllowMethodChainingInBuilder() {
            // When
            TodoRequest request = TodoRequest.builder()
                    .title("Chained Title")
                    .completed(true)
                    .activityType("definite")
                    .tags(List.of("chained"))
                    .build();

            // Then
            assertEquals("Chained Title", request.getTitle());
            assertTrue(request.getCompleted());
            assertEquals("definite", request.getActivityType());
            assertEquals(List.of("chained"), request.getTags());
        }
    }

    @Nested
    @DisplayName("Getter/Setter Tests")
    class GetterSetterTests {

        @Test
        @DisplayName("Should set and get title")
        void shouldSetAndGetTitle() {
            // Given
            TodoRequest request = new TodoRequest();
            String title = "Test Title";

            // When
            request.setTitle(title);

            // Then
            assertEquals(title, request.getTitle());
        }

        @Test
        @DisplayName("Should set and get completed status")
        void shouldSetAndGetCompletedStatus() {
            // Given
            TodoRequest request = new TodoRequest();

            // When
            request.setCompleted(true);

            // Then
            assertTrue(request.getCompleted());

            // When
            request.setCompleted(false);

            // Then
            assertFalse(request.getCompleted());
        }

        @Test
        @DisplayName("Should set and get start date")
        void shouldSetAndGetStartDate() {
            // Given
            TodoRequest request = new TodoRequest();
            LocalDateTime startDate = LocalDateTime.now();

            // When
            request.setStartDate(startDate);

            // Then
            assertEquals(startDate, request.getStartDate());
        }

        @Test
        @DisplayName("Should set and get activity type")
        void shouldSetAndGetActivityType() {
            // Given
            TodoRequest request = new TodoRequest();
            String activityType = "regular";

            // When
            request.setActivityType(activityType);

            // Then
            assertEquals(activityType, request.getActivityType());
        }

        @Test
        @DisplayName("Should set and get end date")
        void shouldSetAndGetEndDate() {
            // Given
            TodoRequest request = new TodoRequest();
            LocalDateTime endDate = LocalDateTime.now().plusDays(1);

            // When
            request.setEndDate(endDate);

            // Then
            assertEquals(endDate, request.getEndDate());
        }

        @Test
        @DisplayName("Should set and get tags")
        void shouldSetAndGetTags() {
            // Given
            TodoRequest request = new TodoRequest();
            List<String> tags = List.of("tag1", "tag2", "tag3");

            // When
            request.setTags(tags);

            // Then
            assertEquals(tags, request.getTags());
            assertEquals(3, request.getTags().size());
        }
    }

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should create TodoRequest with no-args constructor")
        void shouldCreateWithNoArgsConstructor() {
            // When
            TodoRequest request = new TodoRequest();

            // Then
            assertNull(request.getTitle());
            assertNull(request.getCompleted());
            assertNull(request.getStartDate());
            assertNull(request.getActivityType());
            assertNull(request.getEndDate());
            assertNull(request.getTags());
        }

        @Test
        @DisplayName("Should create TodoRequest with all-args constructor")
        void shouldCreateWithAllArgsConstructor() {
            // Given
            String title = "Constructor Title";
            Boolean completed = false;
            LocalDateTime startDate = LocalDateTime.now();
            String activityType = "regular";
            LocalDateTime endDate = startDate.plusHours(2);
            List<String> tags = List.of("test");

            // When
            TodoRequest request = new TodoRequest(title, completed, startDate, activityType, endDate, tags);

            // Then
            assertEquals(title, request.getTitle());
            assertEquals(completed, request.getCompleted());
            assertEquals(startDate, request.getStartDate());
            assertEquals(activityType, request.getActivityType());
            assertEquals(endDate, request.getEndDate());
            assertEquals(tags, request.getTags());
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCases {

        @Test
        @DisplayName("Should handle empty tags list")
        void shouldHandleEmptyTagsList() {
            // Given
            TodoRequest request = TodoRequest.builder()
                    .title("Valid Title")
                    .completed(false)
                    .tags(List.of())
                    .build();

            // When & Then
            assertEquals(0, request.getTags().size());
        }

        @Test
        @DisplayName("Should handle special characters in title")
        void shouldHandleSpecialCharactersInTitle() {
            // Given
            String specialTitle = "Title with special chars: @#$%^&*()_+{}|:<>?[]\\;',./";

            // When
            TodoRequest request = TodoRequest.builder()
                    .title(specialTitle)
                    .completed(false)
                    .build();

            // Then
            assertEquals(specialTitle, request.getTitle());
        }

        @Test
        @DisplayName("Should handle unicode characters in title")
        void shouldHandleUnicodeCharactersInTitle() {
            // Given
            String unicodeTitle = "Unicode Title: 你好世界 🌍 éñ español";

            // When
            TodoRequest request = TodoRequest.builder()
                    .title(unicodeTitle)
                    .completed(false)
                    .build();

            // Then
            assertEquals(unicodeTitle, request.getTitle());
        }

        @Test
        @DisplayName("Should handle null values in builder")
        void shouldHandleNullValuesInBuilder() {
            // When
            TodoRequest request = TodoRequest.builder()
                    .title("Test Title")
                    .completed(null)
                    .startDate(null)
                    .activityType(null)
                    .endDate(null)
                    .tags(null)
                    .build();

            // Then
            assertEquals("Test Title", request.getTitle());
            assertNull(request.getCompleted());
            assertNull(request.getStartDate());
            assertNull(request.getActivityType());
            assertNull(request.getEndDate());
            assertNull(request.getTags());
        }
    }
}
