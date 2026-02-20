package utils

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/mr-tron/base58"
)

func GenUid() string {
	generated, err := uuid.NewUUID()
	if err != nil {
		log.Printf("Error on uuid.NewUUID")
	}

	uuidBytes := generated[:]

	return base58.Encode(uuidBytes)
}

func IntPtr(value int) *int {
	return &value
}

// Helper function to create a string pointer
func StrPtr(s string) *string {
	return &s
}

// PtrToStr returns the string pointed to by s, or "" if s is nil.
func PtrToStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func ConvertFloat32ToFloat64(input []float32) []float64 {
	output := make([]float64, len(input))
	for i, v := range input {
		output[i] = float64(v)
	}
	return output
}

func GetAgeFromBirthdate(birthdate string) string {
	now := time.Now()
	year := birthdate[:4]
	yearInt, err := strconv.Atoi(year)
	if err != nil {
		return "0"
	}

	return fmt.Sprintf("%d", now.Year()-yearInt)
}

func GetSajuProfileImagePath(uid string) string {
	return fmt.Sprintf("saju_profile/%s", uid)
}
func GetPhyPartnerImagePath(uid string) string {
	return fmt.Sprintf("phy_partner/%s", uid)
}

func GetAiExecutionInputImagePath(uid string) string {
	return fmt.Sprintf("ai_execution_input/%s", uid)
}

func GetAiExecutionOutputImagePath(uid string) string {
	return fmt.Sprintf("ai_execution_output/%s", uid)
}
