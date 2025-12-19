package com.example.todobackend.service;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final PushSubscriptionRepository subscriptionRepository;
    private PushService pushService;

    @Autowired
    public PushNotificationService(
            PushSubscriptionRepository subscriptionRepository,
            @Value("${push.vapid.public.key:}") String vapidPublicKey,
            @Value("${push.vapid.private.key:}") String vapidPrivateKey,
            @Value("${push.vapid.subject:mailto:admin@example.com}") String vapidSubject) {

        this.subscriptionRepository = subscriptionRepository;

        // Initialize the push service with VAPID keys (with fallback for missing keys)
        if (vapidPublicKey != null && !vapidPublicKey.trim().isEmpty() &&
            vapidPrivateKey != null && !vapidPrivateKey.trim().isEmpty()) {
            try {
                this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
                log.info("Push notification service initialized successfully");
            } catch (GeneralSecurityException e) {
                log.error("Failed to initialize push service with provided VAPID keys: {}", e.getMessage());
                this.pushService = null;
            }
        } else {
            log.warn("VAPID keys not configured. Push notifications will be disabled.");
            this.pushService = null;
        }
    }

    @Transactional
    public void saveSubscription(User user, String endpoint, String p256dhKey, String authKey) {
        // Check if subscription already exists
        if (subscriptionRepository.existsByUserAndEndpoint(user, endpoint)) {
            log.debug("Push subscription already exists for user {} and endpoint {}", user.getUsername(), endpoint);
            return;
        }

        PushSubscription subscription = new PushSubscription();
        subscription.setUser(user);
        subscription.setEndpoint(endpoint);
        subscription.setP256dhKey(p256dhKey);
        subscription.setAuthKey(authKey);

        subscriptionRepository.save(subscription);
        log.info("Saved push subscription for user: {}", user.getUsername());
    }

    @Transactional
    public void removeSubscription(User user, String endpoint) {
        List<PushSubscription> subscriptions = subscriptionRepository.findByUser(user);
        subscriptions.stream()
            .filter(sub -> sub.getEndpoint().equals(endpoint))
            .forEach(subscriptionRepository::delete);

        log.info("Removed push subscription for user: {}", user.getUsername());
    }

    @Transactional
    public void removeAllSubscriptions(User user) {
        subscriptionRepository.deleteByUser(user);
        log.info("Removed all push subscriptions for user: {}", user.getUsername());
    }

    public void sendPushNotification(User user, String title, String body) {
        if (pushService == null) {
            log.warn("Push service not initialized. Cannot send notifications.");
            return;
        }

        List<PushSubscription> subscriptions = subscriptionRepository.findByUser(user);

        for (PushSubscription sub : subscriptions) {
            try {
                // Create the subscription object for the web-push library
                Subscription subscription = new Subscription(
                    sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dhKey(), sub.getAuthKey())
                );

                // Create notification payload
                String payload = String.format(
                    "{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/logo192.png\",\"badge\":\"/logo192.png\"}",
                    title.replace("\"", "\\\""),
                    body.replace("\"", "\\\"")
                );

                // Send the notification
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);

                log.debug("Sent push notification to user: {}", user.getUsername());

            } catch (Exception e) {
                log.error("Failed to send push notification to user {}: {}", user.getUsername(), e.getMessage());
                // Consider removing invalid subscriptions
                if (e.getMessage().contains("410") || e.getMessage().contains("404")) {
                    subscriptionRepository.delete(sub);
                    log.info("Removed invalid push subscription for user: {}", user.getUsername());
                }
            }
        }
    }

    public List<PushSubscription> getUserSubscriptions(User user) {
        return subscriptionRepository.findByUser(user);
    }

    public boolean hasActiveSubscription(User user) {
        return !subscriptionRepository.findByUser(user).isEmpty();
    }
}
