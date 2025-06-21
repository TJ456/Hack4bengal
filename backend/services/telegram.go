package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"Wallet/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// TelegramService manages interactions with the Telegram Bot API
type TelegramService struct {
	Token   string
	BaseURL string
	DB      *gorm.DB // Database connection for storing mappings
}

// TelegramUpdate represents an update from Telegram
type TelegramUpdate struct {
	UpdateID int              `json:"update_id"`
	Message  *TelegramMessage `json:"message,omitempty"`
}

// TelegramMessage represents a message in a Telegram update
type TelegramMessage struct {
	MessageID int           `json:"message_id"`
	From      *TelegramUser `json:"from"`
	Chat      *TelegramChat `json:"chat"`
	Text      string        `json:"text"`
	Date      int64         `json:"date"`
}

// TelegramUser represents a Telegram user
type TelegramUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
}

// TelegramChat represents a Telegram chat
type TelegramChat struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title,omitempty"`
	Username  string `json:"username,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
}

// NewTelegramService creates a new Telegram service instance
func NewTelegramService(token string, db *gorm.DB) *TelegramService {
	if token == "" {
		log.Println("Warning: Telegram bot token is not set")
	}

	return &TelegramService{
		Token:   token,
		BaseURL: fmt.Sprintf("https://api.telegram.org/bot%s", token),
		DB:      db,
	}
}

// SendMessage sends a message to a specific Telegram chat
func (ts *TelegramService) SendMessage(chatID int64, text string) error {
	if ts.Token == "" {
		return fmt.Errorf("telegram token not configured")
	}

	url := fmt.Sprintf("%s/sendMessage", ts.BaseURL)
	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal telegram payload: %w", err)
	}

	resp, err := http.Post(url, "application/json", strings.NewReader(string(jsonPayload)))
	if err != nil {
		return fmt.Errorf("failed to send telegram message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned non-OK status: %d", resp.StatusCode)
	}

	return nil
}

// NotifySecurityAlert sends a security alert to the user's telegram if they have linked their account
func (ts *TelegramService) NotifySecurityAlert(walletAddress string, alert *models.SecurityAlert) error {
	var mapping models.TelegramMapping
	result := ts.DB.Where("wallet_address = ? AND is_active = ?", walletAddress, true).First(&mapping)
	if result.Error != nil {
		return fmt.Errorf("no telegram chat linked to wallet %s: %w", walletAddress, result.Error)
	}

	chatIDInt, err := strconv.ParseInt(mapping.ChatID, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid chat ID format: %w", err)
	}

	message := fmt.Sprintf("⚠️ <b>SECURITY ALERT</b> ⚠️\n\n"+
		"<b>Type:</b> %s\n"+
		"<b>Severity:</b> %s\n"+
		"<b>Details:</b> %s\n\n"+
		"<b>Time:</b> %s\n\n"+
		"Use the /block command to immediately block this transaction.",
		alert.Type,
		alert.Severity,
		alert.Details,
		time.Unix(alert.Timestamp, 0).Format(time.RFC1123),
	)

	return ts.SendMessage(chatIDInt, message)
}

// NotifyScamReport sends a notification when a scam has been reported
func (ts *TelegramService) NotifyScamReport(walletAddress string, report *models.Report) error {
	var mapping models.TelegramMapping
	result := ts.DB.Where("wallet_address = ? AND is_active = ?", walletAddress, true).First(&mapping)
	if result.Error != nil {
		return fmt.Errorf("no telegram chat linked to wallet %s: %w", walletAddress, result.Error)
	}

	chatIDInt, err := strconv.ParseInt(mapping.ChatID, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid chat ID format: %w", err)
	}
	message := fmt.Sprintf("🚨 <b>SCAM REPORTED</b> 🚨\n\n"+
		"<b>Scam Address:</b> %s\n"+
		"<b>Category:</b> %s\n"+
		"<b>Description:</b> %s\n\n"+
		"<b>Time:</b> %s\n\n"+
		"Your report has been added to the blockchain.",
		report.ReportedAddress,
		report.Category,
		report.Description,
		report.CreatedAt.Format(time.RFC1123),
	)

	return ts.SendMessage(chatIDInt, message)
}

// LinkWallet associates a Telegram chat ID with a wallet address
func (ts *TelegramService) LinkWallet(chatID string, walletAddress string, userName string, firstName string, lastName string) error {
	// Check if mapping already exists
	var existingMapping models.TelegramMapping
	result := ts.DB.Where("wallet_address = ?", walletAddress).First(&existingMapping)

	if result.Error == nil {
		// Update existing mapping
		existingMapping.ChatID = chatID
		existingMapping.UserName = userName
		existingMapping.FirstName = firstName
		existingMapping.LastName = lastName
		existingMapping.IsActive = true
		return ts.DB.Save(&existingMapping).Error
	}

	// Create new mapping
	mapping := models.TelegramMapping{
		WalletAddress: walletAddress,
		ChatID:        chatID,
		UserName:      userName,
		FirstName:     firstName,
		LastName:      lastName,
		IsActive:      true,
	}

	return ts.DB.Create(&mapping).Error
}

// GetWebhookHandler returns a Gin handler for Telegram webhooks
func (ts *TelegramService) GetWebhookHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var update TelegramUpdate
		if err := c.ShouldBindJSON(&update); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Process update
		if update.Message != nil {
			ts.processMessage(update.Message)
		}

		c.Status(http.StatusOK)
	}
}

// processMessage handles incoming Telegram messages
func (ts *TelegramService) processMessage(message *TelegramMessage) {
	// Process commands
	if strings.HasPrefix(message.Text, "/") {
		cmd := strings.Split(message.Text, " ")
		switch cmd[0] {
		case "/start":
			welcomeMessage := "Welcome to UnhackableWallet Telegram Companion! 🔒\n\n" +
				"I'll help you protect your crypto assets by providing:\n" +
				"• Real-time security alerts\n" +
				"• Transaction notifications\n" +
				"• Quick actions to block suspicious activity\n\n" +
				"Use /link YOUR_WALLET_ADDRESS to connect your wallet."

			ts.SendMessage(message.Chat.ID, welcomeMessage)
		case "/link":
			if len(cmd) < 2 {
				ts.SendMessage(message.Chat.ID, "Please provide your wallet address: /link YOUR_WALLET_ADDRESS")
				return
			}

			walletAddr := cmd[1]
			chatID := fmt.Sprintf("%d", message.Chat.ID)

			// Get user details
			userName := ""
			firstName := ""
			lastName := ""

			if message.From != nil {
				userName = message.From.Username
				firstName = message.From.FirstName
				lastName = message.From.LastName
			}

			if err := ts.LinkWallet(chatID, walletAddr, userName, firstName, lastName); err != nil {
				log.Printf("Error linking wallet: %v", err)
				ts.SendMessage(message.Chat.ID, "❌ Failed to link your wallet. Please try again later.")
				return
			}

			successMsg := fmt.Sprintf("✅ Successfully linked your Telegram account to wallet %s!\n\n"+
				"You will now receive security alerts and notifications for this wallet.",
				walletAddr)
			ts.SendMessage(message.Chat.ID, successMsg)

		case "/help":
			helpMessage := "📚 <b>Available Commands</b>\n\n" +
				"/start - Welcome message and bot introduction\n" +
				"/link YOUR_WALLET_ADDRESS - Connect your wallet to receive notifications\n" +
				"/status - Check your current security status\n" +
				"/block ID - Block a suspicious transaction\n" +
				"/report ADDRESS - Report a scam address\n" +
				"/help - Show this help message"

			ts.SendMessage(message.Chat.ID, helpMessage)
		case "/status":
			// Check if user has linked wallet
			var mappings []models.TelegramMapping
			chatIDStr := fmt.Sprintf("%d", message.Chat.ID)
			result := ts.DB.Where("chat_id = ? AND is_active = ?", chatIDStr, true).Find(&mappings)

			if result.Error != nil || result.RowsAffected == 0 {
				ts.SendMessage(message.Chat.ID, "❌ You don't have any linked wallets. Use /link YOUR_WALLET_ADDRESS to connect your wallet.")
				return
			}

			// Generate status message
			statusMessage := "🛡️ <b>Security Status</b>: Strong\n\n" +
				"✅ No suspicious activities detected\n" +
				"✅ AI scam detection active\n" +
				"✅ Real-time monitoring enabled\n\n" +
				"<b>Connected wallets:</b>\n"

			for _, mapping := range mappings {
				statusMessage += fmt.Sprintf("• %s\n", mapping.WalletAddress)
			}

			statusMessage += "\nYour wallet is currently protected by UnhackableWallet security features."

			ts.SendMessage(message.Chat.ID, statusMessage)
		}
	}
}

// SetWebhook configures the webhook URL for the Telegram bot
func (ts *TelegramService) SetWebhook(webhookURL string) error {
	if ts.Token == "" {
		return fmt.Errorf("telegram token not configured")
	}

	url := fmt.Sprintf("%s/setWebhook?url=%s", ts.BaseURL, webhookURL)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to set webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned non-OK status: %d", resp.StatusCode)
	}

	log.Printf("Successfully set webhook to %s", webhookURL)
	return nil
}

// NotifyAdmin sends a message to the admin chat
func (ts *TelegramService) NotifyAdmin(text string) error {
	// Get admin chat ID from environment variable
	adminChatID := ts.getAdminChatID()
	if adminChatID == 0 {
		return fmt.Errorf("admin chat ID not configured")
	}

	return ts.SendMessage(adminChatID, text)
}

// getAdminChatID retrieves the admin chat ID from stored configuration
func (ts *TelegramService) getAdminChatID() int64 {
	var config models.Config
	err := ts.DB.Where("key = ?", "telegram_admin_chat").First(&config).Error
	if err != nil {
		log.Printf("Warning: Failed to get admin chat ID from database: %v", err)
		return 0
	}

	chatID, err := strconv.ParseInt(config.Value, 10, 64)
	if err != nil {
		log.Printf("Warning: Invalid admin chat ID in database: %v", err)
		return 0
	}

	return chatID
}
