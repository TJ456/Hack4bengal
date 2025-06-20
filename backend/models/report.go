package models

import (
	"time"
)

// Report represents a user-submitted report of a scam or phishing attempt
type Report struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	ReportedAddress   string    `json:"reportedAddress" gorm:"index"`
	ReporterAddress   string    `json:"reporterAddress" gorm:"index"`
	TxHash           string    `json:"txHash"`
	Category         string    `json:"category"` // "phishing", "scam", "fraud", "other"
	Description      string    `json:"description"`
	Evidence         string    `json:"evidence"`
	Amount           float64   `json:"amount"`   // Amount involved in the scam
	ScammerAddress   string    `json:"scammerAddress"` // Same as ReportedAddress, but more explicit name
	ScamType         string    `json:"scamType"`       // More specific than Category
	Priority         string    `json:"priority"`       // "low", "medium", "high"
	RequiresImmediate bool      `json:"requiresImmediate"` // Whether immediate action is needed
	CreatedAt        time.Time `json:"createdAt"`
	Status           string    `json:"status"` // "pending", "verified", "rejected"
	Severity         int       `json:"severity" gorm:"default:0"` // 1-5 rating
}
