package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DAOProposal represents a governance proposal in the DAO
type DAOProposal struct {
	ID             uint   `gorm:"primaryKey"`
	Title          string
	Description    string
	CreatorAddress string `gorm:"column:proposer_address"`
	Status         string
	VotesFor       int
	VotesAgainst   int
}

// DAOVote represents a vote cast by a user for a DAO proposal
type DAOVote struct {
	ID           uint   `gorm:"primaryKey"`
	ProposalID   uint
	VoterAddress string
	VoteType     string
	VotePower    float64
}

func main() {
	// Load .env file
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Check DAO tables
	log.Println("Checking DAO tables...")

	// Check if tables exist
	if err := checkDAOTables(db); err != nil {
		log.Fatalf("Failed to check DAO tables: %v", err)
	}

	log.Println("DAO tables check completed successfully")
}

func checkDAOTables(db *gorm.DB) error {
	// Check if tables exist
	if !db.Migrator().HasTable(&DAOProposal{}) {
		log.Println("Creating DAO proposals table...")
		if err := db.AutoMigrate(&DAOProposal{}); err != nil {
			return fmt.Errorf("failed to create DAO proposals table: %w", err)
		}
	} else {
		log.Println("DAO proposals table exists")
	}

	if !db.Migrator().HasTable(&DAOVote{}) {
		log.Println("Creating DAO votes table...")
		if err := db.AutoMigrate(&DAOVote{}); err != nil {
			return fmt.Errorf("failed to create DAO votes table: %w", err)
		}
	} else {
		log.Println("DAO votes table exists")
	}

	return nil
}
