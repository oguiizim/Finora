package handler

import (
	"net/http"
	"strings"
	"sync"

	"github.com/oguiizim/finora/server"
)

var (
	once       sync.Once
	apiHandler http.Handler
	initErr    error
)

// Handler is the Vercel Go Function entry point. vercel.json forwards every
// /api/* request here and includes the original API path in the `path` query.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		apiHandler, initErr = server.NewHandler()
	})
	if initErr != nil {
		http.Error(w, "API initialization failed", http.StatusInternalServerError)
		return
	}

	if path := strings.Trim(r.URL.Query().Get("path"), "/"); path != "" {
		r.URL.Path = "/api/" + path
	}
	apiHandler.ServeHTTP(w, r)
}
