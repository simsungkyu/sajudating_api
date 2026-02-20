// Package itemncard: tests for pair (궁합) pipeline (P_items, pair trigger).
package itemncard

import (
	"testing"

	"sajudating_api/api/dao/entity"
	itemncardtypes "sajudating_api/api/types/itemncard"
)

func TestPItemsFromPillars(t *testing.T) {
	pillarsA := itemncardtypes.PillarsText{Year: "경오", Month: "기축", Day: "갑자", Hour: "병인"}
	pillarsB := itemncardtypes.PillarsText{Year: "경오", Month: "기축", Day: "갑자", Hour: "병인"}
	items := PItemsFromPillars(pillarsA, pillarsB)
	if len(items) == 0 {
		t.Fatal("PItemsFromPillars expected non-empty when A==B (same pillars → 충/합/형/해 at same pos)")
	}
	var hasPair bool
	for _, it := range items {
		if it.K == "궁합" {
			hasPair = true
			break
		}
	}
	if !hasPair {
		t.Error("PItemsFromPillars expected at least one 궁합 item")
	}
	tokens := ItemsToTokens(items)
	if len(tokens) == 0 {
		t.Error("ItemsToTokens(P items) expected non-empty")
	}
}

func TestEvaluatePairTrigger_Empty(t *testing.T) {
	aSet := map[string]bool{}
	bSet := map[string]bool{}
	pSet := map[string]bool{}
	pass, _ := EvaluatePairTrigger(aSet, bSet, pSet, "")
	if !pass {
		t.Error("empty trigger expected pass")
	}
}

func TestEvaluatePairTrigger_AnyP(t *testing.T) {
	pSet := map[string]bool{"궁합:충@A.일지-B.일지": true}
	trigger := `{"any":[{"token":"궁합:충@A.일지-B.일지"}]}`
	pass, ev := EvaluatePairTrigger(nil, nil, pSet, trigger)
	if !pass {
		t.Error("expected pass when P token matches any")
	}
	if len(ev) == 0 {
		t.Error("expected evidence")
	}
}

// TestEvaluatePairTrigger_NotFails: pair card with not-token present in P set → fail (excluded from selection).
func TestEvaluatePairTrigger_NotFails(t *testing.T) {
	pSet := map[string]bool{"궁합:천간합": true, "궁합:확신#L": true}
	trigger := `{"all":[],"any":[{"src":"P","token":"궁합:천간합"}],"not":[{"src":"P","token":"궁합:확신#L"}]}`
	pass, _ := EvaluatePairTrigger(nil, nil, pSet, trigger)
	if pass {
		t.Error("expected fail when not-token is present in P set")
	}
}

func TestSelectPairCardsFromCards_Structure(t *testing.T) {
	pSet := map[string]bool{"궁합:충@A.일지-B.일지": true}
	cards := []entity.ItemNCard{
		{CardID: "pair_1", Title: "Pair Card", Priority: 70,
			TriggerJSON: `{"any":[{"token":"궁합:충@A.일지-B.일지"}]}`,
			ScoreJSON:   `{"base":60}`,
		},
	}
	selected, evidences, scores := SelectPairCardsFromCards(cards, nil, nil, pSet, 0, 0)
	if len(selected) != 1 {
		t.Fatalf("expected 1 selected; got %d", len(selected))
	}
	if selected[0].CardID != "pair_1" {
		t.Errorf("card_id = %s, want pair_1", selected[0].CardID)
	}
	if len(evidences) != 1 || len(evidences[0]) == 0 {
		t.Errorf("expected evidence; got %v", evidences)
	}
	if len(scores) != 1 || scores[0] != 60 {
		t.Errorf("scores = %v, want [60]", scores)
	}
}
