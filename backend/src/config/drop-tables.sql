-- Set client encoding
SET client_encoding = 'UTF8';

-- Drop tables in dependency order
DROP TABLE IF EXISTS ownership_transfers CASCADE;
DROP TABLE IF EXISTS renewal_requests CASCADE;
DROP TABLE IF EXISTS agent_authorization CASCADE;
DROP TABLE IF EXISTS global_agents CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS transfer_status CASCADE; 