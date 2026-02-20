// cardtools_test.go: unit tests for MCP card tools (cardJSONToInput validation); no DB required.
package mcplocal

import (
	"strings"
	"testing"
)

func TestCardJSONToInput(t *testing.T) {
	validSaju := `{
		"card_id": "십성_정재_강함_v1",
		"scope": "saju",
		"title": "정재가 강하게 드러남",
		"trigger": {"all":[{"token":"십성:정재"}],"any":[],"not":[]},
		"score": {"base":50,"bonus_if":[],"penalty_if":[]},
		"content": {}
	}`
	validPair := `{
		"card_id": "궁합_충_일지_v1",
		"scope": "pair",
		"title": "A·B 일지 충",
		"trigger": {"all":[],"any":[{"src":"P","token":"궁합:충@A.일지-B.일지"}],"not":[]},
		"score": {"base":50,"bonus_if":[],"penalty_if":[]},
		"content": {}
	}`

	tests := []struct {
		name    string
		raw     string
		wantErr bool
		errSub  string
	}{
		{"valid saju", validSaju, false, ""},
		{"valid pair with src P", validPair, false, ""},
		{"invalid JSON", `{card_id: unquoted}`, true, "invalid card_json"},
		{"missing card_id", `{"scope":"saju","title":"x","trigger":{},"score":{},"content":{}}`, true, "card_id is required"},
		{"empty card_id", `{"card_id":"","scope":"saju","title":"x","trigger":{},"score":{},"content":{}}`, true, "card_id is required"},
		{"invalid scope", `{"card_id":"c","scope":"other","title":"x","trigger":{},"score":{},"content":{}}`, true, "scope must be saju or pair"},
		{"missing scope", `{"card_id":"c","title":"x","trigger":{},"score":{},"content":{}}`, true, "scope must be saju or pair"},
		{"missing title", `{"card_id":"c","scope":"saju","trigger":{},"score":{},"content":{}}`, true, "title is required"},
		{"empty title", `{"card_id":"c","scope":"saju","title":"","trigger":{},"score":{},"content":{}}`, true, "title is required"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			out, err := cardJSONToInput(tt.raw)
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
			if out.CardID == "" || out.Scope == "" || out.Title == "" {
				t.Errorf("expected non-empty CardID/Scope/Title, got %q / %q / %q", out.CardID, out.Scope, out.Title)
			}
		})
	}
}
