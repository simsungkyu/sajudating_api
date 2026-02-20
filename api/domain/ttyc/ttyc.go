package domain

import (
	"fmt"
	"sort"
	"time"
)

const (
	MINUTE_MS int64 = 60_000
	DAY_MS    int64 = 86_400_000

	KST_OFFSET_MINUTES = 9 * 60
)

var (
	TTYC_EXAMPLE_TS_2022_02_01 = time.Date(2022, time.February, 1, 0, 0, 0, 0, time.Local).UnixMilli()
	TTYC_DAY_ANCHOR_GAPJA_TS   = time.Date(1984, time.February, 2, 0, 0, 0, 0, time.Local).UnixMilli()
)

type TtycTimePrecision string
type TtycSex string
type TtycFortuneType string
type TtycFiveElement string
type TtycYinYang string
type TtycTenGod string
type TtycTwelveFate string

const (
	TtycTimePrecisionMinute  TtycTimePrecision = "MINUTE"
	TtycTimePrecisionHour    TtycTimePrecision = "HOUR"
	TtycTimePrecisionUnknown TtycTimePrecision = "UNKNOWN"
)

const (
	TtycSexM       TtycSex = "M"
	TtycSexF       TtycSex = "F"
	TtycSexUnknown TtycSex = "UNKNOWN"
)

const (
	TtycFortuneTypeDaeun TtycFortuneType = "대운"
	TtycFortuneTypeSeun  TtycFortuneType = "세운"
	TtycFortuneTypeWolun TtycFortuneType = "월운"
	TtycFortuneTypeIlun  TtycFortuneType = "일운"
)

const (
	TtycFiveElementWood  TtycFiveElement = "목"
	TtycFiveElementFire  TtycFiveElement = "화"
	TtycFiveElementEarth TtycFiveElement = "토"
	TtycFiveElementMetal TtycFiveElement = "금"
	TtycFiveElementWater TtycFiveElement = "수"
)

const (
	TtycYinYangYang TtycYinYang = "양"
	TtycYinYangYin  TtycYinYang = "음"
)

const (
	TtycTenGodBigyeon   TtycTenGod = "비견"
	TtycTenGodGeopjae   TtycTenGod = "겁재"
	TtycTenGodSiksin    TtycTenGod = "식신"
	TtycTenGodSanggwan  TtycTenGod = "상관"
	TtycTenGodPyeonjae  TtycTenGod = "편재"
	TtycTenGodJeongjae  TtycTenGod = "정재"
	TtycTenGodPyeongwan TtycTenGod = "편관"
	TtycTenGodJeonggwan TtycTenGod = "정관"
	TtycTenGodPyeonin   TtycTenGod = "편인"
	TtycTenGodJeongin   TtycTenGod = "정인"
)

const (
	TtycTwelveFateJangsaeng TtycTwelveFate = "장생"
	TtycTwelveFateMokyok    TtycTwelveFate = "목욕"
	TtycTwelveFateGwandae   TtycTwelveFate = "관대"
	TtycTwelveFateGeonrok   TtycTwelveFate = "건록"
	TtycTwelveFateJewang    TtycTwelveFate = "제왕"
	TtycTwelveFateSoe       TtycTwelveFate = "쇠"
	TtycTwelveFateByeong    TtycTwelveFate = "병"
	TtycTwelveFateSa        TtycTwelveFate = "사"
	TtycTwelveFateMyo       TtycTwelveFate = "묘"
	TtycTwelveFateJeol      TtycTwelveFate = "절"
	TtycTwelveFateTae       TtycTwelveFate = "태"
	TtycTwelveFateYang      TtycTwelveFate = "양"
)

type TtycLocalDateTimeParts struct {
	Year        int `json:"year"`
	Month       int `json:"month"`
	Day         int `json:"day"`
	Hour        int `json:"hour"`
	Minute      int `json:"minute"`
	Second      int `json:"second"`
	Millisecond int `json:"millisecond"`
}

type TtycGanjiMeta struct {
	Stem          int             `json:"stem"`
	Branch        int             `json:"branch"`
	StemKo        string          `json:"stemKo"`
	StemHanja     string          `json:"stemHanja"`
	BranchKo      string          `json:"branchKo"`
	BranchHanja   string          `json:"branchHanja"`
	GanjiKo       string          `json:"ganjiKo"`
	GanjiHanja    string          `json:"ganjiHanja"`
	StemEl        TtycFiveElement `json:"stemEl"`
	StemYinYang   TtycYinYang     `json:"stemYinYang"`
	StemTenGod    TtycTenGod      `json:"stemTenGod"`
	BranchEl      TtycFiveElement `json:"branchEl"`
	BranchYinYang TtycYinYang     `json:"branchYinYang"`
	BranchTenGod  TtycTenGod      `json:"branchTenGod"`
	BranchTwelve  TtycTwelveFate  `json:"branchTwelve"`
}

type TtycPillars struct {
	Year  TtycGanjiMeta  `json:"year"`
	Month TtycGanjiMeta  `json:"month"`
	Day   TtycGanjiMeta  `json:"day"`
	Hour  *TtycGanjiMeta `json:"hour,omitempty"`
}

type TtycPillarCalcInput struct {
	Ts              int64             `json:"ts"`
	TzOffsetMinutes *int              `json:"tzOffsetMinutes,omitempty"`
	TimePrecision   TtycTimePrecision `json:"timePrecision,omitempty"`
}

type TtycPillarBoundaries struct {
	LichunStartTs    int64 `json:"lichunStartTs"`
	MonthTermStartTs int64 `json:"monthTermStartTs"`
	DayStartTs       int64 `json:"dayStartTs"`
}

type TtycPillarCalcResult struct {
	Ts              int64                  `json:"ts"`
	TzOffsetMinutes int                    `json:"tzOffsetMinutes"`
	TimePrecision   TtycTimePrecision      `json:"timePrecision"`
	Local           TtycLocalDateTimeParts `json:"local"`
	DayMasterStem   int                    `json:"dayMasterStem"`
	Pillars         TtycPillars            `json:"pillars"`
	Boundaries      TtycPillarBoundaries   `json:"boundaries"`
}

type TtycFortuneRequest struct {
	BaseTs       *int64 `json:"baseTs,omitempty"`
	SeunFromYear *int   `json:"seunFromYear,omitempty"`
	SeunToYear   *int   `json:"seunToYear,omitempty"`
	WolunYear    *int   `json:"wolunYear,omitempty"`
	IlunYear     *int   `json:"ilunYear,omitempty"`
	IlunMonth    *int   `json:"ilunMonth,omitempty"`
}

type TtycFortunePeriod struct {
	TtycGanjiMeta

	Type      TtycFortuneType `json:"type"`
	Order     int             `json:"order,omitempty"`
	AgeFrom   int             `json:"ageFrom,omitempty"`
	AgeTo     int             `json:"ageTo,omitempty"`
	StartYear int             `json:"startYear"`
	Year      int             `json:"year"`
	Month     int             `json:"month,omitempty"`
	Day       int             `json:"day,omitempty"`
	SourceTs  int64           `json:"sourceTs"`
}

type TtycFortuneFlow struct {
	BaseTs    int64                  `json:"baseTs"`
	BaseLocal TtycLocalDateTimeParts `json:"baseLocal"`
	Daeun     *TtycFortunePeriod     `json:"daeun,omitempty"`
	Seun      TtycFortunePeriod      `json:"seun"`
	Wolun     TtycFortunePeriod      `json:"wolun"`
	Ilun      TtycFortunePeriod      `json:"ilun"`
	DaeunList []TtycFortunePeriod    `json:"daeunList"`
	SeunList  []TtycFortunePeriod    `json:"seunList,omitempty"`
	WolunList []TtycFortunePeriod    `json:"wolunList,omitempty"`
	IlunList  []TtycFortunePeriod    `json:"ilunList,omitempty"`
}

type TtycCalculateInput struct {
	BirthTs         int64               `json:"birthTs"`
	TzOffsetMinutes *int                `json:"tzOffsetMinutes,omitempty"`
	Sex             TtycSex             `json:"sex,omitempty"`
	TimePrecision   TtycTimePrecision   `json:"timePrecision,omitempty"`
	Fortune         *TtycFortuneRequest `json:"fortune,omitempty"`
}

type TtycCalculateResult struct {
	Birth   TtycPillarCalcResult `json:"birth"`
	Fortune TtycFortuneFlow      `json:"fortune"`
}

type TtycTimestampParts struct {
	Year        int
	Month       int
	Day         int
	Hour        int
	Minute      int
	Second      int
	Millisecond int
}

var ttycStemKo = [...]string{"갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"}
var ttycStemHanja = [...]string{"甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"}
var ttycBranchKo = [...]string{"자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"}
var ttycBranchHanja = [...]string{"子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"}

var ttycStemElement = [...]TtycFiveElement{
	TtycFiveElementWood,
	TtycFiveElementWood,
	TtycFiveElementFire,
	TtycFiveElementFire,
	TtycFiveElementEarth,
	TtycFiveElementEarth,
	TtycFiveElementMetal,
	TtycFiveElementMetal,
	TtycFiveElementWater,
	TtycFiveElementWater,
}

var ttycBranchElement = [...]TtycFiveElement{
	TtycFiveElementWater,
	TtycFiveElementEarth,
	TtycFiveElementWood,
	TtycFiveElementWood,
	TtycFiveElementEarth,
	TtycFiveElementFire,
	TtycFiveElementFire,
	TtycFiveElementEarth,
	TtycFiveElementMetal,
	TtycFiveElementMetal,
	TtycFiveElementEarth,
	TtycFiveElementWater,
}

var ttycMonthStemSeedByYearStem = [...]int{
	2, 4, 6, 8, 0, 2, 4, 6, 8, 0,
}

var ttycTwelveFateOrder = [...]TtycTwelveFate{
	TtycTwelveFateJangsaeng,
	TtycTwelveFateMokyok,
	TtycTwelveFateGwandae,
	TtycTwelveFateGeonrok,
	TtycTwelveFateJewang,
	TtycTwelveFateSoe,
	TtycTwelveFateByeong,
	TtycTwelveFateSa,
	TtycTwelveFateMyo,
	TtycTwelveFateJeol,
	TtycTwelveFateTae,
	TtycTwelveFateYang,
}

var ttycTwelveFateStartBranchByDayStem = [...]int{
	11, 6, 2, 9, 2, 9, 5, 0, 8, 3,
}

type ttycSolarMonthStartTemplate struct {
	Month  int
	Day    int
	Branch int
	Name   string
}

const ttycSxtwlDayCycleOffset int64 = 2

var ttycSolarMonthStarts = [...]ttycSolarMonthStartTemplate{
	{Month: 1, Day: 6, Branch: 1, Name: "소한(丑월)"},
	{Month: 2, Day: 4, Branch: 2, Name: "입춘(寅월)"},
	{Month: 3, Day: 6, Branch: 3, Name: "경칩(卯월)"},
	{Month: 4, Day: 5, Branch: 4, Name: "청명(辰월)"},
	{Month: 5, Day: 6, Branch: 5, Name: "입하(巳월)"},
	{Month: 6, Day: 6, Branch: 6, Name: "망종(午월)"},
	{Month: 7, Day: 7, Branch: 7, Name: "소서(未월)"},
	{Month: 8, Day: 8, Branch: 8, Name: "입추(申월)"},
	{Month: 9, Day: 8, Branch: 9, Name: "백로(酉월)"},
	{Month: 10, Day: 8, Branch: 10, Name: "한로(戌월)"},
	{Month: 11, Day: 7, Branch: 11, Name: "입동(亥월)"},
	{Month: 12, Day: 7, Branch: 0, Name: "대설(子월)"},
}

func ttycMod(n, m int) int {
	return ((n % m) + m) % m
}

func ttycFloorDiv(n, d int64) int64 {
	q := n / d
	r := n % d
	if r != 0 && ((r > 0) != (d > 0)) {
		q--
	}
	return q
}

func ttycNormalizeTzOffsetMinutes(v *int) (int, error) {
	if v == nil {
		return KST_OFFSET_MINUTES, nil
	}
	if *v < -1080 || *v > 1080 {
		return 0, fmt.Errorf("tzOffsetMinutes out of range: %d", *v)
	}
	return *v, nil
}

func ttycNormalizeTimePrecision(v TtycTimePrecision) TtycTimePrecision {
	if v == "" {
		return TtycTimePrecisionMinute
	}
	return v
}

func ttycNormalizeSex(v TtycSex) TtycSex {
	if v == "" {
		return TtycSexUnknown
	}
	return v
}

func ttycLookupSolarTermStartDay(year, month int) (int, bool) {
	if month < 1 || month > 12 {
		return 0, false
	}
	if year < ttycSolarTermStartYear || year > ttycSolarTermEndYear {
		return 0, false
	}
	day := ttycSolarTermStartDayTable[year-ttycSolarTermStartYear][month-1]
	if day == 0 {
		return 0, false
	}
	return int(day), true
}

func ToLocalDateTimeParts(ts int64, tzOffsetMinutes *int) (TtycLocalDateTimeParts, error) {
	tzOffset, err := ttycNormalizeTzOffsetMinutes(tzOffsetMinutes)
	if err != nil {
		return TtycLocalDateTimeParts{}, err
	}
	localTs := ts + int64(tzOffset)*MINUTE_MS
	d := time.UnixMilli(localTs).UTC()
	return TtycLocalDateTimeParts{
		Year:        d.Year(),
		Month:       int(d.Month()),
		Day:         d.Day(),
		Hour:        d.Hour(),
		Minute:      d.Minute(),
		Second:      d.Second(),
		Millisecond: d.Nanosecond() / int(time.Millisecond),
	}, nil
}

func ToUnixTimestamp(parts TtycTimestampParts, tzOffsetMinutes *int) (int64, error) {
	tzOffset, err := ttycNormalizeTzOffsetMinutes(tzOffsetMinutes)
	if err != nil {
		return 0, err
	}
	utcMs := time.Date(
		parts.Year,
		time.Month(parts.Month),
		parts.Day,
		parts.Hour,
		parts.Minute,
		parts.Second,
		parts.Millisecond*1_000_000,
		time.UTC,
	).UnixMilli()
	return utcMs - int64(tzOffset)*MINUTE_MS, nil
}

func ToUnixTimestampByDateCtor(
	year int,
	monthOneBased int,
	day int,
	hour int,
	minute int,
	second int,
) int64 {
	return time.Date(year, time.Month(monthOneBased), day, hour, minute, second, 0, time.Local).UnixMilli()
}

func DaysInMonth(year, month int) int {
	if year <= 0 || month < 1 || month > 12 {
		return 31
	}
	return time.Date(year, time.Month(month+1), 0, 0, 0, 0, 0, time.UTC).Day()
}

func ClampDay(year, month, day int) int {
	if day < 1 {
		return 1
	}
	maxDay := DaysInMonth(year, month)
	if day > maxDay {
		return maxDay
	}
	return day
}

func ttycValidateStem(stem int) error {
	if stem < 0 || stem > 9 {
		return fmt.Errorf("invalid stem index: %d", stem)
	}
	return nil
}

func ttycValidateBranch(branch int) error {
	if branch < 0 || branch > 11 {
		return fmt.Errorf("invalid branch index: %d", branch)
	}
	return nil
}

func ttycYinYangByIndex(index int) TtycYinYang {
	if index%2 == 0 {
		return TtycYinYangYang
	}
	return TtycYinYangYin
}

func ttycFiveElementIndex(el TtycFiveElement) int {
	switch el {
	case TtycFiveElementWood:
		return 0
	case TtycFiveElementFire:
		return 1
	case TtycFiveElementEarth:
		return 2
	case TtycFiveElementMetal:
		return 3
	case TtycFiveElementWater:
		return 4
	default:
		return 0
	}
}

func ttycTenGodByDiffAndParity(diff int, sameYinYang bool) TtycTenGod {
	switch diff {
	case 0:
		if sameYinYang {
			return TtycTenGodBigyeon
		}
		return TtycTenGodGeopjae
	case 1:
		if sameYinYang {
			return TtycTenGodSiksin
		}
		return TtycTenGodSanggwan
	case 2:
		if sameYinYang {
			return TtycTenGodPyeonjae
		}
		return TtycTenGodJeongjae
	case 3:
		if sameYinYang {
			return TtycTenGodPyeongwan
		}
		return TtycTenGodJeonggwan
	case 4:
		if sameYinYang {
			return TtycTenGodPyeonin
		}
		return TtycTenGodJeongin
	default:
		return TtycTenGodBigyeon
	}
}

func ttycTenGodByStem(dayMasterStem, targetStem int) (TtycTenGod, error) {
	if err := ttycValidateStem(dayMasterStem); err != nil {
		return "", err
	}
	if err := ttycValidateStem(targetStem); err != nil {
		return "", err
	}
	dmEl := ttycFiveElementIndex(ttycStemElement[dayMasterStem])
	tgEl := ttycFiveElementIndex(ttycStemElement[targetStem])
	diff := ttycMod(tgEl-dmEl, 5)
	same := ttycYinYangByIndex(dayMasterStem) == ttycYinYangByIndex(targetStem)
	return ttycTenGodByDiffAndParity(diff, same), nil
}

func ttycTenGodByBranch(dayMasterStem, branch int) (TtycTenGod, error) {
	if err := ttycValidateStem(dayMasterStem); err != nil {
		return "", err
	}
	if err := ttycValidateBranch(branch); err != nil {
		return "", err
	}
	dmEl := ttycFiveElementIndex(ttycStemElement[dayMasterStem])
	brEl := ttycFiveElementIndex(ttycBranchElement[branch])
	diff := ttycMod(brEl-dmEl, 5)
	same := ttycYinYangByIndex(dayMasterStem) == ttycYinYangByIndex(branch)
	return ttycTenGodByDiffAndParity(diff, same), nil
}

func ttycTwelveFateByBranch(dayMasterStem, branch int) (TtycTwelveFate, error) {
	if err := ttycValidateStem(dayMasterStem); err != nil {
		return "", err
	}
	if err := ttycValidateBranch(branch); err != nil {
		return "", err
	}
	startBranch := ttycTwelveFateStartBranchByDayStem[dayMasterStem]
	dir := 1
	if dayMasterStem%2 != 0 {
		dir = -1
	}
	step := ttycMod((branch-startBranch)*dir, 12)
	return ttycTwelveFateOrder[step], nil
}

func ttycBuildGanjiMeta(stem, branch, dayMasterStem int) (TtycGanjiMeta, error) {
	if err := ttycValidateStem(stem); err != nil {
		return TtycGanjiMeta{}, err
	}
	if err := ttycValidateBranch(branch); err != nil {
		return TtycGanjiMeta{}, err
	}
	if err := ttycValidateStem(dayMasterStem); err != nil {
		return TtycGanjiMeta{}, err
	}

	stemTenGod, err := ttycTenGodByStem(dayMasterStem, stem)
	if err != nil {
		return TtycGanjiMeta{}, err
	}
	branchTenGod, err := ttycTenGodByBranch(dayMasterStem, branch)
	if err != nil {
		return TtycGanjiMeta{}, err
	}
	branchTwelve, err := ttycTwelveFateByBranch(dayMasterStem, branch)
	if err != nil {
		return TtycGanjiMeta{}, err
	}

	stemKo := ttycStemKo[stem]
	stemHanja := ttycStemHanja[stem]
	branchKo := ttycBranchKo[branch]
	branchHanja := ttycBranchHanja[branch]

	return TtycGanjiMeta{
		Stem:          stem,
		Branch:        branch,
		StemKo:        stemKo,
		StemHanja:     stemHanja,
		BranchKo:      branchKo,
		BranchHanja:   branchHanja,
		GanjiKo:       stemKo + branchKo,
		GanjiHanja:    stemHanja + branchHanja,
		StemEl:        ttycStemElement[stem],
		StemYinYang:   ttycYinYangByIndex(stem),
		StemTenGod:    stemTenGod,
		BranchEl:      ttycBranchElement[branch],
		BranchYinYang: ttycYinYangByIndex(branch),
		BranchTenGod:  branchTenGod,
		BranchTwelve:  branchTwelve,
	}, nil
}

type ttycYearPillarCalc struct {
	Stem          int
	Branch        int
	CycleYear     int
	LichunStartTs int64
}

func ttycCalcYearPillar(ts int64, local TtycLocalDateTimeParts, tzOffsetMinutes int) (ttycYearPillarCalc, error) {
	lichunDay := 4
	if day, ok := ttycLookupSolarTermStartDay(local.Year, 2); ok {
		lichunDay = day
	}
	lichunStartTs, err := ToUnixTimestamp(
		TtycTimestampParts{Year: local.Year, Month: 2, Day: lichunDay, Hour: 0, Minute: 0},
		&tzOffsetMinutes,
	)
	if err != nil {
		return ttycYearPillarCalc{}, err
	}
	cycleYear := local.Year
	if ts < lichunStartTs {
		cycleYear = local.Year - 1
	}
	return ttycYearPillarCalc{
		Stem:          ttycMod(cycleYear-4, 10),
		Branch:        ttycMod(cycleYear-4, 12),
		CycleYear:     cycleYear,
		LichunStartTs: lichunStartTs,
	}, nil
}

type ttycMonthBranchBoundary struct {
	StartTs int64
	Branch  int
	Name    string
}

func ttycBuildMonthBranchBoundaries(year, tzOffsetMinutes int) ([]ttycMonthBranchBoundary, error) {
	out := make([]ttycMonthBranchBoundary, 0, len(ttycSolarMonthStarts)*3)
	for _, y := range []int{year - 1, year, year + 1} {
		for _, item := range ttycSolarMonthStarts {
			day := item.Day
			if v, ok := ttycLookupSolarTermStartDay(y, item.Month); ok {
				day = v
			}
			startTs, err := ToUnixTimestamp(
				TtycTimestampParts{Year: y, Month: item.Month, Day: day, Hour: 0, Minute: 0},
				&tzOffsetMinutes,
			)
			if err != nil {
				return nil, err
			}
			out = append(out, ttycMonthBranchBoundary{
				StartTs: startTs,
				Branch:  item.Branch,
				Name:    item.Name,
			})
		}
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].StartTs < out[j].StartTs
	})
	return out, nil
}

type ttycMonthBranchCalc struct {
	Branch   int
	StartTs  int64
	TermName string
}

func ttycCalcMonthBranch(ts int64, localYear, tzOffsetMinutes int) (ttycMonthBranchCalc, error) {
	boundaries, err := ttycBuildMonthBranchBoundaries(localYear, tzOffsetMinutes)
	if err != nil {
		return ttycMonthBranchCalc{}, err
	}
	current := boundaries[0]
	for _, b := range boundaries {
		if b.StartTs <= ts {
			current = b
			continue
		}
		break
	}
	return ttycMonthBranchCalc{
		Branch:   current.Branch,
		StartTs:  current.StartTs,
		TermName: current.Name,
	}, nil
}

func ttycCalcMonthStem(yearStem, monthBranch int) (int, error) {
	if err := ttycValidateStem(yearStem); err != nil {
		return 0, err
	}
	if err := ttycValidateBranch(monthBranch); err != nil {
		return 0, err
	}
	seed := ttycMonthStemSeedByYearStem[yearStem]
	monthOrder := ttycMod(monthBranch-2, 12) + 1
	return ttycMod(seed+(monthOrder-1), 10), nil
}

type ttycDayPillarCalc struct {
	Stem       int
	Branch     int
	DayStartTs int64
}

func ttycCalcDayPillar(local TtycLocalDateTimeParts, tzOffsetMinutes int) (ttycDayPillarCalc, error) {
	dayStartTs, err := ToUnixTimestamp(
		TtycTimestampParts{Year: local.Year, Month: local.Month, Day: local.Day, Hour: 0, Minute: 0},
		&tzOffsetMinutes,
	)
	if err != nil {
		return ttycDayPillarCalc{}, err
	}
	anchorStartTs, err := ToUnixTimestamp(
		TtycTimestampParts{Year: 1984, Month: 2, Day: 2, Hour: 0, Minute: 0},
		&tzOffsetMinutes,
	)
	if err != nil {
		return ttycDayPillarCalc{}, err
	}
	diffDays := ttycFloorDiv(dayStartTs-anchorStartTs, DAY_MS) + ttycSxtwlDayCycleOffset
	return ttycDayPillarCalc{
		Stem:       ttycMod(int(diffDays), 10),
		Branch:     ttycMod(int(diffDays), 12),
		DayStartTs: dayStartTs,
	}, nil
}

type ttycHourPillarCalc struct {
	Stem   int
	Branch int
}

func ttycCalcHourPillar(dayStem, hour int) (ttycHourPillarCalc, error) {
	if err := ttycValidateStem(dayStem); err != nil {
		return ttycHourPillarCalc{}, err
	}
	branch := ttycMod((hour+1)/2, 12)
	stem := ttycMod(dayStem*2+branch, 10)
	return ttycHourPillarCalc{
		Stem:   stem,
		Branch: branch,
	}, nil
}

func CalculatePillars(input TtycPillarCalcInput) (TtycPillarCalcResult, error) {
	tzOffsetMinutes, err := ttycNormalizeTzOffsetMinutes(input.TzOffsetMinutes)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	timePrecision := ttycNormalizeTimePrecision(input.TimePrecision)
	ts := input.Ts

	local, err := ToLocalDateTimeParts(ts, &tzOffsetMinutes)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	yearPillar, err := ttycCalcYearPillar(ts, local, tzOffsetMinutes)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	monthBranch, err := ttycCalcMonthBranch(ts, local.Year, tzOffsetMinutes)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	monthStem, err := ttycCalcMonthStem(yearPillar.Stem, monthBranch.Branch)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	dayPillar, err := ttycCalcDayPillar(local, tzOffsetMinutes)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	dayMasterStem := dayPillar.Stem

	yearMeta, err := ttycBuildGanjiMeta(yearPillar.Stem, yearPillar.Branch, dayMasterStem)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	monthMeta, err := ttycBuildGanjiMeta(monthStem, monthBranch.Branch, dayMasterStem)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	dayMeta, err := ttycBuildGanjiMeta(dayPillar.Stem, dayPillar.Branch, dayMasterStem)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}

	pillars := TtycPillars{
		Year:  yearMeta,
		Month: monthMeta,
		Day:   dayMeta,
	}
	if timePrecision != TtycTimePrecisionUnknown {
		hourPillar, err := ttycCalcHourPillar(dayMasterStem, local.Hour)
		if err != nil {
			return TtycPillarCalcResult{}, err
		}
		hourMeta, err := ttycBuildGanjiMeta(hourPillar.Stem, hourPillar.Branch, dayMasterStem)
		if err != nil {
			return TtycPillarCalcResult{}, err
		}
		pillars.Hour = &hourMeta
	}

	return TtycPillarCalcResult{
		Ts:              ts,
		TzOffsetMinutes: tzOffsetMinutes,
		TimePrecision:   timePrecision,
		Local:           local,
		DayMasterStem:   dayMasterStem,
		Pillars:         pillars,
		Boundaries: TtycPillarBoundaries{
			LichunStartTs:    yearPillar.LichunStartTs,
			MonthTermStartTs: monthBranch.StartTs,
			DayStartTs:       dayPillar.DayStartTs,
		},
	}, nil
}

func ttycIsForwardDaeun(yearStem int, sex TtycSex) bool {
	yangYear := yearStem%2 == 0
	if sex == TtycSexM {
		return yangYear
	}
	if sex == TtycSexF {
		return !yangYear
	}
	return yangYear
}

type ttycFortunePeriodExtra struct {
	Order     int
	AgeFrom   int
	AgeTo     int
	StartYear int
	Year      int
	Month     int
	Day       int
}

func ttycToFortunePeriod(
	kind TtycFortuneType,
	stem int,
	branch int,
	dayMasterStem int,
	sourceTs int64,
	extra ttycFortunePeriodExtra,
) (TtycFortunePeriod, error) {
	meta, err := ttycBuildGanjiMeta(stem, branch, dayMasterStem)
	if err != nil {
		return TtycFortunePeriod{}, err
	}
	return TtycFortunePeriod{
		Type:          kind,
		SourceTs:      sourceTs,
		TtycGanjiMeta: meta,
		Order:         extra.Order,
		AgeFrom:       extra.AgeFrom,
		AgeTo:         extra.AgeTo,
		StartYear:     extra.StartYear,
		Year:          extra.Year,
		Month:         extra.Month,
		Day:           extra.Day,
	}, nil
}

func ttycBuildDaeunList(birth TtycPillarCalcResult, sex TtycSex) ([]TtycFortunePeriod, error) {
	forward := ttycIsForwardDaeun(birth.Pillars.Year.Stem, sex)
	baseMonthStem := birth.Pillars.Month.Stem
	baseMonthBranch := birth.Pillars.Month.Branch

	list := make([]TtycFortunePeriod, 0, 8)
	for order := 1; order <= 8; order++ {
		shift := order
		if !forward {
			shift = -order
		}
		stem := ttycMod(baseMonthStem+shift, 10)
		branch := ttycMod(baseMonthBranch+shift, 12)
		ageFrom := 1 + (order-1)*10
		ageTo := ageFrom + 9
		startYear := birth.Local.Year + ageFrom

		item, err := ttycToFortunePeriod(
			TtycFortuneTypeDaeun,
			stem,
			branch,
			birth.DayMasterStem,
			birth.Ts,
			ttycFortunePeriodExtra{
				Order:     order,
				AgeFrom:   ageFrom,
				AgeTo:     ageTo,
				StartYear: startYear,
				Year:      startYear,
			},
		)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, nil
}

func ttycPickCurrentDaeun(daeunList []TtycFortunePeriod, birthYear, baseYear int) *TtycFortunePeriod {
	if len(daeunList) == 0 {
		return nil
	}
	age := baseYear - birthYear + 1
	if age < 1 {
		age = 1
	}
	idx := (age - 1) / 10
	if idx < 0 {
		idx = 0
	}
	if idx >= len(daeunList) {
		idx = len(daeunList) - 1
	}
	picked := daeunList[idx]
	picked.Type = TtycFortuneTypeDaeun
	return &picked
}

type ttycLocalDatePatch struct {
	Year   *int
	Month  *int
	Day    *int
	Hour   *int
	Minute *int
}

func ttycCalcPillarsAtLocalParts(
	base TtycLocalDateTimeParts,
	patch ttycLocalDatePatch,
	tzOffsetMinutes int,
	timePrecision TtycTimePrecision,
) (TtycPillarCalcResult, error) {
	year := base.Year
	if patch.Year != nil {
		year = *patch.Year
	}
	month := base.Month
	if patch.Month != nil {
		month = *patch.Month
	}
	dayRaw := base.Day
	if patch.Day != nil {
		dayRaw = *patch.Day
	}
	day := ClampDay(year, month, dayRaw)
	hour := base.Hour
	if patch.Hour != nil {
		hour = *patch.Hour
	}
	minute := base.Minute
	if patch.Minute != nil {
		minute = *patch.Minute
	}

	ts, err := ToUnixTimestamp(
		TtycTimestampParts{
			Year:   year,
			Month:  month,
			Day:    day,
			Hour:   hour,
			Minute: minute,
		},
		&tzOffsetMinutes,
	)
	if err != nil {
		return TtycPillarCalcResult{}, err
	}
	return CalculatePillars(TtycPillarCalcInput{
		Ts:              ts,
		TzOffsetMinutes: &tzOffsetMinutes,
		TimePrecision:   timePrecision,
	})
}

func ttycBuildSeunList(req TtycFortuneRequest, base TtycPillarCalcResult) ([]TtycFortunePeriod, error) {
	hasFrom := req.SeunFromYear != nil
	hasTo := req.SeunToYear != nil
	if !hasFrom && !hasTo {
		return nil, nil
	}

	from := base.Local.Year
	if hasFrom {
		from = *req.SeunFromYear
	}
	to := base.Local.Year
	if hasTo {
		to = *req.SeunToYear
	}
	if from <= 0 || to <= 0 {
		return nil, fmt.Errorf("seunFromYear/seunToYear must be positive")
	}
	if from > to {
		from, to = to, from
	}
	if to-from+1 > 30 {
		to = from + 29
	}

	out := make([]TtycFortunePeriod, 0, to-from+1)
	for y := from; y <= to; y++ {
		year := y
		calc, err := ttycCalcPillarsAtLocalParts(
			base.Local,
			ttycLocalDatePatch{Year: &year},
			base.TzOffsetMinutes,
			base.TimePrecision,
		)
		if err != nil {
			return nil, err
		}
		item, err := ttycToFortunePeriod(
			TtycFortuneTypeSeun,
			calc.Pillars.Year.Stem,
			calc.Pillars.Year.Branch,
			base.DayMasterStem,
			calc.Ts,
			ttycFortunePeriodExtra{
				StartYear: y,
				Year:      y,
			},
		)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func ttycBuildWolunList(req TtycFortuneRequest, base TtycPillarCalcResult) ([]TtycFortunePeriod, error) {
	if req.WolunYear == nil {
		return nil, nil
	}
	year := *req.WolunYear
	if year <= 0 {
		return nil, fmt.Errorf("wolunYear must be positive")
	}

	out := make([]TtycFortunePeriod, 0, 12)
	for month := 1; month <= 12; month++ {
		y, m := year, month
		calc, err := ttycCalcPillarsAtLocalParts(
			base.Local,
			ttycLocalDatePatch{Year: &y, Month: &m},
			base.TzOffsetMinutes,
			base.TimePrecision,
		)
		if err != nil {
			return nil, err
		}
		item, err := ttycToFortunePeriod(
			TtycFortuneTypeWolun,
			calc.Pillars.Month.Stem,
			calc.Pillars.Month.Branch,
			base.DayMasterStem,
			calc.Ts,
			ttycFortunePeriodExtra{
				StartYear: year,
				Year:      year,
				Month:     month,
			},
		)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func ttycBuildIlunList(req TtycFortuneRequest, base TtycPillarCalcResult) ([]TtycFortunePeriod, error) {
	hasYear := req.IlunYear != nil
	hasMonth := req.IlunMonth != nil
	if !hasYear && !hasMonth {
		return nil, nil
	}
	if !hasYear || !hasMonth {
		return nil, fmt.Errorf("ilunYear and ilunMonth are required together")
	}

	year := *req.IlunYear
	month := *req.IlunMonth
	if year <= 0 {
		return nil, fmt.Errorf("ilunYear must be positive")
	}
	if month < 1 || month > 12 {
		return nil, fmt.Errorf("ilunMonth must be in 1..12")
	}

	totalDays := DaysInMonth(year, month)
	out := make([]TtycFortunePeriod, 0, totalDays)
	for day := 1; day <= totalDays; day++ {
		y, m, d := year, month, day
		calc, err := ttycCalcPillarsAtLocalParts(
			base.Local,
			ttycLocalDatePatch{Year: &y, Month: &m, Day: &d},
			base.TzOffsetMinutes,
			base.TimePrecision,
		)
		if err != nil {
			return nil, err
		}
		item, err := ttycToFortunePeriod(
			TtycFortuneTypeIlun,
			calc.Pillars.Day.Stem,
			calc.Pillars.Day.Branch,
			base.DayMasterStem,
			calc.Ts,
			ttycFortunePeriodExtra{
				StartYear: year,
				Year:      year,
				Month:     month,
				Day:       day,
			},
		)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func CalculateFortuneFlow(
	birth TtycPillarCalcResult,
	sex TtycSex,
	request *TtycFortuneRequest,
) (TtycFortuneFlow, error) {
	req := TtycFortuneRequest{}
	if request != nil {
		req = *request
	}

	baseTs := birth.Ts
	if req.BaseTs != nil {
		baseTs = *req.BaseTs
	}
	baseCalc, err := CalculatePillars(TtycPillarCalcInput{
		Ts:              baseTs,
		TzOffsetMinutes: &birth.TzOffsetMinutes,
		TimePrecision:   birth.TimePrecision,
	})
	if err != nil {
		return TtycFortuneFlow{}, err
	}

	daeunList, err := ttycBuildDaeunList(birth, ttycNormalizeSex(sex))
	if err != nil {
		return TtycFortuneFlow{}, err
	}
	daeun := ttycPickCurrentDaeun(daeunList, birth.Local.Year, baseCalc.Local.Year)

	seun, err := ttycToFortunePeriod(
		TtycFortuneTypeSeun,
		baseCalc.Pillars.Year.Stem,
		baseCalc.Pillars.Year.Branch,
		birth.DayMasterStem,
		baseCalc.Ts,
		ttycFortunePeriodExtra{
			StartYear: baseCalc.Local.Year,
			Year:      baseCalc.Local.Year,
		},
	)
	if err != nil {
		return TtycFortuneFlow{}, err
	}
	wolun, err := ttycToFortunePeriod(
		TtycFortuneTypeWolun,
		baseCalc.Pillars.Month.Stem,
		baseCalc.Pillars.Month.Branch,
		birth.DayMasterStem,
		baseCalc.Ts,
		ttycFortunePeriodExtra{
			StartYear: baseCalc.Local.Year,
			Year:      baseCalc.Local.Year,
			Month:     baseCalc.Local.Month,
		},
	)
	if err != nil {
		return TtycFortuneFlow{}, err
	}
	ilun, err := ttycToFortunePeriod(
		TtycFortuneTypeIlun,
		baseCalc.Pillars.Day.Stem,
		baseCalc.Pillars.Day.Branch,
		birth.DayMasterStem,
		baseCalc.Ts,
		ttycFortunePeriodExtra{
			StartYear: baseCalc.Local.Year,
			Year:      baseCalc.Local.Year,
			Month:     baseCalc.Local.Month,
			Day:       baseCalc.Local.Day,
		},
	)
	if err != nil {
		return TtycFortuneFlow{}, err
	}

	seunList, err := ttycBuildSeunList(req, baseCalc)
	if err != nil {
		return TtycFortuneFlow{}, err
	}
	wolunList, err := ttycBuildWolunList(req, baseCalc)
	if err != nil {
		return TtycFortuneFlow{}, err
	}
	ilunList, err := ttycBuildIlunList(req, baseCalc)
	if err != nil {
		return TtycFortuneFlow{}, err
	}

	return TtycFortuneFlow{
		BaseTs:    baseTs,
		BaseLocal: baseCalc.Local,
		Daeun:     daeun,
		Seun:      seun,
		Wolun:     wolun,
		Ilun:      ilun,
		DaeunList: daeunList,
		SeunList:  seunList,
		WolunList: wolunList,
		IlunList:  ilunList,
	}, nil
}

func CalculateTtyc(input TtycCalculateInput) (TtycCalculateResult, error) {
	birth, err := CalculatePillars(TtycPillarCalcInput{
		Ts:              input.BirthTs,
		TzOffsetMinutes: input.TzOffsetMinutes,
		TimePrecision:   input.TimePrecision,
	})
	if err != nil {
		return TtycCalculateResult{}, err
	}
	fortune, err := CalculateFortuneFlow(birth, input.Sex, input.Fortune)
	if err != nil {
		return TtycCalculateResult{}, err
	}
	return TtycCalculateResult{
		Birth:   birth,
		Fortune: fortune,
	}, nil
}

type TtycCalculatorOptions struct {
	TzOffsetMinutes *int
	TimePrecision   TtycTimePrecision
	Sex             TtycSex
}

type TtycCalculator struct {
	tzOffsetMinutes int
	timePrecision   TtycTimePrecision
	sex             TtycSex
}

func NewTtycCalculator(opts *TtycCalculatorOptions) (*TtycCalculator, error) {
	var (
		tzPtr         *int
		timePrecision TtycTimePrecision
		sex           TtycSex
	)
	if opts != nil {
		tzPtr = opts.TzOffsetMinutes
		timePrecision = opts.TimePrecision
		sex = opts.Sex
	}

	tzOffsetMinutes, err := ttycNormalizeTzOffsetMinutes(tzPtr)
	if err != nil {
		return nil, err
	}
	return &TtycCalculator{
		tzOffsetMinutes: tzOffsetMinutes,
		timePrecision:   ttycNormalizeTimePrecision(timePrecision),
		sex:             ttycNormalizeSex(sex),
	}, nil
}

func (c *TtycCalculator) CalculatePillars(ts int64) (TtycPillarCalcResult, error) {
	return CalculatePillars(TtycPillarCalcInput{
		Ts:              ts,
		TzOffsetMinutes: &c.tzOffsetMinutes,
		TimePrecision:   c.timePrecision,
	})
}

func (c *TtycCalculator) Calculate(ts int64, fortune *TtycFortuneRequest) (TtycCalculateResult, error) {
	return CalculateTtyc(TtycCalculateInput{
		BirthTs:         ts,
		TzOffsetMinutes: &c.tzOffsetMinutes,
		Sex:             c.sex,
		TimePrecision:   c.timePrecision,
		Fortune:         fortune,
	})
}
