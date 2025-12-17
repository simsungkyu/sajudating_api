package service

import (
	"encoding/base64"
	"fmt"
	"strings"
)

func decodeBase64Image(value string) ([]byte, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil, fmt.Errorf("empty image payload")
	}

	// Accept both raw base64 and data URLs (data:<mime>;base64,<payload>)
	if idx := strings.Index(trimmed, "base64,"); idx >= 0 {
		trimmed = trimmed[idx+len("base64,"):]
	}

	data, err := base64.StdEncoding.DecodeString(trimmed)
	if err != nil {
		return nil, fmt.Errorf("invalid base64 image: %w", err)
	}
	return data, nil
}
