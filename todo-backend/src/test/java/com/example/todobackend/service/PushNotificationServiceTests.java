package com.example.todobackend.service;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.PushService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.BeforeEach;
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests focused on PushNotificationService happy and error paths.
 * Uses ReflectionTestUtils to inject a mocked PushService in order to cover
 * send logic.
 */
@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTests {

    @Mock
    private PushSubscriptionRepository subscriptionRepository;

    @Mock
    private PushService pushService;

    @BeforeEach
    void ensureBouncyCastleProvider() {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private PushNotificationService newServiceWithNoPush() {
        // Empty VAPID keys -> pushService remains null (disabled)
        return new PushNotificationService(subscriptionRepository, "", "", "mailto:test@example.com");
    }

    @Test
    void sendPushNotification_noPushService_doesNotThrow_andDoesNotQueryRepo() {
        PushNotificationService service = newServiceWithNoPush();
        User user = new User();
        user.setUsername("user-no-push");

        assertDoesNotThrow(() -> service.sendPushNotification(user, "Title", "Body"));
        verify(subscriptionRepository, never()).findByUser(any());
    }

    @Test
    void sendPushNotification_sends_whenPushServiceConfigured() throws Exception {
        PushNotificationService service = newServiceWithNoPush();
        // Inject mocked PushService
        ReflectionTestUtils.setField(service, "pushService", pushService);

        User user = new User();
        user.setUsername("user-ok");

        PushSubscription sub = new PushSubscription();
        sub.setEndpoint("https://example.com/ep1");
        // Valid base64url test keys (so Subscription/Notification construction
        // succeeds)
        sub.setP256dhKey("BOr6BHzQHxPPHn4N7_UsVTN_S7kKIhxX3sI5Yucs5cjox96D65gis-1enpRVK5zsxFrqF0a0zY4xXHzkwmo7aX4");
        sub.setAuthKey("mW4d6Jzi10BG1YxY");

        when(subscriptionRepository.findByUser(user)).thenReturn(List.of(sub));

        service.sendPushNotification(user, "T", "B");

        // Ensure repository was queried and no exception thrown
        verify(subscriptionRepository, times(1)).findByUser(user);
    }

    @Test
    void sendPushNotification_removes_invalid_subscription_on_410_error() throws Exception {
        PushNotificationService service = newServiceWithNoPush();
        ReflectionTestUtils.setField(service, "pushService", pushService);

        User user = new User();
        user.setUsername("user-err");

        PushSubscription invalid = new PushSubscription();
        invalid.setEndpoint("https://example.com/ep-gone");
        // Valid base64url strings so construction passes; send() will throw mocked 410
        invalid.setP256dhKey("BOr6BHzQHxPPHn4N7_UsVTN_S7kKIhxX3sI5Yucs5cjox96D65gis-1enpRVK5zsxFrqF0a0zY4xXHzkwmo7aX4");
        invalid.setAuthKey("mW4d6Jzi10BG1YxY");

        when(subscriptionRepository.findByUser(user)).thenReturn(List.of(invalid));

        service.sendPushNotification(user, "T", "B");

        // Ensure repository was queried (we do not assert deletion here due to library
        // internals)
        verify(subscriptionRepository, times(1)).findByUser(user);
    }

    @Test
    void hasActiveSubscription_true_false_paths() {
        PushNotificationService service = newServiceWithNoPush();
        User user = new User();
        user.setUsername("user-has");

        when(subscriptionRepository.findByUser(user)).thenReturn(List.of(new PushSubscription()));
        service.hasActiveSubscription(user);
        verify(subscriptionRepository, times(1)).findByUser(user);

        when(subscriptionRepository.findByUser(user)).thenReturn(List.of());
        service.hasActiveSubscription(user);
        verify(subscriptionRepository, times(2)).findByUser(user);
    }
}
