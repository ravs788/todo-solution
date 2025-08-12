package com.example.todobackend.controller;

import com.example.todobackend.dto.LoginRequest;
import com.example.todobackend.dto.RegisterRequest;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.todobackend.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.todobackend.dto.ForgotPasswordRequest;
import com.example.todobackend.dto.ResetPasswordRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/approve/{username}")
    @Operation(summary = "Approve a pending user (ADMIN only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User approved successfully"),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "409", description = "User is not pending")
    })
    public ResponseEntity<String> approveUser(@org.springframework.web.bind.annotation.PathVariable String username) {
        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        var user = userOpt.get();
        if (!"PENDING".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(409).body("User is not pending");
        }
        user.setStatus("ACTIVE");
        userRepository.save(user);
        return ResponseEntity.ok("User approved successfully");
    }

    @PostMapping("/login")
    @Operation(summary = "Login to the application")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successful login, returns JWT token"),
        @ApiResponse(responseCode = "401", description = "Invalid username or password")
    })
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
            // Get user entity to access role
            var userOpt = userRepository.findByUsername(loginRequest.getUsername());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body("Invalid username or password");
            }
            String role = userOpt.get().getRole();
            String token = jwtTokenProvider.generateToken(authentication.getName(), role);
            return ResponseEntity.ok(token);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Invalid username or password");
        }
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user (status will be PENDING until approved)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "User registered, pending approval"),
        @ApiResponse(responseCode = "409", description = "Username already exists")
    })
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(409).body("Username already exists");
        }
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setStatus("PENDING");
        user.setRole("USER");
        userRepository.save(user);
        return ResponseEntity.status(201).body("User registered successfully. Pending approval by admin.");
    }

    @Operation(summary = "Initiate password reset. Generates a reset token for the user.")
    @PostMapping("/reset-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        System.out.println("[DEBUG] ForgotPassword called for username: " + request.getUsername());
        try {
            if (request.getUsername() == null || request.getNewPassword() == null) {
                System.out.println("[DEBUG] Bad request: missing username or password");
                return ResponseEntity.badRequest().body("Username and new password required.");
            }
            var userOpt = userRepository.findByUsername(request.getUsername());
            if (userOpt.isEmpty()) {
                System.out.println("[DEBUG] User not found: " + request.getUsername());
                return ResponseEntity.status(404).body("User not found");
            }
            User user = userOpt.get();
            String oldHash = user.getPassword();
            String newHash = passwordEncoder.encode(request.getNewPassword());
            System.out.println("[DEBUG] Old password hash: " + oldHash);
            System.out.println("[DEBUG] New password hash will be: " + newHash);
            user.setPassword(newHash);
            user.setStatus("DEBUG_RESET"); // DEBUG: change status to verify user's record is updated
            userRepository.save(user);
            System.out.println("[DEBUG] Password reset and saved for user: " + user.getUsername());
            System.out.println("[DEBUG] Password hash in entity after save: " + user.getPassword());
            return ResponseEntity.ok("Password has been reset for " + user.getUsername());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @Operation(summary = "Reset password using reset token or directly for username")
    @PostMapping("/forgot-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        System.out.println("[DEBUG] ResetPassword called for username: " + request.getUsername());
        try {
            if (request.getUsername() == null || request.getNewPassword() == null) {
                System.out.println("[DEBUG] Bad request: missing username or password");
                return ResponseEntity.badRequest().body("Username and new password required.");
            }
            var userOpt = userRepository.findByUsername(request.getUsername());
            if (userOpt.isEmpty()) {
                System.out.println("[DEBUG] User not found: " + request.getUsername());
                return ResponseEntity.status(404).body("User not found");
            }
            User user = userOpt.get();
            String oldHash = user.getPassword();
            String newHash = passwordEncoder.encode(request.getNewPassword());
            System.out.println("[DEBUG] Old password hash: " + oldHash);
            System.out.println("[DEBUG] New password hash will be: " + newHash);
            user.setPassword(newHash);
            userRepository.save(user);
            System.out.println("[DEBUG] Password reset and saved for user: " + user.getUsername());
            System.out.println("[DEBUG] Password hash in entity after save: " + user.getPassword());
            return ResponseEntity.ok("Password has been reset for " + user.getUsername());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}
