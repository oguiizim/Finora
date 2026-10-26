package user

type User struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Password string `json:"-"`
	Active   bool   `json:"active"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}
type LoginRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}
type Session struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
