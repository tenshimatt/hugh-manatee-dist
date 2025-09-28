-- Initialize databases for all services
-- This runs when PostgreSQL container starts for the first time

-- Create databases
CREATE DATABASE airflow_db;
CREATE DATABASE gitlab_db;
CREATE DATABASE openproject_db;
CREATE DATABASE grafana_db;

-- Create users with proper permissions
CREATE USER airflow WITH ENCRYPTED PASSWORD 'pandora123';
CREATE USER gitlab WITH ENCRYPTED PASSWORD 'pandora123';
CREATE USER openproject WITH ENCRYPTED PASSWORD 'pandora123';
CREATE USER grafana WITH ENCRYPTED PASSWORD 'pandora123';

-- Grant database permissions
GRANT ALL PRIVILEGES ON DATABASE airflow_db TO airflow;
GRANT ALL PRIVILEGES ON DATABASE gitlab_db TO gitlab;
GRANT ALL PRIVILEGES ON DATABASE openproject_db TO openproject;
GRANT ALL PRIVILEGES ON DATABASE grafana_db TO grafana;

-- Additional permissions for GitLab (needs more extensive access)
ALTER USER gitlab CREATEDB;
ALTER USER gitlab CREATEROLE;

-- Additional permissions for Grafana
ALTER USER grafana CREATEDB;