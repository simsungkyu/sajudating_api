// Package itemncard: 大運 (Daesoon) pillar computation from 月柱 + gender + step (korean_standard_v1).
package itemncard

import (
	"fmt"
	"strconv"
	"strings"

	itemncardtypes "sajudating_api/api/types/itemncard"
	"sajudating_api/api/utils"
)

// DaesoonPillars returns 4 pillars for the given 大運 step: 年柱/月柱 from 月柱 shifted by step (順/逆 by gender), 日柱/时柱 from birth.
// birthY, birthM, birthD, hh, mm, timezone: birth date/time (same as PillarsFromBirth). gender: "male"/"female", "남"/"여", "男"/"女".
// stepIndex: 0-based 大運 step (0 = 月柱 as first decade). Returns pillars and period label e.g. "대운 0".
func DaesoonPillars(birthY, birthM, birthD int, hh, mm *int, timezone, gender string, stepIndex int) (pillars itemncardtypes.PillarsText, periodLabel string, err error) {
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	birthPillars, _, err := PillarsFromBirth(birthY, birthM, birthD, hh, mm, timezone)
	if err != nil {
		return itemncardtypes.PillarsText{}, "", fmt.Errorf("birth pillars: %w", err)
	}
	yearTg, _, ok := pillarToIndices(birthPillars.Year)
	if !ok {
		return itemncardtypes.PillarsText{}, "", fmt.Errorf("invalid year pillar %q", birthPillars.Year)
	}
	monthTg, monthDz, ok := pillarToIndices(birthPillars.Month)
	if !ok {
		return itemncardtypes.PillarsText{}, "", fmt.Errorf("invalid month pillar %q", birthPillars.Month)
	}
	// 陽年: year stem index even (甲0 丙2 戊4 庚6 壬8). 陰年: odd. 男順女逆 for 陽年, 男逆女順 for 陰年.
	yangYear := yearTg%2 == 0
	male := isMale(gender)
	forward := (yangYear && male) || (!yangYear && !male)
	// Shift 月柱 by stepIndex: forward → +step, backward → -step (wrap 10/12).
	var tgIdx, dzIdx int
	if forward {
		tgIdx = ((monthTg+stepIndex)%10 + 10) % 10
		dzIdx = ((monthDz+stepIndex)%12 + 12) % 12
	} else {
		tgIdx = ((monthTg-stepIndex)%10 + 10) % 10
		dzIdx = ((monthDz-stepIndex)%12 + 12) % 12
	}
	daesoonGanZhi := utils.TG_ARRAY[tgIdx] + utils.DZ_ARRAY[dzIdx]
	pillars.Year = daesoonGanZhi
	pillars.Month = daesoonGanZhi
	pillars.Day = birthPillars.Day
	pillars.Hour = birthPillars.Hour
	periodLabel = "대운 " + strconv.Itoa(stepIndex)
	return pillars, periodLabel, nil
}

func isMale(g string) bool {
	lower := strings.ToLower(strings.TrimSpace(g))
	return lower == "male" || lower == "남" || lower == "男" || g == "m"
}
