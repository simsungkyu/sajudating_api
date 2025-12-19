package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"sajudating_api/api/admgql/model"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/utils"
)

type AdminToolService struct{}

func NewAdminToolService() *AdminToolService {
	return &AdminToolService{}
}

// 천간(天干) 변환 테이블
var stemHanja = []string{"甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"}
var stemKo = []string{"갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"}

// 지지(地支) 변환 테이블
var branchHanja = []string{"子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"}
var branchKo = []string{"자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"}

// 육십갑자 cycle_id 계산 (천간 * 6 + 지지 / 2)
func getCycleID(tg, dz int) int {
	return (tg*6 + dz/2) % 60
}

// GetPaljaGql calculates palja using sxtwl (만세력)
func (s *AdminToolService) GetPaljaGql(ctx context.Context, birthdate string, timezone string) (*model.SimpleResult, error) {
	palja, err := extdao.GenPalja(birthdate, timezone)
	if err != nil {
		return nil, err
	}

	// 전체 사주 정보를 구조화된 형태로 반환
	response := map[string]any{
		"palja":          palja.GetPalja(),                          // 천간지지 한글 (예: "경오신사")
		"full_palja":     palja.GetFullPalja(),                      // 천간+지지 (예: "66165949")
		"palja_korean":   palja.GetPaljaKorean(),                    // 한글 (예: "경오 신사 무유")
		"palja_tenstems": utils.CalculateTenStems(palja.GetPalja()), // 십성 (예: "비견 겁재 비견 겁재 본원 겁재 비견 겁재 ")
		"pillars": map[string]any{
			"year": map[string]any{
				"tg":     palja.Pillars.Year.Tg,
				"dz":     palja.Pillars.Year.Dz,
				"korean": utils.TG_ARRAY[palja.Pillars.Year.Tg] + utils.DZ_ARRAY[palja.Pillars.Year.Dz],
			},
			"month": map[string]any{
				"tg":     palja.Pillars.Month.Tg,
				"dz":     palja.Pillars.Month.Dz,
				"korean": utils.TG_ARRAY[palja.Pillars.Month.Tg] + utils.DZ_ARRAY[palja.Pillars.Month.Dz],
			},
			"day": map[string]any{
				"tg":     palja.Pillars.Day.Tg,
				"dz":     palja.Pillars.Day.Dz,
				"korean": utils.TG_ARRAY[palja.Pillars.Day.Tg] + utils.DZ_ARRAY[palja.Pillars.Day.Dz],
			},
		},
		"input": palja.Input,
		"meta":  palja.Meta,
	}

	// 시주 정보가 있으면 추가
	if palja.Pillars.Hour != nil {
		response["pillars"].(map[string]any)["hour"] = map[string]any{
			"tg":            palja.Pillars.Hour.Tg,
			"dz":            palja.Pillars.Hour.Dz,
			"korean":        utils.TG_ARRAY[palja.Pillars.Hour.Tg] + utils.DZ_ARRAY[palja.Pillars.Hour.Dz],
			"actual_hour":   palja.Pillars.Hour.ActualHour,
			"actual_minute": palja.Pillars.Hour.ActualMin,
		}
	}

	// JSON으로 변환
	jsonBytes, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal palja result: %w", err)
	}

	return &model.SimpleResult{
		Ok:    true,
		Value: utils.StrPtr(string(jsonBytes)),
	}, nil
}

type inputError struct{ err error }

func (e inputError) Error() string { return e.err.Error() }
func (e inputError) Unwrap() error { return e.err }

// calculateSxtwl performs the actual sxtwl calculation
func calculateSxtwl(birth string, timezone string) (map[string]any, error) {
	// Parse birth datetime (YYYYMMDD or YYYYMMDDHHmm format)
	if len(birth) != 8 && len(birth) != 12 {
		return nil, inputError{err: fmt.Errorf("invalid birth format: expected YYYYMMDD (8 digits) or YYYYMMDDHHmm (12 digits), got %s", birth)}
	}

	year, err := strconv.Atoi(birth[0:4])
	if err != nil {
		return nil, inputError{err: fmt.Errorf("invalid year: %w", err)}
	}
	month, err := strconv.Atoi(birth[4:6])
	if err != nil {
		return nil, inputError{err: fmt.Errorf("invalid month: %w", err)}
	}
	day, err := strconv.Atoi(birth[6:8])
	if err != nil {
		return nil, inputError{err: fmt.Errorf("invalid day: %w", err)}
	}

	var hour *int
	var minute *int
	if len(birth) == 12 {
		h, err := strconv.Atoi(birth[8:10])
		if err != nil {
			return nil, inputError{err: fmt.Errorf("invalid hour: %w", err)}
		}
		m, err := strconv.Atoi(birth[10:12])
		if err != nil {
			return nil, inputError{err: fmt.Errorf("invalid minute: %w", err)}
		}
		hour = &h
		minute = &m
	}

	// Call Python sxtwl service
	result, err := extdao.CallSxtwlOptional(year, month, day, hour, minute, timezone, nil)
	if err != nil {
		return nil, fmt.Errorf("sxtwl calculation failed: %w", err)
	}

	// Convert indices to Hanja/Korean
	yearPillar := convertPillar(result.Pillars.Year.Tg, result.Pillars.Year.Dz)
	monthPillar := convertPillar(result.Pillars.Month.Tg, result.Pillars.Month.Dz)
	dayPillar := convertPillar(result.Pillars.Day.Tg, result.Pillars.Day.Dz)

	var hourPillar SajuPillarText
	if hour != nil && minute != nil {
		// Calculate hour pillar (시주)
		// Hour pillar stem is calculated based on day stem and hour branch
		hourBranchIndex := ((*hour + 1) / 2) % 12
		hourStemIndex := calculateHourStem(dayPillar.StemKo, hourBranchIndex)
		hourPillar = convertPillar(hourStemIndex, hourBranchIndex)
	}

	// Result string: 연/월/일/(시) 한글 6글자 or 8글자
	resultKo := yearPillar.PillarKo + monthPillar.PillarKo + dayPillar.PillarKo
	if hour != nil && minute != nil {
		resultKo += hourPillar.PillarKo
	}

	resp := map[string]any{
		"birth":    birth,
		"timezone": timezone,
		"y":        year,
		"m":        month,
		"d":        day,
		"hh":       hour,
		"mm":       minute,
		"result":   resultKo,
	}

	return resp, nil
}

// convertPillar converts tg(천간) and dz(지지) indices to SajuPillar
type SajuPillarText struct {
	StemKo      string
	BranchKo    string
	PillarKo    string
	StemHanja   string
	BranchHanja string
	PillarHanja string
	CycleID     int
}

func convertPillar(tg, dz int) SajuPillarText {
	stemH := stemHanja[tg]
	stemK := stemKo[tg]
	branchH := branchHanja[dz]
	branchK := branchKo[dz]

	return SajuPillarText{
		StemHanja:   stemH,
		BranchHanja: branchH,
		StemKo:      stemK,
		BranchKo:    branchK,
		PillarHanja: stemH + branchH,
		PillarKo:    stemK + branchK,
		CycleID:     getCycleID(tg, dz),
	}
}

// calculateHourStem calculates hour stem based on day stem and hour branch
// 시간의 천간은 일간에 따라 결정됨 (일간과 시지로 시간 천간 계산)
func calculateHourStem(dayStemKo string, hourBranch int) int {
	// Find day stem index
	dayStemIndex := 0
	for i, stem := range stemKo {
		if stem == dayStemKo {
			dayStemIndex = i
			break
		}
	}

	// 시간 천간 계산 공식: (일간 * 2 + 시지/2) % 10
	// 자시(0)부터 시작, 2시간마다 변경
	hourStemIndex := (dayStemIndex*2 + hourBranch) % 10
	return hourStemIndex
}
