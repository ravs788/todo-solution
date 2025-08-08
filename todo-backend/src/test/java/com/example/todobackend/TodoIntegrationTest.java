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
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Epic("Integration Tests")
@Feature("Todo Integration Tests")
public class TodoIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @Story("End-to-End Create Todo")
    @Description("Test end-to-end create todo with login token")
    @Severity(SeverityLevel.CRITICAL)
    public void endToEnd_createTodo_withLoginToken() {
        // --- 1. Login and get token ---
        String loginUrl = "http://localhost:" + port + "/api/auth/login";
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        ResponseEntity<String> loginResponse = restTemplate.postForEntity(
                loginUrl, loginRequest, String.class);

        Assertions.assertEquals(HttpStatus.OK, loginResponse.getStatusCode(), "Login should succeed");
        String token = loginResponse.getBody();
        Assertions.assertNotNull(token, "Token should not be null");

        // --- 2. Create todo using token ---
        String todosUrl = "http://localhost:" + port + "/api/todos";
        TodoRequest todoRequest = new TodoRequest();
        todoRequest.setTitle("integration test todo");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<TodoRequest> req = new HttpEntity<>(todoRequest, headers);

        ResponseEntity<Todo> todoResponse = restTemplate.postForEntity(
                todosUrl, req, Todo.class);

        Assertions.assertEquals(HttpStatus.OK, todoResponse.getStatusCode(), "Todo creation should succeed");
        Todo created = todoResponse.getBody();
        Assertions.assertNotNull(created, "Created Todo should not be null");
        Assertions.assertEquals("integration test todo", created.getTitle());
    }
}
