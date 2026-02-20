package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/domain"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/utils"
)

// ExtractSajuPairService provides GraphQL-facing methods for extract_saju / extract_pair queries.
type ExtractSajuPairService struct {
	// 외부 의존성을 함수로 분리해 테스트에서 sxtwl 호출을 쉽게 대체한다.
	callSxtwl func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error)
	// 문서 생성 시각 고정을 위해 주입 가능하게 둔다.
	now func() time.Time
}

// NewExtractSajuPairService returns a new ExtractSajuPairService.
func NewExtractSajuPairService() *ExtractSajuPairService {
	return newExtractSajuPairServiceWithDeps(extdao.CallSxtwlOptional, func() time.Time { return time.Now().UTC() })
}

// newExtractSajuPairServiceWithDeps 는 테스트/운영 모두에서 동일한 생성 경로를 사용하기 위한 내부 팩토리다.
func newExtractSajuPairServiceWithDeps(
	callSxtwl func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error),
	now func() time.Time,
) *ExtractSajuPairService {
	if callSxtwl == nil {
		callSxtwl = extdao.CallSxtwlOptional
	}
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	return &ExtractSajuPairService{
		callSxtwl: callSxtwl,
		now:       now,
	}
}

// ExtractSajuGql builds a full ExtractSajuDoc from birth input via sxtwl + domain rules.
func (s *ExtractSajuPairService) ExtractSajuGql(ctx context.Context, input model.ExtractSajuInput) (*model.SimpleResult, error) {
	_ = ctx
	doc, _, err := s.calculateSajuDoc(input, "extract_saju")
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	gqlDoc, err := toModelExtractSajuDoc(doc)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	return &model.SimpleResult{Ok: true, Node: gqlDoc}, nil
}

// ExtractPairGql builds two saju docs and derives pair-level metrics/relations.
func (s *ExtractSajuPairService) ExtractPairGql(ctx context.Context, input model.ExtractPairInput) (*model.SimpleResult, error) {
	_ = ctx
	if input.A == nil || input.B == nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("a and b inputs are required")}, nil
	}
	if input.Engine == nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("pair engine is required")}, nil
	}

	docA, birthA, err := s.calculateSajuDoc(*input.A, "extract_pair.a")
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("failed to calculate A: " + err.Error())}, nil
	}
	docB, birthB, err := s.calculateSajuDoc(*input.B, "extract_pair.b")
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("failed to calculate B: " + err.Error())}, nil
	}

	pairInput := domain.PairInput{
		A:       birthA,
		B:       birthB,
		Engine:  toDomainEngine(input.Engine),
		RuleSet: utils.PtrToStr(input.RuleSet),
	}
	pairDoc, err := domain.BuildPairDocAt(pairInput, docA, docB, s.now())
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("failed to build pair doc: " + err.Error())}, nil
	}
	gqlDoc, err := toModelExtractPairDoc(pairDoc)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	return &model.SimpleResult{Ok: true, Node: gqlDoc}, nil
}

func (s *ExtractSajuPairService) calculateSajuDoc(input model.ExtractSajuInput, caller string) (*domain.SajuDoc, domain.BirthInput, error) {
	// 1) 입력 시간 문자열을 표준 파트(년월일시분)로 정규화
	parts, err := parseLocalDateTime(selectDtLocal(input))
	if err != nil {
		return nil, domain.BirthInput{}, fmt.Errorf("%s: invalid dtLocal: %w", caller, err)
	}

	// 2) 시간 정밀도와 타임존을 확정
	timePrec := toDomainTimePrecision(input.TimePrec, parts.HasTime)
	tz := input.Tz
	if tz == "" {
		tz = "Asia/Seoul"
	}

	// 3) sxtwl 호출용 시/분 결정(시주 미상은 nil 전달)
	hh, mm := toHourMinute(parts, timePrec)
	palja, err := s.callSxtwl(parts.Year, parts.Month, parts.Day, hh, mm, tz, nil)
	if err != nil {
		return nil, domain.BirthInput{}, fmt.Errorf("%s: sxtwl failed: %w", caller, err)
	}

	// 4) 만세력 원천값을 도메인 문서 생성용 구조로 변환
	raw := toRawPillars(palja)
	birthInput := toDomainBirthInput(input, timePrec)
	birthInput.Tz = tz

	// 5) 도메인 규칙으로 SajuDoc 계산
	doc, err := domain.BuildSajuDocAt(birthInput, raw, s.now())
	if err != nil {
		return nil, domain.BirthInput{}, fmt.Errorf("%s: build saju doc failed: %w", caller, err)
	}
	// 6) 운세 기준 포인트 + 필요 범위 리스트를 요청했으면 sxtwl 기준으로 재계산해 덮어쓴다.
	if err := s.applyFortuneRuns(doc, birthInput, parts); err != nil {
		return nil, domain.BirthInput{}, fmt.Errorf("%s: run fortunes failed: %w", caller, err)
	}
	return doc, birthInput, nil
}

func toRawPillars(res *extdao.SxtwlResult) domain.RawPillars {
	raw := domain.RawPillars{
		Year:  domain.RawPillar{Stem: domain.StemId(res.Pillars.Year.Tg), Branch: domain.BranchId(res.Pillars.Year.Dz)},
		Month: domain.RawPillar{Stem: domain.StemId(res.Pillars.Month.Tg), Branch: domain.BranchId(res.Pillars.Month.Dz)},
		Day:   domain.RawPillar{Stem: domain.StemId(res.Pillars.Day.Tg), Branch: domain.BranchId(res.Pillars.Day.Dz)},
	}
	if res.Pillars.Hour != nil {
		raw.Hour = &domain.RawPillar{
			Stem:   domain.StemId(res.Pillars.Hour.Tg),
			Branch: domain.BranchId(res.Pillars.Hour.Dz),
		}
	}
	return raw
}

func toDomainBirthInput(input model.ExtractSajuInput, timePrec domain.TimePrecision) domain.BirthInput {
	var loc *domain.Geo
	if input.Loc != nil {
		loc = &domain.Geo{
			Lat: input.Loc.Lat,
			Lon: input.Loc.Lon,
		}
	}
	return domain.BirthInput{
		DtLocal:       input.DtLocal,
		Tz:            input.Tz,
		Loc:           loc,
		Calendar:      utils.PtrToStr(input.Calendar),
		LeapMonth:     input.LeapMonth,
		Sex:           utils.PtrToStr(input.Sex),
		TimePrec:      timePrec,
		Engine:        toDomainEngine(input.Engine),
		SolarDt:       utils.PtrToStr(input.SolarDt),
		AdjustedDt:    utils.PtrToStr(input.AdjustedDt),
		FortuneBaseDt: utils.PtrToStr(input.FortuneBaseDt),
		SeunFromYear:  input.SeunFromYear,
		SeunToYear:    input.SeunToYear,
		WolunYear:     input.WolunYear,
		IlunYear:      input.IlunYear,
		IlunMonth:     input.IlunMonth,
	}
}

func toDomainEngine(in *model.ExtractEngineInput) domain.Engine {
	if in == nil {
		return domain.Engine{Name: "sxtwl", Ver: "1"}
	}
	return domain.Engine{
		Name:   in.Name,
		Ver:    in.Ver,
		Sys:    utils.PtrToStr(in.Sys),
		Params: in.Params,
	}
}

func toDomainTimePrecision(in *model.ExtractTimePrecision, hasTime bool) domain.TimePrecision {
	if in == nil {
		if hasTime {
			return domain.TimePrecisionMinute
		}
		return domain.TimePrecisionUnknown
	}
	switch *in {
	case model.ExtractTimePrecisionHour:
		return domain.TimePrecisionHour
	case model.ExtractTimePrecisionUnknown:
		return domain.TimePrecisionUnknown
	default:
		return domain.TimePrecisionMinute
	}
}

func toHourMinute(parts localDateTimeParts, timePrec domain.TimePrecision) (*int, *int) {
	if !parts.HasTime || timePrec == domain.TimePrecisionUnknown {
		return nil, nil
	}
	h := parts.Hour
	m := parts.Minute
	if timePrec == domain.TimePrecisionHour {
		m = 0
	}
	return &h, &m
}

func selectDtLocal(input model.ExtractSajuInput) string {
	if input.AdjustedDt != nil && *input.AdjustedDt != "" {
		return *input.AdjustedDt
	}
	return input.DtLocal
}

type localDateTimeParts struct {
	Year    int
	Month   int
	Day     int
	Hour    int
	Minute  int
	HasTime bool
}

// parseLocalDateTime 은 admweb/GraphQL에서 들어올 수 있는 주요 포맷을 모두 흡수한다.
func parseLocalDateTime(v string) (localDateTimeParts, error) {
	layouts := []struct {
		Layout  string
		HasTime bool
	}{
		{"2006-01-02T15:04:05", true},
		{"2006-01-02 15:04:05", true},
		{"2006-01-02T15:04", true},
		{"2006-01-02 15:04", true},
		{"2006-01-02T15", true},
		{"2006-01-02 15", true},
		{"2006-01-02T15:04:05Z07:00", true},
		{"2006-01-02T15:04Z07:00", true},
		{"200601021504", true},
		{"20060102", false},
		{"2006-01-02", false},
	}
	for _, l := range layouts {
		if t, err := time.Parse(l.Layout, v); err == nil {
			return localDateTimeParts{
				Year:    t.Year(),
				Month:   int(t.Month()),
				Day:     t.Day(),
				Hour:    t.Hour(),
				Minute:  t.Minute(),
				HasTime: l.HasTime,
			}, nil
		}
	}
	return localDateTimeParts{}, fmt.Errorf("unsupported format: %q", v)
}

func hasFortuneRunRequest(in domain.BirthInput) bool {
	return strings.TrimSpace(in.FortuneBaseDt) != "" ||
		in.SeunFromYear != nil ||
		in.SeunToYear != nil ||
		in.WolunYear != nil ||
		in.IlunYear != nil ||
		in.IlunMonth != nil
}

func resolveFortuneBaseParts(in domain.BirthInput, birthParts localDateTimeParts) (localDateTimeParts, error) {
	baseRaw := strings.TrimSpace(in.FortuneBaseDt)
	if baseRaw == "" {
		return birthParts, nil
	}
	baseParts, err := parseLocalDateTime(baseRaw)
	if err != nil {
		return localDateTimeParts{}, fmt.Errorf("invalid fortuneBaseDt: %w", err)
	}
	// 기준일시에 시간이 없으면 출생 입력 시각을 물려서 운세 경계값 흔들림을 줄인다.
	if !baseParts.HasTime && birthParts.HasTime {
		baseParts.Hour = birthParts.Hour
		baseParts.Minute = birthParts.Minute
		baseParts.HasTime = true
	}
	return baseParts, nil
}

func daysInMonth(year, month int) int {
	if year <= 0 || month < 1 || month > 12 {
		return 31
	}
	return time.Date(year, time.Month(month)+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

func clampDay(year, month, day int) int {
	if day < 1 {
		return 1
	}
	maxDay := daysInMonth(year, month)
	if day > maxDay {
		return maxDay
	}
	return day
}

func (s *ExtractSajuPairService) calcRawPillarsAt(parts localDateTimeParts, timePrec domain.TimePrecision, tz string) (domain.RawPillars, error) {
	hh, mm := toHourMinute(parts, timePrec)
	res, err := s.callSxtwl(parts.Year, parts.Month, parts.Day, hh, mm, tz, nil)
	if err != nil {
		return domain.RawPillars{}, err
	}
	return toRawPillars(res), nil
}

func (s *ExtractSajuPairService) buildSeunList(in domain.BirthInput, base localDateTimeParts, dayMaster domain.StemId) ([]domain.DaeunPeriod, error) {
	if in.SeunFromYear == nil && in.SeunToYear == nil {
		return nil, nil
	}
	from := base.Year
	to := base.Year
	if in.SeunFromYear != nil {
		from = *in.SeunFromYear
	}
	if in.SeunToYear != nil {
		to = *in.SeunToYear
	}
	if from <= 0 || to <= 0 {
		return nil, fmt.Errorf("seunFromYear/seunToYear must be positive")
	}
	if from > to {
		from, to = to, from
	}
	const maxYears = 30
	if to-from+1 > maxYears {
		to = from + maxYears - 1
	}

	out := make([]domain.DaeunPeriod, 0, to-from+1)
	for y := from; y <= to; y++ {
		parts := base
		parts.Year = y
		parts.Day = clampDay(parts.Year, parts.Month, parts.Day)
		raw, err := s.calcRawPillarsAt(parts, in.TimePrec, in.Tz)
		if err != nil {
			return nil, fmt.Errorf("seun list year %d: %w", y, err)
		}
		item := domain.EnrichFortunePeriod(domain.DaeunPeriod{
			Type:      "SEUN",
			Stem:      raw.Year.Stem,
			Branch:    raw.Year.Branch,
			StartYear: y,
			Year:      y,
		}, dayMaster)
		out = append(out, item)
	}
	return out, nil
}

func (s *ExtractSajuPairService) buildWolunList(in domain.BirthInput, base localDateTimeParts, dayMaster domain.StemId) ([]domain.DaeunPeriod, error) {
	if in.WolunYear == nil {
		return nil, nil
	}
	year := *in.WolunYear
	if year <= 0 {
		return nil, fmt.Errorf("wolunYear must be positive")
	}

	out := make([]domain.DaeunPeriod, 0, 12)
	for m := 1; m <= 12; m++ {
		parts := base
		parts.Year = year
		parts.Month = m
		parts.Day = clampDay(parts.Year, parts.Month, parts.Day)
		raw, err := s.calcRawPillarsAt(parts, in.TimePrec, in.Tz)
		if err != nil {
			return nil, fmt.Errorf("wolun list %04d-%02d: %w", year, m, err)
		}
		item := domain.EnrichFortunePeriod(domain.DaeunPeriod{
			Type:      "WOLUN",
			Stem:      raw.Month.Stem,
			Branch:    raw.Month.Branch,
			StartYear: year,
			Year:      year,
			Month:     m,
		}, dayMaster)
		out = append(out, item)
	}
	return out, nil
}

func (s *ExtractSajuPairService) buildIlunList(in domain.BirthInput, base localDateTimeParts, dayMaster domain.StemId) ([]domain.DaeunPeriod, error) {
	if in.IlunYear == nil && in.IlunMonth == nil {
		return nil, nil
	}
	if in.IlunYear == nil || in.IlunMonth == nil {
		return nil, fmt.Errorf("ilunYear and ilunMonth are required together")
	}
	year := *in.IlunYear
	month := *in.IlunMonth
	if year <= 0 {
		return nil, fmt.Errorf("ilunYear must be positive")
	}
	if month < 1 || month > 12 {
		return nil, fmt.Errorf("ilunMonth must be in 1..12")
	}

	totalDays := daysInMonth(year, month)
	out := make([]domain.DaeunPeriod, 0, totalDays)
	for day := 1; day <= totalDays; day++ {
		parts := base
		parts.Year = year
		parts.Month = month
		parts.Day = day
		raw, err := s.calcRawPillarsAt(parts, in.TimePrec, in.Tz)
		if err != nil {
			return nil, fmt.Errorf("ilun list %04d-%02d-%02d: %w", year, month, day, err)
		}
		item := domain.EnrichFortunePeriod(domain.DaeunPeriod{
			Type:      "ILUN",
			Stem:      raw.Day.Stem,
			Branch:    raw.Day.Branch,
			StartYear: year,
			Year:      year,
			Month:     month,
			Day:       day,
		}, dayMaster)
		out = append(out, item)
	}
	return out, nil
}

func (s *ExtractSajuPairService) applyFortuneRuns(doc *domain.SajuDoc, in domain.BirthInput, birthParts localDateTimeParts) error {
	if doc == nil || !hasFortuneRunRequest(in) {
		return nil
	}
	baseParts, err := resolveFortuneBaseParts(in, birthParts)
	if err != nil {
		return err
	}
	baseRaw, err := s.calcRawPillarsAt(baseParts, in.TimePrec, in.Tz)
	if err != nil {
		return fmt.Errorf("fortune base pillar calc failed: %w", err)
	}

	dayMaster := doc.DayMaster
	seun := domain.EnrichFortunePeriod(domain.DaeunPeriod{
		Type:      "SEUN",
		Stem:      baseRaw.Year.Stem,
		Branch:    baseRaw.Year.Branch,
		StartYear: baseParts.Year,
		Year:      baseParts.Year,
	}, dayMaster)
	wolun := domain.EnrichFortunePeriod(domain.DaeunPeriod{
		Type:      "WOLUN",
		Stem:      baseRaw.Month.Stem,
		Branch:    baseRaw.Month.Branch,
		StartYear: baseParts.Year,
		Year:      baseParts.Year,
		Month:     baseParts.Month,
	}, dayMaster)
	ilun := domain.EnrichFortunePeriod(domain.DaeunPeriod{
		Type:      "ILUN",
		Stem:      baseRaw.Day.Stem,
		Branch:    baseRaw.Day.Branch,
		StartYear: baseParts.Year,
		Year:      baseParts.Year,
		Month:     baseParts.Month,
		Day:       baseParts.Day,
	}, dayMaster)
	doc.Seun = &seun
	doc.Wolun = &wolun
	doc.Ilun = &ilun

	// 대운 포인트는 운세 기준 연도(기본: dtLocal) 기준으로 재선택한다.
	if len(doc.DaeunList) > 0 && birthParts.Year > 0 && baseParts.Year > 0 {
		age := baseParts.Year - birthParts.Year + 1
		if age < 1 {
			age = 1
		}
		idx := (age - 1) / 10
		if idx < 0 {
			idx = 0
		}
		if idx >= len(doc.DaeunList) {
			idx = len(doc.DaeunList) - 1
		}
		current := doc.DaeunList[idx]
		current.Type = "DAEUN"
		doc.Daeun = &current
	}

	seunList, err := s.buildSeunList(in, baseParts, dayMaster)
	if err != nil {
		return err
	}
	wolunList, err := s.buildWolunList(in, baseParts, dayMaster)
	if err != nil {
		return err
	}
	ilunList, err := s.buildIlunList(in, baseParts, dayMaster)
	if err != nil {
		return err
	}

	doc.SeunList = seunList
	doc.WolunList = wolunList
	doc.IlunList = ilunList
	return nil
}

// toModelExtractSajuDoc 은 uint8 기반 도메인 타입과 GraphQL int 타입 차이를 안전하게 매핑한다.
func toModelExtractSajuDoc(doc *domain.SajuDoc) (*model.ExtractSajuDoc, error) {
	if doc == nil {
		return nil, fmt.Errorf("nil saju doc")
	}
	out := &model.ExtractSajuDoc{
		SchemaVer: doc.SchemaVer,
		Input:     toModelSajuInputDisplay(doc.Input),
		Pillars:   make([]*model.ExtractPillar, 0, len(doc.Pillars)),
		Nodes:     make([]*model.ExtractSajuNode, 0, len(doc.Nodes)),
		Edges:     make([]*model.ExtractSajuEdge, 0, len(doc.Edges)),
		Facts:     make([]*model.ExtractFactItem, 0, len(doc.Facts)),
		Evals:     make([]*model.ExtractEvalItem, 0, len(doc.Evals)),
		DayMaster: int(doc.DayMaster),
		DaeunList: make([]*model.ExtractDaeunPeriod, 0, len(doc.DaeunList)),
		SeunList:  make([]*model.ExtractDaeunPeriod, 0, len(doc.SeunList)),
		WolunList: make([]*model.ExtractDaeunPeriod, 0, len(doc.WolunList)),
		IlunList:  make([]*model.ExtractDaeunPeriod, 0, len(doc.IlunList)),
	}
	if doc.Daeun != nil {
		out.Daeun = toModelDaeunPeriod(*doc.Daeun)
	}
	if doc.Seun != nil {
		out.Seun = toModelDaeunPeriod(*doc.Seun)
	}
	if doc.Wolun != nil {
		out.Wolun = toModelDaeunPeriod(*doc.Wolun)
	}
	if doc.Ilun != nil {
		out.Ilun = toModelDaeunPeriod(*doc.Ilun)
	}
	for _, p := range doc.Pillars {
		out.Pillars = append(out.Pillars, &model.ExtractPillar{
			K:        model.ExtractPillarKey(p.K),
			Stem:     int(p.Stem),
			Branch:   int(p.Branch),
			Hidden:   toIntSliceStem(p.Hidden),
			NaEum:    strPtrIfNotEmpty(p.NaEum),
			GongMang: toIntSliceBranch(p.GongMang),
		})
	}
	for _, n := range doc.Nodes {
		var idx *int
		if n.Idx != nil {
			v := int(*n.Idx)
			idx = &v
		}
		var stem *int
		if n.Stem != nil {
			v := int(*n.Stem)
			stem = &v
		}
		var branch *int
		if n.Branch != nil {
			v := int(*n.Branch)
			branch = &v
		}
		var tenGod *model.ExtractTenGod
		if n.TenGod != nil {
			v := model.ExtractTenGod(*n.TenGod)
			tenGod = &v
		}
		var twelve *model.ExtractTwelveFate
		if n.Twelve != nil {
			v := model.ExtractTwelveFate(*n.Twelve)
			twelve = &v
		}
		out.Nodes = append(out.Nodes, &model.ExtractSajuNode{
			ID:       int(n.ID),
			Kind:     model.ExtractNodeKind(n.Kind),
			Pillar:   model.ExtractPillarKey(n.Pillar),
			Idx:      idx,
			Stem:     stem,
			Branch:   branch,
			El:       model.ExtractFiveEl(n.El),
			Yy:       model.ExtractYinYang(n.Yy),
			TenGod:   tenGod,
			Twelve:   twelve,
			Strength: n.Strength,
		})
	}
	for _, e := range doc.Edges {
		var result *model.ExtractFiveEl
		if e.Result != nil {
			v := model.ExtractFiveEl(*e.Result)
			result = &v
		}
		out.Edges = append(out.Edges, &model.ExtractSajuEdge{
			ID:     int(e.ID),
			T:      string(e.T),
			A:      int(e.A),
			B:      int(e.B),
			W:      e.W,
			Refs:   toIntSliceNode(e.Refs),
			Result: result,
			Active: e.Active,
		})
	}
	for _, f := range doc.Facts {
		out.Facts = append(out.Facts, &model.ExtractFactItem{
			ID:       f.ID,
			K:        string(f.K),
			N:        f.N,
			V:        f.V,
			Refs:     toIntSliceNode(f.Refs),
			Evidence: toModelEvidence(f.Evidence),
			Score:    toModelScorePtr(f.Score),
		})
	}
	for _, e := range doc.Evals {
		out.Evals = append(out.Evals, &model.ExtractEvalItem{
			ID:       e.ID,
			K:        string(e.K),
			N:        e.N,
			V:        e.V,
			Refs:     toIntSliceNode(e.Refs),
			Evidence: toModelEvidence(e.Evidence),
			Score:    toModelScore(e.Score),
		})
	}
	for _, d := range doc.DaeunList {
		out.DaeunList = append(out.DaeunList, toModelDaeunPeriod(d))
	}
	for _, d := range doc.SeunList {
		out.SeunList = append(out.SeunList, toModelDaeunPeriod(d))
	}
	for _, d := range doc.WolunList {
		out.WolunList = append(out.WolunList, toModelDaeunPeriod(d))
	}
	for _, d := range doc.IlunList {
		out.IlunList = append(out.IlunList, toModelDaeunPeriod(d))
	}
	if doc.ElBalance != nil {
		out.ElBalance = &model.ExtractElDistribution{
			Wood:  doc.ElBalance.Wood,
			Fire:  doc.ElBalance.Fire,
			Earth: doc.ElBalance.Earth,
			Metal: doc.ElBalance.Metal,
			Water: doc.ElBalance.Water,
		}
	}
	if doc.HourCtx != nil {
		out.HourCtx = &model.ExtractHourContext{
			Status:        model.ExtractHourPillarStatus(doc.HourCtx.Status),
			MissingReason: strPtrIfNotEmpty(doc.HourCtx.MissingReason),
			StableNodes:   toIntSliceNode(doc.HourCtx.StableNodes),
			StableEdges:   toIntSliceEdge(doc.HourCtx.StableEdges),
			StableFacts:   append([]string(nil), doc.HourCtx.StableFacts...),
			StableEvals:   append([]string(nil), doc.HourCtx.StableEvals...),
			Candidates:    make([]*model.ExtractHourCandidate, 0, len(doc.HourCtx.Candidates)),
		}
		for _, c := range doc.HourCtx.Candidates {
			out.HourCtx.Candidates = append(out.HourCtx.Candidates, &model.ExtractHourCandidate{
				Order:      c.Order,
				Pillar:     outPillarToModel(c.Pillar),
				TimeWindow: strPtrIfNotEmpty(c.TimeWindow),
				Weight:     c.Weight,
				AddedNodes: toIntSliceNode(c.AddedNodes),
				AddedEdges: toIntSliceEdge(c.AddedEdges),
				AddedFacts: append([]string(nil), c.AddedFacts...),
				AddedEvals: append([]string(nil), c.AddedEvals...),
			})
		}
	}
	return out, nil
}

// toModelExtractPairDoc 은 PairDoc 전체를 GraphQL 응답 타입으로 수동 매핑한다.
func toModelExtractPairDoc(doc *domain.PairDoc) (*model.ExtractPairDoc, error) {
	if doc == nil {
		return nil, fmt.Errorf("nil pair doc")
	}
	out := &model.ExtractPairDoc{
		SchemaVer: doc.SchemaVer,
		Input: &model.ExtractPairInputDisplay{
			A:       toModelSajuInputDisplay(doc.Input.A),
			B:       toModelSajuInputDisplay(doc.Input.B),
			Engine:  toModelEngine(doc.Input.Engine),
			RuleSet: strPtrIfNotEmpty(doc.Input.RuleSet),
		},
		Edges:     make([]*model.ExtractPairEdge, 0, len(doc.Edges)),
		Facts:     make([]*model.ExtractPairFactItem, 0, len(doc.Facts)),
		Evals:     make([]*model.ExtractPairEvalItem, 0, len(doc.Evals)),
		CreatedAt: strPtrIfNotEmpty(doc.CreatedAt),
	}
	if doc.Charts != nil {
		charts := &model.ExtractPairCharts{}
		var err error
		if doc.Charts.A != nil {
			charts.A, err = toModelExtractSajuDoc(doc.Charts.A)
			if err != nil {
				return nil, err
			}
		}
		if doc.Charts.B != nil {
			charts.B, err = toModelExtractSajuDoc(doc.Charts.B)
			if err != nil {
				return nil, err
			}
		}
		out.Charts = charts
	}
	if doc.Metrics != nil {
		out.Metrics = &model.ExtractPairMetrics{
			HarmonyIndex:      doc.Metrics.HarmonyIndex,
			ConflictIndex:     doc.Metrics.ConflictIndex,
			NetIndex:          doc.Metrics.NetIndex,
			ElementComplement: doc.Metrics.ElementComplement,
			UsefulGodSupport:  doc.Metrics.UsefulGodSupport,
			RoleFit:           doc.Metrics.RoleFit,
			PressureRisk:      doc.Metrics.PressureRisk,
			Confidence:        doc.Metrics.Confidence,
			Sensitivity:       doc.Metrics.Sensitivity,
			TimingAlignment:   doc.Metrics.TimingAlignment,
		}
	}
	for _, e := range doc.Edges {
		var result *model.ExtractFiveEl
		if e.Result != nil {
			v := model.ExtractFiveEl(*e.Result)
			result = &v
		}
		out.Edges = append(out.Edges, &model.ExtractPairEdge{
			ID:       int(e.ID),
			T:        string(e.T),
			A:        int(e.A),
			B:        int(e.B),
			W:        e.W,
			RefsA:    toIntSliceNode(e.RefsA),
			RefsB:    toIntSliceNode(e.RefsB),
			Result:   result,
			Active:   e.Active,
			Evidence: toModelPairEvidencePtr(e.Evidence),
		})
	}
	for _, f := range doc.Facts {
		out.Facts = append(out.Facts, &model.ExtractPairFactItem{
			ID:       f.ID,
			K:        string(f.K),
			N:        f.N,
			V:        f.V,
			RefsA:    toIntSliceNode(f.RefsA),
			RefsB:    toIntSliceNode(f.RefsB),
			Evidence: toModelPairEvidence(f.Evidence),
			Score:    toModelPairScorePtr(f.Score),
		})
	}
	for _, e := range doc.Evals {
		out.Evals = append(out.Evals, &model.ExtractPairEvalItem{
			ID:       e.ID,
			K:        model.ExtractPairEvalKind(e.K),
			N:        e.N,
			V:        e.V,
			RefsA:    toIntSliceNode(e.RefsA),
			RefsB:    toIntSliceNode(e.RefsB),
			Evidence: toModelPairEvidence(e.Evidence),
			Score:    toModelPairScore(e.Score),
		})
	}
	if doc.HourCtx != nil {
		out.HourCtx = &model.ExtractPairHourContext{
			StatusA:        model.ExtractHourPillarStatus(doc.HourCtx.StatusA),
			StatusB:        model.ExtractHourPillarStatus(doc.HourCtx.StatusB),
			MissingReasonA: strPtrIfNotEmpty(doc.HourCtx.MissingReasonA),
			MissingReasonB: strPtrIfNotEmpty(doc.HourCtx.MissingReasonB),
			StableEdges:    toIntSlicePairEdge(doc.HourCtx.StableEdges),
			StableFacts:    append([]string(nil), doc.HourCtx.StableFacts...),
			StableEvals:    append([]string(nil), doc.HourCtx.StableEvals...),
			Candidates:     make([]*model.ExtractPairHourCandidate, 0, len(doc.HourCtx.Candidates)),
		}
		for _, c := range doc.HourCtx.Candidates {
			out.HourCtx.Candidates = append(out.HourCtx.Candidates, &model.ExtractPairHourCandidate{
				Order:      c.Order,
				A:          toModelPairHourChoice(c.A),
				B:          toModelPairHourChoice(c.B),
				Weight:     c.Weight,
				AddedEdges: toIntSlicePairEdge(c.AddedEdges),
				AddedFacts: append([]string(nil), c.AddedFacts...),
				AddedEvals: append([]string(nil), c.AddedEvals...),
				MetricsDelta: func() *model.ExtractPairMetrics {
					if c.MetricsDelta == nil {
						return nil
					}
					return &model.ExtractPairMetrics{
						HarmonyIndex:      c.MetricsDelta.HarmonyIndex,
						ConflictIndex:     c.MetricsDelta.ConflictIndex,
						NetIndex:          c.MetricsDelta.NetIndex,
						ElementComplement: c.MetricsDelta.ElementComplement,
						UsefulGodSupport:  c.MetricsDelta.UsefulGodSupport,
						RoleFit:           c.MetricsDelta.RoleFit,
						PressureRisk:      c.MetricsDelta.PressureRisk,
						Confidence:        c.MetricsDelta.Confidence,
						Sensitivity:       c.MetricsDelta.Sensitivity,
						TimingAlignment:   c.MetricsDelta.TimingAlignment,
					}
				}(),
				OverallScore: toModelPairScorePtr(c.OverallScore),
				Note:         strPtrIfNotEmpty(c.Note),
			})
		}
	}
	return out, nil
}

func toModelSajuInputDisplay(in domain.BirthInput) *model.ExtractSajuInputDisplay {
	out := &model.ExtractSajuInputDisplay{
		DtLocal:       in.DtLocal,
		Tz:            in.Tz,
		Calendar:      strPtrIfNotEmpty(in.Calendar),
		LeapMonth:     in.LeapMonth,
		Sex:           strPtrIfNotEmpty(in.Sex),
		TimePrec:      toModelTimePrecisionPtr(in.TimePrec),
		Engine:        toModelEngine(in.Engine),
		SolarDt:       strPtrIfNotEmpty(in.SolarDt),
		AdjustedDt:    strPtrIfNotEmpty(in.AdjustedDt),
		FortuneBaseDt: strPtrIfNotEmpty(in.FortuneBaseDt),
		SeunFromYear:  in.SeunFromYear,
		SeunToYear:    in.SeunToYear,
		WolunYear:     in.WolunYear,
		IlunYear:      in.IlunYear,
		IlunMonth:     in.IlunMonth,
	}
	if in.Loc != nil {
		out.Loc = &model.ExtractGeo{
			Lat: in.Loc.Lat,
			Lon: in.Loc.Lon,
		}
	}
	return out
}

func toModelEngine(in domain.Engine) *model.ExtractEngine {
	return &model.ExtractEngine{
		Name:   in.Name,
		Ver:    in.Ver,
		Sys:    strPtrIfNotEmpty(in.Sys),
		Params: in.Params,
	}
}

func toModelEvidence(in domain.Evidence) *model.ExtractEvidence {
	return &model.ExtractEvidence{
		RuleID:  in.RuleId,
		RuleVer: in.RuleVer,
		Sys:     strPtrIfNotEmpty(in.Sys),
		Inputs: &model.ExtractEvidenceInputs{
			Nodes:  toIntSliceNode(in.Inputs.Nodes),
			Params: in.Inputs.Params,
		},
		Notes: strPtrIfNotEmpty(in.Notes),
	}
}

func toModelScore(in domain.Score) *model.ExtractScore {
	out := &model.ExtractScore{
		Total:      in.Total,
		Min:        in.Min,
		Max:        in.Max,
		Norm0_100:  int(in.Norm0_100),
		Confidence: in.Confidence,
		Parts:      make([]*model.ExtractScorePart, 0, len(in.Parts)),
	}
	for _, p := range in.Parts {
		out.Parts = append(out.Parts, &model.ExtractScorePart{
			Label: p.Label,
			W:     p.W,
			Raw:   p.Raw,
			Refs:  toIntSliceNode(p.Refs),
			Note:  strPtrIfNotEmpty(p.Note),
		})
	}
	return out
}

func toModelScorePtr(in *domain.Score) *model.ExtractScore {
	if in == nil {
		return nil
	}
	return toModelScore(*in)
}

func toModelPairEvidence(in domain.PairEvidence) *model.ExtractPairEvidence {
	return &model.ExtractPairEvidence{
		RuleID:  in.RuleId,
		RuleVer: in.RuleVer,
		Sys:     strPtrIfNotEmpty(in.Sys),
		Inputs: &model.ExtractPairEvidenceInputs{
			NodesA: toIntSliceNode(in.Inputs.NodesA),
			NodesB: toIntSliceNode(in.Inputs.NodesB),
			Params: in.Inputs.Params,
		},
		Notes: strPtrIfNotEmpty(in.Notes),
	}
}

func toModelPairEvidencePtr(in *domain.PairEvidence) *model.ExtractPairEvidence {
	if in == nil {
		return nil
	}
	return toModelPairEvidence(*in)
}

func toModelPairScore(in domain.PairScore) *model.ExtractPairScore {
	out := &model.ExtractPairScore{
		Total:      in.Total,
		Min:        in.Min,
		Max:        in.Max,
		Norm0_100:  int(in.Norm0_100),
		Confidence: in.Confidence,
		Parts:      make([]*model.ExtractPairScorePart, 0, len(in.Parts)),
	}
	for _, p := range in.Parts {
		out.Parts = append(out.Parts, &model.ExtractPairScorePart{
			Label: p.Label,
			W:     p.W,
			Raw:   p.Raw,
			RefsA: toIntSliceNode(p.RefsA),
			RefsB: toIntSliceNode(p.RefsB),
			Note:  strPtrIfNotEmpty(p.Note),
		})
	}
	return out
}

func toModelPairScorePtr(in *domain.PairScore) *model.ExtractPairScore {
	if in == nil {
		return nil
	}
	return toModelPairScore(*in)
}

func toModelDaeunPeriod(in domain.DaeunPeriod) *model.ExtractDaeunPeriod {
	return &model.ExtractDaeunPeriod{
		Type:         in.Type,
		Order:        in.Order,
		Stem:         int(in.Stem),
		Branch:       int(in.Branch),
		StemKo:       strPtrIfNotEmpty(in.StemKo),
		StemHanja:    strPtrIfNotEmpty(in.StemHanja),
		BranchKo:     strPtrIfNotEmpty(in.BranchKo),
		BranchHanja:  strPtrIfNotEmpty(in.BranchHanja),
		GanjiKo:      strPtrIfNotEmpty(in.GanjiKo),
		GanjiHanja:   strPtrIfNotEmpty(in.GanjiHanja),
		StemEl:       toModelFiveElPtr(in.StemEl),
		StemYy:       toModelYinYangPtr(in.StemYy),
		StemTenGod:   toModelTenGodPtr(in.StemTenGod),
		BranchEl:     toModelFiveElPtr(in.BranchEl),
		BranchYy:     toModelYinYangPtr(in.BranchYy),
		BranchTenGod: toModelTenGodPtr(in.BranchTenGod),
		BranchTwelve: toModelTwelvePtr(in.BranchTwelve),
		AgeFrom:      in.AgeFrom,
		AgeTo:        in.AgeTo,
		StartYear:    in.StartYear,
		Year:         in.Year,
		Month:        in.Month,
		Day:          in.Day,
	}
}

func toModelPairHourChoice(in domain.PairHourChoice) *model.ExtractPairHourChoice {
	var pillar *model.ExtractPillar
	if in.Pillar != nil {
		pillar = outPillarToModel(*in.Pillar)
	}
	return &model.ExtractPairHourChoice{
		Status:         model.ExtractHourPillarStatus(in.Status),
		CandidateOrder: in.CandidateOrder,
		Pillar:         pillar,
		TimeWindow:     strPtrIfNotEmpty(in.TimeWindow),
		Weight:         in.Weight,
	}
}

func outPillarToModel(in domain.Pillar) *model.ExtractPillar {
	return &model.ExtractPillar{
		K:        model.ExtractPillarKey(in.K),
		Stem:     int(in.Stem),
		Branch:   int(in.Branch),
		Hidden:   toIntSliceStem(in.Hidden),
		NaEum:    strPtrIfNotEmpty(in.NaEum),
		GongMang: toIntSliceBranch(in.GongMang),
	}
}

func toModelTimePrecisionPtr(in domain.TimePrecision) *model.ExtractTimePrecision {
	if in == "" {
		return nil
	}
	v := model.ExtractTimePrecision(in)
	return &v
}

func toModelFiveElPtr(in domain.FiveEl) *model.ExtractFiveEl {
	if in == "" {
		return nil
	}
	v := model.ExtractFiveEl(in)
	return &v
}

func toModelYinYangPtr(in domain.YinYang) *model.ExtractYinYang {
	if in == "" {
		return nil
	}
	v := model.ExtractYinYang(in)
	return &v
}

func toModelTenGodPtr(in *domain.TenGod) *model.ExtractTenGod {
	if in == nil || *in == "" {
		return nil
	}
	v := model.ExtractTenGod(*in)
	return &v
}

func toModelTwelvePtr(in *domain.TwelveFate) *model.ExtractTwelveFate {
	if in == nil || *in == "" {
		return nil
	}
	v := model.ExtractTwelveFate(*in)
	return &v
}

func toIntSliceStem(in []domain.StemId) []int {
	if len(in) == 0 {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func toIntSliceBranch(in []domain.BranchId) []int {
	if len(in) == 0 {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func toIntSliceNode(in []domain.NodeId) []int {
	if len(in) == 0 {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func toIntSliceEdge(in []domain.EdgeId) []int {
	if len(in) == 0 {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func toIntSlicePairEdge(in []domain.PairEdgeId) []int {
	if len(in) == 0 {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func strPtrIfNotEmpty(v string) *string {
	if v == "" {
		return nil
	}
	x := v
	return &x
}
