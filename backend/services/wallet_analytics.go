package services

import (
	"Wallet/backend/models"
	"context"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"gorm.io/gorm"
)

// TokenTransfer represents ERC20 token transfer data
type TokenTransfer struct {
	TokenAddress  string
	TokenSymbol   string
	FromAddress   string
	ToAddress     string
	Amount        *big.Int
	Timestamp     time.Time
	TransactionID string
}

// WalletAnalyticsService provides methods to collect wallet metrics for ML analysis
type WalletAnalyticsService struct {
	db        *gorm.DB
	ethClient *ethclient.Client
	rpcURL    string
}

// NewWalletAnalyticsService creates a new wallet analytics service
func NewWalletAnalyticsService(db *gorm.DB, rpcURL string) (*WalletAnalyticsService, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %w", err)
	}

	return &WalletAnalyticsService{
		db:        db,
		ethClient: client,
		rpcURL:    rpcURL,
	}, nil
}

// GetWalletAnalytics collects all required metrics for ML model prediction
func (s *WalletAnalyticsService) GetWalletAnalytics(address string) (*models.WalletAnalytics, error) {
	walletAddr := common.HexToAddress(address)

	// Create analytics object
	analytics := &models.WalletAnalytics{}

	// Get transaction history (both sent and received)
	sentTxs, receivedTxs, err := s.getTransactionHistory(walletAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction history: %w", err)
	}

	// 1. Calculate time-based metrics
	analytics.AvgMinBetweenSentTx = s.calculateAvgTimeBetweenTxs(sentTxs)
	analytics.AvgMinBetweenReceivedTx = s.calculateAvgTimeBetweenTxs(receivedTxs)
	analytics.TimeDiffFirstLastMins = s.calculateTimeDiffFirstLastMins(append(sentTxs, receivedTxs...))

	// 2. Count transactions
	analytics.SentTxCount = len(sentTxs)
	analytics.ReceivedTxCount = len(receivedTxs)

	// 3. Get contract creation count
	analytics.CreatedContractsCount = s.getContractCreationCount(walletAddr)

	// 4. ETH value metrics
	analytics.MaxValueReceived = s.calculateMaxValueReceived(receivedTxs).String()
	analytics.AvgValueReceived = s.calculateAvgValue(receivedTxs).String()
	analytics.AvgValueSent = s.calculateAvgValue(sentTxs).String()
	analytics.TotalEtherSent = s.calculateTotalValue(sentTxs).String()

	// 5. Get current balance
	balance, err := s.ethClient.BalanceAt(context.Background(), walletAddr, nil)
	if err != nil {
		log.Printf("Failed to get balance for address %s: %v", address, err)
		balance = big.NewInt(0)
	}
	analytics.TotalEtherBalance = balance.String()

	// 6. ERC20 token metrics
	erc20Data, err := s.getERC20TokenData(walletAddr)
	if err != nil {
		log.Printf("Failed to get ERC20 data for address %s: %v", address, err)
		// Continue with zeros for ERC20 data
	} else {
		analytics.ERC20TotalEtherReceived = erc20Data.TotalReceived.String()
		analytics.ERC20TotalEtherSent = erc20Data.TotalSent.String()
		analytics.ERC20TotalEtherSentContract = erc20Data.TotalSentToContracts.String()
		analytics.ERC20UniqSentAddr = len(erc20Data.UniqueSentAddresses)
		analytics.ERC20UniqRecTokenName = len(erc20Data.UniqueReceivedTokens)
		analytics.ERC20MostSentTokenType = erc20Data.MostSentToken
		analytics.ERC20MostRecTokenType = erc20Data.MostReceivedToken
	}

	// Calculate derived metrics
	totalTxs := analytics.SentTxCount + analytics.ReceivedTxCount
	if totalTxs > 0 && analytics.TimeDiffFirstLastMins > 0 {
		analytics.TxnFrequency = float64(totalTxs) / analytics.TimeDiffFirstLastMins * 60.0 // Transactions per hour
	}

	// Calculate wallet age
	analytics.WalletAge = s.calculateWalletAge(append(sentTxs, receivedTxs...))

	return analytics, nil
}

// getTransactionHistory fetches both sent and received transactions for an address
func (s *WalletAnalyticsService) getTransactionHistory(address common.Address) ([]*types.Transaction, []*types.Transaction, error) {
	// In a real implementation, you would query transactions from a node or API
	// This is a simplified version using the database
	var txsFromDb []models.Transaction
	if err := s.db.Where("from_address = ? OR to_address = ?", address.Hex(), address.Hex()).Find(&txsFromDb).Error; err != nil {
		return nil, nil, fmt.Errorf("failed to fetch transactions from database: %w", err)
	}

	// Convert to necessary format and separate sent vs received
	var sentTxs []*types.Transaction
	var receivedTxs []*types.Transaction

	// In a real implementation, you would create transaction objects
	// For now, we'll return empty slices as a placeholder
	return sentTxs, receivedTxs, nil
}

// calculateAvgTimeBetweenTxs calculates the average time between transactions in minutes
func (s *WalletAnalyticsService) calculateAvgTimeBetweenTxs(txs []*types.Transaction) float64 {
	if len(txs) < 2 {
		return 0
	}

	// In a real implementation, sort transactions by timestamp
	// Calculate differences between consecutive timestamps
	// Return the average

	return 30.0 // Placeholder value
}

// calculateTimeDiffFirstLastMins calculates the time difference between first and last transaction
func (s *WalletAnalyticsService) calculateTimeDiffFirstLastMins(txs []*types.Transaction) float64 {
	if len(txs) < 2 {
		return 0
	}

	// In a real implementation:
	// Sort transactions by timestamp
	// Calculate difference between first and last

	return 10080.0 // Placeholder: 1 week in minutes
}

// getContractCreationCount counts how many contracts the wallet has created
func (s *WalletAnalyticsService) getContractCreationCount(address common.Address) int {
	// In a real implementation, you would check for contract creation transactions
	return 0 // Placeholder
}

// calculateMaxValueReceived finds the largest transaction amount received
func (s *WalletAnalyticsService) calculateMaxValueReceived(txs []*types.Transaction) *big.Int {
	if len(txs) == 0 {
		return big.NewInt(0)
	}

	// In a real implementation, calculate the max value
	return big.NewInt(0) // Placeholder
}

// calculateAvgValue calculates the average transaction value
func (s *WalletAnalyticsService) calculateAvgValue(txs []*types.Transaction) *big.Int {
	if len(txs) == 0 {
		return big.NewInt(0)
	}

	// In a real implementation, calculate the average
	return big.NewInt(0) // Placeholder
}

// calculateTotalValue calculates the sum of all transaction values
func (s *WalletAnalyticsService) calculateTotalValue(txs []*types.Transaction) *big.Int {
	if len(txs) == 0 {
		return big.NewInt(0)
	}

	// In a real implementation, sum all values
	return big.NewInt(0) // Placeholder
}

// ERC20Data holds ERC20 token metrics
type ERC20Data struct {
	TotalReceived        *big.Int
	TotalSent            *big.Int
	TotalSentToContracts *big.Int
	UniqueSentAddresses  map[string]bool
	UniqueReceivedTokens map[string]bool
	TokenSendCounts      map[string]int
	TokenReceiveCounts   map[string]int
	MostSentToken        string
	MostReceivedToken    string
}

// getERC20TokenData collects metrics about ERC20 token transfers
func (s *WalletAnalyticsService) getERC20TokenData(address common.Address) (*ERC20Data, error) {
	// In a real implementation, you would:
	// 1. Fetch ERC20 transfers from an API or database
	// 2. Process them to extract the required metrics

	// For now, return placeholder data
	result := &ERC20Data{
		TotalReceived:        big.NewInt(0),
		TotalSent:            big.NewInt(0),
		TotalSentToContracts: big.NewInt(0),
		UniqueSentAddresses:  make(map[string]bool),
		UniqueReceivedTokens: make(map[string]bool),
		TokenSendCounts:      make(map[string]int),
		TokenReceiveCounts:   make(map[string]int),
		MostSentToken:        "UNKNOWN",
		MostReceivedToken:    "UNKNOWN",
	}

	return result, nil
}

// calculateWalletAge determines the age of the wallet in days
func (s *WalletAnalyticsService) calculateWalletAge(txs []*types.Transaction) int {
	if len(txs) == 0 {
		return 0
	}

	// In a real implementation:
	// Find earliest transaction
	// Calculate difference between that and now

	return 90 // Placeholder: 90 days
}

// ExportAnalyticsForML generates a CSV file with wallet analytics for ML training
func (s *WalletAnalyticsService) ExportAnalyticsForML(addresses []string, filePath string) error {
	// 1. Collect analytics for all addresses
	var allAnalytics []*models.WalletAnalytics

	for _, addr := range addresses {
		analytics, err := s.GetWalletAnalytics(addr)
		if err != nil {
			log.Printf("Failed to get analytics for address %s: %v", addr, err)
			continue
		}
		allAnalytics = append(allAnalytics, analytics)
	}

	// 2. Export to CSV
	// (Implementation would write all analytics to a CSV file)

	return nil
}

// GetRiskPredictionInput formats wallet analytics for ML model input
func (s *WalletAnalyticsService) GetRiskPredictionInput(analytics *models.WalletAnalytics) map[string]interface{} {
	// Convert analytics to the format expected by the ML model
	input := map[string]interface{}{
		"avg_min_between_sent_tx":         analytics.AvgMinBetweenSentTx,
		"avg_min_between_received_tx":     analytics.AvgMinBetweenReceivedTx,
		"time_diff_first_last_mins":       analytics.TimeDiffFirstLastMins,
		"sent_tx_count":                   analytics.SentTxCount,
		"received_tx_count":               analytics.ReceivedTxCount,
		"created_contracts_count":         analytics.CreatedContractsCount,
		"max_value_received":              analytics.MaxValueReceived,
		"avg_value_received":              analytics.AvgValueReceived,
		"avg_value_sent":                  analytics.AvgValueSent,
		"total_ether_sent":                analytics.TotalEtherSent,
		"total_ether_balance":             analytics.TotalEtherBalance,
		"erc20_total_ether_received":      analytics.ERC20TotalEtherReceived,
		"erc20_total_ether_sent":          analytics.ERC20TotalEtherSent,
		"erc20_total_ether_sent_contract": analytics.ERC20TotalEtherSentContract,
		"erc20_uniq_sent_addr":            analytics.ERC20UniqSentAddr,
		"erc20_uniq_rec_token_name":       analytics.ERC20UniqRecTokenName,
		"erc20_most_sent_token_type":      analytics.ERC20MostSentTokenType,
		"erc20_most_rec_token_type":       analytics.ERC20MostRecTokenType,
	}

	return input
}

// ScamHistory represents an address's history with scam reports
type ScamHistory struct {
	ScamCount          int
	TotalScamAmount    float64
	LastScamReportTime time.Time
}

// GetAddressScamHistory retrieves the scam history for an address
func (s *WalletAnalyticsService) GetAddressScamHistory(address string) (*ScamHistory, error) {
	var history ScamHistory

	// Query scam reports for this address
	var reports []models.Report
	err := s.db.Where("scammer_address = ? AND status = ?", address, "confirmed").
		Order("created_at desc").
		Find(&reports).Error
	if err != nil {
		return nil, fmt.Errorf("failed to query scam reports: %w", err)
	}

	history.ScamCount = len(reports)
	if history.ScamCount > 0 {
		history.LastScamReportTime = reports[0].CreatedAt
		for _, report := range reports {
			history.TotalScamAmount += report.Amount
		}
	}

	return &history, nil
}

// IsUnusualTransaction checks if a transaction shows unusual patterns
func (s *WalletAnalyticsService) IsUnusualTransaction(tx models.Transaction) (bool, error) {
	// Get recent transactions for the sender
	var recentTxs []models.Transaction
	err := s.db.Where("from_address = ? AND created_at > ?",
		tx.FromAddress, time.Now().Add(-24*time.Hour)).
		Order("created_at desc").
		Find(&recentTxs).Error
	if err != nil {
		return false, fmt.Errorf("failed to query recent transactions: %w", err)
	}

	// Calculate average transaction value
	var totalValue float64
	for _, rtx := range recentTxs {
		totalValue += rtx.Value
	}

	if len(recentTxs) == 0 {
		// First transaction in 24 hours is considered unusual
		return true, nil
	}

	avgValue := totalValue / float64(len(recentTxs))

	// Check if this transaction is significantly larger than average
	if tx.Value > avgValue*3 {
		return true, nil
	}

	// Check if this is a new recipient
	for _, rtx := range recentTxs {
		if rtx.ToAddress == tx.ToAddress {
			// Not a new recipient
			return false, nil
		}
	}

	// New recipient is considered unusual
	return true, nil
}
