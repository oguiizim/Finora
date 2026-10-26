CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    senha TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT (true),
    refresh_token TEXT
);
