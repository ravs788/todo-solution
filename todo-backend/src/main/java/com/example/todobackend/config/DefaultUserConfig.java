package com.example.todobackend.config;

import com.example.todobackend.repository.UserRepository;
import com.example.todobackend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class DefaultUserConfig {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DefaultUserConfig(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void init() {
        String defaultUsername = "admin";
        String defaultPassword = "password";
        User defaultUser = userRepository.findByUsername(defaultUsername).orElse(null);
        if (defaultUser == null) {
            defaultUser = new User();
            defaultUser.setUsername(defaultUsername);
        }
        defaultUser.setPassword(passwordEncoder.encode(defaultPassword));
        defaultUser.setStatus("ACTIVE");
        defaultUser.setRole("ADMIN");
        userRepository.save(defaultUser);
    }
}
