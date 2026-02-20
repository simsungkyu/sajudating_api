// Package itemncard: types for 사주/궁합 데이터 카드 pipeline (items, tokens, trigger).
package itemncard

// Item is one computed fact (십성, 관계, 오행, etc.) per UserInfoStructure.
type Item struct {
	K     string   `json:"k"`     // category: 십성, 관계, 오행, 신살, 격국, 용신, 육친, 강약, 확신, 지장간, 궁합
	N     string   `json:"n"`     // name
	Where []string `json:"where,omitempty"`
	W     int      `json:"w,omitempty"` // 0-100 weight
	Sys   string   `json:"sys,omitempty"`
}

// PillarsText holds pillar positions as Korean names (년간, 월간, ...).
type PillarsText struct {
	Year  string `json:"year"`  // e.g. "경오"
	Month string `json:"month"`
	Day   string `json:"day"`
	Hour  string `json:"hour"` // empty if unknown
}

// Position names for where (년→월→일→시 order).
var WherePositionNames = []string{"년간", "년지", "월간", "월지", "일간", "일지", "시간", "시지"}

// Grade bands: L 0-49, M 50-69, H 70-100.
const GradeL, GradeM, GradeH = "L", "M", "H"

func GradeFromW(w int) string {
	if w < 50 {
		return GradeL
	}
	if w < 70 {
		return GradeM
	}
	return GradeH
}
