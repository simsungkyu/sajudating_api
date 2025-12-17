package service

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"sajudating_api/api/dto"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/utils"

	"github.com/go-chi/chi/v5"
)

type AdminService struct {
}

func NewAdminService() *AdminService {
	return &AdminService{}
}

// AdminAuth handles admin authentication
func (s *AdminService) AdminAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req dto.AdminAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Simple authentication using environment variables
	adminUsername := os.Getenv("ADMIN_USERNAME")
	adminPassword := os.Getenv("ADMIN_PASSWORD")

	if adminUsername == "" {
		adminUsername = "dsadmin"
	}
	if adminPassword == "" {
		adminPassword = "signal!23"
	}

	if req.Username != adminUsername || req.Password != adminPassword {
		utils.RespondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate a simple token (in production, use JWT or similar)
	token := generateToken(req.Username)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.AdminAuthResponse{
		Token:   token,
		Message: "Authentication successful",
	})
}

// Helper functions
func generateToken(username string) string {
	// Simple token generation (in production, use proper JWT)
	data := username + ":" + os.Getenv("SECRET_KEY")
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func GetAdminImage(w http.ResponseWriter, r *http.Request) {
	path := chi.URLParam(r, "*")

	imageS3Dao := extdao.NewImageS3Dao()
	imageData, err, _ := imageS3Dao.GetImageFromS3(path)
	if err != nil {
		log.Printf("Failed to get image from S3: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to get image")
		return
	}
	w.Header().Set("Content-Type", http.DetectContentType(imageData))
	w.WriteHeader(http.StatusOK)
	w.Write(imageData)
}
