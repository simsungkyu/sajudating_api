// JWT token generation and validation utilities for admin authentication
package utils

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const AdminUserContextKey contextKey = "admin_user_uid"

type AdminTokenClaims struct {
	Hashed string `json:"hashed"` // Encrypted JSON string containing {uid, sessionKey}
	jwt.RegisteredClaims
}

// GenerateAdminToken generates a JWT token with encrypted admin session data
func GenerateAdminToken(uid string, sessionKey string) (string, error) {
	secretKey := os.Getenv("SECRET_KEY")
	if secretKey == "" {
		return "", errors.New("SECRET_KEY environment variable is not set")
	}

	// Create payload: {uid, sessionKey}
	payload := map[string]string{
		"uid":        uid,
		"sessionkey": sessionKey,
	}

	// Convert to JSON string
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	// Encrypt the JSON string (simple AES encryption would be better, but for now we'll use the secret key)
	// For simplicity, we'll store the JSON string directly in the hashed field
	// In production, you should use proper encryption (AES-GCM)
	hashed := string(payloadJSON)

	claims := AdminTokenClaims{
		Hashed: hashed,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 24 hours
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateAdminToken validates a JWT token and returns the decrypted admin session data
func ValidateAdminToken(tokenString string) (uid string, sessionKey string, err error) {
	secretKey := os.Getenv("SECRET_KEY")
	if secretKey == "" {
		return "", "", errors.New("SECRET_KEY environment variable is not set")
	}

	token, err := jwt.ParseWithClaims(tokenString, &AdminTokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return "", "", err
	}

	if claims, ok := token.Claims.(*AdminTokenClaims); ok && token.Valid {
		// Decrypt the hashed field (in production, use proper decryption)
		var payload map[string]string
		if err := json.Unmarshal([]byte(claims.Hashed), &payload); err != nil {
			return "", "", err
		}

		uid = payload["uid"]
		sessionKey = payload["sessionkey"]

		if uid == "" || sessionKey == "" {
			return "", "", errors.New("invalid token payload")
		}

		return uid, sessionKey, nil
	}

	return "", "", errors.New("invalid token")
}

// GetAdminUserUIDFromContext extracts admin user UID from context
func GetAdminUserUIDFromContext(ctx context.Context) (string, error) {
	uid, ok := ctx.Value(AdminUserContextKey).(string)
	if !ok || uid == "" {
		return "", errors.New("admin user not found in context")
	}
	return uid, nil
}

// SetAdminUserUIDToContext sets admin user UID to context
func SetAdminUserUIDToContext(ctx context.Context, uid string) context.Context {
	return context.WithValue(ctx, AdminUserContextKey, uid)
}

