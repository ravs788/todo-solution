package com.example.todobackend.controller;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.UserRepository;
import com.example.todobackend.service.PushNotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Target high-coverage for PushNotificationController by covering:
 * - 401 when unauthenticated
 * - 400 on invalid payload
 * - 200 happy paths for subscribe/unsubscribe/subscriptions/status
 */
class PushNotificationControllerTest {

    private final PushNotificationService pushService = mock(PushNotificationService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final PushNotificationController controller = new PushNotificationController(pushService, userRepository);

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    // Helpers

    private void setAuthenticatedPrincipal(String username) {
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        TestingAuthenticationToken auth = new TestingAuthenticationToken(username, "password");
        auth.setAuthenticated(true);
        ctx.setAuthentication(auth);
        SecurityContextHolder.setContext(ctx);
        User u = new User();
        u.setUsername(username);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(u));
    }

    private void setUnauthenticated() {
        SecurityContextHolder.clearContext();
    }

    // subscribe

    @Test
    void subscribe_returns401_when_unauthenticated() {
        setUnauthenticated();
        ResponseEntity<?> resp = controller.subscribe(Map.of("endpoint", "e"));
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void subscribe_returns400_when_invalid_payload() {
        setAuthenticatedPrincipal("alice");
        // Missing keys map entirely
        ResponseEntity<?> resp1 = controller.subscribe(Map.of("endpoint", "e"));
        assertEquals(400, resp1.getStatusCode().value());

        // Missing endpoint
        ResponseEntity<?> resp2 = controller.subscribe(Map.of("keys", Map.of("p256dh", "k", "auth", "a")));
        assertEquals(400, resp2.getStatusCode().value());
    }

    @Test
    void subscribe_returns200_on_success_and_calls_service() {
        setAuthenticatedPrincipal("bob");
        Map<String, Object> body = Map.of(
                "endpoint", "https://example.com/ep",
                "keys", Map.of("p256dh", "k", "auth", "a"));

        ResponseEntity<?> resp = controller.subscribe(body);
        assertEquals(200, resp.getStatusCode().value());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(pushService, times(1)).saveSubscription(
                userCaptor.capture(), eq("https://example.com/ep"), eq("k"), eq("a"));
        assertEquals("bob", userCaptor.getValue().getUsername());
    }

    // unsubscribe

    @Test
    void unsubscribe_returns401_when_unauthenticated() {
        setUnauthenticated();
        ResponseEntity<?> resp = controller.unsubscribe(Map.of("endpoint", "e"));
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void unsubscribe_returns400_when_endpoint_missing() {
        setAuthenticatedPrincipal("carol");
        ResponseEntity<?> resp = controller.unsubscribe(Map.of());
        assertEquals(400, resp.getStatusCode().value());
        verify(pushService, never()).removeSubscription(any(), anyString());
    }

    @Test
    void unsubscribe_returns200_on_success_and_calls_service() {
        setAuthenticatedPrincipal("dave");
        ResponseEntity<?> resp = controller.unsubscribe(Map.of("endpoint", "https://example.com/ep"));
        assertEquals(200, resp.getStatusCode().value());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(pushService, times(1)).removeSubscription(userCaptor.capture(), eq("https://example.com/ep"));
        assertEquals("dave", userCaptor.getValue().getUsername());
    }

    // getSubscriptions

    @Test
    void getSubscriptions_returns401_when_unauthenticated() {
        setUnauthenticated();
        ResponseEntity<?> resp = controller.getSubscriptions();
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void getSubscriptions_returns200_with_list() {
        setAuthenticatedPrincipal("erin");
        when(pushService.getUserSubscriptions(any()))
                .thenReturn(List.of(new PushSubscription(), new PushSubscription()));

        ResponseEntity<?> resp = controller.getSubscriptions();
        assertEquals(200, resp.getStatusCode().value());
        assertTrue(resp.getBody() instanceof List);
        List<?> list = (List<?>) resp.getBody();
        assertEquals(2, list.size());
    }

    // status

    @Test
    void getSubscriptionStatus_returns401_when_unauthenticated() {
        setUnauthenticated();
        ResponseEntity<?> resp = controller.getSubscriptionStatus();
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void getSubscriptionStatus_returns200_with_flag() {
        setAuthenticatedPrincipal("frank");
        when(pushService.hasActiveSubscription(any())).thenReturn(true);

        ResponseEntity<?> resp = controller.getSubscriptionStatus();
        assertEquals(200, resp.getStatusCode().value());
        assertTrue(resp.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) resp.getBody();
        assertEquals(Boolean.TRUE, body.get("hasActiveSubscription"));
    }
}
