package com.example.todobackend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        jwtTokenProvider.setJwtSecret("0123456789012345678901234567890123456789012345678901234567890123abcdefghijklmnopqrstuvwxyz");
        jwtTokenProvider.setJwtExpirationMs(60000);
    }

    @Test
    void testGenerateTokenAndParseUsername() {
        // Arrange
        String username = "testuser";

        // Act
        String token = jwtTokenProvider.generateToken(username);
        String extractedUsername = jwtTokenProvider.getUsernameFromJWT(token);

        // Assert
        assertNotNull(token, "Token should not be null.");
        assertEquals(username, extractedUsername, "Extracted username should match input.");
    }

    @Test
    void testValidateToken_ValidToken() {
        String username = "validuser";
        String token = jwtTokenProvider.generateToken(username);

        assertTrue(jwtTokenProvider.validateToken(token), "Token should be valid.");
    }

    @Test
    void testValidateToken_InvalidToken() {
        String invalidToken = "invalid.token.value";
        assertFalse(jwtTokenProvider.validateToken(invalidToken), "Token should be invalid.");
    }
}
