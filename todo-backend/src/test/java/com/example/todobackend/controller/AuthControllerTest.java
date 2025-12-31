package com.example.todobackend.controller;

import com.example.todobackend.dto.ForgotPasswordRequest;
import com.example.todobackend.dto.LoginRequest;
import com.example.todobackend.dto.RegisterRequest;
import com.example.todobackend.dto.ResetPasswordRequest;
import com.example.todobackend.model.User;
import com.example.todobackend.repository.UserRepository;
import com.example.todobackend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    private AuthenticationManager authenticationManager;
    private JwtTokenProvider jwtTokenProvider;
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthController controller;

    @BeforeEach
    void setup() {
        authenticationManager = mock(AuthenticationManager.class);
        jwtTokenProvider = mock(JwtTokenProvider.class);
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        controller = new AuthController(authenticationManager, jwtTokenProvider, userRepository, passwordEncoder);
    }

    // Helpers
    private User user(String username, String role, String status) {
        User u = new User();
        u.setUsername(username);
        u.setRole(role);
        u.setStatus(status);
        u.setPassword("hashed");
        return u;
    }

    // approveUser

    @Test
    void approveUser_returns404_when_user_not_found() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        ResponseEntity<String> resp = controller.approveUser("alice");
        assertEquals(404, resp.getStatusCode().value());
    }

    @Test
    void approveUser_returns409_when_not_pending() {
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(user("bob", "USER", "ACTIVE")));
        ResponseEntity<String> resp = controller.approveUser("bob");
        assertEquals(409, resp.getStatusCode().value());
    }

    @Test
    void approveUser_returns200_and_sets_active() {
        User pending = user("carol", "USER", "PENDING");
        when(userRepository.findByUsername("carol")).thenReturn(Optional.of(pending));
        ResponseEntity<String> resp = controller.approveUser("carol");
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("ACTIVE", pending.getStatus());
        verify(userRepository).save(pending);
    }

    // login

    @Test
    void login_success_returns_token_200() {
        LoginRequest req = new LoginRequest();
        req.setUsername("dave");
        req.setPassword("pw");

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("dave");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByUsername("dave")).thenReturn(Optional.of(user("dave", "USER", "ACTIVE")));
        when(jwtTokenProvider.generateToken("dave", "USER", "ACTIVE")).thenReturn("jwt-token");

        ResponseEntity<String> resp = controller.login(req);
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("jwt-token", resp.getBody());
    }

    @Test
    void login_returns401_when_authentication_fails() {
        LoginRequest req = new LoginRequest();
        req.setUsername("eve");
        req.setPassword("bad");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new AuthenticationException("bad") {
                });

        ResponseEntity<String> resp = controller.login(req);
        assertEquals(401, resp.getStatusCode().value());
    }

    @Test
    void login_returns401_when_user_not_found_after_auth() {
        LoginRequest req = new LoginRequest();
        req.setUsername("frank");
        req.setPassword("pw");

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("frank");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByUsername("frank")).thenReturn(Optional.empty());

        ResponseEntity<String> resp = controller.login(req);
        assertEquals(401, resp.getStatusCode().value());
    }

    // register

    @Test
    void register_returns409_when_username_exists() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("gina");
        req.setPassword("pw");
        when(userRepository.findByUsername("gina")).thenReturn(Optional.of(new User()));

        ResponseEntity<String> resp = controller.register(req);
        assertEquals(409, resp.getStatusCode().value());
    }

    @Test
    void register_returns201_when_success_and_sets_fields() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("henry");
        req.setPassword("pw");
        when(userRepository.findByUsername("henry")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pw")).thenReturn("hash");

        ResponseEntity<String> resp = controller.register(req);
        assertEquals(201, resp.getStatusCode().value());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("henry", saved.getUsername());
        assertEquals("hash", saved.getPassword());
        assertEquals("PENDING", saved.getStatus());
        assertEquals("USER", saved.getRole());
    }

    // forgotPassword (mapped as /reset-password)

    @Test
    void forgotPassword_returns400_when_missing_fields() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setUsername(null);
        req.setNewPassword(null);
        ResponseEntity<String> resp = controller.forgotPassword(req);
        assertEquals(400, resp.getStatusCode().value());
    }

    @Test
    void forgotPassword_returns404_when_user_not_found() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setUsername("ida");
        req.setNewPassword("new");
        when(userRepository.findByUsername("ida")).thenReturn(Optional.empty());

        ResponseEntity<String> resp = controller.forgotPassword(req);
        assertEquals(404, resp.getStatusCode().value());
    }

    @Test
    void forgotPassword_returns200_on_success_and_sets_active() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setUsername("jane");
        req.setNewPassword("new");
        User u = user("jane", "USER", "PENDING");
        when(userRepository.findByUsername("jane")).thenReturn(Optional.of(u));
        when(passwordEncoder.encode("new")).thenReturn("new-hash");

        ResponseEntity<String> resp = controller.forgotPassword(req);
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("new-hash", u.getPassword());
        assertEquals("ACTIVE", u.getStatus());
        verify(userRepository).save(u);
    }

    @Test
    void forgotPassword_returns500_on_exception() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setUsername("kate");
        req.setNewPassword("new");
        when(userRepository.findByUsername("kate")).thenReturn(Optional.of(user("kate", "USER", "ACTIVE")));
        when(passwordEncoder.encode("new")).thenThrow(new RuntimeException("enc err"));

        ResponseEntity<String> resp = controller.forgotPassword(req);
        assertEquals(500, resp.getStatusCode().value());
    }

    // resetPassword (mapped as /forgot-password)

    @Test
    void resetPassword_returns400_when_missing_fields() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setUsername(null);
        req.setNewPassword(null);
        ResponseEntity<String> resp = controller.resetPassword(req);
        assertEquals(400, resp.getStatusCode().value());
    }

    @Test
    void resetPassword_returns404_when_user_not_found() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setUsername("leo");
        req.setNewPassword("new");
        when(userRepository.findByUsername("leo")).thenReturn(Optional.empty());

        ResponseEntity<String> resp = controller.resetPassword(req);
        assertEquals(404, resp.getStatusCode().value());
    }

    @Test
    void resetPassword_returns200_on_success() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setUsername("maya");
        req.setNewPassword("new");
        User u = user("maya", "USER", "ACTIVE");
        when(userRepository.findByUsername("maya")).thenReturn(Optional.of(u));
        when(passwordEncoder.encode("new")).thenReturn("new-hash");

        ResponseEntity<String> resp = controller.resetPassword(req);
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("new-hash", u.getPassword());
        verify(userRepository).save(u);
    }

    @Test
    void resetPassword_returns500_on_exception() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setUsername("nick");
        req.setNewPassword("new");
        when(userRepository.findByUsername("nick")).thenReturn(Optional.of(user("nick", "USER", "ACTIVE")));
        when(passwordEncoder.encode("new")).thenThrow(new RuntimeException("enc err"));

        ResponseEntity<String> resp = controller.resetPassword(req);
        assertEquals(500, resp.getStatusCode().value());
    }
}
