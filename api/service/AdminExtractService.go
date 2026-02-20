// AdminExtractService: admweb-only extraction test (saju and pair) calling itemncard pipeline; LLM context preview.
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/config"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	"sajudating_api/api/dto"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/service/itemncard"
	itemncardtypes "sajudating_api/api/types/itemncard"
	"sajudating_api/api/utils"
)

// AdminExtractService provides GraphQL-facing methods for saju/chemi generation (delegate to package-level Run*).
type AdminExtractService struct{}

// NewAdminExtractService returns a new AdminExtractService.
func NewAdminExtractService() *AdminExtractService {
	return &AdminExtractService{}
}

// RunSajuExtractTest runs pillars → items → tokens → saju card trigger; returns userInfo + selected cards.
// Pillar source by mode (rule_set: korean_standard_v1, sxtwl): 인생 = pillars for birth date/time (원국).
// 연도별 = 歲運: pillars for (target_year, 1, 1) + birth time — 年柱/月柱 from first day of target year via sxtwl.
// 월별 = 月運: pillars for (target_year, target_month, 1) + birth time — 月柱 from first day of that month via sxtwl.
func RunSajuExtractTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req dto.SajuExtractTestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}
	timezone := req.Timezone
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	y, m, d, hh, mm, _ := itemncard.BirthInput(req.Birth.Date, req.Birth.Time)
	if y == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid birth date"})
		return
	}
	mode := req.Mode
	if mode == "" {
		mode = "인생"
	}
	runY, runM, runD := y, m, d
	period := ""
	var pillars itemncardtypes.PillarsText
	var palja string
	var err error

	switch mode {
	case "연도별":
		// 歲運: 年柱/月柱 for target year — use first day of target year (sxtwl).
		if req.TargetYear != "" {
			if ty := parseInt(req.TargetYear); ty > 0 {
				runY, runM, runD = ty, 1, 1
				period = req.TargetYear
			}
		}
	case "월별":
		// 月運: 月柱 for target year-month — use first day of that month (sxtwl).
		if req.TargetYear != "" && req.TargetMonth != "" {
			if ty := parseInt(req.TargetYear); ty > 0 {
				if tm := parseInt(req.TargetMonth); tm >= 1 && tm <= 12 {
					runY, runM, runD = ty, tm, 1
					period = req.TargetYear + "-" + req.TargetMonth
				}
			}
		}
	case "일간":
		// 日運: pillars for target full date + birth time (sxtwl).
		if req.TargetYear != "" && req.TargetMonth != "" && req.TargetDay != "" {
			ty := parseInt(req.TargetYear)
			tm := parseInt(req.TargetMonth)
			td := parseInt(req.TargetDay)
			if ty > 0 && tm >= 1 && tm <= 12 && td >= 1 && td <= 31 {
				runY, runM, runD = ty, tm, td
				period = fmt.Sprintf("%04d-%02d-%02d", ty, tm, td)
			} else {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid target date for 일간: year 4 digits, month 01-12, day 01-31"})
				return
			}
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "일간 mode requires target_year, target_month, target_day"})
			return
		}
	case "대운":
		// 大運: pillars from 月柱 + gender + target_daesoon_index (0-based step).
		if req.TargetDaesoonIndex == "" || req.Gender == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "대운 mode requires target_daesoon_index and gender"})
			return
		}
		stepIdx := parseInt(req.TargetDaesoonIndex)
		if stepIdx < 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid target_daesoon_index for 대운: non-negative integer (e.g. 0, 1)"})
			return
		}
		daesoonPillars, periodLabel, errDaesoon := itemncard.DaesoonPillars(y, m, d, hh, mm, timezone, req.Gender, stepIdx)
		if errDaesoon != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": errDaesoon.Error()})
			return
		}
		period = periodLabel
		runY, runM, runD = y, m, d
		pillars = daesoonPillars
		palja = daesoonPillars.Year + daesoonPillars.Month + daesoonPillars.Day + daesoonPillars.Hour
		err = nil
		goto buildItems
	}

	pillars, palja, err = itemncard.PillarsFromBirth(runY, runM, runD, hh, mm, timezone)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
buildItems:
	items := itemncard.ItemsFromPillars(pillars, palja)
	tokens := itemncard.ItemsToTokens(items)
	tokenSet := make(map[string]bool)
	for _, t := range tokens {
		tokenSet[t] = true
	}
	selected, evidences, scores, err := itemncard.SelectSajuCards(tokenSet)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	cards := make([]dto.SelectedCard, len(selected))
	for i := range selected {
		ev := []string{}
		if i < len(evidences) {
			ev = evidences[i]
		}
		sc := selected[i].Priority
		if i < len(scores) {
			sc = scores[i]
		}
		cards[i] = dto.SelectedCard{
			CardID:   selected[i].CardID,
			Title:    selected[i].Title,
			Evidence: ev,
			Score:    sc,
		}
	}
	userInfo := dto.UserInfoSummary{
		Pillars: map[string]string{
			"y": pillars.Year, "m": pillars.Month, "d": pillars.Day, "h": pillars.Hour,
		},
		ItemsSummary:  "items from pillars",
		TokensSummary: tokens,
		RuleSet:       "korean_standard_v1",
		EngineVersion: "itemncard@0.1",
		Mode:          mode,
		Period:        period,
	}
	baseTimeUsed := "unknown"
	if req.Birth.Time != "" && req.Birth.Time != "unknown" {
		baseTimeUsed = fmt.Sprintf("%02d:%02d", hh, mm)
	}
	desc := ""
	switch mode {
	case "인생":
		desc = "원국"
	case "연도별":
		desc = "歲運"
	case "월별":
		desc = "月運"
	case "일간":
		desc = "日運"
	case "대운":
		desc = "大運"
	}
	pillarSource := &dto.PillarSource{
		BaseDate:     fmt.Sprintf("%04d-%02d-%02d", runY, runM, runD),
		BaseTimeUsed: baseTimeUsed,
		Mode:         mode,
		Period:       period,
		Description:  desc,
	}
	resp := dto.SajuExtractTestResponse{
		UserInfo:      userInfo,
		PillarSource:  pillarSource,
		SelectedCards: cards,
	}
	if len(selected) > 0 {
		resp.LLMContext = itemncard.BuildLLMContextFromCards(selected, defaultLLMContextMaxChars)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func parseInt(s string) int {
	var n int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		}
	}
	return n
}

// RunPairExtractTest runs A/B pillars → A/B items/tokens, P items/tokens, pair card trigger.
func RunPairExtractTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req dto.PairExtractTestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}
	timezone := req.Timezone
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	ya, ma, da, hha, mma, _ := itemncard.BirthInput(req.BirthA.Date, req.BirthA.Time)
	yb, mb, db, hhb, mmb, _ := itemncard.BirthInput(req.BirthB.Date, req.BirthB.Time)
	if ya == 0 || yb == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid birth date"})
		return
	}
	pillarsA, paljaA, err := itemncard.PillarsFromBirth(ya, ma, da, hha, mma, timezone)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	pillarsB, paljaB, err := itemncard.PillarsFromBirth(yb, mb, db, hhb, mmb, timezone)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	itemsA := itemncard.ItemsFromPillars(pillarsA, paljaA)
	itemsB := itemncard.ItemsFromPillars(pillarsB, paljaB)
	pItems := itemncard.PItemsFromPillars(pillarsA, pillarsB)
	tokensA := itemncard.ItemsToTokens(itemsA)
	tokensB := itemncard.ItemsToTokens(itemsB)
	pTokens := itemncard.ItemsToTokens(pItems)
	aSet := make(map[string]bool)
	bSet := make(map[string]bool)
	pSet := make(map[string]bool)
	for _, t := range tokensA {
		aSet[t] = true
	}
	for _, t := range tokensB {
		bSet[t] = true
	}
	for _, t := range pTokens {
		pSet[t] = true
	}
	selected, evidences, scores, err := itemncard.SelectPairCards(aSet, bSet, pSet)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	cards := make([]dto.SelectedCard, len(selected))
	for i := range selected {
		ev := []string{}
		if i < len(evidences) {
			ev = evidences[i]
		}
		sc := selected[i].Priority
		if i < len(scores) {
			sc = scores[i]
		}
		cards[i] = dto.SelectedCard{
			CardID:   selected[i].CardID,
			Title:    selected[i].Title,
			Evidence: ev,
			Score:    sc,
		}
	}
	resp := dto.PairExtractTestResponse{
		SummaryA: dto.UserInfoSummary{
			Pillars:       map[string]string{"y": pillarsA.Year, "m": pillarsA.Month, "d": pillarsA.Day, "h": pillarsA.Hour},
			ItemsSummary:  "items A",
			TokensSummary: tokensA,
			RuleSet:       "korean_standard_v1",
			EngineVersion: "itemncard@0.1",
		},
		SummaryB: dto.UserInfoSummary{
			Pillars:       map[string]string{"y": pillarsB.Year, "m": pillarsB.Month, "d": pillarsB.Day, "h": pillarsB.Hour},
			ItemsSummary:  "items B",
			TokensSummary: tokensB,
			RuleSet:       "korean_standard_v1",
			EngineVersion: "itemncard@0.1",
		},
		PTokensSummary: pTokens,
		SelectedCards:  cards,
	}
	if len(selected) > 0 {
		resp.LLMContext = itemncard.BuildLLMContextFromCards(selected, defaultLLMContextMaxChars)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

const defaultLLMContextMaxChars = 8000

// RunLLMContextPreview returns assembled LLM context from cards by uids or by card_ids+scope (CardDataStructure Step 5).
func RunLLMContextPreview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req dto.LLMContextPreviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
		return
	}
	// Validate required params before touching DB so tests can run without MongoDB.
	if len(req.CardUIDs) == 0 && !(len(req.CardIDs) > 0 && (req.Scope == "saju" || req.Scope == "pair")) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "provide card_uids or (card_ids and scope saju|pair)"})
		return
	}
	repo := dao.NewItemNCardRepository()
	var itemnCardsTyped []entity.ItemNCard
	if len(req.CardUIDs) > 0 {
		for _, uid := range req.CardUIDs {
			if uid == "" {
				continue
			}
			card, err := repo.FindByUID(uid)
			if err != nil {
				continue
			}
			itemnCardsTyped = append(itemnCardsTyped, *card)
		}
	} else {
		// len(req.CardIDs) > 0 && (req.Scope == "saju" || req.Scope == "pair") guaranteed by validation above
		entities, err := repo.FindByCardIDsAndScope(req.CardIDs, req.Scope)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		itemnCardsTyped = entities
	}
	contextStr := itemncard.BuildLLMContextFromCards(itemnCardsTyped, defaultLLMContextMaxChars)
	resp := dto.LLMContextPreviewResponse{
		Context: contextStr,
		Length:  len(contextStr),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// RunSajuGeneration runs the saju generation base method: for each target, pillars → items → tokens → cards → LLM → result.
// 대운 uses DaesoonPillars(birth, gender, period as step index); other kinds use kind+period+birth to resolve run date.
func RunSajuGeneration(ctx context.Context, req dto.SajuGenerationRequest) (dto.SajuGenerationResponse, error) {
	timezone := req.UserInput.Timezone
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	y, m, d, hh, mm, _ := itemncard.BirthInput(req.UserInput.Birth.Date, req.UserInput.Birth.Time)
	if y == 0 {
		return dto.SajuGenerationResponse{}, fmt.Errorf("invalid birth date")
	}
	out := dto.SajuGenerationResponse{
		Targets: make([]dto.SajuGenerationTargetOutput, len(req.Targets)),
	}
	for i, t := range req.Targets {
		out.Targets[i] = dto.SajuGenerationTargetOutput{
			Kind:     t.Kind,
			Period:   t.Period,
			MaxChars: t.MaxChars,
		}
		if t.Kind == "대운" {
			stepIdx := parseInt(t.Period)
			if stepIdx < 0 || req.UserInput.Gender == "" {
				out.Targets[i].Result = "대운 requires period as non-negative step index (e.g. 0, 1) and user_input.gender"
				continue
			}
			pillars, _, errDaesoon := itemncard.DaesoonPillars(y, m, d, hh, mm, timezone, req.UserInput.Gender, stepIdx)
			if errDaesoon != nil {
				out.Targets[i].Result = "대운 pillars: " + errDaesoon.Error()
				continue
			}
			palja := pillars.Year + pillars.Month + pillars.Day + pillars.Hour
			items := itemncard.ItemsFromPillars(pillars, palja)
			tokens := itemncard.ItemsToTokens(items)
			tokenSet := make(map[string]bool)
			for _, tok := range tokens {
				tokenSet[tok] = true
			}
			selected, _, _, err := itemncard.SelectSajuCards(tokenSet)
			if err != nil {
				out.Targets[i].Result = "select cards: " + err.Error()
				continue
			}
			maxChars := t.MaxChars
			if maxChars <= 0 {
				maxChars = defaultLLMContextMaxChars
			}
			contextStr := itemncard.BuildLLMContextFromCards(selected, maxChars)
			if config.AppConfig == nil || config.AppConfig.OpenAI.APIKey == "" {
				out.Targets[i].Result = "OpenAI API key not configured"
				continue
			}
			openaiDao := extdao.NewOpenAIExtDao()
			systemMsg := fmt.Sprintf("You are a Korean saju (사주) expert. Generate a reading based on the following context. Keep the response within approximately %d characters.", maxChars)
			chatReq := extdao.ChatCompletionRequest{
				Messages: []extdao.ChatMessage{
					{Role: "system", Content: systemMsg},
					{Role: "user", Content: contextStr},
				},
				Temperature: 0.7,
				MaxTokens:   (maxChars / 2) + 200,
			}
			text, _, err := openaiDao.ChatCompletion(ctx, chatReq)
			if err != nil {
				out.Targets[i].Result = "LLM: " + err.Error()
				continue
			}
			out.Targets[i].Result = text
			continue
		}
		runY, runM, runD, ok := resolveRunDateForKind(t.Kind, t.Period, y, m, d)
		if !ok {
			out.Targets[i].Result = "invalid period for kind " + t.Kind + ": " + t.Period
			continue
		}
		pillars, palja, err := itemncard.PillarsFromBirth(runY, runM, runD, hh, mm, timezone)
		if err != nil {
			out.Targets[i].Result = "pillars: " + err.Error()
			continue
		}
		items := itemncard.ItemsFromPillars(pillars, palja)
		tokens := itemncard.ItemsToTokens(items)
		tokenSet := make(map[string]bool)
		for _, tok := range tokens {
			tokenSet[tok] = true
		}
		selected, _, _, err := itemncard.SelectSajuCards(tokenSet)
		if err != nil {
			out.Targets[i].Result = "select cards: " + err.Error()
			continue
		}
		maxChars := t.MaxChars
		if maxChars <= 0 {
			maxChars = defaultLLMContextMaxChars
		}
		contextStr := itemncard.BuildLLMContextFromCards(selected, maxChars)
		if config.AppConfig == nil || config.AppConfig.OpenAI.APIKey == "" {
			out.Targets[i].Result = "OpenAI API key not configured"
			continue
		}
		openaiDao := extdao.NewOpenAIExtDao()
		systemMsg := fmt.Sprintf("You are a Korean saju (사주) expert. Generate a reading based on the following context. Keep the response within approximately %d characters.", maxChars)
		chatReq := extdao.ChatCompletionRequest{
			Messages: []extdao.ChatMessage{
				{Role: "system", Content: systemMsg},
				{Role: "user", Content: contextStr},
			},
			Temperature: 0.7,
			MaxTokens:   (maxChars / 2) + 200,
		}
		text, _, err := openaiDao.ChatCompletion(ctx, chatReq)
		if err != nil {
			out.Targets[i].Result = "LLM: " + err.Error()
			continue
		}
		out.Targets[i].Result = text
	}
	return out, nil
}

// RunChemiGeneration runs the chemi (pair) generation base method: pair input → A/B pillars → items → tokens → SelectPairCards → for each target BuildLLMContextFromCards + OpenAI → result.
func RunChemiGeneration(ctx context.Context, req dto.ChemiGenerationRequest) (dto.ChemiGenerationResponse, error) {
	timezone := req.PairInput.Timezone
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	ya, ma, da, hha, mma, _ := itemncard.BirthInput(req.PairInput.BirthA.Date, req.PairInput.BirthA.Time)
	yb, mb, db, hhb, mmb, _ := itemncard.BirthInput(req.PairInput.BirthB.Date, req.PairInput.BirthB.Time)
	if ya == 0 {
		return dto.ChemiGenerationResponse{}, fmt.Errorf("invalid birth A date")
	}
	if yb == 0 {
		return dto.ChemiGenerationResponse{}, fmt.Errorf("invalid birth B date")
	}
	pillarsA, paljaA, err := itemncard.PillarsFromBirth(ya, ma, da, hha, mma, timezone)
	if err != nil {
		return dto.ChemiGenerationResponse{}, fmt.Errorf("pillars A: %w", err)
	}
	pillarsB, paljaB, err := itemncard.PillarsFromBirth(yb, mb, db, hhb, mmb, timezone)
	if err != nil {
		return dto.ChemiGenerationResponse{}, fmt.Errorf("pillars B: %w", err)
	}
	itemsA := itemncard.ItemsFromPillars(pillarsA, paljaA)
	itemsB := itemncard.ItemsFromPillars(pillarsB, paljaB)
	pItems := itemncard.PItemsFromPillars(pillarsA, pillarsB)
	tokensA := itemncard.ItemsToTokens(itemsA)
	tokensB := itemncard.ItemsToTokens(itemsB)
	pTokens := itemncard.ItemsToTokens(pItems)
	aSet := make(map[string]bool)
	bSet := make(map[string]bool)
	pSet := make(map[string]bool)
	for _, t := range tokensA {
		aSet[t] = true
	}
	for _, t := range tokensB {
		bSet[t] = true
	}
	for _, t := range pTokens {
		pSet[t] = true
	}
	selected, _, _, err := itemncard.SelectPairCards(aSet, bSet, pSet)
	if err != nil {
		return dto.ChemiGenerationResponse{}, fmt.Errorf("select pair cards: %w", err)
	}
	out := dto.ChemiGenerationResponse{
		Targets: make([]dto.ChemiGenerationTargetOutput, len(req.Targets)),
	}
	for i, t := range req.Targets {
		out.Targets[i] = dto.ChemiGenerationTargetOutput{
			Perspective: t.Perspective,
			MaxChars:    t.MaxChars,
		}
		maxChars := t.MaxChars
		if maxChars <= 0 {
			maxChars = defaultLLMContextMaxChars
		}
		contextStr := itemncard.BuildLLMContextFromCards(selected, maxChars)
		if config.AppConfig == nil || config.AppConfig.OpenAI.APIKey == "" {
			out.Targets[i].Result = "OpenAI API key not configured"
			continue
		}
		openaiDao := extdao.NewOpenAIExtDao()
		systemMsg := fmt.Sprintf("You are a Korean relationship (궁합) expert. Write from the perspective: %s. Keep the response within approximately %d characters.", t.Perspective, maxChars)
		chatReq := extdao.ChatCompletionRequest{
			Messages: []extdao.ChatMessage{
				{Role: "system", Content: systemMsg},
				{Role: "user", Content: contextStr},
			},
			Temperature: 0.7,
			MaxTokens:   (maxChars / 2) + 200,
		}
		text, _, err := openaiDao.ChatCompletion(ctx, chatReq)
		if err != nil {
			out.Targets[i].Result = "LLM: " + err.Error()
			continue
		}
		out.Targets[i].Result = text
	}
	return out, nil
}

// RunSajuGenerationGql converts GraphQL input to DTO, calls RunSajuGeneration, and returns GraphQL response. All logic lives here (resolver is delegate-only).
func (s *AdminExtractService) RunSajuGenerationGql(ctx context.Context, input model.SajuGenerationRequest) (*model.SajuGenerationResponse, error) {
	if input.UserInput == nil || input.UserInput.Birth == nil {
		return nil, fmt.Errorf("user_input.birth is required")
	}
	req := dto.SajuGenerationRequest{
		UserInput: dto.SajuGenerationUserInput{
			Birth: dto.BirthInput{
				Date:          input.UserInput.Birth.Date,
				Time:          input.UserInput.Birth.Time,
				TimePrecision: utils.PtrToStr(input.UserInput.Birth.TimePrecision),
			},
			Timezone: utils.PtrToStr(input.UserInput.Timezone),
			RuleSet:  utils.PtrToStr(input.UserInput.RuleSet),
			Gender:   utils.PtrToStr(input.UserInput.Gender),
		},
		Targets: make([]dto.SajuGenerationTargetInput, 0, len(input.Targets)),
	}
	for _, t := range input.Targets {
		if t == nil {
			continue
		}
		req.Targets = append(req.Targets, dto.SajuGenerationTargetInput{
			Kind:     t.Kind,
			Period:   t.Period,
			MaxChars: t.MaxChars,
		})
	}
	resp, err := RunSajuGeneration(ctx, req)
	if err != nil {
		return nil, err
	}
	out := &model.SajuGenerationResponse{
		Targets: make([]*model.SajuGenerationTargetOutput, len(resp.Targets)),
	}
	for i := range resp.Targets {
		out.Targets[i] = &model.SajuGenerationTargetOutput{
			Kind:     resp.Targets[i].Kind,
			Period:   resp.Targets[i].Period,
			MaxChars: resp.Targets[i].MaxChars,
			Result:   resp.Targets[i].Result,
		}
	}
	return out, nil
}

// RunChemiGenerationGql converts GraphQL input to DTO, calls RunChemiGeneration, and returns GraphQL response. All logic lives here (resolver is delegate-only).
func (s *AdminExtractService) RunChemiGenerationGql(ctx context.Context, input model.ChemiGenerationRequest) (*model.ChemiGenerationResponse, error) {
	if input.PairInput == nil || input.PairInput.BirthA == nil || input.PairInput.BirthB == nil {
		return nil, fmt.Errorf("pair_input.birthA and birthB are required")
	}
	req := dto.ChemiGenerationRequest{
		PairInput: dto.ChemiGenerationPairInput{
			BirthA: dto.BirthInput{
				Date:          input.PairInput.BirthA.Date,
				Time:          input.PairInput.BirthA.Time,
				TimePrecision: utils.PtrToStr(input.PairInput.BirthA.TimePrecision),
			},
			BirthB: dto.BirthInput{
				Date:          input.PairInput.BirthB.Date,
				Time:          input.PairInput.BirthB.Time,
				TimePrecision: utils.PtrToStr(input.PairInput.BirthB.TimePrecision),
			},
			Timezone: utils.PtrToStr(input.PairInput.Timezone),
		},
		Targets: make([]dto.ChemiGenerationTargetInput, 0, len(input.Targets)),
	}
	for _, t := range input.Targets {
		if t == nil {
			continue
		}
		req.Targets = append(req.Targets, dto.ChemiGenerationTargetInput{
			Perspective: t.Perspective,
			MaxChars:    t.MaxChars,
		})
	}
	resp, err := RunChemiGeneration(ctx, req)
	if err != nil {
		return nil, err
	}
	out := &model.ChemiGenerationResponse{
		Targets: make([]*model.ChemiGenerationTargetOutput, len(resp.Targets)),
	}
	for i := range resp.Targets {
		out.Targets[i] = &model.ChemiGenerationTargetOutput{
			Perspective: resp.Targets[i].Perspective,
			MaxChars:    resp.Targets[i].MaxChars,
			Result:      resp.Targets[i].Result,
		}
	}
	return out, nil
}

// ----- SajuAssemble GraphQL (GraphQL_Extract_Design.md): sajuChart, sajuPairChart, itemnCardsByTokens, pairCardsByTokens, sendLLMRequest -----

// sajuChartData holds the result of building a single saju chart (pillars → items → tokens) without card selection.
type sajuChartData struct {
	pillars          itemncardtypes.PillarsText
	palja            string
	items            []itemncardtypes.Item
	tokens           []string
	period           string
	pillarSource     *dto.PillarSource
	mode             string
	runY, runM, runD int
	baseTimeUsed     string
}

// buildSajuChartData runs the same pillar/items/tokens pipeline as RunSajuExtractTest but does not select cards. Used by SajuChartGql.
func buildSajuChartData(req *dto.SajuExtractTestRequest) (*sajuChartData, error) {
	timezone := req.Timezone
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	y, m, d, hh, mm, _ := itemncard.BirthInput(req.Birth.Date, req.Birth.Time)
	if y == 0 {
		return nil, fmt.Errorf("invalid birth date")
	}
	mode := req.Mode
	if mode == "" {
		mode = "인생"
	}
	runY, runM, runD := y, m, d
	period := ""
	var pillars itemncardtypes.PillarsText
	var palja string
	var err error

	switch mode {
	case "연도별":
		if req.TargetYear != "" {
			if ty := parseInt(req.TargetYear); ty > 0 {
				runY, runM, runD = ty, 1, 1
				period = req.TargetYear
			}
		}
	case "월별":
		if req.TargetYear != "" && req.TargetMonth != "" {
			if ty := parseInt(req.TargetYear); ty > 0 {
				if tm := parseInt(req.TargetMonth); tm >= 1 && tm <= 12 {
					runY, runM, runD = ty, tm, 1
					period = req.TargetYear + "-" + req.TargetMonth
				}
			}
		}
	case "일간":
		if req.TargetYear != "" && req.TargetMonth != "" && req.TargetDay != "" {
			ty := parseInt(req.TargetYear)
			tm := parseInt(req.TargetMonth)
			td := parseInt(req.TargetDay)
			if ty > 0 && tm >= 1 && tm <= 12 && td >= 1 && td <= 31 {
				runY, runM, runD = ty, tm, td
				period = fmt.Sprintf("%04d-%02d-%02d", ty, tm, td)
			} else {
				return nil, fmt.Errorf("invalid target date for 일간")
			}
		} else {
			return nil, fmt.Errorf("일간 mode requires target_year, target_month, target_day")
		}
	case "대운":
		if req.TargetDaesoonIndex == "" || req.Gender == "" {
			return nil, fmt.Errorf("대운 mode requires target_daesoon_index and gender")
		}
		stepIdx := parseInt(req.TargetDaesoonIndex)
		if stepIdx < 0 {
			return nil, fmt.Errorf("invalid target_daesoon_index for 대운")
		}
		daesoonPillars, periodLabel, errDaesoon := itemncard.DaesoonPillars(y, m, d, hh, mm, timezone, req.Gender, stepIdx)
		if errDaesoon != nil {
			return nil, errDaesoon
		}
		period = periodLabel
		runY, runM, runD = y, m, d
		pillars = daesoonPillars
		palja = daesoonPillars.Year + daesoonPillars.Month + daesoonPillars.Day + daesoonPillars.Hour
		goto buildItems
	}

	pillars, palja, err = itemncard.PillarsFromBirth(runY, runM, runD, hh, mm, timezone)
	if err != nil {
		return nil, err
	}
buildItems:
	items := itemncard.ItemsFromPillars(pillars, palja)
	tokens := itemncard.ItemsToTokens(items)
	baseTimeUsed := "unknown"
	if req.Birth.Time != "" && req.Birth.Time != "unknown" {
		baseTimeUsed = fmt.Sprintf("%02d:%02d", ptrToInt(hh), ptrToInt(mm))
	}
	desc := ""
	switch mode {
	case "인생":
		desc = "원국"
	case "연도별":
		desc = "歲運"
	case "월별":
		desc = "月運"
	case "일간":
		desc = "日運"
	case "대운":
		desc = "大運"
	}
	ps := &dto.PillarSource{
		BaseDate:     fmt.Sprintf("%04d-%02d-%02d", runY, runM, runD),
		BaseTimeUsed: baseTimeUsed,
		Mode:         mode,
		Period:       period,
		Description:  desc,
	}
	return &sajuChartData{
		pillars:      pillars,
		palja:        palja,
		items:        items,
		tokens:       tokens,
		period:       period,
		pillarSource: ps,
		mode:         mode,
		runY:         runY,
		runM:         runM,
		runD:         runD,
		baseTimeUsed: baseTimeUsed,
	}, nil
}

func ptrToInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func intPtrToStr(p *int) string {
	if p == nil {
		return ""
	}
	return fmt.Sprintf("%d", *p)
}

// SajuChartGql returns SimpleResult with node = SajuChart (pillars, optional items/tokens). All logic here; resolver delegates only.
func (s *AdminExtractService) SajuChartGql(ctx context.Context, input model.SajuChartInput) (*model.SimpleResult, error) {
	if input.Birth == nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("birth is required")}, nil
	}
	req := &dto.SajuExtractTestRequest{
		Birth: dto.BirthInput{
			Date:          input.Birth.Date,
			Time:          input.Birth.Time,
			TimePrecision: utils.PtrToStr(input.Birth.TimePrecision),
		},
		Timezone:           utils.PtrToStr(input.Timezone),
		Mode:               input.Mode,
		TargetYear:         intPtrToStr(input.TargetYear),
		TargetMonth:        intPtrToStr(input.TargetMonth),
		TargetDay:          intPtrToStr(input.TargetDay),
		TargetDaesoonIndex: intPtrToStr(input.TargetDaesoonIndex),
		Gender:             utils.PtrToStr(input.Gender),
	}
	data, err := buildSajuChartData(req)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	includeTokens := input.IncludeTokens != nil && *input.IncludeTokens
	ruleSet := "korean_standard_v1"
	engineVersion := "itemncard@0.1"
	itemsSummary := "items from pillars"
	var tokensOut []string
	var itemsOut []string
	if includeTokens {
		tokensOut = data.tokens
		itemsOut = make([]string, 0, len(data.items))
		for _, it := range data.items {
			itemsOut = append(itemsOut, it.K+":"+it.N)
		}
	}
	var pillarSource *model.SajuPillarSource
	if data.pillarSource != nil {
		pillarSource = &model.SajuPillarSource{
			BaseDate:     data.pillarSource.BaseDate,
			BaseTimeUsed: data.pillarSource.BaseTimeUsed,
			Mode:         data.pillarSource.Mode,
			Period:       data.pillarSource.Period,
			Description:  data.pillarSource.Description,
		}
	}
	chart := &model.SajuChart{
		Pillars: &model.SajuChartPillars{
			Y: data.pillars.Year,
			M: data.pillars.Month,
			D: data.pillars.Day,
			H: data.pillars.Hour,
		},
		ItemsSummary:  &itemsSummary,
		RuleSet:       &ruleSet,
		EngineVersion: &engineVersion,
		Mode:          &data.mode,
		Period:        &data.period,
		PillarSource:  pillarSource,
	}
	if includeTokens {
		chart.Tokens = tokensOut
		chart.Items = itemsOut
	}
	return &model.SimpleResult{Ok: true, Node: chart}, nil
}

// SajuPairChartGql returns SimpleResult with node = SajuPairChart (chartA, chartB, pTokens). Resolver delegates only.
func (s *AdminExtractService) SajuPairChartGql(ctx context.Context, input model.SajuPairChartInput) (*model.SimpleResult, error) {
	if input.BirthA == nil || input.BirthB == nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("birthA and birthB are required")}, nil
	}
	timezone := utils.PtrToStr(input.Timezone)
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	reqA := &dto.SajuExtractTestRequest{Birth: dto.BirthInput{Date: input.BirthA.Date, Time: input.BirthA.Time, TimePrecision: utils.PtrToStr(input.BirthA.TimePrecision)}, Timezone: timezone, Mode: "인생"}
	reqB := &dto.SajuExtractTestRequest{Birth: dto.BirthInput{Date: input.BirthB.Date, Time: input.BirthB.Time, TimePrecision: utils.PtrToStr(input.BirthB.TimePrecision)}, Timezone: timezone, Mode: "인생"}
	dataA, err := buildSajuChartData(reqA)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("chartA: " + err.Error())}, nil
	}
	dataB, err := buildSajuChartData(reqB)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("chartB: " + err.Error())}, nil
	}
	pItems := itemncard.PItemsFromPillars(dataA.pillars, dataB.pillars)
	pTokens := itemncard.ItemsToTokens(pItems)
	includeTokens := input.IncludeTokens != nil && *input.IncludeTokens
	chartA := sajuChartDataToModel(dataA, includeTokens)
	chartB := sajuChartDataToModel(dataB, includeTokens)
	ruleSet := "korean_standard_v1"
	engineVersion := "itemncard@0.1"
	pair := &model.SajuPairChart{
		ChartA:        chartA,
		ChartB:        chartB,
		PTokens:       pTokens,
		PItemsSummary: utils.StrPtr("p items from pillars"),
		RuleSet:       &ruleSet,
		EngineVersion: &engineVersion,
	}
	if includeTokens {
		pItemsStr := make([]string, 0, len(pItems))
		for _, it := range pItems {
			pItemsStr = append(pItemsStr, it.K+":"+it.N)
		}
		pair.PItems = pItemsStr
	}
	return &model.SimpleResult{Ok: true, Node: pair}, nil
}

func sajuChartDataToModel(data *sajuChartData, includeTokens bool) *model.SajuChart {
	ruleSet := "korean_standard_v1"
	engineVersion := "itemncard@0.1"
	itemsSummary := "items from pillars"
	var tokensOut []string
	var itemsOut []string
	if includeTokens {
		tokensOut = data.tokens
		itemsOut = make([]string, 0, len(data.items))
		for _, it := range data.items {
			itemsOut = append(itemsOut, it.K+":"+it.N)
		}
	}
	var pillarSource *model.SajuPillarSource
	if data.pillarSource != nil {
		pillarSource = &model.SajuPillarSource{
			BaseDate:     data.pillarSource.BaseDate,
			BaseTimeUsed: data.pillarSource.BaseTimeUsed,
			Mode:         data.pillarSource.Mode,
			Period:       data.pillarSource.Period,
			Description:  data.pillarSource.Description,
		}
	}
	return &model.SajuChart{
		Pillars:       &model.SajuChartPillars{Y: data.pillars.Year, M: data.pillars.Month, D: data.pillars.Day, H: data.pillars.Hour},
		ItemsSummary:  &itemsSummary,
		RuleSet:       &ruleSet,
		EngineVersion: &engineVersion,
		Mode:          &data.mode,
		Period:        &data.period,
		PillarSource:  pillarSource,
		Tokens:        tokensOut,
		Items:         itemsOut,
	}
}

// ItemnCardsByTokensGql returns SimpleResult with nodes = selected saju cards for the given tokens. Resolver delegates only.
func (s *AdminExtractService) ItemnCardsByTokensGql(ctx context.Context, input model.ItemnCardsByTokensInput) (*model.SimpleResult, error) {
	tokenSet := make(map[string]bool)
	for _, t := range input.Tokens {
		tokenSet[t] = true
	}
	selected, evidences, scores, err := itemncard.SelectSajuCards(tokenSet)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	nodes := selectedCardsToNodes(selected, evidences, scores)
	return &model.SimpleResult{Ok: true, Nodes: nodes}, nil
}

// PairCardsByTokensGql returns SimpleResult with nodes = selected pair cards for the given tokensA/tokensB/pTokens. Resolver delegates only.
func (s *AdminExtractService) PairCardsByTokensGql(ctx context.Context, input model.PairCardsByTokensInput) (*model.SimpleResult, error) {
	aSet := make(map[string]bool)
	bSet := make(map[string]bool)
	pSet := make(map[string]bool)
	for _, t := range input.TokensA {
		aSet[t] = true
	}
	for _, t := range input.TokensB {
		bSet[t] = true
	}
	for _, t := range input.PTokens {
		pSet[t] = true
	}
	selected, evidences, scores, err := itemncard.SelectPairCards(aSet, bSet, pSet)
	if err != nil {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr(err.Error())}, nil
	}
	nodes := selectedCardsToNodes(selected, evidences, scores)
	return &model.SimpleResult{Ok: true, Nodes: nodes}, nil
}

const selectedCardContentSummaryMax = 200

func selectedCardsToNodes(selected []entity.ItemNCard, evidences [][]string, scores []int) []model.Node {
	nodes := make([]model.Node, len(selected))
	for i := range selected {
		ev := []string{}
		if i < len(evidences) {
			ev = evidences[i]
		}
		sc := selected[i].Priority
		if i < len(scores) {
			sc = scores[i]
		}
		summary := ""
		if len(selected[i].ContentJSON) > 0 {
			if len(selected[i].ContentJSON) <= selectedCardContentSummaryMax {
				summary = selected[i].ContentJSON
			} else {
				summary = selected[i].ContentJSON[:selectedCardContentSummaryMax] + "..."
			}
		}
		nodes[i] = &model.SelectedItemnCard{
			CardID:         selected[i].CardID,
			Title:          selected[i].Title,
			Evidence:       ev,
			Score:          sc,
			ContentSummary: utils.StrPtr(summary),
		}
	}
	return nodes
}

// SendLLMRequestGql calls OpenAI with prompt (and optional systemPrompt/model/maxTokens/temperature); returns SimpleResult with node = LLMRequestResult. No card UID.
func (s *AdminExtractService) SendLLMRequestGql(ctx context.Context, input model.SendLLMRequestInput) (*model.SimpleResult, error) {
	if config.AppConfig == nil || config.AppConfig.OpenAI.APIKey == "" {
		return &model.SimpleResult{Ok: false, Msg: utils.StrPtr("OpenAI API key not configured")}, nil
	}
	messages := []extdao.ChatMessage{{Role: "user", Content: input.Prompt}}
	if input.SystemPrompt != nil && *input.SystemPrompt != "" {
		messages = append([]extdao.ChatMessage{{Role: "system", Content: *input.SystemPrompt}}, messages...)
	}
	maxTokens := 1024
	if input.MaxTokens != nil && *input.MaxTokens > 0 {
		maxTokens = *input.MaxTokens
	}
	temperature := float32(0.7)
	if input.Temperature != nil {
		temperature = float32(*input.Temperature)
	}
	modelName := ""
	if input.Model != nil {
		modelName = *input.Model
	}
	openaiDao := extdao.NewOpenAIExtDao()
	text, usage, err := openaiDao.ChatCompletion(ctx, extdao.ChatCompletionRequest{
		Model:       modelName,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
	})
	if err != nil {
		return &model.SimpleResult{
			Ok:   true,
			Node: &model.LLMRequestResult{ErrorMessage: utils.StrPtr(err.Error())},
		}, nil
	}
	var inTok, outTok, totalTok *int
	if usage != nil {
		inTok = utils.IntPtr(usage.Input)
		outTok = utils.IntPtr(usage.Output)
		totalTok = utils.IntPtr(usage.Total)
	}
	return &model.SimpleResult{
		Ok:   true,
		Node: &model.LLMRequestResult{ResponseText: &text, InputTokens: inTok, OutputTokens: outTok, TotalTokens: totalTok},
	}, nil
}

// resolveRunDateForKind returns (runY, runM, runD, ok) for the given kind and period; birth (y,m,d) used for 인생.
func resolveRunDateForKind(kind, period string, birthY, birthM, birthD int) (runY, runM, runD int, ok bool) {
	switch kind {
	case "인생":
		return birthY, birthM, birthD, true
	case "세운":
		if period == "" {
			return 0, 0, 0, false
		}
		runY = parseInt(period)
		if runY <= 0 {
			return 0, 0, 0, false
		}
		return runY, 1, 1, true
	case "월간":
		parts := strings.Split(period, "-")
		if len(parts) < 2 {
			return 0, 0, 0, false
		}
		runY = parseInt(parts[0])
		runM := parseInt(parts[1])
		if runY <= 0 || runM < 1 || runM > 12 {
			return 0, 0, 0, false
		}
		return runY, runM, 1, true
	case "일간":
		parts := strings.Split(period, "-")
		if len(parts) < 3 {
			return 0, 0, 0, false
		}
		runY = parseInt(parts[0])
		runM := parseInt(parts[1])
		runD := parseInt(parts[2])
		if runY <= 0 || runM < 1 || runM > 12 || runD < 1 || runD > 31 {
			return 0, 0, 0, false
		}
		return runY, runM, runD, true
	default:
		return 0, 0, 0, false
	}
}
