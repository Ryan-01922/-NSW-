-- Set client encoding
SET client_encoding = 'UTF8';

-- Insert test property data
INSERT INTO properties (
    folio_number,
    location_hash,
    area_size,
    owner_address,
    expiry_date,
    status,
    ipfs_hash,
    metadata
) VALUES (
    'NSW-SYD-2024-001',
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    150.75,
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    'active',
    'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8W1a',
    '{"description": "Test Property 1", "zone": "residential", "address": "123 Test Street, Sydney NSW 2000"}'
);

-- Insert test agent authorization data
INSERT INTO agent_authorization (
    agent_address,
    owner_address,
    folio_number,
    authorized_by,
    authorized_at,
    expires_at,
    is_active,
    metadata
) VALUES (
    '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    'NSW-SYD-2024-001',
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    true,
    '{"authorization_type": "full", "notes": "Primary agent for property management"}'
);

-- Insert test renewal request data
INSERT INTO renewal_requests (
    folio_number,
    requester_address,
    new_expiry_date,
    status,
    reason,
    ipfs_hash,
    metadata
) VALUES (
    'NSW-SYD-2024-001',
    '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    CURRENT_TIMESTAMP + INTERVAL '2 years',
    'pending',
    'Extending lease for continued residential use',
    'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8W2b',
    '{"supporting_documents": ["lease_history.pdf", "payment_confirmation.pdf"]}'
);

-- Insert test ownership transfer data
INSERT INTO ownership_transfers (
    folio_number,
    from_address,
    to_address,
    status,
    ipfs_hash,
    metadata
) VALUES (
    'NSW-SYD-2024-001',
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    'pending',
    'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8W3c',
    '{"transfer_reason": "Property sale", "supporting_documents": ["sale_contract.pdf", "identity_verification.pdf"]}'
); 