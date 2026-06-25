CREATE TABLE IF NOT EXISTS access (
    user_id     TEXT    NOT NULL PRIMARY KEY,
    granted_by  TEXT    NOT NULL,
    granted_at  BIGINT  NOT NULL  
);
