-- Wallet Analytics Database Setup
-- Run this script to create the database and tables

-- Create the wallet database
CREATE DATABASE wallet;

-- Connect to the wallet database
\c wallet;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value DECIMAL(36,18) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETH',
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    network VARCHAR(20) NOT NULL DEFAULT 'ethereum',
    risk DECIMAL(5,4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_address VARCHAR(42) NOT NULL,
    reported_address VARCHAR(42) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    evidence TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter_address ON reports(reporter_address);
CREATE INDEX IF NOT EXISTS idx_reports_reported_address ON reports(reported_address);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Create DAO votes table
CREATE TABLE IF NOT EXISTS dao_votes (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL,
    voter_address VARCHAR(42) NOT NULL,
    vote_type VARCHAR(10) NOT NULL, -- 'for', 'against', 'abstain'
    voting_power DECIMAL(36,18) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proposal_id, voter_address)
);

-- Create DAO proposals table
CREATE TABLE IF NOT EXISTS dao_proposals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    proposer_address VARCHAR(42) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'passed', 'rejected', 'executed'
    votes_for DECIMAL(36,18) NOT NULL DEFAULT 0,
    votes_against DECIMAL(36,18) NOT NULL DEFAULT 0,
    votes_abstain DECIMAL(36,18) NOT NULL DEFAULT 0,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create recovery attempts table
CREATE TABLE IF NOT EXISTS recovery_attempts (
    id SERIAL PRIMARY KEY,
    victim_address VARCHAR(42) NOT NULL,
    scammer_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    evidence TEXT,
    amount VARCHAR(78), -- Amount recovered (if successful)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO transactions (from_address, to_address, value, tx_hash, risk, status) VALUES
('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0', '0x71c7656ec7ab88b098defb751b7401b5f6d8976f', 1.2, '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b', 0.1, 'safe'),
('0x71c7656ec7ab88b098defb751b7401b5f6d8976f', '0x1234567890abcdef1234567890abcdef12345678', 15.0, '0xf1e2d3c4b5a6978d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d', 0.85, 'blocked'),
('0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b', '0x8ba1f109551bD432803012645Hac136c22C501', 0.5, '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 0.2, 'safe')
ON CONFLICT (tx_hash) DO NOTHING;

-- Insert sample reports
INSERT INTO reports (reporter_address, reported_address, report_type, description, status) VALUES
('0x71c7656ec7ab88b098defb751b7401b5f6d8976f', '0x1234567890abcdef1234567890abcdef12345678', 'scam', 'Phishing website stealing funds', 'verified'),
('0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b', '0x9876543210fedcba9876543210fedcba98765432', 'fraud', 'Fake token contract', 'pending')
ON CONFLICT DO NOTHING;

-- Create a view for wallet analytics (helpful for ML data)
CREATE OR REPLACE VIEW wallet_analytics_view AS
SELECT 
    from_address as wallet_address,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE from_address = wallet_address) as sent_transactions,
    COUNT(*) FILTER (WHERE to_address = wallet_address) as received_transactions,
    AVG(value) as avg_transaction_value,
    SUM(value) as total_value,
    MAX(value) as max_value,
    MIN(timestamp) as first_transaction,
    MAX(timestamp) as last_transaction,
    AVG(risk) as avg_risk_score
FROM transactions 
GROUP BY from_address;

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON DATABASE wallet TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display success message
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created: transactions, reports, dao_votes, dao_proposals, recovery_attempts' as info;
SELECT COUNT(*) as sample_transactions FROM transactions;
SELECT COUNT(*) as sample_reports FROM reports;
