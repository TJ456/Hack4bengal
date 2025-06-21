package handlers

import (
	"Wallet/backend/models"
	"Wallet/backend/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DAOHandler handles DAO voting endpoints
type DAOHandler struct {
	db *gorm.DB
	blockchainService *services.BlockchainService
}

// NewDAOHandler creates a new DAO handler
func NewDAOHandler(db *gorm.DB, blockchainService *services.BlockchainService) *DAOHandler {
	return &DAOHandler{
		db: db,
		blockchainService: blockchainService,
	}
}

// CastVote records a DAO vote for a proposal
func (h *DAOHandler) CastVote(c *gin.Context) {
	var vote models.DAOVote
	if err := c.ShouldBindJSON(&vote); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vote format"})
		return
	}

	// Set timestamp
	vote.VotedAt = time.Now()

	// Check if proposal exists
	var proposal models.DAOProposal
	if result := h.db.First(&proposal, vote.ProposalID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Proposal not found"})
		return
	}

	// Check if user already voted
	var existingVote models.DAOVote
	result := h.db.Where("proposal_id = ? AND voter_address = ?", vote.ProposalID, vote.VoterAddress).First(&existingVote)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already voted on this proposal"})
		return
	}

	// Save vote to database
	if err := h.db.Create(&vote).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save vote"})
		return
	}

	// Update proposal vote counts
	if vote.VoteType == "for" {
		proposal.VotesFor++
	} else if vote.VoteType == "against" {
		proposal.VotesAgainst++
	}
	h.db.Save(&proposal)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Vote recorded successfully",
		"proposal": proposal,
	})
}

// GetProposals retrieves all active DAO proposals
func (h *DAOHandler) GetProposals(c *gin.Context) {
	var proposals []models.DAOProposal
	
	result := h.db.Find(&proposals)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch proposals"})
		return
	}

	c.JSON(http.StatusOK, proposals)
}

// CreateProposal creates a new DAO proposal
func (h *DAOHandler) CreateProposal(c *gin.Context) {
	var proposal models.DAOProposal
	if err := c.ShouldBindJSON(&proposal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid proposal format"})
		return
	}

	// Set default values
	proposal.CreatedAt = time.Now()
	proposal.Status = "active"
	proposal.VotesFor = 0
	proposal.VotesAgainst = 0
	proposal.EndTime = time.Now().AddDate(0, 0, 7) // 7 days from now

	// Save proposal to database
	if err := h.db.Create(&proposal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create proposal"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id": proposal.ID,
		"message": "Proposal created successfully",
	})
}
