-- Migration number: 0003 	 2025-11-15T17:57:59.122Z
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON USERS(email);
