create table categories(
    id integer primary key autoincrement,
    name text not null,
    created_at text not null default (datetime('now'))
);