package com.example.todobackend.controller;

import com.example.todobackend.model.User;
import com.example.todobackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    private UserRepository userRepository;
    private AdminController controller;

    @BeforeEach
    void setup() {
        userRepository = mock(UserRepository.class);
        controller = new AdminController(userRepository);
    }

    @Test
    void getPendingUsers_returns_list_from_repository() {
        when(userRepository.findByStatus("PENDING")).thenReturn(List.of(new User(), new User()));
        var resp = controller.getPendingUsers();
        assertEquals(200, resp.getStatusCode().value());
        assertEquals(2, resp.getBody().size());
        verify(userRepository).findByStatus("PENDING");
    }

    @Test
    void approveUser_returns404_when_not_found() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        var resp = controller.approveUser(1L);
        assertEquals(404, resp.getStatusCode().value());
        verify(userRepository, never()).save(any());
    }

    @Test
    void approveUser_sets_active_and_returns200() {
        User u = new User();
        u.setStatus("PENDING");
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        var resp = controller.approveUser(2L);
        assertEquals(200, resp.getStatusCode().value());
        assertEquals("ACTIVE", u.getStatus());
        verify(userRepository).save(u);
    }

    @Test
    void getAllUsers_returns_list() {
        when(userRepository.findAll()).thenReturn(List.of(new User()));
        var resp = controller.getAllUsers();
        assertEquals(200, resp.getStatusCode().value());
        assertEquals(1, resp.getBody().size());
        verify(userRepository).findAll();
    }
}
