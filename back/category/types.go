package category

import "time"

type Category struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"-"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateCategory struct {
	Name string `json:"name"`
}

type EditCategory struct {
	ID   int64
	Name string `json:"name"`
}
