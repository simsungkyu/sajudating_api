// Package dto: request/response DTOs for itemncard extraction test APIs.
package dto

// SajuExtractTestRequest is the request body for saju extraction test.
type SajuExtractTestRequest struct {
	Birth       BirthInput `json:"birth"`
	Timezone    string     `json:"timezone"`
	Calendar    string     `json:"calendar"`    // solar | lunar
	Mode               string `json:"mode"`                          // 인생 | 연도별 | 월별 | 일간 | 대운
	TargetYear         string `json:"target_year,omitempty"`        // e.g. "2025" for 연도별/월별/일간
	TargetMonth        string `json:"target_month,omitempty"`       // e.g. "03" for 월별/일간 (with target_year)
	TargetDay          string `json:"target_day,omitempty"`        // e.g. "15" for 일간 (with target_year, target_month)
	TargetDaesoonIndex string `json:"target_daesoon_index,omitempty"` // e.g. "0", "1" for 대운 (0-based step)
	Gender             string `json:"gender,omitempty"`              // required for 대운 (male/female, 男/女)
}

type BirthInput struct {
	Date            string `json:"date"`             // YYYY-MM-DD
	Time            string `json:"time"`             // HH:mm or "unknown"
	TimePrecision   string `json:"time_precision"`   // minute | hour | unknown
}

// PairExtractTestRequest is the request body for pair extraction test.
type PairExtractTestRequest struct {
	BirthA BirthInput `json:"birthA"`
	BirthB BirthInput `json:"birthB"`
	Timezone string  `json:"timezone"`
}

// SelectedCard is one selected card with evidence.
type SelectedCard struct {
	CardID   string   `json:"card_id"`
	Title    string   `json:"title"`
	Evidence []string `json:"evidence"`
	Score    int      `json:"score"`
}

// PillarSource is the "연계 만세력" block: which date/period produced the pillars (for UI display).
type PillarSource struct {
	BaseDate      string `json:"base_date"`       // YYYY-MM-DD
	BaseTimeUsed  string `json:"base_time_used"`  // HH:mm or "unknown"
	Mode          string `json:"mode"`            // 인생 | 연도별 | 월별 | 일간 | 대운
	Period        string `json:"period"`          // e.g. "2025", "2025-03", "2025-03-15"
	Description   string `json:"description,omitempty"` // e.g. "원국", "歲運", "月運", "日運"
}

// SajuExtractTestResponse is the response for saju extraction test.
type SajuExtractTestResponse struct {
	UserInfo      UserInfoSummary `json:"user_info"`
	PillarSource  *PillarSource   `json:"pillar_source,omitempty"` // 연계 만세력: which date produced the pillars
	SelectedCards []SelectedCard  `json:"selected_cards"`
	LLMContext    string          `json:"llm_context,omitempty"` // Assembled LLM context from selected cards when len(SelectedCards) > 0
}

type UserInfoSummary struct {
	Pillars       map[string]string `json:"pillars"`
	ItemsSummary  string            `json:"items_summary"`
	TokensSummary []string          `json:"tokens_summary"`
	RuleSet       string            `json:"rule_set"`
	EngineVersion string            `json:"engine_version"`
	Mode          string            `json:"mode,omitempty"`   // 인생 | 연도별 | 월별 | 일간 | 대운
	Period        string            `json:"period,omitempty"` // e.g. "2025", "2025-03", "2025-03-15" (일간) for display
}

// PairExtractTestResponse is the response for pair extraction test.
type PairExtractTestResponse struct {
	SummaryA       UserInfoSummary `json:"summary_a"`
	SummaryB       UserInfoSummary `json:"summary_b"`
	PTokensSummary []string       `json:"p_tokens_summary"`
	SelectedCards  []SelectedCard `json:"selected_cards"`
	// LLMContext is assembled LLM context from selected pair cards when len(SelectedCards) > 0.
	LLMContext string `json:"llm_context,omitempty"`
}

// LLMContextPreviewRequest is the request for LLM context preview: either card_uids or (card_ids + scope).
type LLMContextPreviewRequest struct {
	CardUIDs []string `json:"card_uids,omitempty"`
	CardIDs  []string `json:"card_ids,omitempty"`
	Scope    string   `json:"scope,omitempty"` // "saju" | "pair" when using card_ids
}

// LLMContextPreviewResponse is the response with assembled context string and length.
type LLMContextPreviewResponse struct {
	Context string `json:"context"`
	Length  int    `json:"length"`
}

// SajuGenerationUserInput is birth + timezone (+ gender for 대운) for saju generation (minimal user-info block).
type SajuGenerationUserInput struct {
	Birth    BirthInput `json:"birth"`
	Timezone string     `json:"timezone"`
	RuleSet  string     `json:"rule_set,omitempty"` // optional, default korean_standard_v1
	Gender   string     `json:"gender,omitempty"`  // required for 대운 (male/female, 男/女)
}

// SajuGenerationTargetInput is one output target: kind, period, max_chars.
type SajuGenerationTargetInput struct {
	Kind     string `json:"kind"`     // 인생 | 대운 | 세운 | 월간 | 일간
	Period   string `json:"period"`   // "" for 인생; "0","1",... for 대운; "2025" for 세운; "2025-03" for 월간; "2025-03-15" for 일간
	MaxChars int    `json:"max_chars"` // approximate output character limit
}

// SajuGenerationTargetOutput is one target with result filled.
type SajuGenerationTargetOutput struct {
	Kind     string `json:"kind"`
	Period   string `json:"period"`
	MaxChars int    `json:"max_chars"`
	Result   string `json:"result"` // generated text or error message for unsupported/failed target
}

// SajuGenerationRequest is the request for the saju generation base method.
type SajuGenerationRequest struct {
	UserInput SajuGenerationUserInput   `json:"user_input"`
	Targets   []SajuGenerationTargetInput `json:"targets"`
}

// SajuGenerationResponse is the response: same-length targets with result per target.
type SajuGenerationResponse struct {
	Targets []SajuGenerationTargetOutput `json:"targets"`
}

// ChemiGenerationPairInput is birth A/B and timezone for chemi (pair) generation.
type ChemiGenerationPairInput struct {
	BirthA   BirthInput `json:"birthA"`
	BirthB   BirthInput `json:"birthB"`
	Timezone string     `json:"timezone"`
}

// ChemiGenerationTargetInput is one output target: perspective (출력관점), max_chars.
type ChemiGenerationTargetInput struct {
	Perspective string `json:"perspective"` // e.g. overview, communication, conflict, compatibility or free text
	MaxChars    int    `json:"max_chars"`   // approximate output character limit
}

// ChemiGenerationTargetOutput is one target with result filled.
type ChemiGenerationTargetOutput struct {
	Perspective string `json:"perspective"`
	MaxChars    int    `json:"max_chars"`
	Result      string `json:"result"` // generated text or error message
}

// ChemiGenerationRequest is the request for the chemi (pair) generation base method.
type ChemiGenerationRequest struct {
	PairInput ChemiGenerationPairInput     `json:"pair_input"`
	Targets   []ChemiGenerationTargetInput `json:"targets"`
}

// ChemiGenerationResponse is the response: same-length targets with result per target.
type ChemiGenerationResponse struct {
	Targets []ChemiGenerationTargetOutput `json:"targets"`
}
