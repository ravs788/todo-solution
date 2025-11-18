package com.example.todobackend.repository;

import com.example.todobackend.model.PushSubscription;
import com.example.todobackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUser(User user);

    void deleteByUser(User user);

    boolean existsByUserAndEndpoint(User user, String endpoint);
}
