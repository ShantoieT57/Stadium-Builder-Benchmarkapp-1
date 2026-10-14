CREATE TABLE Users (
    Id           INTEGER PRIMARY KEY AUTOINCREMENT,
    Name         TEXT    NOT NULL,
    Email        TEXT    NOT NULL COLLATE NOCASE UNIQUE,
    PasswordHash TEXT    NOT NULL,
    Role         TEXT    NOT NULL CHECK (Role IN ('Importer', 'Approver'))
);

-- Server-side sessions. Only a SHA-256 hash of the opaque cookie token is stored.
CREATE TABLE Sessions (
    TokenHash      TEXT    NOT NULL PRIMARY KEY,
    UserId         INTEGER NOT NULL REFERENCES Users (Id) ON DELETE CASCADE,
    CreatedAt      TEXT    NOT NULL,
    LastActivityAt TEXT    NOT NULL
);

CREATE INDEX IX_Sessions_UserId ON Sessions (UserId);
