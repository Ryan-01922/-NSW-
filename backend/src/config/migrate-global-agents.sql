-- Migration: Add global_agents table for system-wide agent permissions
-- Run this script on existing database to add the new table

-- Create global_agents table for system-wide agent permissions
CREATE TABLE IF NOT EXISTS global_agents (
    id SERIAL PRIMARY KEY,
    agent_address VARCHAR(42) NOT NULL UNIQUE CHECK (agent_address ~ '^0x[a-fA-F0-9]{40}$'),
    authorized_by VARCHAR(42) NOT NULL CHECK (authorized_by ~ '^0x[a-fA-F0-9]{40}$'),
    authorized_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_global_agents_address ON global_agents(agent_address);
CREATE INDEX IF NOT EXISTS idx_global_agents_active ON global_agents(is_active);

-- Verify table creation
SELECT 'global_agents table created successfully' AS status; 