package handlers

import (
	"Wallet/backend/middleware"
	"Wallet/backend/services"
	"crypto/rand"
	"encoding/hex"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication related endpoints
type AuthHandler struct {
	blockchainService *services.BlockchainService
	nonceStore        map[string]string // In production, use Redis or another persistent store
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(blockchainService *services.BlockchainService) *AuthHandler {
	return &AuthHandler{
		blockchainService: blockchainService,
		nonceStore:        make(map[string]string),
	}
}

// GetSignatureNonce generates a new nonce for wallet signature
func (h *AuthHandler) GetSignatureNonce(c *gin.Context) {
	walletAddress := c.Query("address")
	if walletAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address is required"})
		return
	}

	// Generate random nonce
	nonceBytes := make([]byte, 32)
	if _, err := rand.Read(nonceBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate nonce"})
		return
	}
	nonce := hex.EncodeToString(nonceBytes)

	// Store nonce for this wallet (with timestamp)
	h.nonceStore[walletAddress] = nonce

	// Create message to be signed
	message := "Sign this message to verify your wallet ownership. Nonce: " + nonce

	c.JSON(http.StatusOK, gin.H{
		"message": message,
		"nonce":   nonce,
	})
}

// VerifyWalletSignature verifies a wallet signature and returns JWT on success
func (h *AuthHandler) VerifyWalletSignature(c *gin.Context) {
	var request struct {
		Address   string `json:"address" binding:"required"`
		Message   string `json:"message" binding:"required"`
		Signature string `json:"signature" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	// Check if nonce exists and is valid
	storedNonce, exists := h.nonceStore[request.Address]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nonce or address"})
		return
	}

	// Verify that the message contains the stored nonce
	if storedNonce == "" || !contains(request.Message, storedNonce) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nonce in message"})
		return
	}

	// Verify signature
	valid, err := h.blockchainService.VerifySignature(request.Address, request.Message, request.Signature)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify signature: " + err.Error()})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	// Clean up used nonce
	delete(h.nonceStore, request.Address)

	// Generate JWT token
	token, err := middleware.GenerateToken(request.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Get wallet balance
	balance, err := h.blockchainService.GetWalletBalance(request.Address)
	if err != nil {
		// Non-fatal error, we'll return 0 balance
		balance = big.NewFloat(0)
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"address": request.Address,
		"balance": balance.String(),
		"expiresAt": time.Now().Add(24 * time.Hour).Unix(), // 24 hour token
	})
}

// GetWalletProfile returns information about the authenticated wallet
func (h *AuthHandler) GetWalletProfile(c *gin.Context) {
	// Get address from Web3 auth middleware
	address, exists := c.Get("address")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	addrStr := address.(string)

	// Get wallet balance
	balance, err := h.blockchainService.GetWalletBalance(addrStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get wallet balance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"address": addrStr,
		"balance": balance.String(),
		"network": "ethereum", // This could be dynamic based on user's connection
	})
}

// Helper function to check if a string contains another string
func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}
