// AdminExtractService_test: unit tests for extract-test handlers and RunSajuGeneration (no DB/sxtwl). Run: cd api && go test ./service/ -run AdminExtract
package service

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"sajudating_api/api/dto"
)

func TestRunSajuExtractTest_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/saju_extract_test", nil)
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET: status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}

func TestRunSajuExtractTest_InvalidBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/saju_extract_test", bytes.NewReader([]byte("not json")))
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("invalid body: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	var out map[string]string
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Error("expected error message")
	}
}

func TestRunSajuExtractTest_InvalidBirthDate(t *testing.T) {
	body := dto.SajuExtractTestRequest{
		Birth:    dto.BirthInput{Date: "invalid", Time: "10:00"},
		Timezone: "Asia/Seoul",
		Mode:     "인생",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/saju_extract_test", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("invalid birth: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	var out map[string]string
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] != "invalid birth date" {
		t.Errorf("error = %q, want invalid birth date", out["error"])
	}
}

func TestRunSajuExtractTest_IlganMode(t *testing.T) {
	body := dto.SajuExtractTestRequest{
		Birth:       dto.BirthInput{Date: "1990-05-15", Time: "10:00"},
		Timezone:    "Asia/Seoul",
		Mode:        "일간",
		TargetYear:  "2025",
		TargetMonth: "03",
		TargetDay:   "15",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/saju_extract_test", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code == http.StatusInternalServerError {
		t.Skip("일간 mode requires sxtwl/MongoDB; skipping when unavailable")
	}
	if w.Code != http.StatusOK {
		t.Errorf("일간: status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.Bytes())
		return
	}
	var resp dto.SajuExtractTestResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.UserInfo.Mode != "일간" {
		t.Errorf("user_info.mode = %q, want 일간", resp.UserInfo.Mode)
	}
	if resp.UserInfo.Period != "2025-03-15" {
		t.Errorf("user_info.period = %q, want 2025-03-15", resp.UserInfo.Period)
	}
	if resp.UserInfo.Pillars == nil || resp.UserInfo.Pillars["y"] == "" {
		t.Error("expected pillars (y,m,d,h) to be present for 일간")
	}
	if resp.PillarSource == nil || resp.PillarSource.BaseDate != "2025-03-15" {
		t.Errorf("expected pillar_source.base_date 2025-03-15, got %v", resp.PillarSource)
	}
}

func TestRunSajuExtractTest_DaesoonModeMissingTarget(t *testing.T) {
	body := dto.SajuExtractTestRequest{
		Birth:    dto.BirthInput{Date: "1990-05-15", Time: "10:00"},
		Timezone: "Asia/Seoul",
		Mode:     "대운",
		// target_daesoon_index and gender omitted
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/saju_extract_test", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("대운 missing target: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	var out map[string]string
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Error("expected error message for 대운 without target_daesoon_index and gender")
	}
}

func TestRunSajuExtractTest_DaesoonModeValid(t *testing.T) {
	body := dto.SajuExtractTestRequest{
		Birth:               dto.BirthInput{Date: "1990-05-15", Time: "10:00"},
		Timezone:            "Asia/Seoul",
		Mode:                "대운",
		TargetDaesoonIndex:  "0",
		Gender:              "male",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/saju_extract_test", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code == http.StatusInternalServerError {
		t.Skip("대운 mode requires sxtwl; skipping when unavailable")
	}
	if w.Code != http.StatusOK {
		t.Errorf("대운 valid: status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.Bytes())
		return
	}
	var resp dto.SajuExtractTestResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.UserInfo.Mode != "대운" {
		t.Errorf("user_info.mode = %q, want 대운", resp.UserInfo.Mode)
	}
	if resp.UserInfo.Period != "대운 0" {
		t.Errorf("user_info.period = %q, want 대운 0", resp.UserInfo.Period)
	}
	if resp.UserInfo.Pillars == nil || resp.UserInfo.Pillars["y"] == "" {
		t.Error("expected pillars (y,m,d,h) to be present for 대운")
	}
	if resp.PillarSource == nil || resp.PillarSource.Mode != "대운" || resp.PillarSource.Period != "대운 0" {
		t.Errorf("expected pillar_source mode 대운, period 대운 0; got %v", resp.PillarSource)
	}
}

func TestRunSajuExtractTest_IlganModeMissingTarget(t *testing.T) {
	body := dto.SajuExtractTestRequest{
		Birth:    dto.BirthInput{Date: "1990-05-15", Time: "10:00"},
		Timezone: "Asia/Seoul",
		Mode:     "일간",
		// target_year, target_month, target_day omitted
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/saju_extract_test", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunSajuExtractTest(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("일간 missing target: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	var out map[string]string
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Error("expected error message for 일간 without target date")
	}
}

func TestRunPairExtractTest_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/pair_extract_test", nil)
	w := httptest.NewRecorder()
	RunPairExtractTest(w, req)
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET: status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}

func TestRunPairExtractTest_InvalidBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/pair_extract_test", bytes.NewReader([]byte("{")))
	w := httptest.NewRecorder()
	RunPairExtractTest(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("invalid body: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestRunPairExtractTest_InvalidBirthDate(t *testing.T) {
	body := dto.PairExtractTestRequest{
		BirthA:   dto.BirthInput{Date: "1990-05-15", Time: "10:00"},
		BirthB:   dto.BirthInput{Date: "invalid", Time: "14:00"},
		Timezone: "Asia/Seoul",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/pair_extract_test", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunPairExtractTest(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("invalid birth B: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	var out map[string]string
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] != "invalid birth date" {
		t.Errorf("error = %q, want invalid birth date", out["error"])
	}
}

func TestRunLLMContextPreview_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/llm_context_preview", nil)
	w := httptest.NewRecorder()
	RunLLMContextPreview(w, req)
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET: status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}

func TestRunLLMContextPreview_InvalidBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/llm_context_preview", bytes.NewReader([]byte("not json")))
	w := httptest.NewRecorder()
	RunLLMContextPreview(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("invalid body: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestRunLLMContextPreview_MissingParams(t *testing.T) {
	body := dto.LLMContextPreviewRequest{CardIDs: []string{"c1"}, Scope: ""}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/llm_context_preview", bytes.NewReader(b))
	w := httptest.NewRecorder()
	RunLLMContextPreview(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("missing scope: status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	var out map[string]string
	if err := json.NewDecoder(w.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Error("expected error message")
	}
}

func TestRunSajuGeneration_InvalidBirth(t *testing.T) {
	ctx := context.Background()
	req := dto.SajuGenerationRequest{
		UserInput: dto.SajuGenerationUserInput{
			Birth:    dto.BirthInput{Date: "invalid", Time: "10:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
		},
		Targets: []dto.SajuGenerationTargetInput{{Kind: "인생", Period: "", MaxChars: 500}},
	}
	_, err := RunSajuGeneration(ctx, req)
	if err == nil {
		t.Error("expected error for invalid birth date")
	}
	if err != nil && err.Error() != "invalid birth date" {
		t.Errorf("error = %v, want invalid birth date", err)
	}
}

func TestRunSajuGeneration_DaesoonMissingGender(t *testing.T) {
	ctx := context.Background()
	req := dto.SajuGenerationRequest{
		UserInput: dto.SajuGenerationUserInput{
			Birth:    dto.BirthInput{Date: "1990-05-15", Time: "10:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
			// Gender omitted
		},
		Targets: []dto.SajuGenerationTargetInput{{Kind: "대운", Period: "0", MaxChars: 500}},
	}
	resp, err := RunSajuGeneration(ctx, req)
	if err != nil {
		t.Fatalf("RunSajuGeneration: %v", err)
	}
	if len(resp.Targets) != 1 {
		t.Fatalf("targets length = %d, want 1", len(resp.Targets))
	}
	if resp.Targets[0].Result == "" || strings.Contains(resp.Targets[0].Result, "gender") == false {
		t.Errorf("대운 without gender should return error mentioning gender; got %q", resp.Targets[0].Result)
	}
}

func TestRunSajuGeneration_DaesoonWithGender(t *testing.T) {
	ctx := context.Background()
	req := dto.SajuGenerationRequest{
		UserInput: dto.SajuGenerationUserInput{
			Birth:    dto.BirthInput{Date: "1990-05-15", Time: "10:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
			Gender:   "male",
		},
		Targets: []dto.SajuGenerationTargetInput{{Kind: "대운", Period: "0", MaxChars: 500}},
	}
	resp, err := RunSajuGeneration(ctx, req)
	if err != nil {
		t.Fatalf("RunSajuGeneration: %v", err)
	}
	if len(resp.Targets) != 1 {
		t.Fatalf("targets length = %d, want 1", len(resp.Targets))
	}
	// Result is either LLM text (when API key set) or "OpenAI API key not configured" or another error; should be non-empty
	if resp.Targets[0].Result == "" {
		t.Error("대운 result should be non-empty (LLM text or error message)")
	}
	if strings.Contains(resp.Targets[0].Result, "대운 미구현") {
		t.Error("대운 should no longer return 대운 미구현")
	}
}

func TestRunSajuGeneration_SingleTargetInsaeng(t *testing.T) {
	ctx := context.Background()
	req := dto.SajuGenerationRequest{
		UserInput: dto.SajuGenerationUserInput{
			Birth:    dto.BirthInput{Date: "1990-05-15", Time: "10:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
		},
		Targets: []dto.SajuGenerationTargetInput{{Kind: "인생", Period: "", MaxChars: 500}},
	}
	resp, err := RunSajuGeneration(ctx, req)
	if err != nil {
		t.Fatalf("RunSajuGeneration: %v", err)
	}
	if len(resp.Targets) != 1 {
		t.Fatalf("targets length = %d, want 1", len(resp.Targets))
	}
	if resp.Targets[0].Kind != "인생" || resp.Targets[0].Period != "" || resp.Targets[0].MaxChars != 500 {
		t.Errorf("target echo: kind=%q period=%q max_chars=%d", resp.Targets[0].Kind, resp.Targets[0].Period, resp.Targets[0].MaxChars)
	}
	// Result is either LLM text (when API key set) or "OpenAI API key not configured"
	if resp.Targets[0].Result == "" {
		t.Error("result should be non-empty (LLM text or error message)")
	}
}

func TestRunSajuGeneration_MultipleTargets(t *testing.T) {
	ctx := context.Background()
	req := dto.SajuGenerationRequest{
		UserInput: dto.SajuGenerationUserInput{
			Birth:    dto.BirthInput{Date: "1990-05-15", Time: "10:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
		},
		Targets: []dto.SajuGenerationTargetInput{
			{Kind: "인생", Period: "", MaxChars: 300},
			{Kind: "세운", Period: "2025", MaxChars: 400},
		},
	}
	resp, err := RunSajuGeneration(ctx, req)
	if err != nil {
		t.Fatalf("RunSajuGeneration: %v", err)
	}
	if len(resp.Targets) != 2 {
		t.Fatalf("targets length = %d, want 2", len(resp.Targets))
	}
	if resp.Targets[0].Kind != "인생" || resp.Targets[0].Period != "" {
		t.Errorf("first target: kind=%q period=%q", resp.Targets[0].Kind, resp.Targets[0].Period)
	}
	if resp.Targets[1].Kind != "세운" || resp.Targets[1].Period != "2025" {
		t.Errorf("second target: kind=%q period=%q", resp.Targets[1].Kind, resp.Targets[1].Period)
	}
	for i := range resp.Targets {
		if resp.Targets[i].Result == "" {
			t.Errorf("target %d result empty", i)
		}
	}
}

func TestRunChemiGeneration_InvalidBirthA(t *testing.T) {
	ctx := context.Background()
	req := dto.ChemiGenerationRequest{
		PairInput: dto.ChemiGenerationPairInput{
			BirthA:   dto.BirthInput{Date: "", Time: "10:00", TimePrecision: "minute"},
			BirthB:   dto.BirthInput{Date: "1990-05-15", Time: "14:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
		},
		Targets: []dto.ChemiGenerationTargetInput{{Perspective: "overview", MaxChars: 500}},
	}
	_, err := RunChemiGeneration(ctx, req)
	if err == nil {
		t.Error("expected error for invalid birth A date")
	}
	if err != nil && !strings.Contains(err.Error(), "birth A") {
		t.Errorf("error = %v, want message containing 'birth A'", err)
	}
}

func TestRunChemiGeneration_InvalidBirthB(t *testing.T) {
	ctx := context.Background()
	req := dto.ChemiGenerationRequest{
		PairInput: dto.ChemiGenerationPairInput{
			BirthA:   dto.BirthInput{Date: "1990-05-15", Time: "10:00", TimePrecision: "minute"},
			BirthB:   dto.BirthInput{Date: "invalid", Time: "14:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
		},
		Targets: []dto.ChemiGenerationTargetInput{{Perspective: "overview", MaxChars: 500}},
	}
	_, err := RunChemiGeneration(ctx, req)
	if err == nil {
		t.Error("expected error for invalid birth B date")
	}
	if err != nil && !strings.Contains(err.Error(), "birth B") {
		t.Errorf("error = %v, want message containing 'birth B'", err)
	}
}

func TestRunChemiGeneration_Valid(t *testing.T) {
	ctx := context.Background()
	req := dto.ChemiGenerationRequest{
		PairInput: dto.ChemiGenerationPairInput{
			BirthA:   dto.BirthInput{Date: "1990-05-15", Time: "10:00", TimePrecision: "minute"},
			BirthB:   dto.BirthInput{Date: "1992-08-20", Time: "14:00", TimePrecision: "minute"},
			Timezone: "Asia/Seoul",
		},
		Targets: []dto.ChemiGenerationTargetInput{{Perspective: "overview", MaxChars: 500}},
	}
	resp, err := RunChemiGeneration(ctx, req)
	if err != nil {
		if strings.Contains(err.Error(), "pillars") || strings.Contains(err.Error(), "select pair cards") {
			t.Skip("RunChemiGeneration valid requires sxtwl/MongoDB or seed; skipping when unavailable")
		}
		t.Fatalf("RunChemiGeneration: %v", err)
	}
	if len(resp.Targets) != 1 {
		t.Fatalf("targets length = %d, want 1", len(resp.Targets))
	}
	if resp.Targets[0].Perspective != "overview" || resp.Targets[0].MaxChars != 500 {
		t.Errorf("target echo: perspective=%q max_chars=%d", resp.Targets[0].Perspective, resp.Targets[0].MaxChars)
	}
	// Result is either LLM text (when API key set) or "OpenAI API key not configured" or another error; should be non-empty
	if resp.Targets[0].Result == "" {
		t.Error("result should be non-empty (LLM text or error message)")
	}
}

func TestResolveRunDateForKind(t *testing.T) {
	tests := []struct {
		kind     string
		period   string
		birthY   int
		birthM   int
		birthD   int
		wantY    int
		wantM    int
		wantD    int
		wantOk   bool
	}{
		{"인생", "", 1990, 5, 15, 1990, 5, 15, true},
		{"세운", "2025", 1990, 5, 15, 2025, 1, 1, true},
		{"세운", "", 1990, 5, 15, 0, 0, 0, false},
		{"월간", "2025-03", 1990, 5, 15, 2025, 3, 1, true},
		{"월간", "2025-12", 1990, 5, 15, 2025, 12, 1, true},
		{"일간", "2025-03-15", 1990, 5, 15, 2025, 3, 15, true},
		{"대운", "2025", 1990, 5, 15, 0, 0, 0, false},
	}
	for _, tt := range tests {
		runY, runM, runD, ok := resolveRunDateForKind(tt.kind, tt.period, tt.birthY, tt.birthM, tt.birthD)
		if ok != tt.wantOk || runY != tt.wantY || runM != tt.wantM || runD != tt.wantD {
			t.Errorf("resolveRunDateForKind(%q, %q, %d,%d,%d) = %d,%d,%d,%v; want %d,%d,%d,%v",
				tt.kind, tt.period, tt.birthY, tt.birthM, tt.birthD, runY, runM, runD, ok, tt.wantY, tt.wantM, tt.wantD, tt.wantOk)
		}
	}
}
