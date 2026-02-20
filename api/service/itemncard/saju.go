// Package itemncard: saju pipeline (pillars → items → tokens → card trigger evaluation).
package itemncard

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"

	"sajudating_api/api/config"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	extdao "sajudating_api/api/ext_dao"
	itemncardtypes "sajudating_api/api/types/itemncard"
	"sajudating_api/api/utils"
)

// PillarsFromBirth calls sxtwl and returns pillars (y,m,d,h) as Korean strings and palja.
func PillarsFromBirth(year, month, day int, hour, min *int, timezone string) (pillars itemncardtypes.PillarsText, palja string, err error) {
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	res, err := extdao.CallSxtwlOptional(year, month, day, hour, min, timezone, nil)
	if err != nil {
		return itemncardtypes.PillarsText{}, "", err
	}
	pillars.Year = utils.TG_ARRAY[res.Pillars.Year.Tg] + utils.DZ_ARRAY[res.Pillars.Year.Dz]
	pillars.Month = utils.TG_ARRAY[res.Pillars.Month.Tg] + utils.DZ_ARRAY[res.Pillars.Month.Dz]
	pillars.Day = utils.TG_ARRAY[res.Pillars.Day.Tg] + utils.DZ_ARRAY[res.Pillars.Day.Dz]
	if res.Pillars.Hour != nil {
		pillars.Hour = utils.TG_ARRAY[res.Pillars.Hour.Tg] + utils.DZ_ARRAY[res.Pillars.Hour.Dz]
	}
	palja = res.GetPalja()
	return pillars, palja, nil
}

// pillarToIndices returns (TG index, DZ index) for a two-rune pillar string (e.g. "경오"). ok false if not found.
func pillarToIndices(pillar string) (tgIdx, dzIdx int, ok bool) {
	runes := []rune(pillar)
	if len(runes) < 2 {
		return 0, 0, false
	}
	tgStr := string(runes[0])
	dzStr := string(runes[1])
	for i, tg := range utils.TG_ARRAY {
		if tg == tgStr {
			tgIdx = i
			break
		}
	}
	for i, dz := range utils.DZ_ARRAY {
		if dz == dzStr {
			dzIdx = i
			return tgIdx, dzIdx, true
		}
	}
	return 0, 0, false
}

// relationPair normalizes pillar pair (i,j) to "posI-posJ" with 년→월→일→시 order (smaller index first).
func relationPair(posNames []string, i, j int) string {
	if i <= j {
		return posNames[i] + "-" + posNames[j]
	}
	return posNames[j] + "-" + posNames[i]
}

// ItemsFromPillars builds items from pillars + palja (십성, 오행, 관계, 확신).
func ItemsFromPillars(pillars itemncardtypes.PillarsText, palja string) []itemncardtypes.Item {
	var items []itemncardtypes.Item
	posNames := []string{"년간", "년지", "월간", "월지", "일간", "일지", "시간", "시지"}
	stemPosNames := []string{"년간", "월간", "일간", "시간"}
	branchPosNames := []string{"년지", "월지", "일지", "시지"}

	tenStemsStr := utils.CalculateTenStems(palja)
	parts := strings.Fields(tenStemsStr)
	for i, part := range parts {
		if part == "본원" || i >= len(posNames) {
			continue
		}
		items = append(items, itemncardtypes.Item{
			K:     "십성",
			N:     part,
			Where: []string{posNames[i]},
			W:     70,
		})
	}
	// 오행 from day stem
	runes := []rune(palja)
	feIdx := 0
	if len(runes) >= 5 {
		dayStem := string(runes[4])
		for i, tg := range utils.TG_ARRAY {
			if tg == dayStem {
				feIdx = utils.TG_FE_INDEXES[i]
				break
			}
		}
		items = append(items, itemncardtypes.Item{
			K: "오행",
			N: utils.FIVE_ELEMENTS[feIdx],
			W: 70,
		})
	}

	// 관계: from pillars compute 천간합( stems ), 충/합/형/파/해/삼합( branches )
	pillarStrs := []string{pillars.Year, pillars.Month, pillars.Day, pillars.Hour}
	var stemIdxs, branchIdxs []int
	var stemPosUsed, branchPosUsed []string
	for i, p := range pillarStrs {
		if p == "" {
			continue
		}
		tg, dz, ok := pillarToIndices(p)
		if !ok {
			continue
		}
		if i < len(stemPosNames) {
			stemPosUsed = append(stemPosUsed, stemPosNames[i])
			stemIdxs = append(stemIdxs, tg)
		}
		if i < len(branchPosNames) {
			branchPosUsed = append(branchPosUsed, branchPosNames[i])
			branchIdxs = append(branchIdxs, dz)
		}
	}
	// 천간합 (TG 五合): pair of stems
	for i := 0; i < len(stemIdxs); i++ {
		for j := i + 1; j < len(stemIdxs); j++ {
			if tgPairHe(stemIdxs[i], stemIdxs[j]) {
				where := relationPair(stemPosUsed, i, j)
				items = append(items, itemncardtypes.Item{K: "관계", N: "천간합", Where: []string{where}, W: 75})
			}
		}
	}
	// 지지 관계: 충/합/형/파/해/삼합
	for i := 0; i < len(branchIdxs); i++ {
		for j := i + 1; j < len(branchIdxs); j++ {
			a, b := branchIdxs[i], branchIdxs[j]
			where := relationPair(branchPosUsed, i, j)
			if dzChong(a, b) {
				items = append(items, itemncardtypes.Item{K: "관계", N: "충", Where: []string{where}, W: 90})
			}
			if dzHe(a, b) {
				items = append(items, itemncardtypes.Item{K: "관계", N: "합", Where: []string{where}, W: 75})
			}
			if dzHyung(a, b) {
				items = append(items, itemncardtypes.Item{K: "관계", N: "형", Where: []string{where}, W: 70})
			}
			if dzHae(a, b) {
				items = append(items, itemncardtypes.Item{K: "관계", N: "해", Where: []string{where}, W: 70})
			}
			if dzSamhap(a, b) {
				items = append(items, itemncardtypes.Item{K: "관계", N: "삼합", Where: []string{where}, W: 80})
			}
		}
	}

	// 신살: 도화(子午卯酉), 역마(寅申巳亥) etc. per rule_set
	for i, dzIdx := range branchIdxs {
		if i >= len(branchPosUsed) {
			break
		}
		pos := branchPosUsed[i]
		if sinsalDoHwa(dzIdx) {
			items = append(items, itemncardtypes.Item{K: "신살", N: "도화", Where: []string{pos}, W: 70, Sys: "common_v1"})
		}
		if sinsalYeokMa(dzIdx) {
			items = append(items, itemncardtypes.Item{K: "신살", N: "역마", Where: []string{pos}, W: 70, Sys: "common_v1"})
		}
		if sinsalCheonEul(dzIdx, stemIdxs) {
			items = append(items, itemncardtypes.Item{K: "신살", N: "천을귀인", Where: []string{pos}, W: 75, Sys: "common_v1"})
		}
	}

	// 지장간: hidden stems per pillar (본기 only for minimal set)
	for i, dzIdx := range branchIdxs {
		if i >= len(branchPosUsed) {
			break
		}
		pos := branchPosUsed[i]
		tgIdx := dzJangGanBongi(dzIdx)
		if tgIdx >= 0 {
			where := pos + ".지장간.본기"
			items = append(items, itemncardtypes.Item{K: "지장간", N: utils.TG_ARRAY[tgIdx], Where: []string{where}, W: 70})
		}
	}

	// 격국: from 월지 十神 (simple rule: 月支本气十神 → 격국). sys for future variants.
	if len(parts) > 3 && parts[3] != "본원" {
		gyeokName := parts[3] + "격"
		items = append(items, itemncardtypes.Item{K: "격국", N: gyeokName, Where: []string{"월지"}, W: 70, Sys: "simple_month_stem_v1"})
	}
	// 용신: minimal placeholder = 日主 오행 (same as day stem element). sys for future variants.
	if len(runes) >= 5 {
		items = append(items, itemncardtypes.Item{K: "용신", N: utils.FIVE_ELEMENTS[feIdx], W: 70, Sys: "simple_day_stem_v1"})
	}
	// 강약: 月令 vs 日主 — same→신강, 月令克日主→신약, else 중화. sys for future variants.
	if len(branchIdxs) > 1 {
		monthDz := branchIdxs[1]
		monthElemIdx := dzToFiveElement(monthDz)
		strong := "중화"
		wVal := 55
		if monthElemIdx == feIdx {
			strong = "신강"
			wVal = 70
		} else if monthKeDay(feIdx, monthElemIdx) {
			strong = "신약"
			wVal = 40
		}
		items = append(items, itemncardtypes.Item{K: "강약", N: strong, W: wVal, Sys: "simple_month_ling_v1"})
	}

	// 확신 placeholder
	items = append(items, itemncardtypes.Item{K: "확신", N: "전체", W: 80})
	return items
}

// dzToFiveElement maps DZ index (0-11) to 五行 index (0-4): 寅卯木, 巳午火, 申酉金, 亥子水, 辰戌丑未土.
func dzToFiveElement(dzIdx int) int {
	switch dzIdx {
	case 2, 3:
		return 0 // 寅卯 木
	case 5, 6:
		return 1 // 巳午 火
	case 8, 9:
		return 2 // 申酉 金
	case 11, 0:
		return 3 // 亥子 水
	case 1, 4, 7, 10:
		return 4 // 丑辰未戌 土
	default:
		return 4
	}
}

// monthKeDay returns true when 月令 克 日主: 木克土(0克4), 土克水(4克3), 水克火(3克1), 火克金(1克2), 金克木(2克0).
func monthKeDay(dayFeIdx, monthFeIdx int) bool {
	return dayFeIdx == (monthFeIdx+4)%5
}

// sinsalDoHwa 桃花: 子午卯酉 (DZ indices 0, 6, 3, 9).
func sinsalDoHwa(dzIdx int) bool {
	return dzIdx == 0 || dzIdx == 6 || dzIdx == 3 || dzIdx == 9
}

// sinsalYeokMa 驿马: 寅申巳亥 (DZ indices 2, 8, 5, 11) — often evaluated at 日支.
func sinsalYeokMa(dzIdx int) bool {
	return dzIdx == 2 || dzIdx == 8 || dzIdx == 5 || dzIdx == 11
}

// sinsalCheonEul 天乙贵人: simplified — day stem 甲戊见丑未, etc. We use day stem (index 2 in stemIdxs) and current branch.
func sinsalCheonEul(dzIdx int, stemIdxs []int) bool {
	if len(stemIdxs) < 3 {
		return false
	}
	dayStem := stemIdxs[2] // 일간
	// 甲戊见丑未, 乙己见子申, 丙丁见亥酉, 庚辛见寅午, 壬癸见卯巳 (TG indices 0-9)
	pairs := map[int][]int{
		0: {1, 7}, 4: {1, 7},   // 甲戊 -> 丑未
		1: {0, 8}, 5: {0, 8},   // 乙己 -> 子申
		2: {11, 9}, 3: {11, 9}, // 丙丁 -> 亥酉
		6: {2, 6}, 7: {2, 6},   // 庚辛 -> 寅午 (辛=7)
		8: {3, 5}, 9: {3, 5},   // 壬癸 -> 卯巳
	}
	for _, b := range pairs[dayStem] {
		if dzIdx == b {
			return true
		}
	}
	return false
}

// dzJangGanBongi returns TG index of 本气 for the given DZ index (0-11), or -1.
func dzJangGanBongi(dzIdx int) int {
	// 子癸, 丑己, 寅甲, 卯乙, 辰戊, 巳丙, 午丁, 未己, 申庚, 酉辛, 戌戊, 亥壬
	table := []int{9, 5, 0, 1, 4, 2, 3, 5, 6, 8, 4, 8}
	if dzIdx < 0 || dzIdx >= len(table) {
		return -1
	}
	return table[dzIdx]
}

// tgPairHe returns true if the two stem indices form 天干五合 (甲己, 乙庚, 丙辛, 丁壬, 戊癸).
func tgPairHe(i, j int) bool {
	if i > j {
		i, j = j, i
	}
	pairs := [][2]int{{0, 5}, {1, 6}, {2, 7}, {3, 8}, {4, 9}}
	for _, p := range pairs {
		if i == p[0] && j == p[1] {
			return true
		}
	}
	return false
}

// dzChong 六冲: 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥 (indices 0-11).
func dzChong(i, j int) bool {
	if i > j {
		i, j = j, i
	}
	pairs := [][2]int{{0, 6}, {1, 7}, {2, 8}, {3, 9}, {4, 10}, {5, 11}}
	for _, p := range pairs {
		if i == p[0] && j == p[1] {
			return true
		}
	}
	return false
}

// dzHe 六合: 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未.
func dzHe(i, j int) bool {
	if i > j {
		i, j = j, i
	}
	pairs := [][2]int{{0, 1}, {2, 11}, {3, 10}, {4, 9}, {5, 8}, {6, 7}}
	for _, p := range pairs {
		if i == p[0] && j == p[1] {
			return true
		}
	}
	return false
}

// dzHyung 刑: 寅巳申, 丑戌未, 子卯, and self (辰辰等).
func dzHyung(i, j int) bool {
	if i > j {
		i, j = j, i
	}
	triples := [][3]int{{2, 5, 8}, {1, 7, 10}}
	for _, t := range triples {
		if (i == t[0] && j == t[1]) || (i == t[0] && j == t[2]) || (i == t[1] && j == t[2]) {
			return true
		}
	}
	if (i == 0 && j == 3) || (i == 3 && j == 0) {
		return true
	}
	return i == j && (i == 4 || i == 6 || i == 9 || i == 11)
}

// dzHae 害: 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌.
func dzHae(i, j int) bool {
	if i > j {
		i, j = j, i
	}
	pairs := [][2]int{{0, 7}, {1, 6}, {2, 5}, {3, 4}, {8, 11}, {9, 10}}
	for _, p := range pairs {
		if i == p[0] && j == p[1] {
			return true
		}
	}
	return false
}

// dzSamhap 三合: 申子辰, 寅午戌, 亥卯未, 巳酉丑 (pairs within each triple).
func dzSamhap(i, j int) bool {
	if i > j {
		i, j = j, i
	}
	triples := [][3]int{{8, 0, 4}, {2, 6, 10}, {11, 3, 7}, {5, 9, 1}}
	for _, t := range triples {
		count := 0
		if i == t[0] || i == t[1] || i == t[2] {
			count++
		}
		if j == t[0] || j == t[1] || j == t[2] {
			count++
		}
		if count == 2 {
			return true
		}
	}
	return false
}

// NormalizeWhere sorts a relation "A-B" by position order (년→월→일→시).
func NormalizeWhere(where string) string {
	parts := strings.Split(where, "-")
	if len(parts) != 2 {
		return where
	}
	order := map[string]int{"년간": 0, "년지": 1, "월간": 2, "월지": 3, "일간": 4, "일지": 5, "시간": 6, "시지": 7}
	a, b := order[parts[0]], order[parts[1]]
	if a <= b {
		return where
	}
	return parts[1] + "-" + parts[0]
}

// ItemsToTokens compiles items to tokens (k:n, k:n@where, k:n#grade, k:n@where#grade, ~sys).
func ItemsToTokens(items []itemncardtypes.Item) []string {
	seen := make(map[string]bool)
	var tokens []string
	for _, it := range items {
		grade := itemncardtypes.GradeFromW(it.W)
		// T1: existence
		t := it.K + ":" + it.N
		if !seen[t] {
			seen[t] = true
			tokens = append(tokens, t)
		}
		for _, w := range it.Where {
			norm := w
			if strings.Contains(w, "-") {
				norm = NormalizeWhere(w)
			}
			t2 := t + "@" + norm
			if !seen[t2] {
				seen[t2] = true
				tokens = append(tokens, t2)
			}
			t3 := t + "#" + grade
			if !seen[t3] {
				seen[t3] = true
				tokens = append(tokens, t3)
			}
			t4 := t + "@" + norm + "#" + grade
			if !seen[t4] {
				seen[t4] = true
				tokens = append(tokens, t4)
			}
		}
		if len(it.Where) == 0 && it.W > 0 {
			t3 := t + "#" + grade
			if !seen[t3] {
				seen[t3] = true
				tokens = append(tokens, t3)
			}
		}
		if it.Sys != "" {
			ts := t + "~" + it.Sys
			if !seen[ts] {
				seen[ts] = true
				tokens = append(tokens, ts)
			}
		}
	}
	sort.Strings(tokens)
	return tokens
}

// TriggerCondition is one token condition (all/any/not).
type TriggerCondition struct {
	Token string `json:"token"`
}

// TriggerRule holds all/any/not token lists.
type TriggerRule struct {
	All []TriggerCondition `json:"all,omitempty"`
	Any []TriggerCondition `json:"any,omitempty"`
	Not []TriggerCondition `json:"not,omitempty"`
}

// ScoreRule holds base + bonus_if/penalty_if per CardDataStructure (score section).
type ScoreRule struct {
	Base      int `json:"base"`
	BonusIf   []struct {
		Token string `json:"token"`
		Add   int    `json:"add"`
	} `json:"bonus_if,omitempty"`
	PenaltyIf []struct {
		Token string `json:"token"`
		Sub   int    `json:"sub"`
	} `json:"penalty_if,omitempty"`
}

// ComputeScore returns base + sum(bonus for matched tokens) − sum(penalty for matched tokens).
func ComputeScore(tokenSet map[string]bool, scoreJSON string) int {
	if scoreJSON == "" || tokenSet == nil {
		return 0
	}
	var sr ScoreRule
	if err := json.Unmarshal([]byte(scoreJSON), &sr); err != nil {
		return 0
	}
	score := sr.Base
	for _, b := range sr.BonusIf {
		if tokenSet[b.Token] {
			score += b.Add
		}
	}
	for _, p := range sr.PenaltyIf {
		if tokenSet[p.Token] {
			score -= p.Sub
		}
	}
	return score
}

// EvaluateSajuTrigger returns true if tokenSet satisfies the card trigger (not → skip; all; any).
func EvaluateSajuTrigger(tokenSet map[string]bool, triggerJSON string) (pass bool, evidence []string) {
	if triggerJSON == "" {
		return true, nil
	}
	var tr TriggerRule
	if err := json.Unmarshal([]byte(triggerJSON), &tr); err != nil {
		return false, nil
	}
	for _, c := range tr.Not {
		if tokenSet[c.Token] {
			return false, nil
		}
	}
	for _, c := range tr.All {
		if !tokenSet[c.Token] {
			return false, nil
		}
		evidence = append(evidence, c.Token)
	}
	if len(tr.Any) > 0 {
		matched := false
		for _, c := range tr.Any {
			if tokenSet[c.Token] {
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

// selectedCardWithMeta holds card, evidence, and computed score for sorting and limits.
type selectedCardWithMeta struct {
	card     entity.ItemNCard
	evidence []string
	score    int
}

// DefaultMaxPerDomain is the default cap for "domain별 최대 N장" (CardDataStructure Step 4). 0 = no limit.
const DefaultMaxPerDomain = 3

// SelectSajuCardsFromCards runs trigger/score/cooldown/domain-cap on a given card list (no DB). maxPerDomain/maxPerTag: 0 = no limit.
func SelectSajuCardsFromCards(cards []entity.ItemNCard, tokenSet map[string]bool, maxPerDomain, maxPerTag int) ([]entity.ItemNCard, [][]string, []int) {
	var candidates []selectedCardWithMeta
	for i := range cards {
		pass, ev := EvaluateSajuTrigger(tokenSet, cards[i].TriggerJSON)
		if pass {
			score := ComputeScore(tokenSet, cards[i].ScoreJSON)
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
		if candidates[i].score != candidates[j].score {
			return candidates[i].score > candidates[j].score
		}
		return candidates[i].card.CardID < candidates[j].card.CardID
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

// SelectSajuCards returns published saju cards that pass trigger, sorted by priority then score (desc), with cooldown_group and max_per_user applied.
// When ENV=dev, cards are loaded from the seed directory (GetSeedDir) instead of MongoDB; on seed load error, falls back to DB.
func SelectSajuCards(tokenSet map[string]bool) ([]entity.ItemNCard, [][]string, []int, error) {
	if dao.GetDB() == nil {
		return nil, nil, nil, fmt.Errorf("MongoDB not configured (e.g. in tests); saju card selection requires DB or seed")
	}
	var cards []entity.ItemNCard
	var err error
	if config.IsDev() {
		seedDir := GetSeedDir()
		cards, err = LoadSeedCardsByScope(seedDir, "saju")
		if err != nil {
			log.Printf("[itemncard] seed load saju failed (dir=%s): %v; falling back to DB", seedDir, err)
			cards, err = dao.NewItemNCardRepository().ListPublishedByScope("saju")
			if err != nil {
				return nil, nil, nil, err
			}
		}
	} else {
		cards, err = dao.NewItemNCardRepository().ListPublishedByScope("saju")
		if err != nil {
			return nil, nil, nil, err
		}
	}
	selected, evidences, scores := SelectSajuCardsFromCards(cards, tokenSet, DefaultMaxPerDomain, 0)
	return selected, evidences, scores, nil
}

// BirthInput parses YYYY-MM-DD and optional HH:mm.
func BirthInput(dateStr, timeStr string) (y, m, d int, hh, mm *int, err error) {
	parts := strings.Split(dateStr, "-")
	if len(parts) != 3 {
		return 0, 0, 0, nil, nil, nil
	}
	y, _ = strconv.Atoi(parts[0])
	m, _ = strconv.Atoi(parts[1])
	d, _ = strconv.Atoi(parts[2])
	if timeStr != "" && timeStr != "unknown" {
		ts := strings.Split(timeStr, ":")
		if len(ts) >= 2 {
			h, _ := strconv.Atoi(ts[0])
			mmVal, _ := strconv.Atoi(ts[1])
			hh = &h
			mm = &mmVal
		}
	}
	return y, m, d, hh, mm, nil
}
