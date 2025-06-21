package models

import (
	"time"
)

// DAOProposal represents a governance proposal in the DAO
type DAOProposal struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	CreatorAddress string    `json:"creatorAddress" gorm:"index;column:proposer_address"`
	CreatedAt      time.Time `json:"createdAt"`
	EndTime        time.Time `json:"endTime"`
	Status         string    `json:"status"` // "active", "passed", "rejected", "executed"
	VotesFor       int       `json:"votesFor"`
	VotesAgainst   int       `json:"votesAgainst"`
	ExecutionData  string    `json:"executionData"` // contract call data if proposal passes
}

// DAOVote represents a vote cast by a user for a DAO proposal
type DAOVote struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	ProposalID   uint      `json:"proposalId" gorm:"index"`
	VoterAddress string    `json:"voterAddress" gorm:"index"`
	VoteType     string    `json:"voteType"` // "for" or "against"
	VotePower    float64   `json:"votePower"`
	VotedAt      time.Time `json:"votedAt"`
}
