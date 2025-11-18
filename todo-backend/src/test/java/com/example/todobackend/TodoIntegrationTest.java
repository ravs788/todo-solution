package com.example.todobackend;

import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;

import com.example.todobackend.dto.LoginRequest;
import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Todo;
import com.example.todobackend.repository.TodoRepository;
import com.example.todobackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("h2")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import(TestConfig.class)
@Epic("Integration Tests")
@Feature("Todo Integration Tests")
public class TodoIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private UserRepository userRepository;

    // Holds the username used for test-specific user cleanup
    private String testUser;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private <T> T loadTestData(String fileName, Class<T> clazz) throws IOException {
        try (java.io.InputStream is = getClass().getClassLoader().getResourceAsStream("test-data/" + fileName)) {
            if (is == null) throw new java.io.FileNotFoundException("test-data/" + fileName + " not found in classpath");
            return objectMapper.readValue(is, clazz);
        }
    }

    @Test
    @Story("End-to-End Create Todo")
    @Description("Test end-to-end create todo with login token")
    @Severity(SeverityLevel.CRITICAL)
    public void endToEnd_createTodo_withLoginToken() throws IOException {
        // --- 1. Create test user for the test and perform login ---
        testUser = "integration_" + System.currentTimeMillis();

        // Prepare login and todo request data from JSON
        LoginRequest loginRequest = loadTestData("login-request.json", LoginRequest.class);
        loginRequest.setUsername(testUser); // ensure unique per run

        // First, register user
        String registerUrl = "/api/auth/register";
        restTemplate.postForEntity(registerUrl, loginRequest, String.class);

        // Approve user as admin (mimic approval, using admin user)
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("admin");
        adminLogin.setPassword("password");
        String adminToken = restTemplate.postForEntity(
            "/api/auth/login",
            adminLogin,
            String.class
        ).getBody();
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        restTemplate.postForEntity(
            "/api/auth/approve/" + testUser,
            new HttpEntity<>(adminHeaders),
            String.class
        );

        // Now login as test user and get token
        String loginUrl = "/api/auth/login";
        ResponseEntity<String> loginResponse = restTemplate.postForEntity(
                loginUrl, loginRequest, String.class);

        Assertions.assertEquals(HttpStatus.OK, loginResponse.getStatusCode(), "Login should succeed");
        String token = loginResponse.getBody();
        Assertions.assertNotNull(token, "Token should not be null");

        // --- 2. Create todo using token ---
        String todosUrl = "/api/todos";
        TodoRequest todoRequest = loadTestData("todo-request.json", TodoRequest.class);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<TodoRequest> req = new HttpEntity<>(todoRequest, headers);

        ResponseEntity<Todo> todoResponse = restTemplate.postForEntity(
                todosUrl, req, Todo.class);

        Assertions.assertEquals(HttpStatus.OK, todoResponse.getStatusCode(), "Todo creation should succeed");
        Todo created = todoResponse.getBody();
        Assertions.assertNotNull(created, "Created Todo should not be null");
        Assertions.assertEquals(todoRequest.getTitle(), created.getTitle());
    }

    @Test
    @Story("Todo Isolation Per User")
    @Description("Verify that users can only see their own todos")
    @Severity(SeverityLevel.CRITICAL)
    public void todos_are_isolated_per_user() throws IOException {
        // Use a unique username per test run to avoid DB collisions
        testUser = "ravi_" + System.currentTimeMillis();

        // Load login input from JSON and set testUser as username
        LoginRequest loginRequest = loadTestData("login-request.json", LoginRequest.class);
        loginRequest.setUsername(testUser);

        // Register a new user
        String registerUrl = "/api/auth/register";
        restTemplate.postForEntity(registerUrl, loginRequest, String.class);

        // Approve user as admin
        String adminLoginUrl = "/api/auth/login";
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("admin");
        adminLogin.setPassword("password");
        String adminToken = restTemplate.postForEntity(adminLoginUrl, adminLogin, String.class).getBody();
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        restTemplate.postForEntity("/api/auth/approve/" + testUser,
                new HttpEntity<>(adminHeaders), String.class);

        // Login as testUser
        String testUserToken = restTemplate.postForEntity(adminLoginUrl, loginRequest, String.class).getBody();

        // testUser creates a todo from JSON
        String todosUrl = "/api/todos";
        TodoRequest testUserTodoReq = loadTestData("todo-request.json", TodoRequest.class);
        testUserTodoReq.setTitle(testUser + "'s todo");
        HttpHeaders testUserHeaders = new HttpHeaders();
        testUserHeaders.set("Authorization", "Bearer " + testUserToken);
        testUserHeaders.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<TodoRequest> testUserReqEntity = new HttpEntity<>(testUserTodoReq, testUserHeaders);
        restTemplate.postForEntity(todosUrl, testUserReqEntity, Todo.class);

        // Create a second user for isolation check
        String user2 = "user2_" + System.currentTimeMillis();
        LoginRequest user2LoginReq = loadTestData("login-request.json", LoginRequest.class);
        user2LoginReq.setUsername(user2);
        restTemplate.postForEntity(registerUrl, user2LoginReq, String.class);
        restTemplate.postForEntity("/api/auth/approve/" + user2,
                new HttpEntity<>(adminHeaders), String.class);
        String user2Token = restTemplate.postForEntity(adminLoginUrl, user2LoginReq, String.class).getBody();
        TodoRequest user2TodoReq = loadTestData("todo-request.json", TodoRequest.class);
        user2TodoReq.setTitle(user2 + "'s todo");
        HttpHeaders user2Headers = new HttpHeaders();
        user2Headers.set("Authorization", "Bearer " + user2Token);
        user2Headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<TodoRequest> user2ReqEntity = new HttpEntity<>(user2TodoReq, user2Headers);
        restTemplate.postForEntity(todosUrl, user2ReqEntity, Todo.class);

        // testUser only sees their own todo
        ResponseEntity<Todo[]> testUserTodosResp = restTemplate.exchange(
                todosUrl, HttpMethod.GET, new HttpEntity<>(testUserHeaders), Todo[].class);
        Assertions.assertNotNull(testUserTodosResp.getBody());
        // Ensure visibility is isolated: created todo for testUser is present, and user2's todo is not
        Assertions.assertTrue(java.util.Arrays.stream(testUserTodosResp.getBody())
            .anyMatch(t -> (testUser + "'s todo").equals(t.getTitle())), "Created todo must be present for testUser");
        Assertions.assertFalse(java.util.Arrays.stream(testUserTodosResp.getBody())
            .anyMatch(t -> (user2 + "'s todo").equals(t.getTitle())), "No todos from other users should be visible");

        // user2 only sees their own todo
        ResponseEntity<Todo[]> user2TodosResp = restTemplate.exchange(
                todosUrl, HttpMethod.GET, new HttpEntity<>(user2Headers), Todo[].class);
        Assertions.assertNotNull(user2TodosResp.getBody());
        // Ensure visibility is isolated: created todo for user2 is present, and testUser's todo is not
        Assertions.assertTrue(java.util.Arrays.stream(user2TodosResp.getBody())
            .anyMatch(t -> (user2 + "'s todo").equals(t.getTitle())), "Created todo must be present for user2");
        Assertions.assertFalse(java.util.Arrays.stream(user2TodosResp.getBody())
            .anyMatch(t -> (testUser + "'s todo").equals(t.getTitle())), "No todos from other users should be visible");

        // CLEANUP for user2 as well
        todoRepository.findAllByUsername(user2)
            .forEach(todo -> todoRepository.deleteById(todo.getId()));
        userRepository.findByUsername(user2)
            .ifPresent(user -> userRepository.deleteById(user.getId()));
    }

    @Test
    @Story("Create Todo with Tags (Integration)")
    @Description("Test creating a todo with tags, and then fetch todo to verify tags are present. Also test tag suggestion endpoint.")
    @Severity(SeverityLevel.CRITICAL)
    public void createTodo_withTags_andSuggestTags() throws IOException {
        String uniqueUser = "taguser_" + System.currentTimeMillis();

        LoginRequest loginRequest = loadTestData("login-request.json", LoginRequest.class);
        loginRequest.setUsername(uniqueUser);

        // Register and approve as above
        restTemplate.postForEntity("/api/auth/register", loginRequest, String.class);

        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("admin");
        adminLogin.setPassword("password");
        String adminToken = restTemplate.postForEntity(
            "/api/auth/login",
            adminLogin,
            String.class
        ).getBody();
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        restTemplate.postForEntity(
            "/api/auth/approve/" + uniqueUser,
            new HttpEntity<>(adminHeaders),
            String.class
        );
        // Login as test user
        String token = restTemplate.postForEntity("/api/auth/login", loginRequest, String.class).getBody();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Create todo with tags
        TodoRequest todoRequest = new TodoRequest();
        todoRequest.setTitle("Todo With Tags");
        todoRequest.setCompleted(false);
        todoRequest.setTags(java.util.List.of("work", "urgent"));
        HttpEntity<TodoRequest> req = new HttpEntity<>(todoRequest, headers);

        ResponseEntity<Todo> todoResponse = restTemplate.postForEntity("/api/todos", req, Todo.class);
        Assertions.assertEquals(HttpStatus.OK, todoResponse.getStatusCode());
        Todo created = todoResponse.getBody();
        Assertions.assertNotNull(created);
        Assertions.assertNotNull(created.getTags());
        Assertions.assertEquals(2, created.getTags().size());
        Assertions.assertTrue(created.getTags().stream().anyMatch(t -> t.getName().equals("work")));
        Assertions.assertTrue(created.getTags().stream().anyMatch(t -> t.getName().equals("urgent")));

        // Fetch all todos and verify tags
        ResponseEntity<Todo[]> allTodosResp = restTemplate.exchange(
                "/api/todos", HttpMethod.GET, new HttpEntity<>(headers), Todo[].class);
        Assertions.assertEquals(HttpStatus.OK, allTodosResp.getStatusCode());
        Todo[] todos = allTodosResp.getBody();
        Assertions.assertNotNull(todos);
        Assertions.assertTrue(java.util.Arrays.stream(todos)
            .anyMatch(t -> t.getTags() != null && t.getTags().size() == 2));

        // Test tag suggestion endpoint
        ResponseEntity<String[]> suggestResp = restTemplate.exchange(
            "/api/tags?search=wor", HttpMethod.GET, null, String[].class);
        Assertions.assertEquals(HttpStatus.OK, suggestResp.getStatusCode());
        String[] suggestions = suggestResp.getBody();
        Assertions.assertNotNull(suggestions);
        Assertions.assertTrue(java.util.Arrays.asList(suggestions).contains("work"));
    }

    @Test
    @Story("Create and Update Todo with Reminders")
    @Description("Test creating a todo with reminderAt, and updating reminderAt")
    @Severity(SeverityLevel.CRITICAL)
    public void create_and_update_todo_with_reminders() throws IOException {
        String uniqueUser = "reminderuser_" + System.currentTimeMillis();

        LoginRequest loginRequest = loadTestData("login-request.json", LoginRequest.class);
        loginRequest.setUsername(uniqueUser);

        // Register and approve as above
        restTemplate.postForEntity("/api/auth/register", loginRequest, String.class);

        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("admin");
        adminLogin.setPassword("password");
        String adminToken = restTemplate.postForEntity(
            "/api/auth/login",
            adminLogin,
            String.class
        ).getBody();
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        restTemplate.postForEntity(
            "/api/auth/approve/" + uniqueUser,
            new HttpEntity<>(adminHeaders),
            String.class
        );
        // Login as test user
        String token = restTemplate.postForEntity("/api/auth/login", loginRequest, String.class).getBody();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Create todo with reminderAt
        TodoRequest todoRequest = new TodoRequest();
        todoRequest.setTitle("Todo With Reminder");
        todoRequest.setCompleted(false);
        todoRequest.setReminderAt(java.time.LocalDateTime.now().plusDays(1)); // tomorrow
        HttpEntity<TodoRequest> req = new HttpEntity<>(todoRequest, headers);

        ResponseEntity<Todo> todoResponse = restTemplate.postForEntity("/api/todos", req, Todo.class);
        Assertions.assertEquals(HttpStatus.OK, todoResponse.getStatusCode());
        Todo created = todoResponse.getBody();
        Assertions.assertNotNull(created);
        Assertions.assertNotNull(created.getReminderAt());
        Assertions.assertEquals(com.example.todobackend.model.ReminderStatus.PENDING, created.getReminderStatus());

        // Update reminderAt to null
        TodoRequest updateRequest = new TodoRequest();
        updateRequest.setTitle("Updated Todo");
        updateRequest.setReminderAt(null); // clear reminder
        HttpEntity<TodoRequest> updateReq = new HttpEntity<>(updateRequest, headers);

        ResponseEntity<Todo> updateResponse = restTemplate.exchange(
            "/api/todos/" + created.getId(),
            HttpMethod.PUT,
            updateReq,
            Todo.class
        );
        Assertions.assertEquals(HttpStatus.OK, updateResponse.getStatusCode());
        Todo updated = updateResponse.getBody();
        Assertions.assertNotNull(updated);
        Assertions.assertNull(updated.getReminderAt());
        Assertions.assertNull(updated.getReminderStatus());

        // Update with new reminderAt
        updateRequest.setReminderAt(java.time.LocalDateTime.now().plusHours(2));
        updateReq = new HttpEntity<>(updateRequest, headers);
        ResponseEntity<Todo> updateResponse2 = restTemplate.exchange(
            "/api/todos/" + created.getId(),
            HttpMethod.PUT,
            updateReq,
            Todo.class
        );
        Assertions.assertEquals(HttpStatus.OK, updateResponse2.getStatusCode());
        Todo updated2 = updateResponse2.getBody();
        Assertions.assertNotNull(updated2);
        Assertions.assertNotNull(updated2.getReminderAt());
        Assertions.assertEquals(com.example.todobackend.model.ReminderStatus.PENDING, updated2.getReminderStatus());
    }
}
