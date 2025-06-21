package models

import (
	"time"
	"gorm.io/gorm"
)

// CivicAuthSession represents a user's Civic authentication session
type CivicAuthSession struct {
	gorm.Model
	UserAddress    string    `gorm:"index;not null"`
	GatekeeperNetwork string `gorm:"not null"`
	TokenExpiry    time.Time `gorm:"not null"`
	LastVerified   time.Time
	Status         string    `gorm:"not null"` // pending, verified, expired
	GatePass      string    `gorm:"unique"`    // Civic gatepass token
	SecurityLevel  int       `gorm:"not null"` // 1: basic, 2: enhanced, 3: maximum
	DeviceHash    string    `gorm:"index"`     // Hash of the user's device fingerprint
	RiskScore     float64   // Dynamic risk score based on user behavior
	Flags         []string  `gorm:"type:text[]"` // Security flags or warnings
}

// CivicVerificationLog tracks all verification attempts
type CivicVerificationLog struct {
	gorm.Model
	UserAddress     string    `gorm:"index"`
	VerificationType string    `gorm:"not null"` // initial, refresh, challenge
	Success         bool
	IPAddress       string
	DeviceInfo      string
	GeoLocation     string    // Country/region for geo-fencing
	RiskFactors     []string  `gorm:"type:text[]"`
}
