-- Migration 0002: Add chat logs table for Claude AI chat endpoint
-- This table stores conversation history and usage analytics

-- Chat logs table
CREATE TABLE chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    conversation_id TEXT NOT NULL DEFAULT 'default',
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'claude-3-sonnet-20240229',
    tokens_used INTEGER DEFAULT 0,
    cached BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add pet_info column to users table for better AI responses
ALTER TABLE users ADD COLUMN pet_info TEXT; -- JSON object with pet details
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'; -- 'user', 'admin'

-- Create indexes for chat logs performance
CREATE INDEX idx_chat_logs_user ON chat_logs(user_id);
CREATE INDEX idx_chat_logs_conversation ON chat_logs(conversation_id);
CREATE INDEX idx_chat_logs_date ON chat_logs(created_at);
CREATE INDEX idx_chat_logs_user_conversation ON chat_logs(user_id, conversation_id);
CREATE INDEX idx_chat_logs_tokens ON chat_logs(tokens_used);

-- Create index for user premium status for rate limiting
CREATE INDEX idx_users_premium ON users(is_premium);
CREATE INDEX idx_users_role ON users(role);