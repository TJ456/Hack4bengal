package models

// WalletAnalytics contains the features needed for ML model training/prediction
type WalletAnalytics struct {
	// Basic transaction timing metrics
	AvgMinBetweenSentTx     float64 `json:"avg_min_between_sent_tx"`
	AvgMinBetweenReceivedTx float64 `json:"avg_min_between_received_tx"`
	TimeDiffFirstLastMins   float64 `json:"time_diff_first_last_mins"`

	// Transaction counts
	SentTxCount           int `json:"sent_tx_count"`
	ReceivedTxCount       int `json:"received_tx_count"`
	CreatedContractsCount int `json:"created_contracts_count"`

	// ETH value metrics
	MaxValueReceived  string `json:"max_value_received"`
	AvgValueReceived  string `json:"avg_value_received"`
	AvgValueSent      string `json:"avg_value_sent"`
	TotalEtherSent    string `json:"total_ether_sent"`
	TotalEtherBalance string `json:"total_ether_balance"`

	// ERC20 token metrics
	ERC20TotalEtherReceived     string `json:"erc20_total_ether_received"`
	ERC20TotalEtherSent         string `json:"erc20_total_ether_sent"`
	ERC20TotalEtherSentContract string `json:"erc20_total_ether_sent_contract"`
	ERC20UniqSentAddr           int    `json:"erc20_uniq_sent_addr"`
	ERC20UniqRecTokenName       int    `json:"erc20_uniq_rec_token_name"`
	ERC20MostSentTokenType      string `json:"erc20_most_sent_token_type"`
	ERC20MostRecTokenType       string `json:"erc20_most_rec_token_type"`

	// Derived metrics (can be calculated from above)
	TxnFrequency float64 `json:"txn_frequency"`
	AvgTxnValue  string  `json:"avg_txn_value"`

	// Additional metrics for risk assessment
	WalletAge int     `json:"wallet_age_days"`
	RiskScore float64 `json:"risk_score"`
}
