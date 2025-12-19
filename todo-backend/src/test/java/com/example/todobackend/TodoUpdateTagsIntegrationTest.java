package com.example.todobackend;

import com.example.todobackend.dto.LoginRequest;
import com.example.todobackend.dto.TodoRequest;
import com.example.todobackend.model.Todo;
import io.qameta.allure.*;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;

/**
 * Integration test that verifies updating tags on an existing Todo.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import(TestConfig.class)
@Epic("Integration Tests")
@Feature("Todo Update Tags Integration Test")
public class TodoUpdateTagsIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Story("Update Tags on Existing Todo")
    @Description("Create a todo without tags, then update it with new tag list and verify replacement.")
    @Severity(SeverityLevel.CRITICAL)
    @Test
    void updateTodoTags_endToEnd() {
        // 1. Register & approve a user (reuse admin credentials)
        String uniqueUser = "updtag_" + System.currentTimeMillis();

        LoginRequest reg = new LoginRequest();
        reg.setUsername(uniqueUser);
        reg.setPassword("password");
        restTemplate.postForEntity("/api/auth/register", reg, String.class);

        // Admin login
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("admin");
        adminLogin.setPassword("password");
        String adminToken = restTemplate.postForEntity("/api/auth/login", adminLogin, String.class).getBody();
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.set("Authorization", "Bearer " + adminToken);
        restTemplate.postForEntity("/api/auth/approve/" + uniqueUser, new HttpEntity<>(adminHeaders), String.class);

        // User login
        String token = restTemplate.postForEntity("/api/auth/login", reg, String.class).getBody();
        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.set("Authorization", "Bearer " + token);
        userHeaders.setContentType(MediaType.APPLICATION_JSON);

        // 2. Create todo WITHOUT tags
        TodoRequest createReq = new TodoRequest();
        createReq.setTitle("Todo without tags");
        createReq.setCompleted(false);

        ResponseEntity<Todo> createdResp =
                restTemplate.postForEntity("/api/todos", new HttpEntity<>(createReq, userHeaders), Todo.class);
        Assertions.assertEquals(HttpStatus.OK, createdResp.getStatusCode());
        Integer todoId = createdResp.getBody().getId();

        // 3. Update todo WITH tags ["urgent", "critical"]
        TodoRequest updReq = new TodoRequest();
        updReq.setTags(List.of("urgent", "critical"));

        ResponseEntity<Todo> updResp = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT,
                new HttpEntity<>(updReq, userHeaders), Todo.class);
        Assertions.assertEquals(HttpStatus.OK, updResp.getStatusCode());
        Todo updated = updResp.getBody();
        Assertions.assertNotNull(updated.getTags());
        Assertions.assertEquals(2, updated.getTags().size());

        // 4. Replace tags with single tag ["home"]
        TodoRequest replaceReq = new TodoRequest();
        replaceReq.setTags(List.of("home"));
        ResponseEntity<Todo> replResp = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT,
                new HttpEntity<>(replaceReq, userHeaders), Todo.class);
        Assertions.assertEquals(HttpStatus.OK, replResp.getStatusCode());
        Todo replaced = replResp.getBody();
        Assertions.assertNotNull(replaced.getTags());
        Assertions.assertEquals(1, replaced.getTags().size());
        Assertions.assertEquals("home", replaced.getTags().iterator().next().getName());
    }
}
