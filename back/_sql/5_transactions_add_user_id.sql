ALTER TABLE transactions
ADD COLUMN user_id INTEGER REFERENCES users(id);
