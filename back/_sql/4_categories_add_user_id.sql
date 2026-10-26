ALTER TABLE categories
ADD COLUMN user_id INTEGER REFERENCES users(id);
