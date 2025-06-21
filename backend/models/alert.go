package models

// SecurityAlert represents a security alert that can be sent to the user
type SecurityAlert struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	WalletID  string `json:"wallet_id" gorm:"index"`
	Type      string `json:"type" gorm:"index"`               // Type of alert: suspicious_tx, login_attempt, etc
	Severity  string `json:"severity"`                        // low, medium, high, critical
	Details   string `json:"details"`                         // Description of the alert
	Timestamp int64  `json:"timestamp"`                       // Unix timestamp
	Status    string `json:"status" gorm:"default:'pending'"` // pending, resolved, ignored
}

// TransactionNotification represents a transaction notification to be sent to the user
type TransactionNotification struct {
	TransactionHash string  `json:"transaction_hash"`
	Type            string  `json:"type"` // incoming, outgoing, contract_interaction, etc
	FromAddress     string  `json:"from_address"`
	ToAddress       string  `json:"to_address"`
	TokenSymbol     string  `json:"token_symbol"`
	Amount          float64 `json:"amount"`
	NetworkFee      float64 `json:"network_fee"`
	Status          string  `json:"status"` // pending, confirmed, failed
	Timestamp       int64   `json:"timestamp"`
}
