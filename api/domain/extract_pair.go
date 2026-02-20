package domain

import (
	"fmt"
	"math"
	"sort"
	"time"
)

type PairFactKind string  // 궁합 팩트 종류
type PairEvalKind string  // 궁합 평가 분류
type PairMetricKey string // 궁합 정량 지표 키
type PairEdgeId uint32    // 궁합 교차 관계 ID

// ── 평가 분류 ──

const (
	PairEvalHarmony    PairEvalKind = "HARMONY"
	PairEvalConflict   PairEvalKind = "CONFLICT"
	PairEvalComplement PairEvalKind = "COMPLEMENT"
	PairEvalRoleFit    PairEvalKind = "ROLE_FIT"
	PairEvalTiming     PairEvalKind = "TIMING"
	PairEvalOverall    PairEvalKind = "OVERALL"
)

// ── 지표 키(메트릭 스냅샷) ──

const (
	PairMetricHarmonyIndex      PairMetricKey = "harmonyIndex"
	PairMetricConflictIndex     PairMetricKey = "conflictIndex"
	PairMetricNetIndex          PairMetricKey = "netIndex"
	PairMetricElementComplement PairMetricKey = "elementComplement"
	PairMetricUsefulGodSupport  PairMetricKey = "usefulGodSupport"
	PairMetricRoleFit           PairMetricKey = "roleFit"
	PairMetricPressureRisk      PairMetricKey = "pressureRisk"
	PairMetricConfidence        PairMetricKey = "confidence"
	PairMetricSensitivity       PairMetricKey = "sensitivity"
	PairMetricTimingAlignment   PairMetricKey = "timingAlignment"
)

// ── 입력/차트 참조 ──

type PairInput struct {
	A       BirthInput `json:"a"`                 // 사람 A 입력
	B       BirthInput `json:"b"`                 // 사람 B 입력
	Engine  Engine     `json:"engine"`            // 궁합 엔진/룰셋 메타
	RuleSet string     `json:"ruleSet,omitempty"` // 선택된 룰셋 이름
}

type PairCharts struct {
	A *SajuDoc `json:"a,omitempty"` // 사람 A 사주 문서
	B *SajuDoc `json:"b,omitempty"` // 사람 B 사주 문서
}

// ── 교차 관계(궁합 관계선) ──

type PairEdge struct {
	ID       PairEdgeId    `json:"id"`                 // 관계 ID
	T        RelType       `json:"t"`                  // 관계 타입 (합/충/형/해/파/원진 등)
	A        NodeId        `json:"a"`                  // A 측 노드 ID
	B        NodeId        `json:"b"`                  // B 측 노드 ID
	W        *float64      `json:"w,omitempty"`        // 가중치(옵션)
	RefsA    []NodeId      `json:"refsA,omitempty"`    // A 측 성립 기여 노드
	RefsB    []NodeId      `json:"refsB,omitempty"`    // B 측 성립 기여 노드
	Result   *FiveEl       `json:"result,omitempty"`   // 합화 결과 오행(옵션)
	Active   *bool         `json:"active,omitempty"`   // 실제 성립(작용) 여부
	Evidence *PairEvidence `json:"evidence,omitempty"` // 근거(옵션)
}

// ── 근거·점수 ──

type PairEvidence struct {
	RuleId  string             `json:"ruleId"`          // 규칙 ID
	RuleVer string             `json:"ruleVer"`         // 규칙 버전
	Sys     string             `json:"sys,omitempty"`   // 유파/모드
	Inputs  PairEvidenceInputs `json:"inputs"`          // 근거 입력
	Notes   string             `json:"notes,omitempty"` // 한줄 메모
}

type PairEvidenceInputs struct {
	NodesA []NodeId       `json:"nodesA"`           // A 측 참조 노드
	NodesB []NodeId       `json:"nodesB"`           // B 측 참조 노드
	Params map[string]any `json:"params,omitempty"` // 규칙 파라미터
}

type PairScorePart struct {
	Label string   `json:"label"`           // 기여요소
	W     float64  `json:"w"`               // 가중치
	Raw   float64  `json:"raw"`             // 원점수
	RefsA []NodeId `json:"refsA,omitempty"` // A 측 기여 노드
	RefsB []NodeId `json:"refsB,omitempty"` // B 측 기여 노드
	Note  string   `json:"note,omitempty"`  // 짧은 메모
}

type PairScore struct {
	Total      float64         `json:"total"`           // 결론 점수
	Min        float64         `json:"min"`             // 스케일 최소
	Max        float64         `json:"max"`             // 스케일 최대
	Norm0_100  uint8           `json:"norm0_100"`       // UI용 0~100
	Confidence float64         `json:"confidence"`      // 0~1
	Parts      []PairScorePart `json:"parts,omitempty"` // 분해(옵션)
}

// ── 팩트·평가 ──

type PairFactItem struct {
	ID       string       `json:"id"`              // 안정적 ID
	K        PairFactKind `json:"k"`               // 팩트 종류
	N        string       `json:"n"`               // 이름
	V        any          `json:"v,omitempty"`     // 값(옵션)
	RefsA    []NodeId     `json:"refsA"`           // A 측 원인 노드
	RefsB    []NodeId     `json:"refsB"`           // B 측 원인 노드
	Evidence PairEvidence `json:"evidence"`        // 근거
	Score    *PairScore   `json:"score,omitempty"` // 영향도(옵션)
}

type PairEvalItem struct {
	ID       string       `json:"id"`          // 안정적 ID
	K        PairEvalKind `json:"k"`           // 평가 분류
	N        string       `json:"n"`           // 이름
	V        any          `json:"v,omitempty"` // 결과(복합 가능)
	RefsA    []NodeId     `json:"refsA"`       // A 측 기여 노드
	RefsB    []NodeId     `json:"refsB"`       // B 측 기여 노드
	Evidence PairEvidence `json:"evidence"`    // 근거
	Score    PairScore    `json:"score"`       // 평가는 점수 필수
}

// ── 궁합 메트릭 스냅샷(빠른 참조용) ──

type PairMetrics struct {
	HarmonyIndex      *float64 `json:"harmonyIndex,omitempty"`      // 합/삼합/생 가중치 합
	ConflictIndex     *float64 `json:"conflictIndex,omitempty"`     // 충/형/해/파/원진 패널티 합
	NetIndex          *float64 `json:"netIndex,omitempty"`          // harmony - conflict
	ElementComplement *float64 `json:"elementComplement,omitempty"` // 오행 상호 보완
	UsefulGodSupport  *float64 `json:"usefulGodSupport,omitempty"`  // 용/희신 상호 지원
	RoleFit           *float64 `json:"roleFit,omitempty"`           // 십성 역할 정합도
	PressureRisk      *float64 `json:"pressureRisk,omitempty"`      // 갈등 압력 지표
	Confidence        *float64 `json:"confidence,omitempty"`        // 룰 충돌/입력 불확실 반영
	Sensitivity       *float64 `json:"sensitivity,omitempty"`       // 단일 요인 민감도
	TimingAlignment   *float64 `json:"timingAlignment,omitempty"`   // 시기 변동성(옵션)
}

// ── 궁합 시주 미상/후보 조합 확장 ──

type PairHourChoice struct {
	Status         HourPillarStatus `json:"status"`                   // KNOWN|MISSING|ESTIMATED
	CandidateOrder *int             `json:"candidateOrder,omitempty"` // 해당 개인의 HourCandidate.Order 참조
	Pillar         *Pillar          `json:"pillar,omitempty"`         // 선택/확정된 시주 (K=="H")
	TimeWindow     string           `json:"timeWindow,omitempty"`     // 현지시각 구간 (예: "23:00-00:59")
	Weight         *float64         `json:"weight,omitempty"`         // 개인 후보 가중치 0..1
}

type PairHourCandidate struct {
	Order        int            `json:"order"`                  // 우선순위 (1..N)
	A            PairHourChoice `json:"a"`                      // A 측 후보 선택
	B            PairHourChoice `json:"b"`                      // B 측 후보 선택
	Weight       *float64       `json:"weight,omitempty"`       // 조합 가중치 0..1
	AddedEdges   []PairEdgeId   `json:"addedEdges,omitempty"`   // 이 조합에서만 추가되는 pair edge
	AddedFacts   []string       `json:"addedFacts,omitempty"`   // 이 조합에서만 추가되는 PairFactItem.ID
	AddedEvals   []string       `json:"addedEvals,omitempty"`   // 이 조합에서만 추가되는 PairEvalItem.ID
	MetricsDelta *PairMetrics   `json:"metricsDelta,omitempty"` // 기준 대비 메트릭 변화량
	OverallScore *PairScore     `json:"overallScore,omitempty"` // 조합별 종합 점수(옵션)
	Note         string         `json:"note,omitempty"`         // 짧은 설명
}

type PairHourContext struct {
	StatusA        HourPillarStatus    `json:"statusA"`                  // A 시주 상태
	StatusB        HourPillarStatus    `json:"statusB"`                  // B 시주 상태
	MissingReasonA string              `json:"missingReasonA,omitempty"` // 예: "NO_BIRTH_TIME"
	MissingReasonB string              `json:"missingReasonB,omitempty"` // 예: "NO_BIRTH_TIME"
	StableEdges    []PairEdgeId        `json:"stableEdges,omitempty"`    // 시주와 무관하게 유지되는 pair edge
	StableFacts    []string            `json:"stableFacts,omitempty"`    // 시주와 무관하게 유지되는 PairFactItem.ID
	StableEvals    []string            `json:"stableEvals,omitempty"`    // 시주와 무관하게 유지되는 PairEvalItem.ID
	Candidates     []PairHourCandidate `json:"candidates,omitempty"`     // 후보 시주 조합 세트
}

// ── 최상위 문서 ──

type PairDoc struct {
	SchemaVer string           `json:"schemaVer"`           // 스키마 버전
	Input     PairInput        `json:"input"`               // A/B 입력 + 엔진
	Charts    *PairCharts      `json:"charts,omitempty"`    // A/B 사주 원문서(옵션)
	Edges     []PairEdge       `json:"edges,omitempty"`     // 교차 관계
	Metrics   *PairMetrics     `json:"metrics,omitempty"`   // 정량 지표 스냅샷
	Facts     []PairFactItem   `json:"facts,omitempty"`     // 파생 팩트
	Evals     []PairEvalItem   `json:"evals"`               // 평가 결과
	HourCtx   *PairHourContext `json:"hourCtx,omitempty"`   // 시주 확정/미상/추정 및 후보조합별 추가정보
	CreatedAt string           `json:"createdAt,omitempty"` // 문서 생성/계산 시점 (ISO 8601)
}

func BuildPairDoc(input PairInput, aDoc, bDoc *SajuDoc) (*PairDoc, error) {
	return BuildPairDocAt(input, aDoc, bDoc, time.Now().UTC())
}

// BuildPairDocAt:
// 1) A/B 사주 문서에서 동일 주차 교차 관계를 생성
// 2) 조화/충돌/보완 계열 메트릭 계산
// 3) Pair Fact/Eval 및 시주 조합 컨텍스트를 구성한다.
func BuildPairDocAt(input PairInput, aDoc, bDoc *SajuDoc, now time.Time) (*PairDoc, error) {
	if aDoc == nil || bDoc == nil {
		return nil, fmt.Errorf("both saju documents are required")
	}
	if len(aDoc.Pillars) < 3 || len(bDoc.Pillars) < 3 {
		return nil, fmt.Errorf("both charts must contain at least year/month/day pillars")
	}

	pillarA := mapPillarByKey(aDoc.Pillars)
	pillarB := mapPillarByKey(bDoc.Pillars)
	stemNodeA, branchNodeA, pillarByNodeA := mapMainNodesByPillar(aDoc.Nodes)
	stemNodeB, branchNodeB, pillarByNodeB := mapMainNodesByPillar(bDoc.Nodes)

	ordered := []PillarKey{"Y", "M", "D", "H"}
	edges := make([]PairEdge, 0, 24)
	nextEdgeID := PairEdgeId(1)
	addPairEdge := func(ruleID string, spec edgeSpec, aNode, bNode Node) {
		w := spec.Weight
		active := true
		edge := PairEdge{
			ID:     nextEdgeID,
			T:      spec.Type,
			A:      aNode.ID,
			B:      bNode.ID,
			W:      &w,
			RefsA:  []NodeId{aNode.ID},
			RefsB:  []NodeId{bNode.ID},
			Result: spec.Result,
			Active: &active,
			Evidence: &PairEvidence{
				RuleId:  ruleID,
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: []NodeId{aNode.ID},
					NodesB: []NodeId{bNode.ID},
				},
			},
		}
		edges = append(edges, edge)
		nextEdgeID++
	}

	// 같은 기둥 위치(Y/M/D/H)끼리 stem/branch 관계를 계산한다.
	for _, key := range ordered {
		pA, okA := pillarA[key]
		pB, okB := pillarB[key]
		if !okA || !okB {
			continue
		}
		sA, sAOK := stemNodeA[key]
		sB, sBOK := stemNodeB[key]
		if sAOK && sBOK {
			if spec, ok := stemRelationSpec(pA.Stem, pB.Stem); ok {
				addPairEdge("rule.pair.stem_relation", spec, sA, sB)
			}
		}
		bA, bAOK := branchNodeA[key]
		bB, bBOK := branchNodeB[key]
		if bAOK && bBOK {
			specs := branchRelationSpecs(pA.Branch, pB.Branch)
			for _, spec := range specs {
				addPairEdge("rule.pair.branch_relation", spec, bA, bB)
			}
		}
	}

	harmonyRaw := 0.0
	conflictRaw := 0.0
	// 교차 관계를 조화/충돌 그룹으로 집계해 기본 지표를 만든다.
	for _, edge := range edges {
		weight := 1.0
		if edge.W != nil {
			weight = *edge.W
		}
		switch edge.T {
		case relHe, relSamhap:
			harmonyRaw += weight
		case relChong, relHyung, relHae, relPo:
			conflictRaw += weight
		}
	}

	harmonyIndex := clamp(0, 100, harmonyRaw*12.0)
	conflictIndex := clamp(0, 100, conflictRaw*12.0)
	netIndex := clamp(-100, 100, harmonyIndex-conflictIndex)
	elementComplement := calcPairElementComplement(aDoc.ElBalance, bDoc.ElBalance)
	usefulGodSupport := calcUsefulGodSupport(aDoc, bDoc)
	roleFit := calcRoleFit(aDoc, bDoc)
	pressureRisk := clamp(0, 100, conflictIndex*0.85)
	confidence := calcPairConfidence(aDoc, bDoc)
	sensitivity := clamp(0, 100, (1.0-confidence)*100.0+math.Abs(netIndex)*0.2)
	timingAlignment := calcTimingAlignment(edges, pillarByNodeA, pillarByNodeB)

	metrics := &PairMetrics{
		HarmonyIndex:      float64Ptr(harmonyIndex),
		ConflictIndex:     float64Ptr(conflictIndex),
		NetIndex:          float64Ptr(netIndex),
		ElementComplement: float64Ptr(elementComplement),
		UsefulGodSupport:  float64Ptr(usefulGodSupport),
		RoleFit:           float64Ptr(roleFit),
		PressureRisk:      float64Ptr(pressureRisk),
		Confidence:        float64Ptr(confidence),
		Sensitivity:       float64Ptr(sensitivity),
		TimingAlignment:   float64Ptr(timingAlignment),
	}

	relationStats := map[string]int{}
	for _, edge := range edges {
		relationStats[string(edge.T)]++
	}
	dominantRel := dominantRelation(relationStats)

	facts := []PairFactItem{
		{
			ID:    "pair.fact.relation_summary",
			K:     "RELATION_SUMMARY",
			N:     "교차 관계 분포",
			V:     relationStats,
			RefsA: collectPairRefs(edges, true),
			RefsB: collectPairRefs(edges, false),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.relation_summary",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectPairRefs(edges, true),
					NodesB: collectPairRefs(edges, false),
				},
				Notes: "동일 주차 A/B 교차 관계 집계",
			},
		},
		{
			ID:    "pair.fact.dominant_relation",
			K:     "DOMINANT_RELATION",
			N:     "우세 관계",
			V:     dominantRel,
			RefsA: collectPairRefsByRelation(edges, dominantRel, true),
			RefsB: collectPairRefsByRelation(edges, dominantRel, false),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.dominant_relation",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectPairRefsByRelation(edges, dominantRel, true),
					NodesB: collectPairRefsByRelation(edges, dominantRel, false),
				},
				Notes: "관계 빈도 최댓값 기준",
			},
		},
		{
			ID:    "pair.fact.element_complement",
			K:     "ELEMENT_COMPLEMENT",
			N:     "오행 보완도",
			V:     elementComplement,
			RefsA: collectAllNodeIDs(aDoc.Nodes),
			RefsB: collectAllNodeIDs(bDoc.Nodes),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.element_complement",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectAllNodeIDs(aDoc.Nodes),
					NodesB: collectAllNodeIDs(bDoc.Nodes),
				},
				Notes: "양측 오행 분포 평균 균형도",
			},
			Score: pairScorePtr(newPairScore(elementComplement, 0, 100, confidence, nil)),
		},
	}

	netNorm := clamp(0, 100, (netIndex+100.0)/2.0)
	// 종합 점수는 순지수/보완/역할/압박을 가중 결합한다.
	overallRaw := clamp(0, 100, 0.45*netNorm+0.2*elementComplement+0.15*usefulGodSupport+0.2*roleFit-0.2*pressureRisk)

	evals := []PairEvalItem{
		{
			ID:    "pair.eval.harmony",
			K:     PairEvalHarmony,
			N:     "조화 지수",
			V:     harmonyIndex,
			RefsA: collectPairRefsByGroup(edges, true, relHe, relSamhap),
			RefsB: collectPairRefsByGroup(edges, false, relHe, relSamhap),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.eval.harmony",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectPairRefsByGroup(edges, true, relHe, relSamhap),
					NodesB: collectPairRefsByGroup(edges, false, relHe, relSamhap),
				},
				Notes: "합/삼합 가중 합산",
			},
			Score: newPairScore(harmonyIndex, 0, 100, confidence, []PairScorePart{
				{Label: "he_samhap", W: 1.0, Raw: harmonyRaw},
			}),
		},
		{
			ID:    "pair.eval.conflict",
			K:     PairEvalConflict,
			N:     "충돌 지수",
			V:     conflictIndex,
			RefsA: collectPairRefsByGroup(edges, true, relChong, relHyung, relHae, relPo),
			RefsB: collectPairRefsByGroup(edges, false, relChong, relHyung, relHae, relPo),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.eval.conflict",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectPairRefsByGroup(edges, true, relChong, relHyung, relHae, relPo),
					NodesB: collectPairRefsByGroup(edges, false, relChong, relHyung, relHae, relPo),
				},
				Notes: "충·형·해·파 가중 합산",
			},
			Score: newPairScore(conflictIndex, 0, 100, confidence, []PairScorePart{
				{Label: "conflict_relations", W: 1.0, Raw: conflictRaw},
			}),
		},
		{
			ID:    "pair.eval.complement",
			K:     PairEvalComplement,
			N:     "보완 지수",
			V:     elementComplement,
			RefsA: collectAllNodeIDs(aDoc.Nodes),
			RefsB: collectAllNodeIDs(bDoc.Nodes),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.eval.complement",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectAllNodeIDs(aDoc.Nodes),
					NodesB: collectAllNodeIDs(bDoc.Nodes),
				},
				Notes: "오행 분포 보완도",
			},
			Score: newPairScore(elementComplement, 0, 100, confidence, nil),
		},
		{
			ID:    "pair.eval.role_fit",
			K:     PairEvalRoleFit,
			N:     "십성 역할 정합도",
			V:     roleFit,
			RefsA: []NodeId{aDoc.DayMasterNodeID()},
			RefsB: []NodeId{bDoc.DayMasterNodeID()},
			Evidence: PairEvidence{
				RuleId:  "rule.pair.eval.role_fit",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: []NodeId{aDoc.DayMasterNodeID()},
					NodesB: []NodeId{bDoc.DayMasterNodeID()},
				},
				Notes: "양측 일간 상호 십성 기준",
			},
			Score: newPairScore(roleFit, 0, 100, confidence, nil),
		},
		{
			ID:    "pair.eval.timing",
			K:     PairEvalTiming,
			N:     "시기 정렬도",
			V:     timingAlignment,
			RefsA: collectPairRefsByPillar(edges, pillarByNodeA, "M", true),
			RefsB: collectPairRefsByPillar(edges, pillarByNodeB, "M", false),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.eval.timing",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectPairRefsByPillar(edges, pillarByNodeA, "M", true),
					NodesB: collectPairRefsByPillar(edges, pillarByNodeB, "M", false),
				},
				Notes: "월주 관계 중심 정렬도",
			},
			Score: newPairScore(timingAlignment, 0, 100, confidence, nil),
		},
		{
			ID:    "pair.eval.overall",
			K:     PairEvalOverall,
			N:     "궁합 종합 점수",
			V:     overallRaw,
			RefsA: collectPairRefs(edges, true),
			RefsB: collectPairRefs(edges, false),
			Evidence: PairEvidence{
				RuleId:  "rule.pair.eval.overall",
				RuleVer: "v1",
				Sys:     input.Engine.Sys,
				Inputs: PairEvidenceInputs{
					NodesA: collectPairRefs(edges, true),
					NodesB: collectPairRefs(edges, false),
				},
				Notes: "net/complement/useful/role/pressure 종합",
			},
			Score: newPairScore(overallRaw, 0, 100, confidence, []PairScorePart{
				{Label: "net_norm", W: 0.45, Raw: netNorm},
				{Label: "element_complement", W: 0.20, Raw: elementComplement},
				{Label: "useful_support", W: 0.15, Raw: usefulGodSupport},
				{Label: "role_fit", W: 0.20, Raw: roleFit},
				{Label: "pressure_risk", W: -0.20, Raw: pressureRisk},
			}),
		},
	}

	hourCtx := buildPairHourContext(aDoc, bDoc, edges, facts, evals, overallRaw, confidence)
	doc := &PairDoc{
		SchemaVer: "extract_pair.v1",
		Input:     input,
		Charts:    &PairCharts{A: aDoc, B: bDoc},
		Edges:     edges,
		Metrics:   metrics,
		Facts:     facts,
		Evals:     evals,
		HourCtx:   hourCtx,
		CreatedAt: now.UTC().Format(time.RFC3339),
	}
	return doc, nil
}

func (d *SajuDoc) DayMasterNodeID() NodeId {
	for _, n := range d.Nodes {
		if n.Kind == "STEM" && n.Pillar == "D" {
			return n.ID
		}
	}
	return 0
}

func buildPairHourContext(aDoc, bDoc *SajuDoc, edges []PairEdge, facts []PairFactItem, evals []PairEvalItem, overall, confidence float64) *PairHourContext {
	statusA, reasonA := deriveHourStatus(aDoc)
	statusB, reasonB := deriveHourStatus(bDoc)

	ctx := &PairHourContext{
		StatusA:        statusA,
		StatusB:        statusB,
		MissingReasonA: reasonA,
		MissingReasonB: reasonB,
		StableEdges:    collectPairEdgeIDs(edges),
		StableFacts:    collectPairFactIDs(facts),
		StableEvals:    collectPairEvalIDs(evals),
	}

	if statusA == HourKnown && statusB == HourKnown {
		return ctx
	}

	choicesA := buildHourChoicesFromDoc(aDoc)
	choicesB := buildHourChoicesFromDoc(bDoc)
	if len(choicesA) == 0 || len(choicesB) == 0 {
		return ctx
	}

	maxComb := 16
	order := 1
	// 후보 조합이 과도하게 커지지 않도록 상한(16) 내에서 조합한다.
	for _, aChoice := range choicesA {
		for _, bChoice := range choicesB {
			if order > maxComb {
				return ctx
			}
			weight := 1.0
			if aChoice.Weight != nil {
				weight *= *aChoice.Weight
			}
			if bChoice.Weight != nil {
				weight *= *bChoice.Weight
			}
			w := weight
			score := newPairScore(clamp(0, 100, overall*(0.8+0.2*weight)), 0, 100, clamp(0, 1, confidence*math.Max(0.6, weight)), nil)
			ctx.Candidates = append(ctx.Candidates, PairHourCandidate{
				Order:        order,
				A:            aChoice,
				B:            bChoice,
				Weight:       &w,
				OverallScore: &score,
				Note:         "hour-candidate projection",
			})
			order++
		}
	}
	return ctx
}

func buildHourChoicesFromDoc(doc *SajuDoc) []PairHourChoice {
	if doc == nil {
		return nil
	}
	status, _ := deriveHourStatus(doc)
	if status == HourKnown {
		p := doc.HourPillar()
		if p == nil {
			return []PairHourChoice{{Status: HourKnown}}
		}
		w := 1.0
		return []PairHourChoice{{
			Status: HourKnown,
			Pillar: p,
			Weight: &w,
		}}
	}

	if doc.HourCtx == nil || len(doc.HourCtx.Candidates) == 0 {
		return []PairHourChoice{{Status: status}}
	}

	maxChoices := len(doc.HourCtx.Candidates)
	if maxChoices > 4 {
		maxChoices = 4
	}
	ret := make([]PairHourChoice, 0, maxChoices)
	for i := 0; i < maxChoices; i++ {
		c := doc.HourCtx.Candidates[i]
		order := c.Order
		ret = append(ret, PairHourChoice{
			Status:         status,
			CandidateOrder: &order,
			Pillar:         &c.Pillar,
			TimeWindow:     c.TimeWindow,
			Weight:         c.Weight,
		})
	}
	return ret
}

func (d *SajuDoc) HourPillar() *Pillar {
	for _, p := range d.Pillars {
		if p.K == "H" {
			cp := p
			return &cp
		}
	}
	return nil
}

func deriveHourStatus(doc *SajuDoc) (HourPillarStatus, string) {
	if doc == nil {
		return HourMissing, "NO_CHART"
	}
	if doc.HourCtx != nil {
		return doc.HourCtx.Status, doc.HourCtx.MissingReason
	}
	if doc.HourPillar() != nil {
		return HourKnown, ""
	}
	return HourMissing, "NO_BIRTH_TIME"
}

func mapPillarByKey(pillars []Pillar) map[PillarKey]Pillar {
	ret := make(map[PillarKey]Pillar, len(pillars))
	for _, p := range pillars {
		ret[p.K] = p
	}
	return ret
}

func mapMainNodesByPillar(nodes []Node) (map[PillarKey]Node, map[PillarKey]Node, map[NodeId]PillarKey) {
	stems := map[PillarKey]Node{}
	branches := map[PillarKey]Node{}
	pillarByNode := map[NodeId]PillarKey{}
	for _, n := range nodes {
		pillarByNode[n.ID] = n.Pillar
		if n.Kind == "STEM" {
			if _, exists := stems[n.Pillar]; !exists {
				stems[n.Pillar] = n
			}
		} else if n.Kind == "BRANCH" {
			if _, exists := branches[n.Pillar]; !exists {
				branches[n.Pillar] = n
			}
		}
	}
	return stems, branches, pillarByNode
}

func collectAllNodeIDs(nodes []Node) []NodeId {
	out := make([]NodeId, 0, len(nodes))
	for _, n := range nodes {
		out = append(out, n.ID)
	}
	return out
}

func collectPairRefs(edges []PairEdge, aSide bool) []NodeId {
	seen := map[NodeId]bool{}
	out := make([]NodeId, 0, len(edges))
	for _, edge := range edges {
		var id NodeId
		if aSide {
			id = edge.A
		} else {
			id = edge.B
		}
		if !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

func collectPairRefsByRelation(edges []PairEdge, relation string, aSide bool) []NodeId {
	seen := map[NodeId]bool{}
	out := make([]NodeId, 0)
	for _, edge := range edges {
		if string(edge.T) != relation {
			continue
		}
		var id NodeId
		if aSide {
			id = edge.A
		} else {
			id = edge.B
		}
		if !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

func collectPairRefsByGroup(edges []PairEdge, aSide bool, groups ...RelType) []NodeId {
	allow := map[RelType]bool{}
	for _, g := range groups {
		allow[g] = true
	}
	seen := map[NodeId]bool{}
	out := make([]NodeId, 0)
	for _, edge := range edges {
		if !allow[edge.T] {
			continue
		}
		var id NodeId
		if aSide {
			id = edge.A
		} else {
			id = edge.B
		}
		if !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

func collectPairRefsByPillar(edges []PairEdge, pillarByNode map[NodeId]PillarKey, pillar PillarKey, aSide bool) []NodeId {
	seen := map[NodeId]bool{}
	out := make([]NodeId, 0)
	for _, edge := range edges {
		var id NodeId
		if aSide {
			id = edge.A
		} else {
			id = edge.B
		}
		if pillarByNode[id] != pillar {
			continue
		}
		if !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

func collectPairEdgeIDs(edges []PairEdge) []PairEdgeId {
	out := make([]PairEdgeId, 0, len(edges))
	for _, edge := range edges {
		out = append(out, edge.ID)
	}
	return out
}

func collectPairFactIDs(facts []PairFactItem) []string {
	out := make([]string, 0, len(facts))
	for _, fact := range facts {
		out = append(out, fact.ID)
	}
	return out
}

func collectPairEvalIDs(evals []PairEvalItem) []string {
	out := make([]string, 0, len(evals))
	for _, eval := range evals {
		out = append(out, eval.ID)
	}
	return out
}

func dominantRelation(stats map[string]int) string {
	if len(stats) == 0 {
		return "NONE"
	}
	type pair struct {
		K string
		V int
	}
	arr := make([]pair, 0, len(stats))
	for k, v := range stats {
		arr = append(arr, pair{K: k, V: v})
	}
	sort.Slice(arr, func(i, j int) bool {
		if arr[i].V == arr[j].V {
			return arr[i].K < arr[j].K
		}
		return arr[i].V > arr[j].V
	})
	return arr[0].K
}

func calcPairElementComplement(a, b *ElDistribution) float64 {
	if a == nil || b == nil {
		return 50
	}
	avg := []float64{
		(a.Wood + b.Wood) / 2.0,
		(a.Fire + b.Fire) / 2.0,
		(a.Earth + b.Earth) / 2.0,
		(a.Metal + b.Metal) / 2.0,
		(a.Water + b.Water) / 2.0,
	}
	diff := 0.0
	for _, v := range avg {
		diff += math.Abs(v - 0.2)
	}
	return clamp(0, 100, (1.0-diff/1.6)*100.0)
}

func calcUsefulGodSupport(aDoc, bDoc *SajuDoc) float64 {
	if aDoc == nil || bDoc == nil || aDoc.ElBalance == nil || bDoc.ElBalance == nil {
		return 50
	}
	aVals := []float64{aDoc.ElBalance.Wood, aDoc.ElBalance.Fire, aDoc.ElBalance.Earth, aDoc.ElBalance.Metal, aDoc.ElBalance.Water}
	bVals := []float64{bDoc.ElBalance.Wood, bDoc.ElBalance.Fire, bDoc.ElBalance.Earth, bDoc.ElBalance.Metal, bDoc.ElBalance.Water}

	aDm := fiveElementIdx(stemElement(aDoc.DayMaster))
	bDm := fiveElementIdx(stemElement(bDoc.DayMaster))
	aRes := mod5(aDm + 4)
	bRes := mod5(bDm + 4)

	supportA := bVals[aDm] + bVals[aRes]
	supportB := aVals[bDm] + aVals[bRes]
	return clamp(0, 100, ((supportA+supportB)/2.0)*100.0)
}

func calcRoleFit(aDoc, bDoc *SajuDoc) float64 {
	if aDoc == nil || bDoc == nil {
		return 50
	}
	tgAB := tenGodByStem(aDoc.DayMaster, bDoc.DayMaster)
	tgBA := tenGodByStem(bDoc.DayMaster, aDoc.DayMaster)
	return (tenGodRoleScore(tgAB) + tenGodRoleScore(tgBA)) / 2.0
}

func tenGodRoleScore(g TenGod) float64 {
	switch g {
	case JeongGwan, JeongIn, JeongJae:
		return 88
	case PyeonGwan, PyeonIn, PyeonJae:
		return 76
	case SikShin:
		return 72
	case SangGwan:
		return 48
	case BiGyeon:
		return 58
	case GeobJae:
		return 52
	default:
		return 60
	}
}

func calcTimingAlignment(edges []PairEdge, pillarByNodeA, pillarByNodeB map[NodeId]PillarKey) float64 {
	score := 50.0
	for _, edge := range edges {
		if pillarByNodeA[edge.A] != "M" || pillarByNodeB[edge.B] != "M" {
			continue
		}
		switch edge.T {
		case relHe, relSamhap:
			score += 10
		case relChong, relHyung, relHae, relPo:
			score -= 10
		}
	}
	return clamp(0, 100, score)
}

func calcPairConfidence(aDoc, bDoc *SajuDoc) float64 {
	statusA, _ := deriveHourStatus(aDoc)
	statusB, _ := deriveHourStatus(bDoc)
	conf := 0.90
	if statusA == HourEstimated || statusB == HourEstimated {
		conf = 0.80
	}
	if statusA == HourMissing || statusB == HourMissing {
		conf = 0.72
	}
	return conf
}

func float64Ptr(v float64) *float64 {
	x := v
	return &x
}

func newPairScore(total, min, max, confidence float64, parts []PairScorePart) PairScore {
	if max <= min {
		max = min + 1
	}
	norm := int(math.Round((total - min) * 100 / (max - min)))
	if norm < 0 {
		norm = 0
	}
	if norm > 100 {
		norm = 100
	}
	return PairScore{
		Total:      total,
		Min:        min,
		Max:        max,
		Norm0_100:  uint8(norm),
		Confidence: clamp(0, 1, confidence),
		Parts:      parts,
	}
}

func pairScorePtr(v PairScore) *PairScore {
	x := v
	return &x
}
