package com.example.todobackend.controller;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.UserRepository;
import com.example.todobackend.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/push")
@CrossOrigin(origins = "*") // For development: allow all origins
public class PushNotificationController {

    private final PushNotificationService pushService;
    private final UserRepository userRepository;

    @Autowired
    public PushNotificationController(PushNotificationService pushService, UserRepository userRepository) {
        this.pushService = pushService;
        this.userRepository = userRepository;
    }

    private Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        String username = null;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        if (username != null) {
            return userRepository.findByUsername(username);
        }
        return Optional.empty();
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, Object> subscriptionData) {
        Optional<User> userOpt = getCurrentUser();
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            // Extract subscription data from the request
            @SuppressWarnings("unchecked")
            Map<String, Object> keys = (Map<String, Object>) subscriptionData.get("keys");

            String endpoint = (String) subscriptionData.get("endpoint");
            String p256dhKey = (String) keys.get("p256dh");
            String authKey = (String) keys.get("auth");

            if (endpoint == null || p256dhKey == null || authKey == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid subscription data"));
            }

            pushService.saveSubscription(userOpt.get(), endpoint, p256dhKey, authKey);
            return ResponseEntity.ok(Map.of("message", "Subscription saved successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save subscription: " + e.getMessage()));
        }
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody Map<String, String> subscriptionData) {
        Optional<User> userOpt = getCurrentUser();
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        try {
            String endpoint = subscriptionData.get("endpoint");
            if (endpoint == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Endpoint required"));
            }

            pushService.removeSubscription(userOpt.get(), endpoint);
            return ResponseEntity.ok(Map.of("message", "Subscription removed successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to remove subscription: " + e.getMessage()));
        }
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<?> getSubscriptions() {
        Optional<User> userOpt = getCurrentUser();
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        List<PushSubscription> subscriptions = pushService.getUserSubscriptions(userOpt.get());
        return ResponseEntity.ok(subscriptions);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getSubscriptionStatus() {
        Optional<User> userOpt = getCurrentUser();
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        boolean hasActiveSubscription = pushService.hasActiveSubscription(userOpt.get());
        return ResponseEntity.ok(Map.of("hasActiveSubscription", hasActiveSubscription));
    }
}
