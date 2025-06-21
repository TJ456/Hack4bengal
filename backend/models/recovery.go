package models

import (
	"time"
)

// Recovery represents an asset recovery attempt
type Recovery struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	VictimAddress  string    `json:"victimAddress" gorm:"index"`
	ScammerAddress string    `json:"scammerAddress" gorm:"index"`
	TxHash         string    `json:"txHash" gorm:"uniqueIndex"`
	Status         string    `json:"status"` // "pending", "confirmed", "failed"
	CreatedAt      time.Time `json:"createdAt"`
	CompletedAt    time.Time `json:"completedAt,omitempty"`
	Evidence       string    `json:"evidence"`
	Amount         string    `json:"amount,omitempty"` // Amount recovered (if successful)
}
