// Package itemncard: LLM context assembly from selected cards (CardDataStructure Step 5).
package itemncard

import (
	"encoding/json"
	"strings"

	"sajudating_api/api/dao/entity"
)

// ContentShape matches content JSON: summary, points, questions, guardrails.
type ContentShape struct {
	Summary    string   `json:"summary"`
	Points     []string `json:"points,omitempty"`
	Questions  []string `json:"questions,omitempty"`
	Guardrails []string `json:"guardrails,omitempty"`
}

// BuildLLMContextFromCards builds an LLM context string from selected cards' content (summary, points, questions)
// with dedup and length limit, and appends guardrails as instructions. Input is the list of selected cards only.
func BuildLLMContextFromCards(cards []entity.ItemNCard, maxChars int) string {
	if maxChars <= 0 {
		maxChars = 8000
	}
	seen := make(map[string]bool)
	var parts []string
	var guardrails []string
	total := 0
	for i := range cards {
		var c ContentShape
		if err := json.Unmarshal([]byte(cards[i].ContentJSON), &c); err != nil {
			continue
		}
		if c.Summary != "" && !seen[c.Summary] {
			seen[c.Summary] = true
			if total+len(c.Summary)+1 <= maxChars {
				parts = append(parts, c.Summary)
				total += len(c.Summary) + 1
			}
		}
		for _, p := range c.Points {
			p = strings.TrimSpace(p)
			if p != "" && !seen[p] {
				seen[p] = true
				if total+len(p)+1 <= maxChars {
					parts = append(parts, p)
					total += len(p) + 1
				}
			}
		}
		for _, q := range c.Questions {
			q = strings.TrimSpace(q)
			if q != "" && !seen[q] {
				seen[q] = true
				if total+len(q)+1 <= maxChars {
					parts = append(parts, q)
					total += len(q) + 1
				}
			}
		}
		for _, g := range c.Guardrails {
			g = strings.TrimSpace(g)
			if g != "" {
				guardrails = append(guardrails, g)
			}
		}
	}
	out := strings.Join(parts, "\n")
	if len(guardrails) > 0 {
		dedupG := make(map[string]bool)
		var uniq []string
		for _, g := range guardrails {
			if !dedupG[g] {
				dedupG[g] = true
				uniq = append(uniq, g)
			}
		}
		out += "\n\n[가이드라인]\n" + strings.Join(uniq, "\n")
	}
	return out
}
