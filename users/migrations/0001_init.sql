-- Migration number: 0001 	 2025-11-14T03:44:53.799Z
-- users are tracked at the control plane 

CREATE TABLE IF NOT EXISTS USERS (
  userId TEXT PRIMARY KEY,
  createdAt INTEGER NOT NULL
);