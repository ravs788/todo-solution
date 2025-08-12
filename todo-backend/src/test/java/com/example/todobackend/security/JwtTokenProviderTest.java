package com.example.todobackend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Paths;
import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String loadUsernameFromJson(String filename) throws IOException {
        try (java.io.InputStream is = getClass().getClassLoader().getResourceAsStream("test-data/" + filename)) {
            if (is == null) throw new java.io.FileNotFoundException("test-data/" + filename + " not found in classpath");
            Map<?,?> map = objectMapper.readValue(is, Map.class);
            return (String) map.get("username");
        }
    }

    private String loadInvalidTokenFromJson() throws IOException {
        try (java.io.InputStream is = getClass().getClassLoader().getResourceAsStream("test-data/jwt-invalid-token.json")) {
            if (is == null) throw new java.io.FileNotFoundException("test-data/jwt-invalid-token.json not found in classpath");
            Map<?,?> map = objectMapper.readValue(is, Map.class);
            return (String) map.get("invalidToken");
        }
    }

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        jwtTokenProvider.setJwtSecret("0123456789012345678901234567890123456789012345678901234567890123abcdefghijklmnopqrstuvwxyz");
        jwtTokenProvider.setJwtExpirationMs(60000);
    }

    @Test
    void testGenerateTokenAndParseUsername() throws IOException {
        // Arrange
        String username = loadUsernameFromJson("jwt-username.json");

        // Act
        String token = jwtTokenProvider.generateToken(username);
        String extractedUsername = jwtTokenProvider.getUsernameFromJWT(token);

        // Assert
        assertNotNull(token, "Token should not be null.");
        assertEquals(username, extractedUsername, "Extracted username should match input.");
    }

    @Test
    void testValidateToken_ValidToken() throws IOException {
        String username = loadUsernameFromJson("jwt-username.json");
        String token = jwtTokenProvider.generateToken(username);

        assertTrue(jwtTokenProvider.validateToken(token), "Token should be valid.");
    }

    @Test
    void testValidateToken_InvalidToken() throws IOException {
        String invalidToken = loadInvalidTokenFromJson();
        assertFalse(jwtTokenProvider.validateToken(invalidToken), "Token should be invalid.");
    }
}
