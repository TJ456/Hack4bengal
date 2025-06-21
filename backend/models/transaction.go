package models

import (
	"time"
)

// Transaction represents a blockchain transaction analyzed by the firewall
type Transaction struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	FromAddress string    `json:"from" gorm:"index"`
	ToAddress   string    `json:"to" gorm:"index"`
	Value       float64   `json:"value"`
	Currency    string    `json:"currency" gorm:"default:ETH"`
	TxHash      string    `json:"txHash" gorm:"uniqueIndex"`
	Network     string    `json:"network" gorm:"default:ethereum"`
	Risk        float64   `json:"risk"`
	Status      string    `json:"status"`  // "safe", "suspicious", "blocked"
	Timestamp   time.Time `json:"timestamp"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	Metadata    string    `json:"metadata" gorm:"type:jsonb"`
}
