package handlers

import (
	"Wallet/backend/services"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// WalletAnalyticsHandler handles wallet analytics data requests
type WalletAnalyticsHandler struct {
	analyticsService *services.WalletAnalyticsService
}

// NewWalletAnalyticsHandler creates a new wallet analytics handler
func NewWalletAnalyticsHandler(analyticsService *services.WalletAnalyticsService) *WalletAnalyticsHandler {
	return &WalletAnalyticsHandler{
		analyticsService: analyticsService,
	}
}

// GetWalletAnalytics returns analytics data for the specified wallet address
func (h *WalletAnalyticsHandler) GetWalletAnalytics(c *gin.Context) {
	address := c.Query("address")
	if address == "" {
		// Check if the address is in the path
		address = c.Param("address")
		if address == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address is required"})
			return
		}
	}

	// Get analytics for the address
	analytics, err := h.analyticsService.GetWalletAnalytics(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get wallet analytics: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetWalletRiskScore returns a risk score for the wallet based on its analytics
func (h *WalletAnalyticsHandler) GetWalletRiskScore(c *gin.Context) {
	address := c.Query("address")
	if address == "" {
		// Check if the address is in the path
		address = c.Param("address")
		if address == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address is required"})
			return
		}
	}

	// Get analytics for the address
	analytics, err := h.analyticsService.GetWalletAnalytics(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get wallet analytics: " + err.Error()})
		return
	}

	// For now, use a simplified risk score calculation
	// In a real implementation, this would call the ML model
	var riskScore float64
	if analytics.WalletAge < 5 {
		riskScore += 0.4 // New wallets are riskier
	}

	if analytics.SentTxCount < 3 {
		riskScore += 0.3 // Low transaction count is suspicious
	}

	// Cap the risk score at 0.95
	if riskScore > 0.95 {
		riskScore = 0.95
	}

	c.JSON(http.StatusOK, gin.H{
		"address":    address,
		"risk_score": riskScore,
		"risk_level": getRiskLevel(riskScore),
	})
}

// Export wallet data for ML training
func (h *WalletAnalyticsHandler) ExportWalletData(c *gin.Context) {
	// This would be an admin-only endpoint
	// Check authorization

	var req struct {
		Addresses  []string `json:"addresses" binding:"required"`
		OutputPath string   `json:"output_path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	if err := h.analyticsService.ExportAnalyticsForML(req.Addresses, req.OutputPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export data: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Data exported successfully",
		"file_path": req.OutputPath,
	})
}

// GetBulkWalletAnalytics returns analytics data for multiple wallet addresses
func (h *WalletAnalyticsHandler) GetBulkWalletAnalytics(c *gin.Context) {
	var req struct {
		Addresses []string `json:"addresses" binding:"required"`
		Format    string   `json:"format"` // "json" or "csv"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate addresses
	if len(req.Addresses) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one address is required"})
		return
	}

	if len(req.Addresses) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 1000 addresses allowed per request"})
		return
	}

	// Set default format
	if req.Format == "" {
		req.Format = "json"
	}

	// Collect analytics for all addresses
	var results []map[string]interface{}
	var errors []string

	for _, address := range req.Addresses {
		analytics, err := h.analyticsService.GetWalletAnalytics(address)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to get analytics for %s: %s", address, err.Error()))
			continue
		}

		// Convert to map for easier processing
		result := map[string]interface{}{
			"address":                         address,
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
			"txn_frequency":                   analytics.TxnFrequency,
			"avg_txn_value":                   analytics.AvgTxnValue,
			"wallet_age_days":                 analytics.WalletAge,
			"risk_score":                      analytics.RiskScore,
		}
		results = append(results, result)
	}

	// Return based on format
	if req.Format == "csv" {
		h.returnCSV(c, results)
	} else {
		response := gin.H{
			"data":    results,
			"count":   len(results),
			"errors":  errors,
			"success": len(errors) == 0,
		}
		c.JSON(http.StatusOK, response)
	}
}

// ExportMLDataset exports wallet analytics in CSV format for ML training
func (h *WalletAnalyticsHandler) ExportMLDataset(c *gin.Context) {
	var req struct {
		Addresses []string `json:"addresses" binding:"required"`
		Filename  string   `json:"filename"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Set default filename
	if req.Filename == "" {
		req.Filename = fmt.Sprintf("wallet_analytics_%s.csv", time.Now().Format("20060102_150405"))
	}

	// Collect analytics for all addresses
	var results []map[string]interface{}

	for _, address := range req.Addresses {
		analytics, err := h.analyticsService.GetWalletAnalytics(address)
		if err != nil {
			continue // Skip failed addresses
		}

		result := map[string]interface{}{
			"address":                         address,
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
			"txn_frequency":                   analytics.TxnFrequency,
			"avg_txn_value":                   analytics.AvgTxnValue,
			"wallet_age_days":                 analytics.WalletAge,
			"risk_score":                      analytics.RiskScore,
		}
		results = append(results, result)
	}

	// Set headers for file download
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", req.Filename))

	h.returnCSV(c, results)
}

// returnCSV writes the results as CSV to the response
func (h *WalletAnalyticsHandler) returnCSV(c *gin.Context, results []map[string]interface{}) {
	if len(results) == 0 {
		c.String(http.StatusOK, "No data available")
		return
	}

	// Create CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Get headers from first result
	var headers []string
	for key := range results[0] {
		headers = append(headers, key)
	}

	// Write headers
	if err := writer.Write(headers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write CSV headers"})
		return
	}

	// Write data rows
	for _, result := range results {
		var row []string
		for _, header := range headers {
			value := result[header]
			switch v := value.(type) {
			case string:
				row = append(row, v)
			case int:
				row = append(row, strconv.Itoa(v))
			case float64:
				row = append(row, strconv.FormatFloat(v, 'f', -1, 64))
			default:
				row = append(row, fmt.Sprintf("%v", v))
			}
		}
		if err := writer.Write(row); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write CSV row"})
			return
		}
	}
}

// Helper function to get risk level from score
func getRiskLevel(score float64) string {
	if score < 0.2 {
		return "very_low"
	} else if score < 0.4 {
		return "low"
	} else if score < 0.6 {
		return "moderate"
	} else if score < 0.8 {
		return "high"
	} else {
		return "very_high"
	}
}
