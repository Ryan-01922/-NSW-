-- Set client encoding
SET client_encoding = 'UTF8';

-- Create custom types
CREATE TYPE property_status AS ENUM ('active', 'pending', 'expired', 'transferred');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Create users table
CREATE TABLE users (
    address VARCHAR(42) PRIMARY KEY CHECK (address ~ '^0x[a-fA-F0-9]{40}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_users table
CREATE TABLE admin_users (
    address VARCHAR(42) PRIMARY KEY REFERENCES users(address) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create properties table
CREATE TABLE properties (
    folio_number VARCHAR(50) PRIMARY KEY,
    location_hash VARCHAR(66) NOT NULL,
    area_size NUMERIC(10,2) NOT NULL CHECK (area_size > 0),
    owner_address VARCHAR(42) NOT NULL CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    expiry_date TIMESTAMP NOT NULL CHECK (expiry_date > CURRENT_TIMESTAMP),
    status property_status NOT NULL DEFAULT 'pending',
    ipfs_hash VARCHAR(100) NOT NULL CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_authorization table
CREATE TABLE agent_authorization (
    id SERIAL PRIMARY KEY,
    agent_address VARCHAR(42) NOT NULL CHECK (agent_address ~ '^0x[a-fA-F0-9]{40}$'),
    owner_address VARCHAR(42) NOT NULL CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    folio_number VARCHAR(50) NOT NULL REFERENCES properties(folio_number) ON DELETE CASCADE,
    authorized_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP CHECK (expires_at > authorized_at),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_address, owner_address, folio_number),
    CHECK (agent_address != owner_address)
);

-- Create renewal_requests table
CREATE TABLE renewal_requests (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(50) NOT NULL REFERENCES properties(folio_number) ON DELETE CASCADE,
    requester_address VARCHAR(42) NOT NULL CHECK (requester_address ~ '^0x[a-fA-F0-9]{40}$'),
    new_expiry_date TIMESTAMP NOT NULL CHECK (new_expiry_date > CURRENT_TIMESTAMP),
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status request_status NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    ipfs_hash VARCHAR(100) CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (new_expiry_date > request_date)
);

-- Create ownership_transfers table
CREATE TABLE ownership_transfers (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(50) NOT NULL REFERENCES properties(folio_number) ON DELETE CASCADE,
    from_address VARCHAR(42) NOT NULL CHECK (from_address ~ '^0x[a-fA-F0-9]{40}$'),
    to_address VARCHAR(42) NOT NULL CHECK (to_address ~ '^0x[a-fA-F0-9]{40}$'),
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status request_status NOT NULL DEFAULT 'pending',
    ipfs_hash VARCHAR(100) CHECK (ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$'),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_address != to_address)
);

-- Create indexes
CREATE INDEX idx_properties_owner ON properties(owner_address);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_expiry ON properties(expiry_date);
CREATE INDEX idx_agent_auth_agent ON agent_authorization(agent_address) WHERE is_active = true;
CREATE INDEX idx_agent_auth_owner ON agent_authorization(owner_address) WHERE is_active = true;
CREATE INDEX idx_renewal_folio ON renewal_requests(folio_number) WHERE status = 'pending';
CREATE INDEX idx_renewal_status ON renewal_requests(status);
CREATE INDEX idx_transfer_folio ON ownership_transfers(folio_number) WHERE status = 'pending';
CREATE INDEX idx_transfer_status ON ownership_transfers(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers for all tables
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_authorization_updated_at
    BEFORE UPDATE ON agent_authorization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renewal_requests_updated_at
    BEFORE UPDATE ON renewal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ownership_transfers_updated_at
    BEFORE UPDATE ON ownership_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 