package migrations

import (
	"Wallet/backend/models"
	"gorm.io/gorm"
)

func InitializeCivicTables(db *gorm.DB) error {
	// Create tables for Civic Auth
	if err := db.AutoMigrate(
		&models.CivicAuthSession{},
		&models.CivicVerificationLog{},
	); err != nil {
		return err
	}

	// Create indexes for better query performance
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_civic_auth_sessions_user_status ON civic_auth_sessions(user_address, status);
		CREATE INDEX IF NOT EXISTS idx_civic_auth_sessions_expiry ON civic_auth_sessions(token_expiry);
		CREATE INDEX IF NOT EXISTS idx_civic_verification_logs_user ON civic_verification_logs(user_address);
		CREATE INDEX IF NOT EXISTS idx_civic_verification_logs_created ON civic_verification_logs(created_at);
	`).Error; err != nil {
		return err
	}

	return nil
}
