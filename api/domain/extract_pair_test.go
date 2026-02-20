package domain

import (
	"math"
	"testing"
	"time"
)

// ── 기존 테스트 ──

func TestBuildPairDocAt_Basic(t *testing.T) {
	aDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
		Hour:  &RawPillar{Stem: 9, Branch: 3},
	}, TimePrecisionMinute, "1990-05-15 10:24")
	bDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 1, Branch: 1},
		Month: RawPillar{Stem: 6, Branch: 8},
		Day:   RawPillar{Stem: 8, Branch: 4},
		Hour:  &RawPillar{Stem: 2, Branch: 8},
	}, TimePrecisionMinute, "1992-11-03 16:40")

	input := PairInput{
		A:      aDoc.Input,
		B:      bDoc.Input,
		Engine: Engine{Name: "pair_engine", Ver: "1"},
	}
	doc, err := BuildPairDocAt(input, aDoc, bDoc, time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildPairDocAt() error = %v", err)
	}
	if doc.SchemaVer == "" {
		t.Fatal("expected schemaVer")
	}
	if doc.Charts == nil || doc.Charts.A == nil || doc.Charts.B == nil {
		t.Fatal("expected pair charts")
	}
	if doc.Metrics == nil || doc.Metrics.NetIndex == nil {
		t.Fatalf("expected metrics/netIndex: %+v", doc.Metrics)
	}
	if len(doc.Evals) == 0 {
		t.Fatal("expected evals")
	}
	if findPairEval(doc.Evals, PairEvalOverall) == nil {
		t.Fatal("expected overall eval")
	}
}

func TestBuildPairDocAt_WithHourCandidates(t *testing.T) {
	aDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
		Hour:  &RawPillar{Stem: 9, Branch: 3},
	}, TimePrecisionMinute, "1990-05-15 10:24")
	bDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 1, Branch: 1},
		Month: RawPillar{Stem: 6, Branch: 8},
		Day:   RawPillar{Stem: 8, Branch: 4},
	}, TimePrecisionUnknown, "1992-11-03")

	doc, err := BuildPairDocAt(PairInput{
		A:      aDoc.Input,
		B:      bDoc.Input,
		Engine: Engine{Name: "pair_engine", Ver: "1"},
	}, aDoc, bDoc, time.Now().UTC())
	if err != nil {
		t.Fatalf("BuildPairDocAt() error = %v", err)
	}
	if doc.HourCtx == nil {
		t.Fatal("expected hour context")
	}
	if doc.HourCtx.StatusA != HourKnown {
		t.Fatalf("statusA = %s, want KNOWN", doc.HourCtx.StatusA)
	}
	if doc.HourCtx.StatusB != HourMissing {
		t.Fatalf("statusB = %s, want MISSING", doc.HourCtx.StatusB)
	}
	if len(doc.HourCtx.Candidates) == 0 {
		t.Fatal("expected pair hour candidates")
	}
}

func TestBuildPairDocAt_InvalidInput(t *testing.T) {
	if _, err := BuildPairDocAt(PairInput{}, nil, nil, time.Now().UTC()); err == nil {
		t.Fatal("expected error for nil docs")
	}
}

// ── 보강 테스트 ──

// 모든 메트릭이 유효 범위 안에 있는지 검증
func TestBuildPairDocAt_MetricRanges(t *testing.T) {
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
	)
	m := doc.Metrics
	if m == nil {
		t.Fatal("metrics nil")
	}

	assertRange := func(name string, ptr *float64, lo, hi float64) {
		t.Helper()
		if ptr == nil {
			t.Fatalf("%s is nil", name)
		}
		if *ptr < lo || *ptr > hi {
			t.Errorf("%s = %.4f, want [%.1f, %.1f]", name, *ptr, lo, hi)
		}
	}
	assertRange("HarmonyIndex", m.HarmonyIndex, 0, 100)
	assertRange("ConflictIndex", m.ConflictIndex, 0, 100)
	assertRange("NetIndex", m.NetIndex, -100, 100)
	assertRange("ElementComplement", m.ElementComplement, 0, 100)
	assertRange("UsefulGodSupport", m.UsefulGodSupport, 0, 100)
	assertRange("RoleFit", m.RoleFit, 0, 100)
	assertRange("PressureRisk", m.PressureRisk, 0, 100)
	assertRange("Confidence", m.Confidence, 0, 1)
	assertRange("Sensitivity", m.Sensitivity, 0, 100)
	assertRange("TimingAlignment", m.TimingAlignment, 0, 100)
}

// 6개 Eval 항목이 모두 존재하고 점수가 유효한지 검증
func TestBuildPairDocAt_AllEvalsPresent(t *testing.T) {
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
	)

	wantKinds := []PairEvalKind{
		PairEvalHarmony,
		PairEvalConflict,
		PairEvalComplement,
		PairEvalRoleFit,
		PairEvalTiming,
		PairEvalOverall,
	}
	if len(doc.Evals) != len(wantKinds) {
		t.Fatalf("evals count = %d, want %d", len(doc.Evals), len(wantKinds))
	}
	for _, k := range wantKinds {
		ev := findPairEval(doc.Evals, k)
		if ev == nil {
			t.Errorf("missing eval kind %s", k)
			continue
		}
		if ev.Score.Norm0_100 > 100 {
			t.Errorf("eval %s: Norm0_100 = %d, want <=100", k, ev.Score.Norm0_100)
		}
		if ev.Score.Confidence < 0 || ev.Score.Confidence > 1 {
			t.Errorf("eval %s: Confidence = %.4f, want [0,1]", k, ev.Score.Confidence)
		}
		if ev.ID == "" {
			t.Errorf("eval %s: empty ID", k)
		}
		if ev.Evidence.RuleId == "" {
			t.Errorf("eval %s: empty evidence ruleId", k)
		}
	}
}

// Edge 가 올바른 RelType 으로 생성되며 ID가 연속인지 검증
func TestBuildPairDocAt_EdgeIntegrity(t *testing.T) {
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 0, Branch: 0},  // 甲子
			Month: RawPillar{Stem: 4, Branch: 2},  // 戊寅
			Day:   RawPillar{Stem: 4, Branch: 10}, // 戊戌
			Hour:  &RawPillar{Stem: 8, Branch: 0}, // 壬子
		},
		RawPillars{
			Year:  RawPillar{Stem: 5, Branch: 7},   // 己未
			Month: RawPillar{Stem: 3, Branch: 11},  // 丁亥
			Day:   RawPillar{Stem: 0, Branch: 4},   // 甲辰
			Hour:  &RawPillar{Stem: 0, Branch: 10}, // 甲戌
		},
	)

	validRelTypes := map[RelType]bool{
		relHe: true, relChong: true, relHyung: true,
		relHae: true, relPo: true, relSamhap: true,
	}
	for i, edge := range doc.Edges {
		if !validRelTypes[edge.T] {
			t.Errorf("edge[%d] unexpected RelType = %s", i, edge.T)
		}
		if edge.W == nil {
			t.Errorf("edge[%d] weight is nil", i)
		} else if *edge.W <= 0 || *edge.W > 1.0 {
			t.Errorf("edge[%d] weight = %.4f, want (0, 1.0]", i, *edge.W)
		}
		if edge.Active == nil || !*edge.Active {
			t.Errorf("edge[%d] expected Active=true", i)
		}
		if edge.Evidence == nil {
			t.Errorf("edge[%d] evidence is nil", i)
		}
		// ID 는 1부터 연속 증가
		wantID := PairEdgeId(i + 1)
		if edge.ID != wantID {
			t.Errorf("edge[%d] ID = %d, want %d", i, edge.ID, wantID)
		}
	}
}

// 甲己合(Stem 0+5) 이 있는 조합에서 stem HE edge가 생기는지 검증
func TestBuildPairDocAt_StemHarmonyEdge(t *testing.T) {
	// 년간: 甲(0) vs 己(5) → 甲己合土
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 0, Branch: 0},  // 甲子
			Month: RawPillar{Stem: 2, Branch: 2},  // 丙寅
			Day:   RawPillar{Stem: 4, Branch: 4},  // 戊辰
		},
		RawPillars{
			Year:  RawPillar{Stem: 5, Branch: 7},  // 己未
			Month: RawPillar{Stem: 7, Branch: 9},  // 辛酉
			Day:   RawPillar{Stem: 9, Branch: 11}, // 癸亥
		},
	)

	foundEarth := false
	for _, edge := range doc.Edges {
		if edge.T == relHe && edge.Evidence != nil && edge.Evidence.RuleId == "rule.pair.stem_relation" {
			if edge.Result != nil && *edge.Result == FiveEl("EARTH") {
				foundEarth = true
			}
		}
	}
	if !foundEarth {
		t.Fatal("expected stem HE edge with EARTH result for 甲己合")
	}
}

// 子午 충(Branch 0 vs 6) 이 있는 조합에서 CHONG edge가 생기는지 검증
func TestBuildPairDocAt_BranchConflictEdge(t *testing.T) {
	// 년지: 子(0) vs 午(6) → 子午沖
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 0, Branch: 0},  // 甲子
			Month: RawPillar{Stem: 2, Branch: 2},  // 丙寅
			Day:   RawPillar{Stem: 4, Branch: 4},  // 戊辰
		},
		RawPillars{
			Year:  RawPillar{Stem: 4, Branch: 6},  // 戊午
			Month: RawPillar{Stem: 6, Branch: 8},  // 庚申
			Day:   RawPillar{Stem: 8, Branch: 10}, // 壬戌
		},
	)

	found := false
	for _, edge := range doc.Edges {
		if edge.T == relChong && edge.Evidence != nil && edge.Evidence.RuleId == "rule.pair.branch_relation" {
			found = true
		}
	}
	if !found {
		t.Fatal("expected branch CHONG edge for 子午沖")
	}
}

// 동일한 사주끼리 궁합: edges 가 생기지 않아야 함 (같은 stem은 합이 아니므로)
func TestBuildPairDocAt_SamePerson(t *testing.T) {
	raw := RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
		Hour:  &RawPillar{Stem: 9, Branch: 3},
	}
	aDoc := mustBuildDocForPair(t, raw, TimePrecisionMinute, "1990-05-15 10:24")
	bDoc := mustBuildDocForPair(t, raw, TimePrecisionMinute, "1990-05-15 10:24")

	doc, err := BuildPairDocAt(PairInput{
		A:      aDoc.Input,
		B:      bDoc.Input,
		Engine: Engine{Name: "pair_engine", Ver: "1"},
	}, aDoc, bDoc, time.Now().UTC())
	if err != nil {
		t.Fatalf("error = %v", err)
	}
	// 동일 stem 끼리는 stemRelationSpec 이 false 반환
	for _, edge := range doc.Edges {
		if edge.Evidence != nil && edge.Evidence.RuleId == "rule.pair.stem_relation" {
			t.Error("same-stem pair should not produce stem relation edges")
		}
	}
	// 동일 branch 끼리 자형(自刑) 여부만 edge로 존재할 수 있음
	for _, edge := range doc.Edges {
		if edge.T == relChong {
			t.Error("same-person pair should not produce CHONG edges")
		}
	}
	// overall 이 존재하고 유효해야 함
	overall := findPairEval(doc.Evals, PairEvalOverall)
	if overall == nil {
		t.Fatal("expected overall eval")
	}
	if overall.Score.Norm0_100 > 100 {
		t.Errorf("overall Norm0_100 = %d, want <=100", overall.Score.Norm0_100)
	}
}

// 양측 모두 시주 미상인 경우 HourCtx 검증
func TestBuildPairDocAt_BothHourMissing(t *testing.T) {
	aDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 6, Branch: 6},
		Month: RawPillar{Stem: 7, Branch: 5},
		Day:   RawPillar{Stem: 4, Branch: 10},
	}, TimePrecisionUnknown, "1990-05-15")
	bDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 1, Branch: 1},
		Month: RawPillar{Stem: 6, Branch: 8},
		Day:   RawPillar{Stem: 8, Branch: 4},
	}, TimePrecisionUnknown, "1992-11-03")

	doc, err := BuildPairDocAt(PairInput{
		A:      aDoc.Input,
		B:      bDoc.Input,
		Engine: Engine{Name: "pair_engine", Ver: "1"},
	}, aDoc, bDoc, time.Now().UTC())
	if err != nil {
		t.Fatalf("error = %v", err)
	}
	if doc.HourCtx == nil {
		t.Fatal("expected hour context")
	}
	if doc.HourCtx.StatusA != HourMissing {
		t.Errorf("statusA = %s, want MISSING", doc.HourCtx.StatusA)
	}
	if doc.HourCtx.StatusB != HourMissing {
		t.Errorf("statusB = %s, want MISSING", doc.HourCtx.StatusB)
	}
	// confidence 는 0.72 여야 함 (양측 MISSING)
	if doc.Metrics == nil || doc.Metrics.Confidence == nil {
		t.Fatal("confidence nil")
	}
	if *doc.Metrics.Confidence != 0.72 {
		t.Errorf("confidence = %.4f, want 0.72", *doc.Metrics.Confidence)
	}
	// 후보 조합 수가 maxComb(16) 이하
	if len(doc.HourCtx.Candidates) > 16 {
		t.Errorf("candidates = %d, want <=16", len(doc.HourCtx.Candidates))
	}
}

// 양측 시주 확정이면 HourCtx.Candidates 가 비어야 함
func TestBuildPairDocAt_BothHourKnown_NoCandidates(t *testing.T) {
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
	)
	if doc.HourCtx == nil {
		t.Fatal("expected hour context")
	}
	if doc.HourCtx.StatusA != HourKnown || doc.HourCtx.StatusB != HourKnown {
		t.Errorf("expected both KNOWN, got A=%s B=%s", doc.HourCtx.StatusA, doc.HourCtx.StatusB)
	}
	if len(doc.HourCtx.Candidates) != 0 {
		t.Errorf("candidates = %d, want 0 when both KNOWN", len(doc.HourCtx.Candidates))
	}
}

// Pillar 수 부족(2주만)이면 에러
func TestBuildPairDocAt_InsufficientPillars(t *testing.T) {
	aDoc := &SajuDoc{
		Pillars: []Pillar{
			{K: "Y", Stem: 0, Branch: 0},
			{K: "M", Stem: 1, Branch: 1},
		},
		Nodes: []Node{},
	}
	bDoc := &SajuDoc{
		Pillars: []Pillar{
			{K: "Y", Stem: 2, Branch: 2},
			{K: "M", Stem: 3, Branch: 3},
			{K: "D", Stem: 4, Branch: 4},
		},
		Nodes: []Node{},
	}
	_, err := BuildPairDocAt(PairInput{}, aDoc, bDoc, time.Now().UTC())
	if err == nil {
		t.Fatal("expected error for insufficient pillars")
	}
}

// Facts 가 3개 존재하고 ID가 올바른지 검증
func TestBuildPairDocAt_FactsIntegrity(t *testing.T) {
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
	)

	wantFactIDs := []string{
		"pair.fact.relation_summary",
		"pair.fact.dominant_relation",
		"pair.fact.element_complement",
	}
	if len(doc.Facts) != len(wantFactIDs) {
		t.Fatalf("facts count = %d, want %d", len(doc.Facts), len(wantFactIDs))
	}
	for i, wantID := range wantFactIDs {
		if doc.Facts[i].ID != wantID {
			t.Errorf("fact[%d].ID = %s, want %s", i, doc.Facts[i].ID, wantID)
		}
		if doc.Facts[i].Evidence.RuleId == "" {
			t.Errorf("fact[%d] empty evidence ruleId", i)
		}
	}
	// element_complement fact 은 Score 포인터가 설정돼 있어야 함
	if doc.Facts[2].Score == nil {
		t.Error("element_complement fact should have score")
	}
}

// Overall eval 의 Score.Parts 가중치 합산 검증
func TestBuildPairDocAt_OverallScoreParts(t *testing.T) {
	doc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
	)

	overall := findPairEval(doc.Evals, PairEvalOverall)
	if overall == nil {
		t.Fatal("missing overall eval")
	}
	if len(overall.Score.Parts) != 5 {
		t.Fatalf("overall parts = %d, want 5", len(overall.Score.Parts))
	}

	wantLabels := []string{"net_norm", "element_complement", "useful_support", "role_fit", "pressure_risk"}
	wantWeights := []float64{0.45, 0.20, 0.15, 0.20, -0.20}
	for i, part := range overall.Score.Parts {
		if part.Label != wantLabels[i] {
			t.Errorf("part[%d].Label = %s, want %s", i, part.Label, wantLabels[i])
		}
		if part.W != wantWeights[i] {
			t.Errorf("part[%d].W = %.2f, want %.2f", i, part.W, wantWeights[i])
		}
		if part.Raw < 0 || part.Raw > 100 {
			t.Errorf("part[%d].Raw = %.4f, want [0,100]", i, part.Raw)
		}
	}
}

// newPairScore 정규화 정확성 검증
func TestNewPairScore(t *testing.T) {
	tests := []struct {
		name       string
		total      float64
		min, max   float64
		confidence float64
		wantNorm   uint8
	}{
		{"min value", 0, 0, 100, 0.9, 0},
		{"max value", 100, 0, 100, 0.9, 100},
		{"mid value", 50, 0, 100, 0.9, 50},
		{"quarter", 25, 0, 100, 0.85, 25},
		{"negative total clamped", -10, 0, 100, 0.9, 0},
		{"over max clamped", 120, 0, 100, 0.9, 100},
		{"custom range", 75, 50, 150, 0.8, 25},
		{"same min/max guarded", 10, 10, 10, 0.9, 0}, // max becomes min+1 → norm = 0
		{"confidence clamped high", 50, 0, 100, 1.5, 50},
		{"confidence clamped low", 50, 0, 100, -0.1, 50},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			score := newPairScore(tc.total, tc.min, tc.max, tc.confidence, nil)
			if score.Norm0_100 != tc.wantNorm {
				t.Errorf("Norm0_100 = %d, want %d", score.Norm0_100, tc.wantNorm)
			}
			if score.Confidence < 0 || score.Confidence > 1 {
				t.Errorf("Confidence = %.4f, want [0,1]", score.Confidence)
			}
		})
	}
}

// calcPairElementComplement: nil 입력 시 기본값 50
func TestCalcPairElementComplement_Nil(t *testing.T) {
	got := calcPairElementComplement(nil, nil)
	if got != 50 {
		t.Errorf("nil input = %.4f, want 50", got)
	}
	got = calcPairElementComplement(&ElDistribution{Wood: 0.2}, nil)
	if got != 50 {
		t.Errorf("one nil = %.4f, want 50", got)
	}
}

// calcPairElementComplement: 완벽히 균형잡힌 오행 → 100 근처
func TestCalcPairElementComplement_PerfectBalance(t *testing.T) {
	balanced := &ElDistribution{Wood: 0.2, Fire: 0.2, Earth: 0.2, Metal: 0.2, Water: 0.2}
	got := calcPairElementComplement(balanced, balanced)
	if got != 100 {
		t.Errorf("perfect balance = %.4f, want 100", got)
	}
}

// calcPairElementComplement: 극단적 편중 → 낮은 값
func TestCalcPairElementComplement_Extreme(t *testing.T) {
	skewed := &ElDistribution{Wood: 1.0, Fire: 0, Earth: 0, Metal: 0, Water: 0}
	got := calcPairElementComplement(skewed, skewed)
	if got > 50 {
		t.Errorf("extreme skew = %.4f, want < 50", got)
	}
}

// calcPairConfidence: 시주 상태별 신뢰도 검증
func TestCalcPairConfidence(t *testing.T) {
	knownDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 0, Branch: 0},
		Month: RawPillar{Stem: 2, Branch: 2},
		Day:   RawPillar{Stem: 4, Branch: 4},
		Hour:  &RawPillar{Stem: 6, Branch: 6},
	}, TimePrecisionMinute, "1990-01-01 12:00")
	missingDoc := mustBuildDocForPair(t, RawPillars{
		Year:  RawPillar{Stem: 1, Branch: 1},
		Month: RawPillar{Stem: 3, Branch: 3},
		Day:   RawPillar{Stem: 5, Branch: 5},
	}, TimePrecisionUnknown, "1992-06-15")

	// both known → 0.90
	conf := calcPairConfidence(knownDoc, knownDoc)
	if conf != 0.90 {
		t.Errorf("both known = %.4f, want 0.90", conf)
	}
	// one missing → 0.72
	conf = calcPairConfidence(knownDoc, missingDoc)
	if conf != 0.72 {
		t.Errorf("one missing = %.4f, want 0.72", conf)
	}
	// both missing → 0.72
	conf = calcPairConfidence(missingDoc, missingDoc)
	if conf != 0.72 {
		t.Errorf("both missing = %.4f, want 0.72", conf)
	}
}

// tenGodRoleScore 매핑 검증
func TestTenGodRoleScore(t *testing.T) {
	tests := []struct {
		g    TenGod
		want float64
	}{
		{JeongGwan, 88}, {JeongIn, 88}, {JeongJae, 88},
		{PyeonGwan, 76}, {PyeonIn, 76}, {PyeonJae, 76},
		{SikShin, 72},
		{SangGwan, 48},
		{BiGyeon, 58},
		{GeobJae, 52},
		{TenGod("UNKNOWN"), 60},
	}
	for _, tc := range tests {
		got := tenGodRoleScore(tc.g)
		if got != tc.want {
			t.Errorf("tenGodRoleScore(%s) = %.0f, want %.0f", tc.g, got, tc.want)
		}
	}
}

// calcTimingAlignment: edge 없으면 기본 50
func TestCalcTimingAlignment_NoEdges(t *testing.T) {
	got := calcTimingAlignment(nil, nil, nil)
	if got != 50 {
		t.Errorf("no edges = %.4f, want 50", got)
	}
}

// calcTimingAlignment: 월주 HE → 60, CHONG → 40
func TestCalcTimingAlignment_MonthRelations(t *testing.T) {
	nodeA := NodeId(10)
	nodeB := NodeId(20)
	pillarA := map[NodeId]PillarKey{nodeA: "M"}
	pillarB := map[NodeId]PillarKey{nodeB: "M"}

	// 월주 HE 1개
	edges := []PairEdge{{T: relHe, A: nodeA, B: nodeB}}
	got := calcTimingAlignment(edges, pillarA, pillarB)
	if got != 60 {
		t.Errorf("month HE = %.4f, want 60", got)
	}

	// 월주 CHONG 1개
	edges = []PairEdge{{T: relChong, A: nodeA, B: nodeB}}
	got = calcTimingAlignment(edges, pillarA, pillarB)
	if got != 40 {
		t.Errorf("month CHONG = %.4f, want 40", got)
	}

	// 비월주 edge 는 무시
	pillarA2 := map[NodeId]PillarKey{nodeA: "Y"}
	edges = []PairEdge{{T: relChong, A: nodeA, B: nodeB}}
	got = calcTimingAlignment(edges, pillarA2, pillarB)
	if got != 50 {
		t.Errorf("non-month edge = %.4f, want 50", got)
	}
}

// dominantRelation 검증
func TestDominantRelation(t *testing.T) {
	if got := dominantRelation(nil); got != "NONE" {
		t.Errorf("nil = %s, want NONE", got)
	}
	if got := dominantRelation(map[string]int{}); got != "NONE" {
		t.Errorf("empty = %s, want NONE", got)
	}
	stats := map[string]int{"HE": 3, "CHONG": 1, "SAMHAP": 2}
	if got := dominantRelation(stats); got != "HE" {
		t.Errorf("got %s, want HE", got)
	}
	// 동점 시 알파벳 순
	stats = map[string]int{"CHONG": 2, "HE": 2}
	if got := dominantRelation(stats); got != "CHONG" {
		t.Errorf("tie = %s, want CHONG (alphabetical)", got)
	}
}

// collectPairRefs: 중복 제거 및 정렬 검증
func TestCollectPairRefs(t *testing.T) {
	edges := []PairEdge{
		{A: 3, B: 10},
		{A: 1, B: 20},
		{A: 3, B: 30}, // A쪽 중복
	}
	gotA := collectPairRefs(edges, true)
	if len(gotA) != 2 {
		t.Fatalf("aSide refs = %d, want 2 (deduped)", len(gotA))
	}
	if gotA[0] != 1 || gotA[1] != 3 {
		t.Errorf("aSide refs = %v, want [1, 3] (sorted)", gotA)
	}
	gotB := collectPairRefs(edges, false)
	if len(gotB) != 3 {
		t.Fatalf("bSide refs = %d, want 3", len(gotB))
	}
}

// CreatedAt 이 RFC3339 포맷인지 검증
func TestBuildPairDocAt_CreatedAt(t *testing.T) {
	now := time.Date(2026, 2, 16, 12, 30, 0, 0, time.UTC)
	doc := mustBuildPairDocAt(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
		now,
	)
	parsed, err := time.Parse(time.RFC3339, doc.CreatedAt)
	if err != nil {
		t.Fatalf("CreatedAt parse error: %v (value: %s)", err, doc.CreatedAt)
	}
	if !parsed.Equal(now) {
		t.Errorf("CreatedAt = %s, want %s", parsed, now)
	}
}

// 조화 우세 사주 vs 충돌 우세 사주의 netIndex 부호 검증
func TestBuildPairDocAt_NetIndexSign(t *testing.T) {
	// 년지 子(0) vs 丑(1) → 六合(HE), 월지 寅(2) vs 亥(11) → 六合(HE)
	harmonyDoc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 0, Branch: 0},   // 甲子
			Month: RawPillar{Stem: 2, Branch: 2},   // 丙寅
			Day:   RawPillar{Stem: 4, Branch: 4},   // 戊辰
		},
		RawPillars{
			Year:  RawPillar{Stem: 5, Branch: 1},   // 己丑
			Month: RawPillar{Stem: 3, Branch: 11},  // 丁亥
			Day:   RawPillar{Stem: 9, Branch: 9},   // 癸酉
		},
	)
	if harmonyDoc.Metrics.NetIndex == nil {
		t.Fatal("netIndex nil")
	}
	if *harmonyDoc.Metrics.NetIndex < 0 {
		t.Errorf("harmony-dominant pair netIndex = %.4f, want >= 0", *harmonyDoc.Metrics.NetIndex)
	}

	// 년지 子(0) vs 午(6) → 沖(CHONG), 월지 丑(1) vs 未(7) → 沖(CHONG)
	conflictDoc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 0, Branch: 0},  // 甲子
			Month: RawPillar{Stem: 3, Branch: 1},  // 丁丑
			Day:   RawPillar{Stem: 4, Branch: 4},  // 戊辰
		},
		RawPillars{
			Year:  RawPillar{Stem: 4, Branch: 6},  // 戊午
			Month: RawPillar{Stem: 7, Branch: 7},  // 辛未
			Day:   RawPillar{Stem: 8, Branch: 10}, // 壬戌
		},
	)
	if conflictDoc.Metrics.NetIndex == nil {
		t.Fatal("netIndex nil")
	}
	if *conflictDoc.Metrics.NetIndex > 0 {
		t.Errorf("conflict-dominant pair netIndex = %.4f, want <= 0", *conflictDoc.Metrics.NetIndex)
	}
}

// sensitivity 가 confidence 낮을수록 높은지 검증
func TestBuildPairDocAt_SensitivityVsConfidence(t *testing.T) {
	// KNOWN pair → confidence 0.90
	knownDoc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
			Hour:  &RawPillar{Stem: 9, Branch: 3},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
			Hour:  &RawPillar{Stem: 2, Branch: 8},
		},
	)
	// MISSING pair → confidence 0.72
	missingDoc := mustBuildPairDoc(t,
		RawPillars{
			Year:  RawPillar{Stem: 6, Branch: 6},
			Month: RawPillar{Stem: 7, Branch: 5},
			Day:   RawPillar{Stem: 4, Branch: 10},
		},
		RawPillars{
			Year:  RawPillar{Stem: 1, Branch: 1},
			Month: RawPillar{Stem: 6, Branch: 8},
			Day:   RawPillar{Stem: 8, Branch: 4},
		},
	)

	sKnown := *knownDoc.Metrics.Sensitivity
	sMissing := *missingDoc.Metrics.Sensitivity
	// 같은 사주 기반이므로 netIndex 유사 → confidence 차이가 sensitivity 차이를 만듦
	// sensitivity = (1-confidence)*100 + |netIndex|*0.2
	// confidence 낮을수록 sensitivity 높아야 함
	confKnown := *knownDoc.Metrics.Confidence
	confMissing := *missingDoc.Metrics.Confidence
	if confMissing >= confKnown {
		t.Fatalf("confidence: missing=%.4f should be < known=%.4f", confMissing, confKnown)
	}
	// netIndex 가 동일하다면 sensitivity 는 missing 이 더 커야 함
	// 실제로는 3주 vs 4주 차이로 netIndex 도 다를 수 있으므로 공식 직접 검증
	netKnown := math.Abs(*knownDoc.Metrics.NetIndex)
	netMissing := math.Abs(*missingDoc.Metrics.NetIndex)
	expectedSKnown := clamp(0, 100, (1.0-confKnown)*100.0+netKnown*0.2)
	expectedSMissing := clamp(0, 100, (1.0-confMissing)*100.0+netMissing*0.2)
	if math.Abs(sKnown-expectedSKnown) > 0.01 {
		t.Errorf("known sensitivity = %.4f, expected %.4f", sKnown, expectedSKnown)
	}
	if math.Abs(sMissing-expectedSMissing) > 0.01 {
		t.Errorf("missing sensitivity = %.4f, expected %.4f", sMissing, expectedSMissing)
	}
}

// ── 헬퍼 함수 ──

func mustBuildDocForPair(t *testing.T, raw RawPillars, prec TimePrecision, dt string) *SajuDoc {
	t.Helper()
	doc, err := BuildSajuDocAt(BirthInput{
		DtLocal:  dt,
		Tz:       "Asia/Seoul",
		TimePrec: prec,
		Sex:      "M",
		Engine:   Engine{Name: "sxtwl", Ver: "1"},
	}, raw, time.Now().UTC())
	if err != nil {
		t.Fatalf("BuildSajuDocAt() error = %v", err)
	}
	return doc
}

func mustBuildPairDoc(t *testing.T, rawA, rawB RawPillars) *PairDoc {
	t.Helper()
	return mustBuildPairDocAt(t, rawA, rawB, time.Now().UTC())
}

func mustBuildPairDocAt(t *testing.T, rawA, rawB RawPillars, now time.Time) *PairDoc {
	t.Helper()
	precA := TimePrecisionMinute
	dtA := "1990-05-15 10:24"
	if rawA.Hour == nil {
		precA = TimePrecisionUnknown
		dtA = "1990-05-15"
	}
	precB := TimePrecisionMinute
	dtB := "1992-11-03 16:40"
	if rawB.Hour == nil {
		precB = TimePrecisionUnknown
		dtB = "1992-11-03"
	}
	aDoc := mustBuildDocForPair(t, rawA, precA, dtA)
	bDoc := mustBuildDocForPair(t, rawB, precB, dtB)
	doc, err := BuildPairDocAt(PairInput{
		A:      aDoc.Input,
		B:      bDoc.Input,
		Engine: Engine{Name: "pair_engine", Ver: "1"},
	}, aDoc, bDoc, now)
	if err != nil {
		t.Fatalf("BuildPairDocAt() error = %v", err)
	}
	return doc
}

func findPairEval(evals []PairEvalItem, kind PairEvalKind) *PairEvalItem {
	for i := range evals {
		if evals[i].K == kind {
			return &evals[i]
		}
	}
	return nil
}
