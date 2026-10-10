create table transactions(
    id integer primary key autoincrement,
    type text not null default('INCOME'),
    name text not null,
    category_id integer not null,
    amount integer not null default(0),
    date text not null default (datetime('now')),
    status text not null,
    created_at text not null default (datetime('now')),
    updated_at text not null default (datetime('now')),

    foreign key (category_id) references category(id)
);