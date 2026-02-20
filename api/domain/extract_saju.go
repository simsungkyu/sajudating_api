// 사주를 기반으로 추출 데이터 표현하는 도메인 모델
package domain

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"time"
)

type StemId uint8     // 0..9
type BranchId uint8   // 0..11
type PillarKey string // "Y"|"M"|"D"|"H"
type NodeId uint32    // 내부참조 포인터
type EdgeId uint32

type NodeKind string // "STEM"|"BRANCH"|"HIDDEN"
type FiveEl string   // "WOOD"|"FIRE"|"EARTH"|"METAL"|"WATER"
type YinYang string  // "YIN"|"YANG"
type RelType string  // 관계 타입 (예: 合·沖·刑·害·破)
type FactKind string // 팩트 종류
type EvalKind string // 평가 종류
type TimePrecision string
type HourPillarStatus string

// ── 십성(十神) ──

type TenGod string

const (
	BiGyeon   TenGod = "BIGYEON"   // 비견(比肩)
	GeobJae   TenGod = "GEOBJAE"   // 겁재(劫財)
	SikShin   TenGod = "SIKSHIN"   // 식신(食神)
	SangGwan  TenGod = "SANGGWAN"  // 상관(傷官)
	PyeonJae  TenGod = "PYEONJAE"  // 편재(偏財)
	JeongJae  TenGod = "JEONGJAE"  // 정재(正財)
	PyeonGwan TenGod = "PYEONGWAN" // 편관(偏官)
	JeongGwan TenGod = "JEONGGWAN" // 정관(正官)
	PyeonIn   TenGod = "PYEONIN"   // 편인(偏印)
	JeongIn   TenGod = "JEONGIN"   // 정인(正印)
)

// ── 시간 입력/시주 상태 ──

const (
	TimePrecisionMinute  TimePrecision    = "MINUTE"    // 분 단위 시간 확정
	TimePrecisionHour    TimePrecision    = "HOUR"      // 시(2시간 단위) 정도만 확정
	TimePrecisionUnknown TimePrecision    = "UNKNOWN"   // 시간 미상
	HourKnown            HourPillarStatus = "KNOWN"     // 시주 확정
	HourMissing          HourPillarStatus = "MISSING"   // 시주 미상
	HourEstimated        HourPillarStatus = "ESTIMATED" // 시주 추정치 사용
)

// ── 십이운성(十二運星) ──

type TwelveFate string

const (
	JangSaeng TwelveFate = "JANGSAENG" // 장생(長生)
	MokYok    TwelveFate = "MOKYOK"    // 목욕(沐浴)
	GwanDae   TwelveFate = "GWANDAE"   // 관대(冠帶)
	GeonRok   TwelveFate = "GEONROK"   // 건록(建祿)
	JeWang    TwelveFate = "JEWANG"    // 제왕(帝旺)
	Swoe      TwelveFate = "SWOE"      // 쇠(衰)
	Byeong    TwelveFate = "BYEONG"    // 병(病)
	Sa        TwelveFate = "SA"        // 사(死)
	Myo       TwelveFate = "MYO"       // 묘(墓)
	Jeol      TwelveFate = "JEOL"      // 절(絕)
	Tae       TwelveFate = "TAE"       // 태(胎)
	Yang      TwelveFate = "YANG"      // 양(養)
)

// ── 입력 ──

type BirthInput struct {
	DtLocal    string        `json:"dtLocal"`              // ISO local datetime
	Tz         string        `json:"tz"`                   // IANA TZ
	Loc        *Geo          `json:"loc,omitempty"`        // 선택
	Calendar   string        `json:"calendar,omitempty"`   // "SOLAR"|"LUNAR"
	LeapMonth  *bool         `json:"leapMonth,omitempty"`  // 선택
	Sex        string        `json:"sex,omitempty"`        // "M"|"F"
	TimePrec   TimePrecision `json:"timePrec,omitempty"`   // MINUTE|HOUR|UNKNOWN
	Engine     Engine        `json:"engine"`               // 룰셋 메타
	SolarDt    string        `json:"solarDt,omitempty"`    // 음력 입력 시 양력 변환 결과
	AdjustedDt string        `json:"adjustedDt,omitempty"` // 진태양시 보정 후 적용 시간
	// 운세 계산 기준/범위 입력 (옵션): 기본은 dtLocal 기준 포인트만 계산
	FortuneBaseDt string `json:"fortuneBaseDt,omitempty"` // 운세 기준일시(없으면 dtLocal)
	SeunFromYear  *int   `json:"seunFromYear,omitempty"`  // 세운 범위 시작 연도(옵션)
	SeunToYear    *int   `json:"seunToYear,omitempty"`    // 세운 범위 종료 연도(옵션)
	WolunYear     *int   `json:"wolunYear,omitempty"`     // 월운 목록 대상 연도(옵션)
	IlunYear      *int   `json:"ilunYear,omitempty"`      // 일운 목록 대상 연도(옵션)
	IlunMonth     *int   `json:"ilunMonth,omitempty"`     // 일운 목록 대상 월(옵션, 1..12)
}

type Geo struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type Engine struct {
	Name   string         `json:"name"`             // 엔진명
	Ver    string         `json:"ver"`              // 엔진버전
	Sys    string         `json:"sys,omitempty"`    // 유파/모드
	Params map[string]any `json:"params,omitempty"` // 파라미터
}

// ── 사주 구조 ──

type Pillar struct {
	K        PillarKey  `json:"k"`                  // Y/M/D/H
	Stem     StemId     `json:"stem"`               // 천간
	Branch   BranchId   `json:"branch"`             // 지지
	Hidden   []StemId   `json:"hidden,omitempty"`   // 지장간(여기·중기·정기 순)
	NaEum    string     `json:"naEum,omitempty"`    // 납음오행 (예: "海中金")
	GongMang []BranchId `json:"gongMang,omitempty"` // 공망 지지 (2개)
}

type Node struct {
	ID       NodeId      `json:"id"`                 // 내부 ID
	Kind     NodeKind    `json:"kind"`               // STEM/BRANCH/HIDDEN
	Pillar   PillarKey   `json:"pillar"`             // Y/M/D/H
	Idx      *uint8      `json:"idx,omitempty"`      // HIDDEN 순서(옵션)
	Stem     *StemId     `json:"stem,omitempty"`     // kind=STEM/HIDDEN
	Branch   *BranchId   `json:"branch,omitempty"`   // kind=BRANCH
	El       FiveEl      `json:"el"`                 // 오행
	Yy       YinYang     `json:"yy"`                 // 음양
	TenGod   *TenGod     `json:"tenGod,omitempty"`   // 일간 기준 십성
	Twelve   *TwelveFate `json:"twelve,omitempty"`   // 일간 기준 십이운성 (BRANCH만)
	Strength *float64    `json:"strength,omitempty"` // 오행 세기/역량
}

type Edge struct {
	ID     EdgeId   `json:"id"`               // 관계 ID
	T      RelType  `json:"t"`                // 관계 타입
	A      NodeId   `json:"a"`                // endpoint A
	B      NodeId   `json:"b"`                // endpoint B
	W      *float64 `json:"w,omitempty"`      // 가중치(옵션)
	Refs   []NodeId `json:"refs,omitempty"`   // 성립 기여 노드(옵션)
	Result *FiveEl  `json:"result,omitempty"` // 합화(合化) 결과 오행
	Active *bool    `json:"active,omitempty"` // 실제 성립(작용) 여부
}

// ── 근거·점수 ──

type Evidence struct {
	RuleId  string         `json:"ruleId"`          // 규칙 ID
	RuleVer string         `json:"ruleVer"`         // 규칙 버전
	Sys     string         `json:"sys,omitempty"`   // 유파/모드
	Inputs  EvidenceInputs `json:"inputs"`          // 근거 입력
	Notes   string         `json:"notes,omitempty"` // 한줄 메모
}

type EvidenceInputs struct {
	Nodes  []NodeId       `json:"nodes"`            // 참조 노드들
	Params map[string]any `json:"params,omitempty"` // 규칙 파라미터
}

type ScorePart struct {
	Label string   `json:"label"`          // 기여요소
	W     float64  `json:"w"`              // 가중치
	Raw   float64  `json:"raw"`            // 원점수
	Refs  []NodeId `json:"refs,omitempty"` // 기여 노드
	Note  string   `json:"note,omitempty"` // 짧은 메모
}

type Score struct {
	Total      float64     `json:"total"`           // 결론 점수
	Min        float64     `json:"min"`             // 스케일 최소
	Max        float64     `json:"max"`             // 스케일 최대
	Norm0_100  uint8       `json:"norm0_100"`       // UI용 0~100
	Confidence float64     `json:"confidence"`      // 0~1
	Parts      []ScorePart `json:"parts,omitempty"` // 분해(옵션)
}

// ── 팩트·평가 ──

type FactItem struct {
	ID       string   `json:"id"`              // 안정적 ID
	K        FactKind `json:"k"`               // 팩트 종류
	N        string   `json:"n"`               // 이름
	V        any      `json:"v,omitempty"`     // 값(옵션)
	Refs     []NodeId `json:"refs"`            // 원인 노드
	Evidence Evidence `json:"evidence"`        // 근거
	Score    *Score   `json:"score,omitempty"` // 영향도(옵션)
}

type EvalItem struct {
	ID       string   `json:"id"`          // 안정적 ID
	K        EvalKind `json:"k"`           // 평가 종류
	N        string   `json:"n"`           // 이름
	V        any      `json:"v,omitempty"` // 결과(복합 가능)
	Refs     []NodeId `json:"refs"`        // 기여 노드
	Evidence Evidence `json:"evidence"`    // 근거
	Score    Score    `json:"score"`       // 평가는 점수 필수
}

// ── 대운(大運) ──

type DaeunPeriod struct {
	Type         string      `json:"type,omitempty"`         // 운 종류: DAEUN|SEUN|WOLUN|ILUN
	Order        int         `json:"order"`                  // 대운 순서 (1대운, 2대운...)
	Stem         StemId      `json:"stem"`                   // 천간
	Branch       BranchId    `json:"branch"`                 // 지지
	StemKo       string      `json:"stemKo,omitempty"`       // 천간 한글(예: 갑)
	StemHanja    string      `json:"stemHanja,omitempty"`    // 천간 한자(예: 甲)
	BranchKo     string      `json:"branchKo,omitempty"`     // 지지 한글(예: 자)
	BranchHanja  string      `json:"branchHanja,omitempty"`  // 지지 한자(예: 子)
	GanjiKo      string      `json:"ganjiKo,omitempty"`      // 간지 한글(예: 갑자)
	GanjiHanja   string      `json:"ganjiHanja,omitempty"`   // 간지 한자(예: 甲子)
	StemEl       FiveEl      `json:"stemEl,omitempty"`       // 천간 오행
	StemYy       YinYang     `json:"stemYy,omitempty"`       // 천간 음양
	StemTenGod   *TenGod     `json:"stemTenGod,omitempty"`   // 천간 십성(일간 기준)
	BranchEl     FiveEl      `json:"branchEl,omitempty"`     // 지지 오행
	BranchYy     YinYang     `json:"branchYy,omitempty"`     // 지지 음양
	BranchTenGod *TenGod     `json:"branchTenGod,omitempty"` // 지지 십성(일간 기준)
	BranchTwelve *TwelveFate `json:"branchTwelve,omitempty"` // 지지 십이운성(일간 기준)
	AgeFrom      int         `json:"ageFrom"`                // 시작 나이
	AgeTo        int         `json:"ageTo"`                  // 종료 나이
	StartYear    int         `json:"startYear"`              // 시작 연도(서기)
	Year         int         `json:"year,omitempty"`         // 기준 연도(세운/월운/일운)
	Month        int         `json:"month,omitempty"`        // 기준 월(월운/일운)
	Day          int         `json:"day,omitempty"`          // 기준 일(일운)
}

// ── 오행 분포 ──

type ElDistribution struct {
	Wood  float64 `json:"wood"`
	Fire  float64 `json:"fire"`
	Earth float64 `json:"earth"`
	Metal float64 `json:"metal"`
	Water float64 `json:"water"`
}

// ── 시주 미상/후보 시주 확장 ──

type HourCandidate struct {
	Order      int      `json:"order"`                // 우선순위 (1..N)
	Pillar     Pillar   `json:"pillar"`               // 후보 시주 (K=="H")
	TimeWindow string   `json:"timeWindow,omitempty"` // 현지시각 구간 (예: "23:00-00:59")
	Weight     *float64 `json:"weight,omitempty"`     // 0..1 신뢰도/가중치(옵션)
	AddedNodes []NodeId `json:"addedNodes,omitempty"` // 이 후보에서만 추가되는 노드
	AddedEdges []EdgeId `json:"addedEdges,omitempty"` // 이 후보에서만 추가되는 관계
	AddedFacts []string `json:"addedFacts,omitempty"` // 이 후보에서만 추가되는 FactItem.ID
	AddedEvals []string `json:"addedEvals,omitempty"` // 이 후보에서만 추가되는 EvalItem.ID
}

type HourContext struct {
	Status        HourPillarStatus `json:"status"`                  // KNOWN|MISSING|ESTIMATED
	MissingReason string           `json:"missingReason,omitempty"` // 예: "NO_BIRTH_TIME"
	StableNodes   []NodeId         `json:"stableNodes,omitempty"`   // 시주와 무관하게 유지되는 노드
	StableEdges   []EdgeId         `json:"stableEdges,omitempty"`   // 시주와 무관하게 유지되는 관계
	StableFacts   []string         `json:"stableFacts,omitempty"`   // 시주와 무관하게 유지되는 FactItem.ID
	StableEvals   []string         `json:"stableEvals,omitempty"`   // 시주와 무관하게 유지되는 EvalItem.ID
	Candidates    []HourCandidate  `json:"candidates,omitempty"`    // 시주 미상/추정 시 후보 세트
}

// ── 최상위 문서 ──

type SajuDoc struct {
	SchemaVer     string          `json:"schemaVer"`               // 스키마 버전
	Input         BirthInput      `json:"input"`                   // 입력
	Pillars       []Pillar        `json:"pillars"`                 // 기본 4주(Y,M,D,H); 생시 미상은 H 제외 len==3 허용
	Nodes         []Node          `json:"nodes"`                   // 노드들
	Edges         []Edge          `json:"edges,omitempty"`         // 관계(옵션)
	Facts         []FactItem      `json:"facts"`                   // 파생 팩트
	Evals         []EvalItem      `json:"evals"`                   // 평가 결과
	DayMaster     StemId          `json:"dayMaster"`               // 일간(나 자신)
	Daeun         *DaeunPeriod    `json:"daeun,omitempty"`         // 기준 시점 대운
	Seun          *DaeunPeriod    `json:"seun,omitempty"`          // 기준 시점 세운
	Wolun         *DaeunPeriod    `json:"wolun,omitempty"`         // 기준 시점 월운
	Ilun          *DaeunPeriod    `json:"ilun,omitempty"`          // 기준 시점 일운
	DaeunList     []DaeunPeriod   `json:"daeunList,omitempty"`     // 대운 목록
	SeunList      []DaeunPeriod   `json:"seunList,omitempty"`      // 세운 목록(요청 시)
	WolunList     []DaeunPeriod   `json:"wolunList,omitempty"`     // 월운 목록(요청 시)
	IlunList      []DaeunPeriod   `json:"ilunList,omitempty"`      // 일운 목록(요청 시)
	ElBalance     *ElDistribution `json:"elBalance,omitempty"`     // 오행 분포
	HourCtx       *HourContext    `json:"hourCtx,omitempty"`       // 시주 확정/미상/추정 및 후보별 추가정보
	EmptyBranches []BranchId      `json:"emptyBranches,omitempty"` // 일주(일간·일지) 기준 공망 지지 2개; 비어있으면 미계산
	CreatedAt     string          `json:"createdAt,omitempty"`     // 문서 생성/계산 시점 (ISO 8601)
}

type RawPillar struct {
	Stem   StemId
	Branch BranchId
}

type RawPillars struct {
	Year  RawPillar
	Month RawPillar
	Day   RawPillar
	Hour  *RawPillar
}

const (
	relPillar RelType = "PILLAR"
	relHidden RelType = "HIDDEN"
	relHe     RelType = "HE"
	relChong  RelType = "CHONG"
	relHyung  RelType = "HYUNG"
	relHae    RelType = "HAE"
	relPo     RelType = "PO"
	relSamhap RelType = "SAMHAP"
)

const (
	fortuneTypeDaeun = "DAEUN"
	fortuneTypeSeun  = "SEUN"
	fortuneTypeWolun = "WOLUN"
	fortuneTypeIlun  = "ILUN"
)

var (
	errInvalidPillarIndex = errors.New("invalid stem/branch index")
	errParityMismatch     = errors.New("stem/branch parity mismatch (not a valid sexagenary pair)")

	stemFiveEl = [10]FiveEl{
		"WOOD", "WOOD", "FIRE", "FIRE", "EARTH",
		"EARTH", "METAL", "METAL", "WATER", "WATER",
	}

	branchFiveEl = [12]FiveEl{
		"WATER", "EARTH", "WOOD", "WOOD", "EARTH", "FIRE",
		"FIRE", "EARTH", "METAL", "METAL", "EARTH", "WATER",
	}

	stemKorChars     = [10]string{"갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"}
	stemHanjaChars   = [10]string{"甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"}
	branchKorChars   = [12]string{"자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"}
	branchHanjaChars = [12]string{"子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"}

	hiddenStemTable = [12][]StemId{
		{9},       // 子 癸
		{5, 9, 7}, // 丑 己癸辛
		{0, 2, 4}, // 寅 甲丙戊
		{1},       // 卯 乙
		{4, 1, 9}, // 辰 戊乙癸
		{2, 4, 6}, // 巳 丙戊庚
		{3, 5},    // 午 丁己
		{5, 3, 1}, // 未 己丁乙
		{6, 8, 4}, // 申 庚壬戊
		{7},       // 酉 辛
		{4, 7, 3}, // 戌 戊辛丁
		{8, 0},    // 亥 壬甲
	}

	naEumByCycle = [30]string{
		"海中金", "炉中火", "大林木", "路旁土", "剑锋金",
		"山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
		"泉中水", "屋上土", "霹雳火", "松柏木", "长流水",
		"砂中金", "山下火", "平地木", "壁上土", "金箔金",
		"覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木",
		"大溪水", "沙中土", "天上火", "石榴木", "大海水",
	}

	twelveFateOrder = [12]TwelveFate{
		JangSaeng, MokYok, GwanDae, GeonRok, JeWang, Swoe,
		Byeong, Sa, Myo, Jeol, Tae, Yang,
	}

	twelveFateStartBranch = [10]BranchId{
		11, // 甲
		6,  // 乙
		2,  // 丙
		9,  // 丁
		2,  // 戊
		9,  // 己
		5,  // 庚
		0,  // 辛
		8,  // 壬
		3,  // 癸
	}

	pillarStrengthWeight = map[PillarKey]float64{
		"Y": 0.90,
		"M": 1.30,
		"D": 1.10,
		"H": 0.80,
	}

	hourTimeWindows = [12]string{
		"23:00-00:59",
		"01:00-02:59",
		"03:00-04:59",
		"05:00-06:59",
		"07:00-08:59",
		"09:00-10:59",
		"11:00-12:59",
		"13:00-14:59",
		"15:00-16:59",
		"17:00-18:59",
		"19:00-20:59",
		"21:00-22:59",
	}
)

type edgeSpec struct {
	Type   RelType
	Weight float64
	Result *FiveEl
}

type pillarNodeRef struct {
	Stem   NodeId
	Branch NodeId
	Hidden []NodeId
}

func BuildSajuDoc(input BirthInput, raw RawPillars) (*SajuDoc, error) {
	return BuildSajuDocAt(input, raw, time.Now().UTC())
}

// BuildSajuDocAt:
// 1) 원시 간지 입력 검증/정규화
// 2) 4주(또는 3주) 기반 노드/관계 그래프 구성
// 3) Fact/Eval/오행분포/대운/시주컨텍스트까지 계산해 최종 문서를 생성한다.
func BuildSajuDocAt(input BirthInput, raw RawPillars, now time.Time) (*SajuDoc, error) {
	if err := validateRawPillars(raw); err != nil {
		return nil, err
	}
	in := normalizeBirthInput(input, raw)

	pillarRawMap := make(map[PillarKey]RawPillar, 4)
	pillars := make([]Pillar, 0, 4)
	pillars = append(pillars, buildPillar("Y", raw.Year))
	pillarRawMap["Y"] = raw.Year
	pillars = append(pillars, buildPillar("M", raw.Month))
	pillarRawMap["M"] = raw.Month
	pillars = append(pillars, buildPillar("D", raw.Day))
	pillarRawMap["D"] = raw.Day
	if raw.Hour != nil {
		pillars = append(pillars, buildPillar("H", *raw.Hour))
		pillarRawMap["H"] = *raw.Hour
	}

	dayMaster := raw.Day.Stem
	nodes := make([]Node, 0, len(pillars)*5)
	refsByPillar := make(map[PillarKey]pillarNodeRef, len(pillars))
	nextNodeID := NodeId(1)

	// 각 기둥(Y/M/D/H)마다 천간/지지/지장간 노드를 생성한다.
	for _, p := range pillars {
		rawP := pillarRawMap[p.K]
		ref := pillarNodeRef{}
		base := pillarStrengthWeight[p.K]

		stemEl := stemElement(rawP.Stem)
		stemYy := stemYinYang(rawP.Stem)
		stemStrength := base * 1.00
		dmTenGod := tenGodByStem(dayMaster, rawP.Stem)
		stemNode := Node{
			ID:       nextNodeID,
			Kind:     "STEM",
			Pillar:   p.K,
			Stem:     ptrStem(rawP.Stem),
			El:       stemEl,
			Yy:       stemYy,
			TenGod:   &dmTenGod,
			Strength: &stemStrength,
		}
		nodes = append(nodes, stemNode)
		ref.Stem = nextNodeID
		nextNodeID++

		branchEl := branchElement(rawP.Branch)
		branchYy := branchYinYang(rawP.Branch)
		branchStrength := base * 1.20
		branchTwelve := twelveFateByBranch(dayMaster, rawP.Branch)
		branchNode := Node{
			ID:       nextNodeID,
			Kind:     "BRANCH",
			Pillar:   p.K,
			Branch:   ptrBranch(rawP.Branch),
			El:       branchEl,
			Yy:       branchYy,
			Twelve:   &branchTwelve,
			Strength: &branchStrength,
		}
		nodes = append(nodes, branchNode)
		ref.Branch = nextNodeID
		nextNodeID++

		for idx, hStem := range p.Hidden {
			idxVal := uint8(idx)
			hiddenEl := stemElement(hStem)
			hiddenYy := stemYinYang(hStem)
			hiddenStrength := base * (0.62 - float64(idx)*0.08)
			if hiddenStrength < 0.38 {
				hiddenStrength = 0.38
			}
			hiddenTenGod := tenGodByStem(dayMaster, hStem)
			hiddenNode := Node{
				ID:       nextNodeID,
				Kind:     "HIDDEN",
				Pillar:   p.K,
				Idx:      &idxVal,
				Stem:     ptrStem(hStem),
				El:       hiddenEl,
				Yy:       hiddenYy,
				TenGod:   &hiddenTenGod,
				Strength: &hiddenStrength,
			}
			nodes = append(nodes, hiddenNode)
			ref.Hidden = append(ref.Hidden, nextNodeID)
			nextNodeID++
		}
		refsByPillar[p.K] = ref
	}

	edges := make([]Edge, 0, len(nodes)*2)
	nextEdgeID := EdgeId(1)
	addEdge := func(spec edgeSpec, a, b NodeId, refs []NodeId) {
		w := spec.Weight
		active := true
		edge := Edge{
			ID:     nextEdgeID,
			T:      spec.Type,
			A:      a,
			B:      b,
			W:      &w,
			Refs:   refs,
			Result: spec.Result,
			Active: &active,
		}
		edges = append(edges, edge)
		nextEdgeID++
	}

	orderedKeys := orderedPillarKeys(pillars)
	// 구조 엣지: 동일 기둥의 천간-지지, 지지-지장간 연결
	for _, key := range orderedKeys {
		ref := refsByPillar[key]
		addEdge(edgeSpec{Type: relPillar, Weight: 1.0}, ref.Stem, ref.Branch, []NodeId{ref.Stem, ref.Branch})
		for _, hid := range ref.Hidden {
			addEdge(edgeSpec{Type: relHidden, Weight: 0.7}, ref.Branch, hid, []NodeId{ref.Branch, hid})
		}
	}

	// 관계 엣지: 기둥 간 합/충/형/해/파/삼합 계산
	for i := 0; i < len(orderedKeys); i++ {
		for j := i + 1; j < len(orderedKeys); j++ {
			kA, kB := orderedKeys[i], orderedKeys[j]
			rA, rB := pillarRawMap[kA], pillarRawMap[kB]
			refA, refB := refsByPillar[kA], refsByPillar[kB]

			if spec, ok := stemRelationSpec(rA.Stem, rB.Stem); ok {
				addEdge(spec, refA.Stem, refB.Stem, []NodeId{refA.Stem, refB.Stem})
			}
			for _, spec := range branchRelationSpecs(rA.Branch, rB.Branch) {
				addEdge(spec, refA.Branch, refB.Branch, []NodeId{refA.Branch, refB.Branch})
			}
		}
	}

	elBalance := calcElDistribution(nodes)
	relationStats := relationCount(edges)
	dominantEl, dominantRefs := dominantElement(nodes)
	weakEl, weakRefs := weakestElement(nodes)
	monthLingEl := branchElement(raw.Month.Branch)

	baseConfidence := 0.86
	if raw.Hour == nil {
		baseConfidence = 0.68
	}

	dayStemRef := refsByPillar["D"].Stem
	facts := []FactItem{
		{
			ID:   "fact.day_master",
			K:    "DAY_MASTER",
			N:    "일간",
			V:    map[string]any{"stem": int(dayMaster), "element": string(stemElement(dayMaster)), "yinYang": string(stemYinYang(dayMaster))},
			Refs: []NodeId{dayStemRef},
			Evidence: Evidence{
				RuleId:  "rule.day_master",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: []NodeId{dayStemRef}},
				Notes:   "일주 천간을 일간으로 사용",
			},
		},
		{
			ID:   "fact.element.dominant",
			K:    "ELEMENT_DOMINANT",
			N:    "우세 오행",
			V:    string(dominantEl),
			Refs: dominantRefs,
			Evidence: Evidence{
				RuleId:  "rule.element_distribution",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: dominantRefs},
				Notes:   "노드 강도 합산 기준 우세 오행",
			},
		},
		{
			ID:   "fact.element.weak",
			K:    "ELEMENT_WEAK",
			N:    "부족 오행",
			V:    string(weakEl),
			Refs: weakRefs,
			Evidence: Evidence{
				RuleId:  "rule.element_distribution",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: weakRefs},
				Notes:   "노드 강도 합산 기준 부족 오행",
			},
		},
		{
			ID:   "fact.month_command",
			K:    "MONTH_COMMAND",
			N:    "월령 오행",
			V:    string(monthLingEl),
			Refs: []NodeId{refsByPillar["M"].Branch},
			Evidence: Evidence{
				RuleId:  "rule.month_ling",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: []NodeId{refsByPillar["M"].Branch}},
				Notes:   "월지 기준 월령 오행",
			},
		},
		{
			ID:   "fact.relation.count",
			K:    "RELATION_COUNT",
			N:    "관계 분포",
			V:    relationStats,
			Refs: collectRelationRefs(edges),
			Evidence: Evidence{
				RuleId:  "rule.relation_scan",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: collectRelationRefs(edges)},
				Notes:   "합·충·형·해·파·삼합 집계",
			},
		},
	}

	hourStatus := HourKnown
	if raw.Hour == nil && in.TimePrec == TimePrecisionHour {
		hourStatus = HourEstimated
	} else if raw.Hour == nil {
		hourStatus = HourMissing
	}
	facts = append(facts, FactItem{
		ID:   "fact.hour.status",
		K:    "HOUR_STATUS",
		N:    "시주 상태",
		V:    string(hourStatus),
		Refs: []NodeId{},
		Evidence: Evidence{
			RuleId:  "rule.hour_status",
			RuleVer: "v1",
			Sys:     in.Engine.Sys,
			Inputs:  EvidenceInputs{Nodes: []NodeId{}},
			Notes:   "입력 정밀도와 시주 계산 가능 여부",
		},
	})

	balanceScoreValue := calcBalanceScore(elBalance)
	daySupportScoreValue := calcDayMasterSupportScore(dayMaster, elBalance)
	conflictPenalty := float64(relationStats[string(relChong)]*6 + relationStats[string(relHyung)]*5 + relationStats[string(relHae)]*4 + relationStats[string(relPo)]*4)
	overallRaw := clamp(0, 100, 0.58*balanceScoreValue+0.42*daySupportScoreValue-conflictPenalty)

	evals := []EvalItem{
		{
			ID:   "eval.balance",
			K:    "BALANCE",
			N:    "오행 균형도",
			V:    balanceScoreValue,
			Refs: collectElementRefs(nodes),
			Evidence: Evidence{
				RuleId:  "rule.eval.balance",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: collectElementRefs(nodes)},
				Notes:   "오행 분포 균형 기반",
			},
			Score: newScore(balanceScoreValue, 0, 100, baseConfidence, []ScorePart{
				{Label: "distribution", W: 1.0, Raw: balanceScoreValue, Refs: collectElementRefs(nodes)},
			}),
		},
		{
			ID:   "eval.daymaster_support",
			K:    "DAYMASTER_SUPPORT",
			N:    "일간 지지도",
			V:    daySupportScoreValue,
			Refs: []NodeId{dayStemRef, refsByPillar["M"].Branch},
			Evidence: Evidence{
				RuleId:  "rule.eval.daymaster_support",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: []NodeId{dayStemRef, refsByPillar["M"].Branch}},
				Notes:   "비겁·인성 대비 누수·관살 비중",
			},
			Score: newScore(daySupportScoreValue, 0, 100, baseConfidence, []ScorePart{
				{Label: "support_vs_drain", W: 1.0, Raw: daySupportScoreValue, Refs: []NodeId{dayStemRef, refsByPillar["M"].Branch}},
			}),
		},
		{
			ID:   "eval.overall",
			K:    "OVERALL",
			N:    "종합 지표",
			V:    overallRaw,
			Refs: collectRelationRefs(edges),
			Evidence: Evidence{
				RuleId:  "rule.eval.overall",
				RuleVer: "v1",
				Sys:     in.Engine.Sys,
				Inputs:  EvidenceInputs{Nodes: collectRelationRefs(edges)},
				Notes:   "균형도·일간지지도·관계페널티 종합",
			},
			Score: newScore(overallRaw, 0, 100, baseConfidence, []ScorePart{
				{Label: "balance", W: 0.58, Raw: balanceScoreValue, Refs: collectElementRefs(nodes)},
				{Label: "daymaster", W: 0.42, Raw: daySupportScoreValue, Refs: []NodeId{dayStemRef}},
				{Label: "conflict_penalty", W: -1, Raw: conflictPenalty, Refs: collectRelationRefs(edges)},
			}),
		},
	}

	hourCtx := buildHourContext(in, raw, nodes, edges, facts, evals)
	emptyBranches := gongMangBranches(raw.Day.Stem, raw.Day.Branch)
	daeunList := buildDaeunList(in, raw, dayMaster)
	daeun, seun, wolun, ilun := buildRunFortunes(in, raw, dayMaster, daeunList, now)
	createdAt := now.UTC().Format(time.RFC3339)

	doc := &SajuDoc{
		SchemaVer:     "extract_saju.v1",
		Input:         in,
		Pillars:       pillars,
		Nodes:         nodes,
		Edges:         edges,
		Facts:         facts,
		Evals:         evals,
		DayMaster:     dayMaster,
		Daeun:         daeun,
		Seun:          seun,
		Wolun:         wolun,
		Ilun:          ilun,
		DaeunList:     daeunList,
		SeunList:      nil,
		WolunList:     nil,
		IlunList:      nil,
		ElBalance:     elBalance,
		HourCtx:       hourCtx,
		EmptyBranches: emptyBranches,
		CreatedAt:     createdAt,
	}
	return doc, nil
}

func normalizeBirthInput(input BirthInput, raw RawPillars) BirthInput {
	out := input
	if out.Tz == "" {
		out.Tz = "Asia/Seoul"
	}
	if out.Calendar == "" {
		out.Calendar = "SOLAR"
	}
	if out.Engine.Name == "" {
		out.Engine.Name = "sxtwl"
	}
	if out.Engine.Ver == "" {
		out.Engine.Ver = "1"
	}
	if out.TimePrec == "" {
		if raw.Hour != nil {
			out.TimePrec = TimePrecisionMinute
		} else {
			out.TimePrec = TimePrecisionUnknown
		}
	}
	return out
}

func validateRawPillars(raw RawPillars) error {
	if !isValidStem(raw.Year.Stem) || !isValidBranch(raw.Year.Branch) {
		return fmt.Errorf("year pillar: %w", errInvalidPillarIndex)
	}
	if !isValidParity(raw.Year.Stem, raw.Year.Branch) {
		return fmt.Errorf("year pillar: %w", errParityMismatch)
	}
	if !isValidStem(raw.Month.Stem) || !isValidBranch(raw.Month.Branch) {
		return fmt.Errorf("month pillar: %w", errInvalidPillarIndex)
	}
	if !isValidParity(raw.Month.Stem, raw.Month.Branch) {
		return fmt.Errorf("month pillar: %w", errParityMismatch)
	}
	if !isValidStem(raw.Day.Stem) || !isValidBranch(raw.Day.Branch) {
		return fmt.Errorf("day pillar: %w", errInvalidPillarIndex)
	}
	if !isValidParity(raw.Day.Stem, raw.Day.Branch) {
		return fmt.Errorf("day pillar: %w", errParityMismatch)
	}
	if raw.Hour != nil {
		if !isValidStem(raw.Hour.Stem) || !isValidBranch(raw.Hour.Branch) {
			return fmt.Errorf("hour pillar: %w", errInvalidPillarIndex)
		}
		if !isValidParity(raw.Hour.Stem, raw.Hour.Branch) {
			return fmt.Errorf("hour pillar: %w", errParityMismatch)
		}
	}
	return nil
}

func isValidParity(stem StemId, branch BranchId) bool {
	return int(stem)%2 == int(branch)%2
}

func buildPillar(k PillarKey, raw RawPillar) Pillar {
	return Pillar{
		K:        k,
		Stem:     raw.Stem,
		Branch:   raw.Branch,
		Hidden:   hiddenStems(raw.Branch),
		NaEum:    naEum(raw.Stem, raw.Branch),
		GongMang: gongMangBranches(raw.Stem, raw.Branch),
	}
}

func buildHourContext(input BirthInput, raw RawPillars, nodes []Node, edges []Edge, facts []FactItem, evals []EvalItem) *HourContext {
	// 시주가 이미 계산된 경우는 상태만 KNOWN으로 반환.
	if raw.Hour != nil {
		return &HourContext{Status: HourKnown}
	}

	stableNodes := make([]NodeId, 0, len(nodes))
	for _, n := range nodes {
		stableNodes = append(stableNodes, n.ID)
	}
	stableEdges := make([]EdgeId, 0, len(edges))
	for _, e := range edges {
		stableEdges = append(stableEdges, e.ID)
	}
	stableFacts := make([]string, 0, len(facts))
	for _, f := range facts {
		stableFacts = append(stableFacts, f.ID)
	}
	stableEvals := make([]string, 0, len(evals))
	for _, e := range evals {
		stableEvals = append(stableEvals, e.ID)
	}

	ctx := &HourContext{
		Status:        HourMissing,
		MissingReason: "NO_BIRTH_TIME",
		StableNodes:   stableNodes,
		StableEdges:   stableEdges,
		StableFacts:   stableFacts,
		StableEvals:   stableEvals,
	}

	estimatedHour, hasHour := parseHour(input.DtLocal)
	if input.TimePrec == TimePrecisionHour && hasHour {
		// 시 단위 입력은 단일 추정 후보(ESTIMATED)로 취급.
		ctx.Status = HourEstimated
		branch := BranchId(hourToBranch(estimatedHour))
		stem := StemId((int(raw.Day.Stem)*2 + int(branch)) % 10)
		w := 1.0
		ctx.Candidates = []HourCandidate{
			{
				Order:      1,
				Pillar:     buildPillar("H", RawPillar{Stem: stem, Branch: branch}),
				TimeWindow: hourTimeWindows[branch],
				Weight:     &w,
			},
		}
		return ctx
	}

	candidates := make([]HourCandidate, 0, 12)
	weight := 1.0 / 12.0
	// 완전 미상은 12지지를 동일 가중치 후보로 제공.
	for dz := 0; dz < 12; dz++ {
		branch := BranchId(dz)
		stem := StemId((int(raw.Day.Stem)*2 + dz) % 10)
		w := weight
		candidates = append(candidates, HourCandidate{
			Order:      dz + 1,
			Pillar:     buildPillar("H", RawPillar{Stem: stem, Branch: branch}),
			TimeWindow: hourTimeWindows[dz],
			Weight:     &w,
		})
	}
	ctx.Candidates = candidates
	return ctx
}

func buildDaeunList(input BirthInput, raw RawPillars, dayMaster StemId) []DaeunPeriod {
	year := parseYear(input.DtLocal)
	male, sexKnown := parseMale(input.Sex)
	yangYear := int(raw.Year.Stem)%2 == 0
	forward := yangYear
	if sexKnown {
		forward = (yangYear && male) || (!yangYear && !male)
	}

	ret := make([]DaeunPeriod, 0, 8)
	// 기본 8개 대운(10년 단위) 생성.
	for i := 1; i <= 8; i++ {
		shift := i
		if !forward {
			shift = -i
		}
		stem := StemId(mod10(int(raw.Month.Stem) + shift))
		branch := BranchId(mod12(int(raw.Month.Branch) + shift))
		ageFrom := 1 + (i-1)*10
		ageTo := ageFrom + 9
		startYear := 0
		if year > 0 {
			startYear = year + ageFrom
		}
		ret = append(ret, EnrichFortunePeriod(DaeunPeriod{
			Type:      fortuneTypeDaeun,
			Order:     i,
			Stem:      stem,
			Branch:    branch,
			AgeFrom:   ageFrom,
			AgeTo:     ageTo,
			StartYear: startYear,
		}, dayMaster))
	}
	return ret
}

func buildRunFortunes(input BirthInput, raw RawPillars, dayMaster StemId, daeunList []DaeunPeriod, now time.Time) (*DaeunPeriod, *DaeunPeriod, *DaeunPeriod, *DaeunPeriod) {
	fortuneBase := resolveFortuneBaseDt(input)
	year, month, day, ok := parseLocalDate(fortuneBase)
	if !ok {
		year = parseYear(fortuneBase)
	}

	daeun := pickCurrentDaeun(daeunList, year, now.Year())
	if daeun == nil && len(daeunList) > 0 {
		fallback := daeunList[0]
		fallback.Type = fortuneTypeDaeun
		daeun = &fallback
	}

	seun := EnrichFortunePeriod(DaeunPeriod{
		Type:      fortuneTypeSeun,
		Stem:      raw.Year.Stem,
		Branch:    raw.Year.Branch,
		StartYear: year,
		Year:      year,
	}, dayMaster)
	wolun := EnrichFortunePeriod(DaeunPeriod{
		Type:      fortuneTypeWolun,
		Stem:      raw.Month.Stem,
		Branch:    raw.Month.Branch,
		StartYear: year,
		Year:      year,
		Month:     month,
	}, dayMaster)
	ilun := EnrichFortunePeriod(DaeunPeriod{
		Type:      fortuneTypeIlun,
		Stem:      raw.Day.Stem,
		Branch:    raw.Day.Branch,
		StartYear: year,
		Year:      year,
		Month:     month,
		Day:       day,
	}, dayMaster)

	return daeun, &seun, &wolun, &ilun
}

func pickCurrentDaeun(daeunList []DaeunPeriod, birthYear, baseYear int) *DaeunPeriod {
	if len(daeunList) == 0 {
		return nil
	}
	idx := 0
	if birthYear > 0 && baseYear > 0 {
		age := baseYear - birthYear + 1
		if age < 1 {
			age = 1
		}
		idx = (age - 1) / 10
		if idx >= len(daeunList) {
			idx = len(daeunList) - 1
		}
	}
	out := daeunList[idx]
	out.Type = fortuneTypeDaeun
	return &out
}

func relationCount(edges []Edge) map[string]int {
	counts := map[string]int{}
	for _, edge := range edges {
		if edge.T == relPillar || edge.T == relHidden {
			continue
		}
		counts[string(edge.T)]++
	}
	return counts
}

func collectRelationRefs(edges []Edge) []NodeId {
	seen := map[NodeId]bool{}
	refs := make([]NodeId, 0, len(edges)*2)
	for _, edge := range edges {
		if edge.T == relPillar || edge.T == relHidden {
			continue
		}
		if !seen[edge.A] {
			seen[edge.A] = true
			refs = append(refs, edge.A)
		}
		if !seen[edge.B] {
			seen[edge.B] = true
			refs = append(refs, edge.B)
		}
	}
	sort.Slice(refs, func(i, j int) bool { return refs[i] < refs[j] })
	return refs
}

func collectElementRefs(nodes []Node) []NodeId {
	out := make([]NodeId, 0, len(nodes))
	for _, n := range nodes {
		out = append(out, n.ID)
	}
	return out
}

func dominantElement(nodes []Node) (FiveEl, []NodeId) {
	dist := map[FiveEl]float64{}
	for _, n := range nodes {
		w := 1.0
		if n.Strength != nil {
			w = *n.Strength
		}
		dist[n.El] += w
	}
	bestEl := FiveEl("WOOD")
	best := -1.0
	for _, el := range []FiveEl{"WOOD", "FIRE", "EARTH", "METAL", "WATER"} {
		if dist[el] > best {
			best = dist[el]
			bestEl = el
		}
	}
	refs := make([]NodeId, 0)
	for _, n := range nodes {
		if n.El == bestEl {
			refs = append(refs, n.ID)
		}
	}
	return bestEl, refs
}

func weakestElement(nodes []Node) (FiveEl, []NodeId) {
	dist := map[FiveEl]float64{
		"WOOD":  0,
		"FIRE":  0,
		"EARTH": 0,
		"METAL": 0,
		"WATER": 0,
	}
	for _, n := range nodes {
		w := 1.0
		if n.Strength != nil {
			w = *n.Strength
		}
		dist[n.El] += w
	}
	lowEl := FiveEl("WOOD")
	low := math.MaxFloat64
	for _, el := range []FiveEl{"WOOD", "FIRE", "EARTH", "METAL", "WATER"} {
		if dist[el] < low {
			low = dist[el]
			lowEl = el
		}
	}
	refs := make([]NodeId, 0)
	for _, n := range nodes {
		if n.El == lowEl {
			refs = append(refs, n.ID)
		}
	}
	return lowEl, refs
}

func calcElDistribution(nodes []Node) *ElDistribution {
	sum := 0.0
	acc := [5]float64{}
	for _, n := range nodes {
		w := 1.0
		if n.Strength != nil {
			w = *n.Strength
		}
		sum += w
		acc[fiveElementIdx(n.El)] += w
	}
	if sum == 0 {
		return &ElDistribution{Wood: 0.2, Fire: 0.2, Earth: 0.2, Metal: 0.2, Water: 0.2}
	}
	return &ElDistribution{
		Wood:  acc[0] / sum,
		Fire:  acc[1] / sum,
		Earth: acc[2] / sum,
		Metal: acc[3] / sum,
		Water: acc[4] / sum,
	}
}

func calcBalanceScore(dist *ElDistribution) float64 {
	if dist == nil {
		return 50
	}
	target := 0.2
	diff := math.Abs(dist.Wood-target) + math.Abs(dist.Fire-target) + math.Abs(dist.Earth-target) + math.Abs(dist.Metal-target) + math.Abs(dist.Water-target)
	normalized := clamp(0, 1, 1.0-diff/1.6)
	return normalized * 100
}

func calcDayMasterSupportScore(dayMaster StemId, dist *ElDistribution) float64 {
	if dist == nil {
		return 50
	}
	v := []float64{dist.Wood, dist.Fire, dist.Earth, dist.Metal, dist.Water}
	dm := fiveElementIdx(stemElement(dayMaster))
	resource := mod5(dm + 4)
	output := mod5(dm + 1)
	controller := mod5(dm + 3)

	support := v[dm] + v[resource]
	drain := v[output] + v[controller]
	raw := clamp(0, 1, 0.5+(support-drain)/2.0)
	return raw * 100
}

func newScore(total, min, max, confidence float64, parts []ScorePart) Score {
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
	return Score{
		Total:      total,
		Min:        min,
		Max:        max,
		Norm0_100:  uint8(norm),
		Confidence: clamp(0, 1, confidence),
		Parts:      parts,
	}
}

func orderedPillarKeys(pillars []Pillar) []PillarKey {
	order := map[PillarKey]int{"Y": 0, "M": 1, "D": 2, "H": 3}
	ret := make([]PillarKey, 0, len(pillars))
	for _, p := range pillars {
		ret = append(ret, p.K)
	}
	sort.Slice(ret, func(i, j int) bool { return order[ret[i]] < order[ret[j]] })
	return ret
}

func stemRelationSpec(a, b StemId) (edgeSpec, bool) {
	if a == b {
		return edgeSpec{}, false
	}
	if int(a) > int(b) {
		a, b = b, a
	}
	pairs := map[[2]StemId]FiveEl{
		{0, 5}: "EARTH", // 甲己合土
		{1, 6}: "METAL", // 乙庚合金
		{2, 7}: "WATER", // 丙辛合水
		{3, 8}: "WOOD",  // 丁壬合木
		{4, 9}: "FIRE",  // 戊癸合火
	}
	key := [2]StemId{a, b}
	if result, ok := pairs[key]; ok {
		r := result
		return edgeSpec{Type: relHe, Weight: 0.86, Result: &r}, true
	}
	return edgeSpec{}, false
}

func branchRelationSpecs(a, b BranchId) []edgeSpec {
	if int(a) > int(b) {
		a, b = b, a
	}
	out := make([]edgeSpec, 0, 4)
	if isDzChong(a, b) {
		out = append(out, edgeSpec{Type: relChong, Weight: 1.00})
	}
	if isDzHe(a, b) {
		out = append(out, edgeSpec{Type: relHe, Weight: 0.84})
	}
	if isDzHyung(a, b) {
		out = append(out, edgeSpec{Type: relHyung, Weight: 0.72})
	}
	if isDzHae(a, b) {
		out = append(out, edgeSpec{Type: relHae, Weight: 0.68})
	}
	if isDzPo(a, b) {
		out = append(out, edgeSpec{Type: relPo, Weight: 0.64})
	}
	if result, ok := dzSamhapResult(a, b); ok {
		r := result
		out = append(out, edgeSpec{Type: relSamhap, Weight: 0.88, Result: &r})
	}
	return out
}

func isDzChong(a, b BranchId) bool {
	pairs := [][2]BranchId{{0, 6}, {1, 7}, {2, 8}, {3, 9}, {4, 10}, {5, 11}}
	for _, p := range pairs {
		if a == p[0] && b == p[1] {
			return true
		}
	}
	return false
}

func isDzHe(a, b BranchId) bool {
	pairs := [][2]BranchId{{0, 1}, {2, 11}, {3, 10}, {4, 9}, {5, 8}, {6, 7}}
	for _, p := range pairs {
		if a == p[0] && b == p[1] {
			return true
		}
	}
	return false
}

// isDzHyung checks 지지 형(刑). Caller (branchRelationSpecs) guarantees a <= b.
func isDzHyung(a, b BranchId) bool {
	// 삼형: 寅巳申(2,5,8), 丑戌未(1,7,10)
	triples := [][3]BranchId{{2, 5, 8}, {1, 7, 10}}
	for _, t := range triples {
		if (a == t[0] && b == t[1]) || (a == t[0] && b == t[2]) || (a == t[1] && b == t[2]) {
			return true
		}
	}
	// 상형: 子卯(0,3)
	if a == 0 && b == 3 {
		return true
	}
	// 자형: 辰辰(4)·午午(6)·酉酉(9)·亥亥(11) — 두 기둥이 같은 지지일 때
	return a == b && (a == 4 || a == 6 || a == 9 || a == 11)
}

func isDzHae(a, b BranchId) bool {
	pairs := [][2]BranchId{{0, 7}, {1, 6}, {2, 5}, {3, 4}, {8, 11}, {9, 10}}
	for _, p := range pairs {
		if a == p[0] && b == p[1] {
			return true
		}
	}
	return false
}

func isDzPo(a, b BranchId) bool {
	pairs := [][2]BranchId{{0, 9}, {3, 6}, {1, 4}, {7, 10}, {2, 11}, {5, 8}}
	for _, p := range pairs {
		if a == p[0] && b == p[1] {
			return true
		}
	}
	return false
}

func dzSamhapResult(a, b BranchId) (FiveEl, bool) {
	triples := []struct {
		Branches [3]BranchId
		Result   FiveEl
	}{
		{[3]BranchId{8, 0, 4}, "WATER"},
		{[3]BranchId{2, 6, 10}, "FIRE"},
		{[3]BranchId{11, 3, 7}, "WOOD"},
		{[3]BranchId{5, 9, 1}, "METAL"},
	}
	for _, t := range triples {
		inA := a == t.Branches[0] || a == t.Branches[1] || a == t.Branches[2]
		inB := b == t.Branches[0] || b == t.Branches[1] || b == t.Branches[2]
		if inA && inB {
			return t.Result, true
		}
	}
	return "", false
}

// EnrichFortunePeriod fills display-oriented metadata for a 운(운세) 항목.
func EnrichFortunePeriod(in DaeunPeriod, dayMaster StemId) DaeunPeriod {
	if !isValidStem(in.Stem) || !isValidBranch(in.Branch) {
		return in
	}

	in.StemKo = stemKorChars[in.Stem]
	in.StemHanja = stemHanjaChars[in.Stem]
	in.BranchKo = branchKorChars[in.Branch]
	in.BranchHanja = branchHanjaChars[in.Branch]
	in.GanjiKo = in.StemKo + in.BranchKo
	in.GanjiHanja = in.StemHanja + in.BranchHanja

	stemEl := stemElement(in.Stem)
	stemYy := stemYinYang(in.Stem)
	stemTenGod := tenGodByStem(dayMaster, in.Stem)
	in.StemEl = stemEl
	in.StemYy = stemYy
	in.StemTenGod = &stemTenGod

	branchEl := branchElement(in.Branch)
	branchYy := branchYinYang(in.Branch)
	branchTenGod := tenGodByElementAndYinYang(dayMaster, branchEl, branchYy)
	branchTwelve := twelveFateByBranch(dayMaster, in.Branch)
	in.BranchEl = branchEl
	in.BranchYy = branchYy
	in.BranchTenGod = &branchTenGod
	in.BranchTwelve = &branchTwelve

	return in
}

func tenGodByStem(dayMaster, target StemId) TenGod {
	dmEl := fiveElementIdx(stemElement(dayMaster))
	tgEl := fiveElementIdx(stemElement(target))
	sameYy := (int(dayMaster)%2 == int(target)%2)
	return tenGodByElementDiffAndParity(sameYy, mod5(tgEl-dmEl))
}

func tenGodByElementAndYinYang(dayMaster StemId, targetEl FiveEl, targetYy YinYang) TenGod {
	dmEl := fiveElementIdx(stemElement(dayMaster))
	tgEl := fiveElementIdx(targetEl)
	sameYy := stemYinYang(dayMaster) == targetYy
	return tenGodByElementDiffAndParity(sameYy, mod5(tgEl-dmEl))
}

func tenGodByElementDiffAndParity(sameYy bool, diff int) TenGod {
	switch diff {
	case 0:
		if sameYy {
			return BiGyeon
		}
		return GeobJae
	case 1: // 내가 생하는 오행 -> 식상
		if sameYy {
			return SikShin
		}
		return SangGwan
	case 2: // 내가 극하는 오행 -> 재성
		if sameYy {
			return PyeonJae
		}
		return JeongJae
	case 3: // 나를 극하는 오행 -> 관성
		if sameYy {
			return PyeonGwan
		}
		return JeongGwan
	case 4: // 나를 생하는 오행 -> 인성
		if sameYy {
			return PyeonIn
		}
		return JeongIn
	default:
		return BiGyeon
	}
}

func twelveFateByBranch(dayStem StemId, branch BranchId) TwelveFate {
	start := int(twelveFateStartBranch[dayStem])
	dir := 1
	if int(dayStem)%2 == 1 {
		dir = -1
	}
	step := mod12((int(branch) - start) * dir)
	return twelveFateOrder[step]
}

func hiddenStems(branch BranchId) []StemId {
	src := hiddenStemTable[branch]
	ret := make([]StemId, len(src))
	copy(ret, src)
	return ret
}

func gongMangBranches(stem StemId, branch BranchId) []BranchId {
	cycle, ok := sexagenaryIndex(stem, branch)
	if !ok {
		return nil
	}
	xun := cycle / 10
	start := mod12(10 - 2*xun)
	return []BranchId{BranchId(start), BranchId((start + 1) % 12)}
}

func naEum(stem StemId, branch BranchId) string {
	cycle, ok := sexagenaryIndex(stem, branch)
	if !ok {
		return ""
	}
	return naEumByCycle[cycle/2]
}

func sexagenaryIndex(stem StemId, branch BranchId) (int, bool) {
	for i := 0; i < 60; i++ {
		if i%10 == int(stem) && i%12 == int(branch) {
			return i, true
		}
	}
	return 0, false
}

func stemElement(stem StemId) FiveEl {
	return stemFiveEl[stem]
}

func branchElement(branch BranchId) FiveEl {
	return branchFiveEl[branch]
}

func stemYinYang(stem StemId) YinYang {
	if int(stem)%2 == 0 {
		return "YANG"
	}
	return "YIN"
}

func branchYinYang(branch BranchId) YinYang {
	if int(branch)%2 == 0 {
		return "YANG"
	}
	return "YIN"
}

func fiveElementIdx(el FiveEl) int {
	switch el {
	case "WOOD":
		return 0
	case "FIRE":
		return 1
	case "EARTH":
		return 2
	case "METAL":
		return 3
	case "WATER":
		return 4
	default:
		return 0
	}
}

func parseMale(sex string) (bool, bool) {
	switch sex {
	case "M", "m", "male", "MALE", "남", "男":
		return true, true
	case "F", "f", "female", "FEMALE", "여", "女":
		return false, true
	default:
		return false, false
	}
}

func parseYear(dt string) int {
	if len(dt) < 4 {
		return 0
	}
	year := 0
	for i := 0; i < 4; i++ {
		ch := dt[i]
		if ch < '0' || ch > '9' {
			return 0
		}
		year = year*10 + int(ch-'0')
	}
	return year
}

func resolveFortuneBaseDt(input BirthInput) string {
	if input.FortuneBaseDt != "" {
		return input.FortuneBaseDt
	}
	return input.DtLocal
}

func parseLocalDate(dt string) (int, int, int, bool) {
	layouts := []string{
		"2006-01-02",
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04",
		"2006-01-02T15",
		"2006-01-02 15",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, dt); err == nil {
			return t.Year(), int(t.Month()), t.Day(), true
		}
	}
	return 0, 0, 0, false
}

func parseHour(dt string) (int, bool) {
	layouts := []string{
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04",
		"2006-01-02T15",
		"2006-01-02 15",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, dt); err == nil {
			return t.Hour(), true
		}
	}
	return 0, false
}

func hourToBranch(hour int) int {
	h := mod24(hour)
	return ((h + 1) / 2) % 12
}

func ptrStem(v StemId) *StemId {
	x := v
	return &x
}

func ptrBranch(v BranchId) *BranchId {
	x := v
	return &x
}

func isValidStem(v StemId) bool {
	return int(v) >= 0 && int(v) < 10
}

func isValidBranch(v BranchId) bool {
	return int(v) >= 0 && int(v) < 12
}

func clamp(min, max, value float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func mod5(v int) int {
	r := v % 5
	if r < 0 {
		r += 5
	}
	return r
}

func mod10(v int) int {
	r := v % 10
	if r < 0 {
		r += 10
	}
	return r
}

func mod12(v int) int {
	r := v % 12
	if r < 0 {
		r += 12
	}
	return r
}

func mod24(v int) int {
	r := v % 24
	if r < 0 {
		r += 24
	}
	return r
}
