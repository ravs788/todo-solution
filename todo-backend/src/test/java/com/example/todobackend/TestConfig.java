package com.example.todobackend;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.PushSubscriptionRepository;
import com.example.todobackend.service.PushNotificationService;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import java.security.GeneralSecurityException;
import java.util.List;

@TestConfiguration
@Profile("h2") // Only active during H2 tests
public class TestConfig {

    @Bean
    @Primary
    public PushNotificationService pushNotificationService(PushSubscriptionRepository subscriptionRepository) throws GeneralSecurityException {
        // Return a mock service for testing
        PushNotificationService mockService = Mockito.mock(PushNotificationService.class);

        // Configure mock behavior
        Mockito.doNothing().when(mockService).saveSubscription(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any());
        Mockito.doNothing().when(mockService).removeSubscription(Mockito.any(), Mockito.any());
        Mockito.doNothing().when(mockService).removeAllSubscriptions(Mockito.any());
        Mockito.doNothing().when(mockService).sendPushNotification(Mockito.any(), Mockito.any(), Mockito.any());
        Mockito.when(mockService.getUserSubscriptions(Mockito.any())).thenReturn(List.of());
        Mockito.when(mockService.hasActiveSubscription(Mockito.any())).thenReturn(false);

        return mockService;
    }
}
