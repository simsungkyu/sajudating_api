// Package itemncard: tests for LLM context assembly (Step 5).
package itemncard

import (
	"strings"
	"testing"

	"sajudating_api/api/dao/entity"
)

func TestBuildLLMContextFromCards(t *testing.T) {
	cards := []entity.ItemNCard{
		{ContentJSON: `{"summary":"요약 A","points":["포인트 1"],"questions":["질문 1"],"guardrails":["단정 표현 금지"]}`},
		{ContentJSON: `{"summary":"요약 B","points":["포인트 2"],"questions":["질문 2"]}`},
	}
	out := BuildLLMContextFromCards(cards, 5000)
	if !strings.Contains(out, "요약 A") || !strings.Contains(out, "요약 B") {
		t.Errorf("expected both summaries; got %q", out)
	}
	if !strings.Contains(out, "가이드라인") || !strings.Contains(out, "단정 표현 금지") {
		t.Errorf("expected guardrails; got %q", out)
	}
}

func TestBuildLLMContextFromCards_Dedup(t *testing.T) {
	cards := []entity.ItemNCard{
		{ContentJSON: `{"summary":"동일","points":["동일"]}`},
		{ContentJSON: `{"summary":"동일","points":["동일"]}`},
	}
	out := BuildLLMContextFromCards(cards, 5000)
	// Dedup: same string appears once; we expect at least one "동일".
	if !strings.Contains(out, "동일") {
		t.Errorf("dedup: expected '동일' at least once; got %q", out)
	}
	if strings.Count(out, "동일") > 1 {
		t.Errorf("dedup: expected '동일' at most once (dedup); got %q", out)
	}
}
