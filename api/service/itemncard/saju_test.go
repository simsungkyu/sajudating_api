// Package itemncard: tests for saju pipeline (relations, 신살, 지장간).
package itemncard

import (
	"strings"
	"testing"

	"sajudating_api/api/dao/entity"
	itemncardtypes "sajudating_api/api/types/itemncard"
)

func TestPillarToIndices(t *testing.T) {
	tg, dz, ok := pillarToIndices("경오")
	if !ok {
		t.Fatal("pillarToIndices expected ok for 경오")
	}
	// 경=index 6, 오=index 6 in DZ
	if tg != 6 || dz != 6 {
		t.Errorf("pillarToIndices(경오) = tg=%d dz=%d, want 6,6", tg, dz)
	}
	_, _, ok = pillarToIndices("x")
	if ok {
		t.Error("pillarToIndices(x) expected !ok")
	}
}

func TestItemsFromPillars_Relations(t *testing.T) {
	pillars := itemncardtypes.PillarsText{
		Year:  "경오",
		Month: "기축",
		Day:   "갑자",
		Hour:  "병인",
	}
	palja := "경오기축갑자병인"
	items := ItemsFromPillars(pillars, palja)
	var hasRelation bool
	for _, it := range items {
		if it.K == "관계" {
			hasRelation = true
			break
		}
	}
	if !hasRelation {
		t.Error("ItemsFromPillars expected at least one 관계 item")
	}
	var hasSinsal bool
	for _, it := range items {
		if it.K == "신살" {
			hasSinsal = true
			break
		}
	}
	if !hasSinsal {
		t.Error("ItemsFromPillars expected at least one 신살 item")
	}
	var hasJijanggan bool
	for _, it := range items {
		if it.K == "지장간" {
			hasJijanggan = true
			break
		}
	}
	if !hasJijanggan {
		t.Error("ItemsFromPillars expected at least one 지장간 item")
	}
	tokens := ItemsToTokens(items)
	if len(tokens) == 0 {
		t.Error("ItemsToTokens expected non-empty")
	}
}

// TestItemsToTokens_RelationWhere verifies that relationship "where" (e.g. 일지-년지) is normalized
// per TokenRule: fixed order 년→월→일→시 so the same logical pair always yields the same token string.
func TestItemsToTokens_RelationWhere(t *testing.T) {
	items := []itemncardtypes.Item{
		{K: "관계", N: "충", Where: []string{"일지-년지"}, W: 90},
	}
	tokens := ItemsToTokens(items)
	var hasNormalized bool
	for _, tok := range tokens {
		if tok == "관계:충@년지-일지#H" {
			hasNormalized = true
			break
		}
		if tok == "관계:충@일지-년지#H" {
			t.Errorf("ItemsToTokens must normalize where to 년지-일지 per TokenRule; got %q", tok)
			return
		}
	}
	if !hasNormalized {
		t.Errorf("ItemsToTokens expected relation token 관계:충@년지-일지#H; got %v", tokens)
	}
}

// TestNormalizeWhere_ConsistentOrder verifies that both "일지-년지" and "년지-일지" yield the same normalized string.
func TestNormalizeWhere_ConsistentOrder(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"일지-년지", "년지-일지"},
		{"년지-일지", "년지-일지"},
		{"월지-년지", "년지-월지"},
		{"시지-일간", "일간-시지"},
		{"년간", "년간"},
	}
	for _, tt := range tests {
		got := NormalizeWhere(tt.input)
		if got != tt.want {
			t.Errorf("NormalizeWhere(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestEvaluateSajuTrigger_Empty(t *testing.T) {
	tokenSet := map[string]bool{}
	pass, ev := EvaluateSajuTrigger(tokenSet, "")
	if !pass {
		t.Error("empty trigger expected pass")
	}
	if len(ev) != 0 {
		t.Errorf("expected no evidence; got %v", ev)
	}
}

func TestEvaluateSajuTrigger_All(t *testing.T) {
	tokenSet := map[string]bool{"십성:정재": true, "십성:정재#H": true}
	trigger := `{"all":[{"token":"십성:정재"},{"token":"십성:정재#H"}]}`
	pass, ev := EvaluateSajuTrigger(tokenSet, trigger)
	if !pass {
		t.Error("expected pass when all tokens match")
	}
	if len(ev) < 2 {
		t.Errorf("expected evidence for both; got %v", ev)
	}
}

func TestEvaluateSajuTrigger_NotFails(t *testing.T) {
	tokenSet := map[string]bool{"십성:정재": true, "확신:십성#L": true}
	trigger := `{"all":[{"token":"십성:정재"}],"not":[{"token":"확신:십성#L"}]}`
	pass, _ := EvaluateSajuTrigger(tokenSet, trigger)
	if pass {
		t.Error("expected fail when not-token is present")
	}
}

func TestComputeScore(t *testing.T) {
	tokenSet := map[string]bool{"십성:정재": true, "십성:정재@월간#H": true}
	scoreJSON := `{"base":50,"bonus_if":[{"token":"십성:정재@월간#H","add":20}],"penalty_if":[{"token":"관계:충#H","sub":10}]}`
	got := ComputeScore(tokenSet, scoreJSON)
	if got != 70 {
		t.Errorf("ComputeScore = %d, want 70 (50+20)", got)
	}
	got2 := ComputeScore(nil, scoreJSON)
	if got2 != 0 {
		t.Errorf("ComputeScore(nil set) = %d, want 0", got2)
	}
}

func TestItemsFromPillars_GyeokYongStrong(t *testing.T) {
	pillars := itemncardtypes.PillarsText{Year: "경오", Month: "기축", Day: "갑자", Hour: "병인"}
	palja := "경오기축갑자병인"
	items := ItemsFromPillars(pillars, palja)
	var hasGyeok, hasYong, hasStrong bool
	for _, it := range items {
		if it.K == "격국" {
			hasGyeok = true
		}
		if it.K == "용신" {
			hasYong = true
		}
		if it.K == "강약" {
			hasStrong = true
		}
	}
	if !hasGyeok {
		t.Error("ItemsFromPillars expected 격국 item")
	}
	if !hasYong {
		t.Error("ItemsFromPillars expected 용신 item")
	}
	if !hasStrong {
		t.Error("ItemsFromPillars expected 강약 item")
	}
}

func TestSelectSajuCardsFromCards_Structure(t *testing.T) {
	// Mock cards: one passes (token match), one fails (not match)
	tokenSet := map[string]bool{"십성:정재": true, "십성:정재#H": true}
	cards := []entity.ItemNCard{
		{
			CardID: "card_a", Title: "Card A", Priority: 60,
			TriggerJSON: `{"all":[{"token":"십성:정재"},{"token":"십성:정재#H"}]}`,
			ScoreJSON:   `{"base":50,"bonus_if":[{"token":"십성:정재#H","add":10}]}`,
		},
		{
			CardID: "card_b", Title: "Card B", Priority: 50,
			TriggerJSON: `{"all":[{"token":"확신:전체#L"}]}`,
			ScoreJSON:   `{"base":40}`,
		},
	}
	selected, evidences, scores := SelectSajuCardsFromCards(cards, tokenSet, 0, 0)
	if len(selected) != 1 {
		t.Fatalf("expected 1 selected card; got %d", len(selected))
	}
	if selected[0].CardID != "card_a" {
		t.Errorf("selected card_id = %s, want card_a", selected[0].CardID)
	}
	if len(evidences) != 1 || len(evidences[0]) < 2 {
		t.Errorf("expected evidence for both tokens; got %v", evidences)
	}
	if len(scores) != 1 || scores[0] != 60 {
		t.Errorf("score = %v, want [60] (50+10)", scores)
	}
}

func TestSelectSajuCardsFromCards_CooldownGroup(t *testing.T) {
	tokenSet := map[string]bool{"확신:전체": true}
	cards := []entity.ItemNCard{
		{CardID: "c1", Title: "C1", Priority: 70, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`, CooldownGroup: "g1"},
		{CardID: "c2", Title: "C2", Priority: 60, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`, CooldownGroup: "g1"},
	}
	selected, _, _ := SelectSajuCardsFromCards(cards, tokenSet, 0, 0)
	if len(selected) != 1 {
		t.Errorf("cooldown_group: expected 1 card; got %d", len(selected))
	}
	if selected[0].CardID != "c1" {
		t.Errorf("expected c1 (higher priority); got %s", selected[0].CardID)
	}
}

func TestSelectSajuCardsFromCards_DomainCap(t *testing.T) {
	tokenSet := map[string]bool{"확신:전체": true}
	// Three cards in same domain "work"; max 2 per domain.
	cards := []entity.ItemNCard{
		{CardID: "d1", Title: "D1", Priority: 70, Domains: []string{"work"}, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`},
		{CardID: "d2", Title: "D2", Priority: 60, Domains: []string{"work"}, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`},
		{CardID: "d3", Title: "D3", Priority: 50, Domains: []string{"work"}, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`},
	}
	selected, _, _ := SelectSajuCardsFromCards(cards, tokenSet, 2, 0)
	if len(selected) != 2 {
		t.Errorf("domain cap 2: expected 2 selected; got %d", len(selected))
	}
}

// TestSelectSajuCardsFromCards_EmptyTokenSet_ZeroCards: empty tokens → no card matches; returns 0 selected.
func TestSelectSajuCardsFromCards_EmptyTokenSet_ZeroCards(t *testing.T) {
	tokenSet := map[string]bool{}
	cards := []entity.ItemNCard{
		{CardID: "c1", Title: "C1", Priority: 60, TriggerJSON: `{"all":[{"token":"십성:정재"}]}`},
		{CardID: "c2", Title: "C2", Priority: 50, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`},
	}
	selected, evidences, scores := SelectSajuCardsFromCards(cards, tokenSet, 0, 0)
	if len(selected) != 0 {
		t.Errorf("empty tokenSet: expected 0 selected; got %d", len(selected))
	}
	if len(evidences) != 0 || len(scores) != 0 {
		t.Errorf("empty tokenSet: expected no evidences/scores; got %v / %v", evidences, scores)
	}
}

// TestItemsFromPillars_YearMonthStyle verifies that pillars (e.g. 연도별/월별 歲運·月運 style) produce items and tokens.
// Uses synthetic pillars/palja so the test does not depend on sxtwl; validates pillar→items→tokens path.
func TestItemsFromPillars_YearMonthStyle(t *testing.T) {
	pillars := itemncardtypes.PillarsText{
		Year:  "갑진",
		Month: "병인",
		Day:   "경오",
		Hour:  "신미",
	}
	palja := "갑진병인경오신미"
	items := ItemsFromPillars(pillars, palja)
	if len(items) == 0 {
		t.Fatal("ItemsFromPillars expected non-empty items for year/month style pillars")
	}
	tokens := ItemsToTokens(items)
	if len(tokens) == 0 {
		t.Fatal("ItemsToTokens expected non-empty tokens")
	}
	var hasSipsung, hasOhaeng bool
	for _, tok := range tokens {
		if strings.HasPrefix(tok, "십성") {
			hasSipsung = true
		}
		if strings.HasPrefix(tok, "오행") {
			hasOhaeng = true
		}
	}
	if !hasSipsung {
		t.Error("ItemsFromPillars (year/month style) expected at least one 십성 token")
	}
	if !hasOhaeng {
		t.Error("ItemsFromPillars (year/month style) expected at least one 오행 token")
	}
}

// TestSelectSajuCardsFromCards_SamePriorityAndScore_StableOrder verifies that when two or more cards have the same
// priority and same score, selection order is deterministic across multiple calls (tie-break by CardID).
func TestSelectSajuCardsFromCards_SamePriorityAndScore_StableOrder(t *testing.T) {
	tokenSet := map[string]bool{"확신:전체": true, "확신:전체#H": true}
	cards := []entity.ItemNCard{
		{CardID: "card_z", Title: "Z", Priority: 50, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`, ScoreJSON: `{"base":50}`},
		{CardID: "card_a", Title: "A", Priority: 50, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`, ScoreJSON: `{"base":50}`},
		{CardID: "card_m", Title: "M", Priority: 50, TriggerJSON: `{"any":[{"token":"확신:전체"}]}`, ScoreJSON: `{"base":50}`},
	}
	var firstOrder []string
	for round := 0; round < 5; round++ {
		selected, _, _ := SelectSajuCardsFromCards(cards, tokenSet, 0, 0)
		if len(selected) != 3 {
			t.Fatalf("round %d: expected 3 selected; got %d", round, len(selected))
		}
		order := make([]string, len(selected))
		for i := range selected {
			order[i] = selected[i].CardID
		}
		if firstOrder == nil {
			firstOrder = order
		} else {
			for i := range firstOrder {
				if order[i] != firstOrder[i] {
					t.Errorf("round %d: order %v != first order %v (tie-break must be stable)", round, order, firstOrder)
				}
			}
		}
	}
	// Tie-break is CardID ascending: card_a, card_m, card_z
	if len(firstOrder) == 3 && (firstOrder[0] != "card_a" || firstOrder[1] != "card_m" || firstOrder[2] != "card_z") {
		t.Errorf("expected stable order [card_a, card_m, card_z]; got %v", firstOrder)
	}
}
