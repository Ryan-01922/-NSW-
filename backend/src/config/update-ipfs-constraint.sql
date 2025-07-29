-- Update IPFS hash constraint to support both CIDv0 and CIDv1 formats
-- This migration allows both old and new IPFS CID formats

-- Drop the old constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_ipfs_hash_check;

-- Add new constraint that supports both CIDv0 and CIDv1
ALTER TABLE properties ADD CONSTRAINT properties_ipfs_hash_check 
CHECK (
    ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$' OR                      -- CIDv0 format
    ipfs_hash ~ '^bafy[a-z0-9]{55,}$' OR                      -- CIDv1 format (base32)
    ipfs_hash ~ '^bafk[a-z0-9]{55,}$' OR                      -- CIDv1 format (base32)
    ipfs_hash ~ '^bafybe[a-z0-9]{54,}$'                       -- CIDv1 format (base32, different prefix)
);

-- Also update renewal_requests table
ALTER TABLE renewal_requests DROP CONSTRAINT IF EXISTS renewal_requests_ipfs_hash_check;

ALTER TABLE renewal_requests ADD CONSTRAINT renewal_requests_ipfs_hash_check 
CHECK (
    ipfs_hash IS NULL OR
    ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$' OR                      -- CIDv0 format
    ipfs_hash ~ '^bafy[a-z0-9]{55,}$' OR                      -- CIDv1 format
    ipfs_hash ~ '^bafk[a-z0-9]{55,}$' OR                      -- CIDv1 format
    ipfs_hash ~ '^bafybe[a-z0-9]{54,}$'                       -- CIDv1 format
);

-- Also update ownership_transfers table if it exists
ALTER TABLE ownership_transfers DROP CONSTRAINT IF EXISTS ownership_transfers_ipfs_hash_check;

ALTER TABLE ownership_transfers ADD CONSTRAINT ownership_transfers_ipfs_hash_check 
CHECK (
    ipfs_hash IS NULL OR
    ipfs_hash ~ '^Qm[a-zA-Z0-9]{44}$' OR                      -- CIDv0 format
    ipfs_hash ~ '^bafy[a-z0-9]{55,}$' OR                      -- CIDv1 format
    ipfs_hash ~ '^bafk[a-z0-9]{55,}$' OR                      -- CIDv1 format
    ipfs_hash ~ '^bafybe[a-z0-9]{54,}$'                       -- CIDv1 format
); 