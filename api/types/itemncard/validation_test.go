// validation_test.go: unit tests for card payload validation (trigger/score shape) and seed file structure.
// Fix 2026-02-01: TestSeedFileStructure resolves testdata via runtime.Caller(0) so it works regardless of process cwd (api/ or api/types/itemncard).
package itemncard

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestValidateCardPayload(t *testing.T) {
	tests := []struct {
		name       string
		scope      string
		triggerJSON string
		scoreJSON   string
		wantErr    bool
		errSub     string
	}{
		{"valid saju trigger", "saju", `{"all":[{"token":"십성:정재"}],"any":[],"not":[]}`, "{}", false, ""},
		{"valid pair trigger with src P", "pair", `{"all":[],"any":[{"src":"P","token":"궁합:충@A.일지-B.일지"}],"not":[]}`, "{}", false, ""},
		{"pair trigger missing token", "pair", `{"all":[],"any":[{"src":"P","token":""}],"not":[]}`, "{}", true, "missing token"},
		{"pair trigger invalid src", "pair", `{"all":[],"any":[{"src":"X","token":"궁합:충"}],"not":[]}`, "{}", true, "src must be P, A, or B"},
		{"pair trigger missing src", "pair", `{"all":[],"any":[{"token":"궁합:충"}],"not":[]}`, "{}", true, "src must be P, A, or B"},
		{"invalid trigger JSON", "saju", `{all: no quotes}`, "{}", true, "invalid JSON"},
		{"valid score", "saju", "{}", `{"base":50,"bonus_if":[{"token":"십성:정재#H","add":10}],"penalty_if":[]}`, false, ""},
		{"score bonus_if missing token", "saju", "{}", `{"base":50,"bonus_if":[{"add":10}],"penalty_if":[]}`, true, "missing token"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCardPayload(tt.scope, tt.triggerJSON, tt.scoreJSON)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error containing %q, got nil", tt.errSub)
				}
				if tt.errSub != "" && !strings.Contains(err.Error(), tt.errSub) {
					t.Errorf("error %q does not contain %q", err.Error(), tt.errSub)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

// seedShape is minimal CardDataStructure/ChemiStructure shape for validation.
type seedShape struct {
	CardID  string          `json:"card_id"`
	Scope   string          `json:"scope"`
	Title   string          `json:"title"`
	Trigger json.RawMessage `json:"trigger"`
	Score   json.RawMessage `json:"score"`
	Content json.RawMessage `json:"content"`
}

// TestSeedFileStructure verifies testdata seed JSON files conform to CardDataStructure (saju) / ChemiStructure (pair).
func TestSeedFileStructure(t *testing.T) {
	_, file, _, _ := runtime.Caller(0)
	base := filepath.Join(filepath.Dir(file), "testdata")
	if _, err := os.Stat(base); os.IsNotExist(err) {
		t.Skipf("testdata/ not found at %s", base)
	}
	files := []struct {
		name string
		path string
	}{
		{"saju", filepath.Join(base, "seed_saju.json")},
		{"pair", filepath.Join(base, "seed_pair.json")},
	}
	for _, f := range files {
		t.Run(f.name, func(t *testing.T) {
			raw, err := os.ReadFile(f.path)
			if err != nil {
				t.Fatalf("read %s: %v", f.path, err)
			}
			var s seedShape
			if err := json.Unmarshal(raw, &s); err != nil {
				t.Fatalf("unmarshal: %v", err)
			}
			if s.CardID == "" || s.Scope == "" || s.Title == "" {
				t.Errorf("missing required field: card_id=%q scope=%q title=%q", s.CardID, s.Scope, s.Title)
			}
			if len(s.Trigger) == 0 {
				t.Error("trigger is required")
			}
			triggerJSON := "{}"
			if len(s.Trigger) > 0 {
				triggerJSON = string(s.Trigger)
			}
			scoreJSON := "{}"
			if len(s.Score) > 0 {
				scoreJSON = string(s.Score)
			}
			if err := ValidateCardPayload(s.Scope, triggerJSON, scoreJSON); err != nil {
				t.Errorf("ValidateCardPayload: %v", err)
			}
		})
	}
}
