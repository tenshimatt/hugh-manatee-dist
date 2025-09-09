-- Test basic table creation
CREATE TYPE user_account_type AS ENUM ('user', 'business', 'admin');

CREATE TABLE users_test (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);