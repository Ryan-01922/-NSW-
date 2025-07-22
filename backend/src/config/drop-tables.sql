-- 设置客户端编码
SET client_encoding = 'UTF8';

-- 删除表（按照依赖关系顺序）
DROP TABLE IF EXISTS ownership_transfers CASCADE;
DROP TABLE IF EXISTS renewal_requests CASCADE;
DROP TABLE IF EXISTS agent_authorization CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

-- 删除自定义类型
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE; 