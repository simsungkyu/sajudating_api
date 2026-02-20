package domain

import (
	"testing"
	"time"
)

// ── 통합 테스트 ──

func TestBuildSajuDocAt_KnownHour(t *testing.T) {
	input := BirthInput{
		DtLocal:  "1990-05-15 10:24",
		Tz:       "Asia/Seoul",
		TimePrec: TimePrecisionMinute,
		Sex:      "M",
		Engine:   Engine{Name: "sxtwl", Ver: "1"},
	}
	raw := RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
		Hour:  &RawPillar{Stem: 9, Branch: 3},
	}

	doc, err := BuildSajuDocAt(input, raw, time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSajuDocAt() error = %v", err)
	}
	if doc.DayMaster != 4 {
		t.Fatalf("day master = %d, want 4", doc.DayMaster)
	}
	if len(doc.Pillars) != 4 {
		t.Fatalf("pillar count = %d, want 4", len(doc.Pillars))
	}
	if doc.HourCtx == nil || doc.HourCtx.Status != HourKnown {
		t.Fatalf("hour context = %+v, want KNOWN", doc.HourCtx)
	}
	if len(doc.Nodes) == 0 || len(doc.Edges) == 0 {
		t.Fatalf("expected nodes/edges, got nodes=%d edges=%d", len(doc.Nodes), len(doc.Edges))
	}
	if len(doc.Facts) < 5 || len(doc.Evals) < 3 {
		t.Fatalf("expected enough facts/evals, got facts=%d evals=%d", len(doc.Facts), len(doc.Evals))
	}
	if doc.ElBalance == nil {
		t.Fatal("expected elBalance")
	}
	if len(doc.EmptyBranches) != 2 {
		t.Fatalf("emptyBranches len = %d, want 2", len(doc.EmptyBranches))
	}
	if doc.Daeun == nil || doc.Seun == nil || doc.Wolun == nil || doc.Ilun == nil {
		t.Fatalf("expected all run fortunes, got daeun=%+v seun=%+v wolun=%+v ilun=%+v", doc.Daeun, doc.Seun, doc.Wolun, doc.Ilun)
	}
	if doc.Daeun.Type != fortuneTypeDaeun || doc.Daeun.Order != 4 || doc.Daeun.Stem != 1 || doc.Daeun.Branch != 9 {
		t.Fatalf("daeun = %+v, want type=%s order=4 stem=1 branch=9", doc.Daeun, fortuneTypeDaeun)
	}
	if doc.Daeun.GanjiKo == "" || doc.Daeun.StemTenGod == nil || doc.Daeun.BranchTenGod == nil || doc.Daeun.BranchTwelve == nil {
		t.Fatalf("daeun metadata is not filled: %+v", doc.Daeun)
	}
	if doc.Seun.Type != fortuneTypeSeun || doc.Seun.Stem != raw.Year.Stem || doc.Seun.Branch != raw.Year.Branch || doc.Seun.Year != 1990 {
		t.Fatalf("seun = %+v, want type=%s stem=%d branch=%d year=1990", doc.Seun, fortuneTypeSeun, raw.Year.Stem, raw.Year.Branch)
	}
	if doc.Wolun.Type != fortuneTypeWolun || doc.Wolun.Stem != raw.Month.Stem || doc.Wolun.Branch != raw.Month.Branch || doc.Wolun.Year != 1990 || doc.Wolun.Month != 5 {
		t.Fatalf("wolun = %+v, want type=%s stem=%d branch=%d year=1990 month=5", doc.Wolun, fortuneTypeWolun, raw.Month.Stem, raw.Month.Branch)
	}
	if doc.Ilun.Type != fortuneTypeIlun || doc.Ilun.Stem != raw.Day.Stem || doc.Ilun.Branch != raw.Day.Branch || doc.Ilun.Year != 1990 || doc.Ilun.Month != 5 || doc.Ilun.Day != 15 {
		t.Fatalf("ilun = %+v, want type=%s stem=%d branch=%d year=1990 month=5 day=15", doc.Ilun, fortuneTypeIlun, raw.Day.Stem, raw.Day.Branch)
	}
	if len(doc.DaeunList) != 8 {
		t.Fatalf("daeunList len = %d, want 8", len(doc.DaeunList))
	}
	if doc.DaeunList[0].Type != fortuneTypeDaeun {
		t.Fatalf("daeunList[0].type = %q, want %q", doc.DaeunList[0].Type, fortuneTypeDaeun)
	}
}

func TestBuildSajuDocAt_MissingHourCandidates(t *testing.T) {
	input := BirthInput{
		DtLocal:  "1990-05-15",
		Tz:       "Asia/Seoul",
		TimePrec: TimePrecisionUnknown,
		Engine:   Engine{Name: "sxtwl", Ver: "1"},
	}
	raw := RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
	}

	doc, err := BuildSajuDocAt(input, raw, time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSajuDocAt() error = %v", err)
	}
	if len(doc.Pillars) != 3 {
		t.Fatalf("pillar count = %d, want 3", len(doc.Pillars))
	}
	if doc.HourCtx == nil {
		t.Fatal("expected hour context")
	}
	if doc.HourCtx.Status != HourMissing {
		t.Fatalf("hour status = %s, want MISSING", doc.HourCtx.Status)
	}
	if len(doc.HourCtx.Candidates) != 12 {
		t.Fatalf("hour candidates = %d, want 12", len(doc.HourCtx.Candidates))
	}
	if len(doc.HourCtx.StableNodes) == 0 || len(doc.HourCtx.StableEdges) == 0 {
		t.Fatalf("expected stable nodes/edges, got nodes=%d edges=%d", len(doc.HourCtx.StableNodes), len(doc.HourCtx.StableEdges))
	}
}

func TestBuildSajuDocAt_EstimatedHourCandidate(t *testing.T) {
	input := BirthInput{
		DtLocal:  "1990-05-15 13",
		Tz:       "Asia/Seoul",
		TimePrec: TimePrecisionHour,
		Engine:   Engine{Name: "sxtwl", Ver: "1"},
	}
	raw := RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
	}

	doc, err := BuildSajuDocAt(input, raw, time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSajuDocAt() error = %v", err)
	}
	if doc.HourCtx == nil {
		t.Fatal("expected hour context")
	}
	if doc.HourCtx.Status != HourEstimated {
		t.Fatalf("hour status = %s, want ESTIMATED", doc.HourCtx.Status)
	}
	if len(doc.HourCtx.Candidates) != 1 {
		t.Fatalf("hour candidates = %d, want 1", len(doc.HourCtx.Candidates))
	}
	cand := doc.HourCtx.Candidates[0]
	if cand.TimeWindow != "13:00-14:59" {
		t.Fatalf("timeWindow = %s, want 13:00-14:59", cand.TimeWindow)
	}
	// 戊(4)日 13시 → 미시(未, branch=7), stem = (4*2+7)%10 = 5(己)
	if cand.Pillar.Branch != 7 {
		t.Fatalf("candidate branch = %d, want 7 (未)", cand.Pillar.Branch)
	}
	if cand.Pillar.Stem != 5 {
		t.Fatalf("candidate stem = %d, want 5 (己)", cand.Pillar.Stem)
	}
}

func TestBuildSajuDocAt_InvalidPillar(t *testing.T) {
	input := BirthInput{
		DtLocal:  "1990-05-15 13:00",
		Tz:       "Asia/Seoul",
		TimePrec: TimePrecisionMinute,
		Engine:   Engine{Name: "sxtwl", Ver: "1"},
	}
	raw := RawPillars{
		Year:  RawPillar{Stem: 10, Branch: 0},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
	}
	if _, err := BuildSajuDocAt(input, raw, time.Now().UTC()); err == nil {
		t.Fatal("expected error for invalid pillar index")
	}
}

// ── 패리티 검증 테스트 ──

func TestValidateRawPillars_ParityMismatch(t *testing.T) {
	tests := []struct {
		name string
		raw  RawPillars
	}{
		{
			name: "year parity mismatch (甲+丑 = yang stem + yin branch)",
			raw: RawPillars{
				Year:  RawPillar{Stem: 0, Branch: 1}, // 甲(yang)+丑(yin) 불가
				Month: RawPillar{Stem: 0, Branch: 0},
				Day:   RawPillar{Stem: 0, Branch: 0},
			},
		},
		{
			name: "month parity mismatch",
			raw: RawPillars{
				Year:  RawPillar{Stem: 0, Branch: 0},
				Month: RawPillar{Stem: 1, Branch: 0}, // 乙(yin)+子(yang) 불가
				Day:   RawPillar{Stem: 0, Branch: 0},
			},
		},
		{
			name: "day parity mismatch",
			raw: RawPillars{
				Year:  RawPillar{Stem: 0, Branch: 0},
				Month: RawPillar{Stem: 0, Branch: 0},
				Day:   RawPillar{Stem: 2, Branch: 3}, // 丙(yang)+卯(yin) 불가
			},
		},
		{
			name: "hour parity mismatch",
			raw: RawPillars{
				Year:  RawPillar{Stem: 0, Branch: 0},
				Month: RawPillar{Stem: 0, Branch: 0},
				Day:   RawPillar{Stem: 0, Branch: 0},
				Hour:  &RawPillar{Stem: 3, Branch: 4}, // 丁(yin)+辰(yang) 불가
			},
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := validateRawPillars(tc.raw)
			if err == nil {
				t.Fatal("expected parity mismatch error")
			}
		})
	}
}

func TestValidateRawPillars_ValidParity(t *testing.T) {
	raw := RawPillars{
		Year:  RawPillar{Stem: 0, Branch: 0},  // 甲子 (yang+yang)
		Month: RawPillar{Stem: 1, Branch: 1},  // 乙丑 (yin+yin)
		Day:   RawPillar{Stem: 2, Branch: 2},  // 丙寅 (yang+yang)
		Hour:  &RawPillar{Stem: 3, Branch: 3}, // 丁卯 (yin+yin)
	}
	if err := validateRawPillars(raw); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// ── 십성(十神) 테스트 ──

func TestTenGodByStem(t *testing.T) {
	// 일간=甲(0) 기준 십성 전체 검증
	tests := []struct {
		dayMaster StemId
		target    StemId
		want      TenGod
	}{
		{0, 0, BiGyeon},   // 甲→甲: 비견
		{0, 1, GeobJae},   // 甲→乙: 겁재
		{0, 2, SikShin},   // 甲→丙: 식신
		{0, 3, SangGwan},  // 甲→丁: 상관
		{0, 4, PyeonJae},  // 甲→戊: 편재
		{0, 5, JeongJae},  // 甲→己: 정재
		{0, 6, PyeonGwan}, // 甲→庚: 편관
		{0, 7, JeongGwan}, // 甲→辛: 정관
		{0, 8, PyeonIn},   // 甲→壬: 편인
		{0, 9, JeongIn},   // 甲→癸: 정인
		// 일간=丙(2) 기준 일부 검증
		{2, 2, BiGyeon},  // 丙→丙: 비견
		{2, 4, SikShin},  // 丙→戊: 火(1)→土(2), diff=mod5(2-1)=1 → 식신
		{2, 0, PyeonIn},  // 丙→甲: 火(1)←木(0), diff=mod5(0-1)=4 → 편인
		{2, 6, PyeonJae}, // 丙→庚: 火(1)→金(3), diff=mod5(3-1)=2 → 편재
	}
	for _, tc := range tests {
		got := tenGodByStem(tc.dayMaster, tc.target)
		if got != tc.want {
			t.Errorf("tenGodByStem(%d,%d) = %s, want %s", tc.dayMaster, tc.target, got, tc.want)
		}
	}
}

// ── 십이운성(十二運星) 테스트 ──

func TestTwelveFateByBranch(t *testing.T) {
	tests := []struct {
		dayStem StemId
		branch  BranchId
		want    TwelveFate
	}{
		// 甲日 장생=亥(11), 순행
		{0, 11, JangSaeng}, // 甲의 장생=亥
		{0, 0, MokYok},     // 甲의 목욕=子
		{0, 1, GwanDae},    // 甲의 관대=丑
		{0, 2, GeonRok},    // 甲의 건록=寅
		{0, 3, JeWang},     // 甲의 제왕=卯
		{0, 4, Swoe},       // 甲의 쇠=辰
		// 乙日 장생=午(6), 역행
		{1, 6, JangSaeng}, // 乙의 장생=午
		{1, 5, MokYok},    // 乙의 목욕=巳
		{1, 4, GwanDae},   // 乙의 관대=辰
		{1, 3, GeonRok},   // 乙의 건록=卯
		// 庚日 장생=巳(5), 순행
		{6, 5, JangSaeng}, // 庚의 장생=巳
		{6, 6, MokYok},    // 庚의 목욕=午
	}
	for _, tc := range tests {
		got := twelveFateByBranch(tc.dayStem, tc.branch)
		if got != tc.want {
			t.Errorf("twelveFateByBranch(%d,%d) = %s, want %s", tc.dayStem, tc.branch, got, tc.want)
		}
	}
}

// ── 지장간 테스트 ──

func TestHiddenStems(t *testing.T) {
	tests := []struct {
		branch BranchId
		want   []StemId
	}{
		{0, []StemId{9}},       // 子 → 癸
		{1, []StemId{5, 9, 7}}, // 丑 → 己癸辛
		{2, []StemId{0, 2, 4}}, // 寅 → 甲丙戊
		{3, []StemId{1}},       // 卯 → 乙
		{6, []StemId{3, 5}},    // 午 → 丁己
		{9, []StemId{7}},       // 酉 → 辛
		{11, []StemId{8, 0}},   // 亥 → 壬甲
	}
	for _, tc := range tests {
		got := hiddenStems(tc.branch)
		if len(got) != len(tc.want) {
			t.Errorf("hiddenStems(%d) len = %d, want %d", tc.branch, len(got), len(tc.want))
			continue
		}
		for i := range got {
			if got[i] != tc.want[i] {
				t.Errorf("hiddenStems(%d)[%d] = %d, want %d", tc.branch, i, got[i], tc.want[i])
			}
		}
	}
}

// ── 공망 테스트 ──

func TestGongMangBranches(t *testing.T) {
	tests := []struct {
		stem   StemId
		branch BranchId
		want   []BranchId
	}{
		// 甲子旬 (cycle 0-9) → 공망 = 戌(10), 亥(11)
		{0, 0, []BranchId{10, 11}},
		// 甲戌旬 (cycle 10-19) → 공망 = 申(8), 酉(9)
		{0, 10, []BranchId{8, 9}},
		// 甲申旬 (cycle 20-29) → 공망 = 午(6), 未(7)
		{0, 8, []BranchId{6, 7}},
		// 甲午旬 (cycle 30-39) → 공망 = 辰(4), 巳(5)
		{0, 6, []BranchId{4, 5}},
		// 甲辰旬 (cycle 40-49) → 공망 = 寅(2), 卯(3)
		{0, 4, []BranchId{2, 3}},
		// 甲寅旬 (cycle 50-59) → 공망 = 子(0), 丑(1)
		{0, 2, []BranchId{0, 1}},
	}
	for _, tc := range tests {
		got := gongMangBranches(tc.stem, tc.branch)
		if len(got) != 2 {
			t.Errorf("gongMangBranches(%d,%d) len = %d, want 2", tc.stem, tc.branch, len(got))
			continue
		}
		if got[0] != tc.want[0] || got[1] != tc.want[1] {
			t.Errorf("gongMangBranches(%d,%d) = %v, want %v", tc.stem, tc.branch, got, tc.want)
		}
	}
}

func TestGongMangBranches_InvalidParity(t *testing.T) {
	// 甲(0)+丑(1) → 음양 불일치 → sexagenaryIndex 실패 → nil
	got := gongMangBranches(0, 1)
	if got != nil {
		t.Errorf("gongMangBranches(0,1) = %v, want nil (invalid parity)", got)
	}
}

// ── 60갑자 인덱스 테스트 ──

func TestSexagenaryIndex(t *testing.T) {
	tests := []struct {
		stem   StemId
		branch BranchId
		want   int
		ok     bool
	}{
		{0, 0, 0, true},   // 甲子
		{1, 1, 1, true},   // 乙丑
		{9, 11, 59, true}, // 癸亥 (마지막)
		{0, 1, 0, false},  // 甲丑 (음양 불일치)
		{1, 0, 0, false},  // 乙子 (음양 불일치)
		{4, 10, 34, true}, // 戊戌
	}
	for _, tc := range tests {
		got, ok := sexagenaryIndex(tc.stem, tc.branch)
		if ok != tc.ok {
			t.Errorf("sexagenaryIndex(%d,%d) ok = %v, want %v", tc.stem, tc.branch, ok, tc.ok)
			continue
		}
		if ok && got != tc.want {
			t.Errorf("sexagenaryIndex(%d,%d) = %d, want %d", tc.stem, tc.branch, got, tc.want)
		}
	}
}

// ── 납음 테스트 ──

func TestNaEum(t *testing.T) {
	tests := []struct {
		stem   StemId
		branch BranchId
		want   string
	}{
		{0, 0, "海中金"}, // 甲子
		{1, 1, "海中金"}, // 乙丑 (같은 쌍)
		{2, 2, "炉中火"}, // 丙寅
		{0, 1, ""},    // 甲丑 (불가 조합)
	}
	for _, tc := range tests {
		got := naEum(tc.stem, tc.branch)
		if got != tc.want {
			t.Errorf("naEum(%d,%d) = %q, want %q", tc.stem, tc.branch, got, tc.want)
		}
	}
}

// ── 지지 관계 테스트 ──

func TestIsDzChong(t *testing.T) {
	// 충(沖): 子午(0,6), 丑未(1,7), 寅申(2,8), 卯酉(3,9), 辰戌(4,10), 巳亥(5,11)
	chongPairs := [][2]BranchId{{0, 6}, {1, 7}, {2, 8}, {3, 9}, {4, 10}, {5, 11}}
	for _, p := range chongPairs {
		if !isDzChong(p[0], p[1]) {
			t.Errorf("isDzChong(%d,%d) = false, want true", p[0], p[1])
		}
	}
	if isDzChong(0, 1) {
		t.Error("isDzChong(0,1) = true, want false")
	}
}

func TestIsDzHe(t *testing.T) {
	// 육합: 子丑(0,1), 寅亥(2,11), 卯戌(3,10), 辰酉(4,9), 巳申(5,8), 午未(6,7)
	hePairs := [][2]BranchId{{0, 1}, {2, 11}, {3, 10}, {4, 9}, {5, 8}, {6, 7}}
	for _, p := range hePairs {
		if !isDzHe(p[0], p[1]) {
			t.Errorf("isDzHe(%d,%d) = false, want true", p[0], p[1])
		}
	}
	if isDzHe(0, 2) {
		t.Error("isDzHe(0,2) = true, want false")
	}
}

func TestIsDzHyung(t *testing.T) {
	// 삼형: 寅巳(2,5), 寅申(2,8), 巳申(5,8), 丑未(1,7), 丑戌(1,10), 未戌(7,10)
	hyungPairs := [][2]BranchId{{2, 5}, {2, 8}, {5, 8}, {1, 7}, {1, 10}, {7, 10}}
	for _, p := range hyungPairs {
		if !isDzHyung(p[0], p[1]) {
			t.Errorf("isDzHyung(%d,%d) = false, want true", p[0], p[1])
		}
	}
	// 상형: 子卯(0,3)
	if !isDzHyung(0, 3) {
		t.Error("isDzHyung(0,3) = false, want true")
	}
	// 자형: 辰辰(4,4), 午午(6,6), 酉酉(9,9), 亥亥(11,11)
	selfPairs := []BranchId{4, 6, 9, 11}
	for _, b := range selfPairs {
		if !isDzHyung(b, b) {
			t.Errorf("isDzHyung(%d,%d) self = false, want true", b, b)
		}
	}
	// 자형 아닌 것: 子子(0,0)
	if isDzHyung(0, 0) {
		t.Error("isDzHyung(0,0) = true, want false")
	}
}

func TestIsDzHae(t *testing.T) {
	// 해(害): 子未(0,7), 丑午(1,6), 寅巳(2,5), 卯辰(3,4), 申亥(8,11), 酉戌(9,10)
	haePairs := [][2]BranchId{{0, 7}, {1, 6}, {2, 5}, {3, 4}, {8, 11}, {9, 10}}
	for _, p := range haePairs {
		if !isDzHae(p[0], p[1]) {
			t.Errorf("isDzHae(%d,%d) = false, want true", p[0], p[1])
		}
	}
}

func TestIsDzPo(t *testing.T) {
	// 파(破): 子酉(0,9), 卯午(3,6), 丑辰(1,4), 未戌(7,10), 寅亥(2,11), 巳申(5,8)
	poPairs := [][2]BranchId{{0, 9}, {3, 6}, {1, 4}, {7, 10}, {2, 11}, {5, 8}}
	for _, p := range poPairs {
		if !isDzPo(p[0], p[1]) {
			t.Errorf("isDzPo(%d,%d) = false, want true", p[0], p[1])
		}
	}
}

func TestDzSamhapResult(t *testing.T) {
	// 삼합: 申子辰(8,0,4)→水, 寅午戌(2,6,10)→火, 亥卯未(11,3,7)→木, 巳酉丑(5,9,1)→金
	tests := []struct {
		a, b BranchId
		want FiveEl
		ok   bool
	}{
		{0, 4, "WATER", true}, // 子+辰 (水局)
		{0, 8, "WATER", true}, // 子+申
		{4, 8, "WATER", true}, // 辰+申
		{2, 6, "FIRE", true},  // 寅+午 (火局)
		{2, 10, "FIRE", true}, // 寅+戌
		{3, 7, "WOOD", true},  // 卯+未 (木局)
		{3, 11, "WOOD", true}, // 卯+亥
		{1, 5, "METAL", true}, // 丑+巳 (金局)
		{1, 9, "METAL", true}, // 丑+酉
		{0, 3, "", false},     // 子+卯 (삼합 아님)
	}
	for _, tc := range tests {
		got, ok := dzSamhapResult(tc.a, tc.b)
		if ok != tc.ok {
			t.Errorf("dzSamhapResult(%d,%d) ok = %v, want %v", tc.a, tc.b, ok, tc.ok)
			continue
		}
		if ok && got != tc.want {
			t.Errorf("dzSamhapResult(%d,%d) = %s, want %s", tc.a, tc.b, got, tc.want)
		}
	}
}

// ── 천간 합 테스트 ──

func TestStemRelationSpec(t *testing.T) {
	// 천간합: 甲己合土(0,5), 乙庚合金(1,6), 丙辛合水(2,7), 丁壬合木(3,8), 戊癸合火(4,9)
	tests := []struct {
		a, b   StemId
		result FiveEl
		ok     bool
	}{
		{0, 5, "EARTH", true},
		{1, 6, "METAL", true},
		{2, 7, "WATER", true},
		{3, 8, "WOOD", true},
		{4, 9, "FIRE", true},
		{5, 0, "EARTH", true}, // 역순도 동작
		{0, 1, "", false},     // 甲乙 합 아님
		{0, 0, "", false},     // 같은 간
	}
	for _, tc := range tests {
		spec, ok := stemRelationSpec(tc.a, tc.b)
		if ok != tc.ok {
			t.Errorf("stemRelationSpec(%d,%d) ok = %v, want %v", tc.a, tc.b, ok, tc.ok)
			continue
		}
		if ok && (spec.Result == nil || *spec.Result != tc.result) {
			t.Errorf("stemRelationSpec(%d,%d) result = %v, want %s", tc.a, tc.b, spec.Result, tc.result)
		}
	}
}

// ── 시간→지지 변환 테스트 ──

func TestHourToBranch(t *testing.T) {
	tests := []struct {
		hour int
		want int
	}{
		{23, 0},  // 子時
		{0, 0},   // 子時
		{1, 1},   // 丑時
		{2, 1},   // 丑時
		{3, 2},   // 寅時
		{5, 3},   // 卯時
		{11, 6},  // 午時
		{13, 7},  // 未時
		{21, 11}, // 亥時
		{22, 11}, // 亥時
	}
	for _, tc := range tests {
		got := hourToBranch(tc.hour)
		if got != tc.want {
			t.Errorf("hourToBranch(%d) = %d, want %d", tc.hour, got, tc.want)
		}
	}
}

// ── 오행/음양 기본 함수 테스트 ──

func TestStemElement(t *testing.T) {
	// 甲乙=木, 丙丁=火, 戊己=土, 庚辛=金, 壬癸=水
	expected := []FiveEl{"WOOD", "WOOD", "FIRE", "FIRE", "EARTH", "EARTH", "METAL", "METAL", "WATER", "WATER"}
	for i, want := range expected {
		got := stemElement(StemId(i))
		if got != want {
			t.Errorf("stemElement(%d) = %s, want %s", i, got, want)
		}
	}
}

func TestBranchElement(t *testing.T) {
	// 子=水, 丑=土, 寅=木, 卯=木, 辰=土, 巳=火, 午=火, 未=土, 申=金, 酉=金, 戌=土, 亥=水
	expected := []FiveEl{"WATER", "EARTH", "WOOD", "WOOD", "EARTH", "FIRE", "FIRE", "EARTH", "METAL", "METAL", "EARTH", "WATER"}
	for i, want := range expected {
		got := branchElement(BranchId(i))
		if got != want {
			t.Errorf("branchElement(%d) = %s, want %s", i, got, want)
		}
	}
}

func TestStemYinYang(t *testing.T) {
	for i := 0; i < 10; i++ {
		got := stemYinYang(StemId(i))
		want := YinYang("YANG")
		if i%2 == 1 {
			want = "YIN"
		}
		if got != want {
			t.Errorf("stemYinYang(%d) = %s, want %s", i, got, want)
		}
	}
}

// ── 오행 균형/점수 테스트 ──

func TestCalcBalanceScore_PerfectBalance(t *testing.T) {
	dist := &ElDistribution{Wood: 0.2, Fire: 0.2, Earth: 0.2, Metal: 0.2, Water: 0.2}
	score := calcBalanceScore(dist)
	if score != 100 {
		t.Errorf("perfect balance score = %f, want 100", score)
	}
}

func TestCalcBalanceScore_Nil(t *testing.T) {
	score := calcBalanceScore(nil)
	if score != 50 {
		t.Errorf("nil balance score = %f, want 50", score)
	}
}

func TestNewScore_NormClamping(t *testing.T) {
	s := newScore(150, 0, 100, 0.9, nil) // total > max
	if s.Norm0_100 != 100 {
		t.Errorf("norm = %d, want 100 (clamped)", s.Norm0_100)
	}
	s2 := newScore(-10, 0, 100, 0.9, nil) // total < min
	if s2.Norm0_100 != 0 {
		t.Errorf("norm = %d, want 0 (clamped)", s2.Norm0_100)
	}
}
