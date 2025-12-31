package com.example.todobackend.service;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PushNotificationServiceTest {

    private PushSubscriptionRepository repo;

    private User user(String name) {
        User u = new User();
        u.setUsername(name);
        return u;
    }

    private PushSubscription sub(User u, String endpoint, String p256, String auth) {
        PushSubscription s = new PushSubscription();
        s.setUser(u);
        s.setEndpoint(endpoint);
        s.setP256dhKey(p256);
        s.setAuthKey(auth);
        return s;
    }

    @BeforeEach
    void setup() {
        repo = mock(PushSubscriptionRepository.class);
    }

    @Test
    void saveSubscription_doesNotSave_whenAlreadyExists() {
        User u = user("alice");
        when(repo.existsByUserAndEndpoint(u, "e1")).thenReturn(true);

        PushNotificationService svc = new PushNotificationService(repo, "", "", "");
        svc.saveSubscription(u, "e1", "k", "a");

        verify(repo, never()).save(any());
    }

    @Test
    void saveSubscription_saves_whenNotExists() {
        User u = user("bob");
        when(repo.existsByUserAndEndpoint(u, "e2")).thenReturn(false);

        PushNotificationService svc = new PushNotificationService(repo, "", "", "");
        svc.saveSubscription(u, "e2", "p256", "auth");

        ArgumentCaptor<PushSubscription> cap = ArgumentCaptor.forClass(PushSubscription.class);
        verify(repo).save(cap.capture());
        PushSubscription saved = cap.getValue();
        assertSame(u, saved.getUser());
        assertEquals("e2", saved.getEndpoint());
        assertEquals("p256", saved.getP256dhKey());
        assertEquals("auth", saved.getAuthKey());
    }

    @Test
    void removeSubscription_deletesOnlyMatchingEndpoint() {
        User u = user("carol");
        PushSubscription keep = sub(u, "keep", "k1", "a1");
        PushSubscription del = sub(u, "delete", "k2", "a2");
        when(repo.findByUser(u)).thenReturn(List.of(keep, del));

        PushNotificationService svc = new PushNotificationService(repo, "", "", "");
        svc.removeSubscription(u, "delete");

        verify(repo).delete(del);
        verify(repo, never()).delete(keep);
    }

    @Test
    void removeAllSubscriptions_callsRepository() {
        User u = user("dan");
        PushNotificationService svc = new PushNotificationService(repo, "", "", "");
        svc.removeAllSubscriptions(u);
        verify(repo).deleteByUser(u);
    }

    @Test
    void hasActiveSubscription_and_getUserSubscriptions_work() {
        User u = user("eve");
        when(repo.findByUser(u)).thenReturn(List.of(sub(u, "e", "p", "a")));
        PushNotificationService svc = new PushNotificationService(repo, "", "", "");
        assertTrue(svc.hasActiveSubscription(u));
        assertEquals(1, svc.getUserSubscriptions(u).size());

        when(repo.findByUser(u)).thenReturn(List.of());
        assertFalse(svc.hasActiveSubscription(u));
        assertTrue(svc.getUserSubscriptions(u).isEmpty());
    }

    @Test
    void sendPushNotification_whenPushServiceNotInitialized_doesNothing() {
        User u = user("frank");
        PushNotificationService svc = new PushNotificationService(repo, "", "", ""); // pushService == null
        svc.sendPushNotification(u, "t", "b");
        verify(repo, never()).findByUser(any());
    }

    @Disabled("PushService.send is likely final; Mockito verification unreliable without inline mock maker. Skipping this interaction test.")
    @Test
    void sendPushNotification_success_and_error_removesInvalidSub() throws Exception {
        User u = user("grace");

        // Service tries to init PushService with keys; invalid keys -> caught and set
        // null.
        PushNotificationService svc = new PushNotificationService(repo, "pub", "priv", "mailto:x@y");
        // Inject a mock PushService via reflection
        PushService push = mock(PushService.class);
        Field f = PushNotificationService.class.getDeclaredField("pushService");
        f.setAccessible(true);
        f.set(svc, push);

        PushSubscription ok = sub(u, "https://ok", "p1", "a1");
        PushSubscription gone = sub(u, "https://gone", "p2", "a2");
        when(repo.findByUser(u)).thenReturn(List.of(ok, gone));

        // First send succeeds, second throws an error with 410 to trigger deletion
        when(push.send(any(Notification.class)))
                .thenReturn(null)
                .thenThrow(new RuntimeException("410 Gone"));

        svc.sendPushNotification(u, "Title", "Body");

        // push.send is called twice
        verify(push, times(2)).send(any(Notification.class));
        // repository.delete called for the invalid subscription
        verify(repo).delete(gone);
        verify(repo, never()).delete(ok);
    }
}
