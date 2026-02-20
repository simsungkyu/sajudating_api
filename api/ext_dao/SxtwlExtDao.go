package extdao

import (
	"fmt"
	"math"
	"strconv"
	"time"

	ttycdom "sajudating_api/api/domain/ttyc"
	utils "sajudating_api/api/utils"
)

const defaultSajuTimezone = "Asia/Seoul"

// NOTE ABOUT SxtwlExtDao.go
//
// This file keeps the legacy SxtwlExtDao API surface for compatibility with
// existing service/resolver call sites.
//
// Historically, it executed python_tool/sxtwl_service.py. Now it uses the
// Go-native TTYC engine (api/domain/ttyc) to fully replace that dependency
// while keeping return shapes and helper methods unchanged.
//
// In short: API compatibility is preserved, runtime is now ttyc.
type SxtwlResult struct {
	Input   map[string]any `json:"input"`
	Pillars struct {
		Year struct {
			Tg int `json:"tg"`
			Dz int `json:"dz"`
		} `json:"year"`
		Month struct {
			Tg int `json:"tg"`
			Dz int `json:"dz"`
		} `json:"month"`
		Day struct {
			Tg int `json:"tg"`
			Dz int `json:"dz"`
		} `json:"day"`
		Hour *struct {
			Tg         int `json:"tg"`
			Dz         int `json:"dz"`
			DzIndex    int `json:"dz_index"`    // 하위 호환성
			ActualHour int `json:"actual_hour"` // 실제 시간
			ActualMin  int `json:"actual_minute"`
		} `json:"hour_hint"`
	} `json:"pillars"`
	Meta map[string]any `json:"meta"`
}

// return 6 or 8 characters palja (천간지지, 연월일시 순) 한글 배열을 참고하여 한글로 변환, 6자에서 8자
func (r *SxtwlResult) GetPalja() string {
	y := utils.TG_ARRAY[r.Pillars.Year.Tg] + utils.DZ_ARRAY[r.Pillars.Year.Dz]
	m := utils.TG_ARRAY[r.Pillars.Month.Tg] + utils.DZ_ARRAY[r.Pillars.Month.Dz]
	d := utils.TG_ARRAY[r.Pillars.Day.Tg] + utils.DZ_ARRAY[r.Pillars.Day.Dz]
	if r.Pillars.Hour != nil {
		h := utils.TG_ARRAY[r.Pillars.Hour.Tg] + utils.DZ_ARRAY[r.Pillars.Hour.Dz]
		return y + m + d + h
	}
	return y + m + d
}

// GetFullPalja returns full palja string with both 천간(Tg) and 지지(Dz)
// Returns 6 characters (YMD) or 8 characters (YMDH) palja
func (r *SxtwlResult) GetFullPalja() string {
	if r.Pillars.Hour != nil {
		return fmt.Sprintf("%d%d%d%d%d%d%d%d",
			r.Pillars.Year.Tg, r.Pillars.Year.Dz,
			r.Pillars.Month.Tg, r.Pillars.Month.Dz,
			r.Pillars.Day.Tg, r.Pillars.Day.Dz,
			r.Pillars.Hour.Tg, r.Pillars.Hour.Dz)
	}
	return fmt.Sprintf("%d%d%d%d%d%d",
		r.Pillars.Year.Tg, r.Pillars.Year.Dz,
		r.Pillars.Month.Tg, r.Pillars.Month.Dz,
		r.Pillars.Day.Tg, r.Pillars.Day.Dz)
}

// GetPaljaKorean returns palja in Korean characters
func (r *SxtwlResult) GetPaljaKorean() string {
	yearStr := utils.TG_ARRAY[r.Pillars.Year.Tg] + utils.DZ_ARRAY[r.Pillars.Year.Dz]
	monthStr := utils.TG_ARRAY[r.Pillars.Month.Tg] + utils.DZ_ARRAY[r.Pillars.Month.Dz]
	dayStr := utils.TG_ARRAY[r.Pillars.Day.Tg] + utils.DZ_ARRAY[r.Pillars.Day.Dz]

	if r.Pillars.Hour != nil {
		hourStr := utils.TG_ARRAY[r.Pillars.Hour.Tg] + utils.DZ_ARRAY[r.Pillars.Hour.Dz]
		return yearStr + " " + monthStr + " " + dayStr + " " + hourStr
	}
	return yearStr + " " + monthStr + " " + dayStr
}

func GenPalja(birthdate string, timezone string) (*SxtwlResult, error) {
	if len(birthdate) != 8 && len(birthdate) != 12 {
		return nil, fmt.Errorf("invalid birth format: expected YYYYMMDD or YYYYMMDDHHmm, got %q", birthdate)
	}
	y, err := strconv.Atoi(birthdate[0:4])
	if err != nil {
		return nil, fmt.Errorf("invalid year: %w", err)
	}
	m, err := strconv.Atoi(birthdate[4:6])
	if err != nil {
		return nil, fmt.Errorf("invalid month: %w", err)
	}
	d, err := strconv.Atoi(birthdate[6:8])
	if err != nil {
		return nil, fmt.Errorf("invalid day: %w", err)
	}

	var hh *int
	var mm *int
	if len(birthdate) == 12 {
		hInt, err := strconv.Atoi(birthdate[8:10])
		if err != nil {
			return nil, fmt.Errorf("invalid hour: %w", err)
		}
		mInt, err := strconv.Atoi(birthdate[10:12])
		if err != nil {
			return nil, fmt.Errorf("invalid minute: %w", err)
		}
		hh = &hInt
		mm = &mInt
	}

	palja, err := CallSxtwlOptional(y, m, d, hh, mm, timezone, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate palja: %w", err)
	}
	return palja, nil
}

func CallSxtwl(y, m, d, hh, mm int, timezone string, longitude *float64) (*SxtwlResult, error) {
	return CallSxtwlOptional(y, m, d, &hh, &mm, timezone, longitude)
}

// CallSxtwlOptional keeps the historical API contract but is now backed by ttyc.
// If hh or mm is nil, hour pillar is omitted (UNKNOWN precision), matching legacy behavior.
func CallSxtwlOptional(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*SxtwlResult, error) {
	if err := validateSolarDate(y, m, d); err != nil {
		return nil, err
	}
	if (hh == nil) != (mm == nil) {
		return nil, fmt.Errorf("hour and minute must be provided together")
	}
	if hh != nil {
		if *hh < 0 || *hh > 23 {
			return nil, fmt.Errorf("invalid hour: %d", *hh)
		}
		if *mm < 0 || *mm > 59 {
			return nil, fmt.Errorf("invalid minute: %d", *mm)
		}
	}

	tz := timezone
	if tz == "" {
		tz = defaultSajuTimezone
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return nil, fmt.Errorf("invalid timezone: %s", tz)
	}

	hasTime := hh != nil && mm != nil
	calcHour, calcMinute := 12, 0
	if hasTime {
		calcHour = *hh
		calcMinute = *mm
	}

	localForOffset := time.Date(y, time.Month(m), d, calcHour, calcMinute, 0, 0, loc)
	_, offsetSec := localForOffset.Zone()
	offsetMinutes := offsetSec / 60

	ts, err := ttycdom.ToUnixTimestamp(ttycdom.TtycTimestampParts{
		Year:   y,
		Month:  m,
		Day:    d,
		Hour:   calcHour,
		Minute: calcMinute,
	}, &offsetMinutes)
	if err != nil {
		return nil, fmt.Errorf("failed to build timestamp: %w", err)
	}

	timePrecision := ttycdom.TtycTimePrecisionUnknown
	if hasTime {
		timePrecision = ttycdom.TtycTimePrecisionMinute
	}

	calc, err := ttycdom.CalculatePillars(ttycdom.TtycPillarCalcInput{
		Ts:              ts,
		TzOffsetMinutes: &offsetMinutes,
		TimePrecision:   timePrecision,
	})
	if err != nil {
		return nil, fmt.Errorf("ttyc calculate failed: %w", err)
	}

	res := &SxtwlResult{}
	res.Pillars.Year.Tg = calc.Pillars.Year.Stem
	res.Pillars.Year.Dz = calc.Pillars.Year.Branch
	res.Pillars.Month.Tg = calc.Pillars.Month.Stem
	res.Pillars.Month.Dz = calc.Pillars.Month.Branch
	res.Pillars.Day.Tg = calc.Pillars.Day.Stem
	res.Pillars.Day.Dz = calc.Pillars.Day.Branch

	if hasTime {
		actualHour, actualMinute := *hh, *mm
		if longitude != nil {
			actualHour, actualMinute = applySolarTimeCorrection(actualHour, actualMinute, offsetMinutes, *longitude)
		}

		hStem, hBranch, err := calcHourPillar(calc.Pillars.Day.Stem, actualHour)
		if err != nil {
			return nil, err
		}
		res.Pillars.Hour = &struct {
			Tg         int `json:"tg"`
			Dz         int `json:"dz"`
			DzIndex    int `json:"dz_index"`
			ActualHour int `json:"actual_hour"`
			ActualMin  int `json:"actual_minute"`
		}{
			Tg:         hStem,
			Dz:         hBranch,
			DzIndex:    hBranch,
			ActualHour: actualHour,
			ActualMin:  actualMinute,
		}
	}

	inputHour, inputMinute := any(nil), any(nil)
	if hasTime {
		inputHour = *hh
		inputMinute = *mm
	}
	inputLng := any(nil)
	if longitude != nil {
		inputLng = *longitude
	}
	res.Input = map[string]any{
		"y":   y,
		"m":   m,
		"d":   d,
		"hh":  inputHour,
		"mm":  inputMinute,
		"tz":  tz,
		"lng": inputLng,
	}

	localISO, utcISO := any(nil), any(nil)
	if hasTime {
		localDt := time.Date(y, time.Month(m), d, *hh, *mm, 0, 0, loc)
		localISO = localDt.Format(time.RFC3339)
		utcISO = localDt.UTC().Format(time.RFC3339)
	}

	// ttyc currently tracks 12 month-term boundaries; keep legacy keys for clients.
	isJieQi := false
	jieQi := any(nil)
	if isMonthTermDate(calc.Boundaries.MonthTermStartTs, offsetMinutes, y, m, d) {
		isJieQi = true
		jieQi = monthTermNameByBranch(calc.Pillars.Month.Branch)
	}

	res.Meta = map[string]any{
		"engine":  "ttyc",
		"isJieQi": isJieQi,
		"jieQi":   jieQi,
		"timezone_info": map[string]any{
			"tz":         tz,
			"utc_time":   utcISO,
			"local_time": localISO,
		},
	}

	return res, nil
}

func validateSolarDate(y, m, d int) error {
	if y <= 0 {
		return fmt.Errorf("invalid year: %d", y)
	}
	if m < 1 || m > 12 {
		return fmt.Errorf("invalid month: %d", m)
	}
	last := time.Date(y, time.Month(m)+1, 0, 0, 0, 0, 0, time.UTC).Day()
	if d < 1 || d > last {
		return fmt.Errorf("invalid day: %d", d)
	}
	return nil
}

func isMonthTermDate(termTs int64, offsetMinutes, y, m, d int) bool {
	local, err := ttycdom.ToLocalDateTimeParts(termTs, &offsetMinutes)
	if err != nil {
		return false
	}
	return local.Year == y && local.Month == m && local.Day == d
}

func monthTermNameByBranch(branch int) string {
	switch branch {
	case 1:
		return "소한(丑월)"
	case 2:
		return "입춘(寅월)"
	case 3:
		return "경칩(卯월)"
	case 4:
		return "청명(辰월)"
	case 5:
		return "입하(巳월)"
	case 6:
		return "망종(午월)"
	case 7:
		return "소서(未월)"
	case 8:
		return "입추(申월)"
	case 9:
		return "백로(酉월)"
	case 10:
		return "한로(戌월)"
	case 11:
		return "입동(亥월)"
	case 0:
		return "대설(子월)"
	default:
		return ""
	}
}

func calcHourPillar(dayStem, hour int) (int, int, error) {
	if dayStem < 0 || dayStem > 9 {
		return 0, 0, fmt.Errorf("invalid day stem: %d", dayStem)
	}
	branch := mod((hour+1)/2, 12)
	stem := mod(dayStem*2+branch, 10)
	return stem, branch, nil
}

func applySolarTimeCorrection(hour, minute, tzOffsetMinutes int, longitude float64) (int, int) {
	timezoneCenterLongitude := (float64(tzOffsetMinutes) / 60.0) * 15.0
	timeOffsetMinutes := (longitude - timezoneCenterLongitude) * 4.0
	totalMinutes := float64(hour*60+minute) + timeOffsetMinutes

	hourBase := int(math.Floor(totalMinutes / 60.0))
	minutePart := math.Mod(totalMinutes, 60.0)
	if minutePart < 0 {
		minutePart += 60.0
	}
	actualHour := mod(hourBase, 24)
	actualMinute := int(minutePart)
	return actualHour, actualMinute
}

func mod(n, m int) int {
	return ((n % m) + m) % m
}
