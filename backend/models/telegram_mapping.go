package models

import (
	"time"

	"gorm.io/gorm"
)

// TelegramMapping represents a mapping between a Telegram chat ID and a wallet address
type TelegramMapping struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	WalletAddress string         `gorm:"index;size:42" json:"wallet_address"`
	ChatID        string         `gorm:"index" json:"chat_id"`
	UserName      string         `json:"user_name"`
	FirstName     string         `json:"first_name"`
	LastName      string         `json:"last_name"`
	IsActive      bool           `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}
