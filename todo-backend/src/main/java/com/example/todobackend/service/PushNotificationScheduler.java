package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.TodoRepository;
import com.example.todobackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class PushNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationScheduler.class);

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushService;

    @Autowired
    public PushNotificationScheduler(
            TodoRepository todoRepository,
            UserRepository userRepository,
            PushNotificationService pushService) {
        this.todoRepository = todoRepository;
        this.userRepository = userRepository;
        this.pushService = pushService;
    }

    /**
     * Check for due reminders every 30 seconds
     * This runs on all instances in a distributed system - consider using a distributed lock
     * for production deployments
     */
    @Scheduled(fixedRate = 30000) // 30 seconds
    public void checkAndSendReminders() {
        log.debug("Checking for due reminders...");

        try {
            LocalDateTime now = LocalDateTime.now();
            List<Todo> dueTodos = todoRepository.findByReminderAtBeforeAndReminderStatus(now, "PENDING");

            log.debug("Found {} due reminders", dueTodos.size());

            for (Todo todo : dueTodos) {
                try {
                    // Get the user for this todo
                    User user = userRepository.findByUsername(todo.getUsername())
                        .orElse(null);

                    if (user == null) {
                        log.warn("User not found for todo reminder: {}", todo.getUsername());
                        continue;
                    }

                    // Send push notification
                    String title = "Todo Reminder";
                    String body = formatReminderMessage(todo);
                    pushService.sendPushNotification(user, title, body);

                    // Mark reminder as sent
                    todo.setReminderStatus(com.example.todobackend.model.ReminderStatus.SENT);
                    todoRepository.save(todo);

                    log.info("Sent reminder notification for todo: {}", todo.getTitle());

                } catch (Exception e) {
                    log.error("Failed to send reminder for todo {}: {}", todo.getId(), e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error in reminder check job: {}", e.getMessage(), e);
        }
    }

    private String formatReminderMessage(Todo todo) {
        StringBuilder message = new StringBuilder();
        message.append("Reminder: ").append(todo.getTitle());

        if (todo.getEndDate() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm");
            String formattedDate = todo.getEndDate().format(formatter);
            message.append(" (Due: ").append(formattedDate).append(")");
        }

        return message.toString();
    }
}
