// Package itemncard: pair (궁합) pipeline (A/B items → P_items → P_tokens, pair card trigger).
package itemncard

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"

	"sajudating_api/api/config"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	itemncardtypes "sajudating_api/api/types/itemncard"
)

// PairTriggerCondition has optional src (P|A|B) and token.
type PairTriggerCondition struct {
	Src   string `json:"src,omitempty"` // P, A, B
	Token string `json:"token"`
}

// PairTriggerRule holds all/any/not with src.
type PairTriggerRule struct {
	All []PairTriggerCondition `json:"all,omitempty"`
	Any []PairTriggerCondition `json:"any,omitempty"`
	Not []PairTriggerCondition `json:"not,omitempty"`
}

// pairWhere returns "A.<pos>-B.<pos>" (A first per ChemiStructure).
func pairWhere(pos string) string {
	return "A." + pos + "-B." + pos
}

// PItemsFromPillars builds pair items from A/B pillars: 충/합/형/해/천간합/삼합 with where A.<pos>-B.<pos>.
func PItemsFromPillars(pillarsA, pillarsB itemncardtypes.PillarsText) []itemncardtypes.Item {
	var items []itemncardtypes.Item
	stemPosNames := []string{"년간", "월간", "일간", "시간"}
	branchPosNames := []string{"년지", "월지", "일지", "시지"}
	pillarStrsA := []string{pillarsA.Year, pillarsA.Month, pillarsA.Day, pillarsA.Hour}
	pillarStrsB := []string{pillarsB.Year, pillarsB.Month, pillarsB.Day, pillarsB.Hour}

	for posIdx := 0; posIdx < 4; posIdx++ {
		if posIdx >= len(pillarStrsA) || posIdx >= len(pillarStrsB) {
			break
		}
		tgA, dzA, okA := pillarToIndices(pillarStrsA[posIdx])
		tgB, dzB, okB := pillarToIndices(pillarStrsB[posIdx])
		if !okA || !okB {
			continue
		}
		stemPos := stemPosNames[posIdx]
		branchPos := branchPosNames[posIdx]

		// 천간합 (stem-stem at same position)
		if tgPairHe(tgA, tgB) {
			items = append(items, itemncardtypes.Item{K: "궁합", N: "천간합", Where: []string{pairWhere(stemPos)}, W: 75, Sys: "pair_v1"})
		}
		// 충/합/형/해/삼합 (branch-branch at same position)
		if dzChong(dzA, dzB) {
			items = append(items, itemncardtypes.Item{K: "궁합", N: "충", Where: []string{pairWhere(branchPos)}, W: 90, Sys: "pair_v1"})
		}
		if dzHe(dzA, dzB) {
			items = append(items, itemncardtypes.Item{K: "궁합", N: "합", Where: []string{pairWhere(branchPos)}, W: 75, Sys: "pair_v1"})
		}
		if dzHyung(dzA, dzB) {
			items = append(items, itemncardtypes.Item{K: "궁합", N: "형", Where: []string{pairWhere(branchPos)}, W: 70, Sys: "pair_v1"})
		}
		if dzHae(dzA, dzB) {
			items = append(items, itemncardtypes.Item{K: "궁합", N: "해", Where: []string{pairWhere(branchPos)}, W: 70, Sys: "pair_v1"})
		}
		if dzSamhap(dzA, dzB) {
			items = append(items, itemncardtypes.Item{K: "궁합", N: "삼합", Where: []string{pairWhere(branchPos)}, W: 80, Sys: "pair_v1"})
		}
	}
	// 확신 fallback so pair trigger can still match
	if len(items) == 0 {
		items = append(items, itemncardtypes.Item{K: "궁합", N: "확신", W: 80, Sys: "pair_v1"})
	}
	return items
}

// EvaluatePairTrigger evaluates trigger against A_tokens, B_tokens, P_tokens (src P|A|B).
func EvaluatePairTrigger(aSet, bSet, pSet map[string]bool, triggerJSON string) (pass bool, evidence []string) {
	if triggerJSON == "" {
		return true, nil
	}
	var tr PairTriggerRule
	if err := json.Unmarshal([]byte(triggerJSON), &tr); err != nil {
		return false, nil
	}
	getSet := func(src string) map[string]bool {
		switch src {
		case "A":
			return aSet
		case "B":
			return bSet
		default:
			return pSet
		}
	}
	for _, c := range tr.Not {
		s := getSet(c.Src)
		if s == nil {
			s = pSet
		}
		if s[c.Token] {
			return false, nil
		}
	}
	for _, c := range tr.All {
		s := getSet(c.Src)
		if s == nil {
			s = pSet
		}
		if !s[c.Token] {
			return false, nil
		}
		evidence = append(evidence, c.Token)
	}
	if len(tr.Any) > 0 {
		matched := false
		for _, c := range tr.Any {
			s := getSet(c.Src)
			if s == nil {
				s = pSet
			}
			if s[c.Token] {
				matched = true
				evidence = append(evidence, c.Token)
			}
		}
		if !matched {
			return false, nil
		}
	}
	return true, evidence
}

// pairTokenSet merges A, B, P token sets for score computation (bonus_if/penalty_if may reference any).
func pairTokenSet(aSet, bSet, pSet map[string]bool) map[string]bool {
	merged := make(map[string]bool)
	for t := range aSet {
		merged[t] = true
	}
	for t := range bSet {
		merged[t] = true
	}
	for t := range pSet {
		merged[t] = true
	}
	return merged
}

// SelectPairCardsFromCards runs trigger/score/cooldown/domain-cap on a given pair card list (no DB). maxPerDomain/maxPerTag: 0 = no limit.
func SelectPairCardsFromCards(cards []entity.ItemNCard, aSet, bSet, pSet map[string]bool, maxPerDomain, maxPerTag int) ([]entity.ItemNCard, [][]string, []int) {
	mergedSet := pairTokenSet(aSet, bSet, pSet)
	var candidates []selectedCardWithMeta
	for i := range cards {
		pass, ev := EvaluatePairTrigger(aSet, bSet, pSet, cards[i].TriggerJSON)
		if pass {
			score := ComputeScore(mergedSet, cards[i].ScoreJSON)
			if score == 0 && cards[i].ScoreJSON == "" {
				score = cards[i].Priority
			}
			candidates = append(candidates, selectedCardWithMeta{card: cards[i], evidence: ev, score: score})
		}
	}
	sort.Slice(candidates, func(i, j int) bool {
		if candidates[i].card.Priority != candidates[j].card.Priority {
			return candidates[i].card.Priority > candidates[j].card.Priority
		}
		return candidates[i].score > candidates[j].score
	})
	seenGroup := make(map[string]bool)
	perCardCount := make(map[string]int)
	perDomainCount := make(map[string]int)
	perTagCount := make(map[string]int)
	var selected []entity.ItemNCard
	var evidences [][]string
	var scores []int
	for _, c := range candidates {
		if c.card.CooldownGroup != "" && seenGroup[c.card.CooldownGroup] {
			continue
		}
		if c.card.MaxPerUser > 0 && perCardCount[c.card.CardID] >= c.card.MaxPerUser {
			continue
		}
		if maxPerDomain > 0 {
			overDomain := false
			for _, d := range c.card.Domains {
				if perDomainCount[d] >= maxPerDomain {
					overDomain = true
					break
				}
			}
			if overDomain {
				continue
			}
		}
		if maxPerTag > 0 {
			overTag := false
			for _, tag := range c.card.Tags {
				if perTagCount[tag] >= maxPerTag {
					overTag = true
					break
				}
			}
			if overTag {
				continue
			}
		}
		selected = append(selected, c.card)
		evidences = append(evidences, c.evidence)
		scores = append(scores, c.score)
		if c.card.CooldownGroup != "" {
			seenGroup[c.card.CooldownGroup] = true
		}
		perCardCount[c.card.CardID]++
		for _, d := range c.card.Domains {
			perDomainCount[d]++
		}
		for _, tag := range c.card.Tags {
			perTagCount[tag]++
		}
	}
	return selected, evidences, scores
}

// SelectPairCards returns published pair cards that pass trigger, sorted by priority then score (desc), with cooldown_group and max_per_user applied.
// When ENV=dev, cards are loaded from the seed directory (GetSeedDir) instead of MongoDB; on seed load error, falls back to DB.
func SelectPairCards(aSet, bSet, pSet map[string]bool) ([]entity.ItemNCard, [][]string, []int, error) {
	if dao.GetDB() == nil {
		return nil, nil, nil, fmt.Errorf("MongoDB not configured (e.g. in tests); pair card selection requires DB or seed")
	}
	var cards []entity.ItemNCard
	var err error
	if config.IsDev() {
		seedDir := GetSeedDir()
		cards, err = LoadSeedCardsByScope(seedDir, "pair")
		if err != nil {
			log.Printf("[itemncard] seed load pair failed (dir=%s): %v; falling back to DB", seedDir, err)
			cards, err = dao.NewItemNCardRepository().ListPublishedByScope("pair")
			if err != nil {
				return nil, nil, nil, err
			}
		}
	} else {
		cards, err = dao.NewItemNCardRepository().ListPublishedByScope("pair")
		if err != nil {
			return nil, nil, nil, err
		}
	}
	selected, evidences, scores := SelectPairCardsFromCards(cards, aSet, bSet, pSet, DefaultMaxPerDomain, 0)
	return selected, evidences, scores, nil
}
