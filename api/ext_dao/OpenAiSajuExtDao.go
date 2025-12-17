// OpenAI를 통한 사주 분석 결과 생성
package extdao

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// OpenAiSajuExtDao handles OpenAI-based Saju analysis
type OpenAiSajuExtDao struct {
	openaiDao *OpenAIExtDao
}

// NewOpenAiSajuExtDao creates a new OpenAiSajuExtDao instance
func NewOpenAiSajuExtDao() *OpenAiSajuExtDao {
	return &OpenAiSajuExtDao{
		openaiDao: NewOpenAIExtDao(),
	}
}

// SajuAnalysisRequest represents the input for Saju analysis
type SajuAnalysisRequest struct {
	Gender string // "male" or "female"
	Birth  string // yyyymmddhhmm format (hhmm optional)
	Palja  string // 팔자 문자열 (6~8자, 한글)
}

// SajuAnalysisResponse represents the JSON response from OpenAI
type SajuAnalysisResponse struct {
	Nickname    string `json:"nickname"`
	Sex         string `json:"sex"`
	Age         int    `json:"age,omitempty"`
	Summary     string `json:"summary"`
	Content     string `json:"content"`
	PartnerTips string `json:"partner_tips"`
}

// buildPrompt constructs the prompt for Saju analysis based on the Python code
func buildPrompt(req SajuAnalysisRequest) string {
	var birthInfo string
	if req.Birth != "" {
		birthInfo = req.Birth
	} else {
		birthInfo = "없음"
	}

	var paljaInfo string
	if req.Palja != "" {
		paljaInfo = req.Palja
	} else {
		paljaInfo = "없음"
	}

	return fmt.Sprintf(GetPrompt(PromptTypeSaju), req.Gender, birthInfo, paljaInfo)
}

// AnalyzeSaju performs Saju analysis using OpenAI
func (dao *OpenAiSajuExtDao) AnalyzeSaju(ctx context.Context, req SajuAnalysisRequest) (*SajuAnalysisResponse, error) {
	// Build the prompt
	prompt := buildPrompt(req)

	// Call OpenAI API
	chatReq := ChatCompletionRequest{
		Model: "gpt-4o-mini", // Using gpt-4o-mini as closest to gpt-4.1-mini
		Messages: []ChatMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.6,
		MaxTokens:   3000,
	}

	responseText, err := dao.openaiDao.ChatCompletion(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get OpenAI response: %w", err)
	}

	// Extract JSON from response (handle cases where response might have extra text)
	responseText = strings.TrimSpace(responseText)
	start := strings.Index(responseText, "{")
	end := strings.LastIndex(responseText, "}")
	if start == -1 || end == -1 || end <= start {
		return nil, fmt.Errorf("invalid JSON response format")
	}

	jsonText := responseText[start : end+1]

	// Parse JSON response
	var apiResponse SajuAnalysisResponse
	if err := json.Unmarshal([]byte(jsonText), &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	return &apiResponse, nil
}
