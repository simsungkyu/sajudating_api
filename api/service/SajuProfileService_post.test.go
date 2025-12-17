// localhost 에서 post /api/saju_profile 요청에 대한 테스트
package service

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"testing"
	"time"
)

const (
	baseURL = "http://localhost:8080"
)

// TestCreateSajuProfile_WithoutImage 이미지 없이 사주 프로필 생성 테스트
func TestCreateSajuProfile_WithoutImage(t *testing.T) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// 필수 필드 추가
	writer.WriteField("email", "test@example.com")
	writer.WriteField("birthdate", "19900101120000")
	writer.WriteField("sex", "male")

	writer.Close()

	req, err := http.NewRequest("POST", baseURL+"/api/saju_profile", &buf)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// 응답 검증
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected status 201, got %d. Body: %s", resp.StatusCode, string(body))
	}

	// 응답 본문 검증
	var result map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if uid, ok := result["uid"]; !ok || uid == "" {
		t.Errorf("Expected uid in response, got: %v", result)
	}

	t.Logf("Successfully created profile with uid: %s", result["uid"])
}

// TestCreateSajuProfile_WithImage 이미지 포함 사주 프로필 생성 테스트
func TestCreateSajuProfile_WithImage(t *testing.T) {
	// 테스트용 임시 이미지 파일 생성
	tmpFile, err := os.CreateTemp("", "test_image_*.png")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// 간단한 PNG 헤더 작성 (1x1 투명 이미지)
	pngData := []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
		0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
		0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
		0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
		0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
		0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
		0x42, 0x60, 0x82,
	}
	tmpFile.Write(pngData)
	tmpFile.Seek(0, 0)

	// Multipart form 데이터 생성
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// 필수 필드 추가
	writer.WriteField("email", "testimage@example.com")
	writer.WriteField("birthdate", "19950315093000")
	writer.WriteField("sex", "female")

	// 이미지 파일 추가
	part, err := writer.CreateFormFile("image", "test.png")
	if err != nil {
		t.Fatalf("Failed to create form file: %v", err)
	}
	if _, err := io.Copy(part, tmpFile); err != nil {
		t.Fatalf("Failed to copy file: %v", err)
	}

	writer.Close()

	req, err := http.NewRequest("POST", baseURL+"/api/saju_profile", &buf)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// 응답 검증
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected status 201, got %d. Body: %s", resp.StatusCode, string(body))
	}

	// 응답 본문 검증
	var result map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if uid, ok := result["uid"]; !ok || uid == "" {
		t.Errorf("Expected uid in response, got: %v", result)
	}

	t.Logf("Successfully created profile with image, uid: %s", result["uid"])
}

// TestCreateSajuProfile_WithoutEmail 이메일 없이 사주 프로필 생성 테스트 (이메일은 선택 필드)
func TestCreateSajuProfile_WithoutEmail(t *testing.T) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// email 제외하고 필드 추가
	writer.WriteField("birthdate", "19900101120000")
	writer.WriteField("sex", "male")

	writer.Close()

	req, err := http.NewRequest("POST", baseURL+"/api/saju_profile", &buf)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// 201 Created 검증 (이메일은 선택 필드)
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected status 201, got %d. Body: %s", resp.StatusCode, string(body))
	}

	// 응답 본문 검증
	var result map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if uid, ok := result["uid"]; !ok || uid == "" {
		t.Errorf("Expected uid in response, got: %v", result)
	}

	t.Logf("Successfully created profile without email, uid: %s", result["uid"])
}

// TestCreateSajuProfile_MissingBirthdate 필수 필드 누락 테스트 - birthdate 없음
func TestCreateSajuProfile_MissingBirthdate(t *testing.T) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// birthdate 제외하고 필드 추가
	writer.WriteField("email", "test@example.com")
	writer.WriteField("sex", "male")

	writer.Close()

	req, err := http.NewRequest("POST", baseURL+"/api/saju_profile", &buf)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// 400 Bad Request 검증
	if resp.StatusCode != http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("Expected status 400, got %d. Body: %s", resp.StatusCode, string(body))
	}

	t.Log("Correctly rejected request with missing birthdate")
}

// TestCreateSajuProfile_MissingSex 필수 필드 누락 테스트 - sex 없음
func TestCreateSajuProfile_MissingSex(t *testing.T) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// sex 제외하고 필드 추가
	writer.WriteField("email", "test@example.com")
	writer.WriteField("birthdate", "19900101120000")

	writer.Close()

	req, err := http.NewRequest("POST", baseURL+"/api/saju_profile", &buf)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// 400 Bad Request 검증
	if resp.StatusCode != http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("Expected status 400, got %d. Body: %s", resp.StatusCode, string(body))
	}

	t.Log("Correctly rejected request with missing sex")
}

// TestCreateSajuProfile_WrongMethod GET 메서드로 요청 시 405 에러 테스트
func TestCreateSajuProfile_WrongMethod(t *testing.T) {
	req, err := http.NewRequest("GET", baseURL+"/api/saju_profile", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// 405 Method Not Allowed 검증
	if resp.StatusCode != http.StatusMethodNotAllowed {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("Expected status 405, got %d. Body: %s", resp.StatusCode, string(body))
	}

	t.Log("Correctly rejected GET request with 405")
}
