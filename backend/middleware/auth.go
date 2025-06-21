package middleware

import (
	"Wallet/backend/services"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTAuthMiddleware authenticates requests using JWT tokens
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		
		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			// Get the secret key
			secret := os.Getenv("JWT_SECRET")
			if secret == "" {
				secret = "your-secret-key" // Default for development
			}
			return []byte(secret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: " + err.Error()})
			c.Abort()
			return
		}

		// Check if token is valid
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Add claims to context
			c.Set("address", claims["address"])
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}
	}
}

// Web3AuthMiddleware authenticates requests using Web3 signatures
func Web3AuthMiddleware(blockchainService *services.BlockchainService) gin.HandlerFunc {
	return func(c *gin.Context) {
		address := c.GetHeader("X-Wallet-Address")
		signature := c.GetHeader("X-Wallet-Signature")
		message := c.GetHeader("X-Wallet-Message")

		// Check if all required headers are present
		if address == "" || signature == "" || message == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authentication headers"})
			c.Abort()
			return
		}

		// Verify the signature
		isValid, err := blockchainService.VerifySignature(address, message, signature)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to verify signature: " + err.Error()})
			c.Abort()
			return
		}

		if !isValid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
			c.Abort()
			return
		}

		// Add the wallet address to the context
		c.Set("address", address)
		c.Next()
	}
}

// GenerateToken creates a JWT token for a wallet address
func GenerateToken(address string) (string, error) {
	// Get the secret key
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key" // Default for development
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"address": address,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // 24 hour expiry
		"iat":     time.Now().Unix(),
	})

	// Sign and return token
	return token.SignedString([]byte(secret))
}

// RateLimitMiddleware limits request rates based on IP address
func RateLimitMiddleware() gin.HandlerFunc {
	// In production, this would use Redis or another store for rate limiting
	// For development, we'll use a simple in-memory store
	limits := make(map[string]int)
	lastReset := time.Now()
	resetInterval := time.Minute * 15
	maxRequests := 100

	return func(c *gin.Context) {
		ip := c.ClientIP()

		// Reset counters if needed
		if time.Since(lastReset) > resetInterval {
			limits = make(map[string]int)
			lastReset = time.Now()
		}

		// Check if rate limit is exceeded
		if limits[ip] >= maxRequests {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		// Increment counter for this IP
		limits[ip]++
		c.Next()
	}
}
