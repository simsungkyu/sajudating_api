// OpenAI를 통한 관상 분석 결과 생성 (이미지와 성별 기반)
package extdao

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"
)

// OpenAiPhyExtDao handles OpenAI-based physiognomy analysis
type OpenAiPhyExtDao struct {
	openaiDao *OpenAIExtDao
}

// NewOpenAiPhyExtDao creates a new OpenAiPhyExtDao instance
func NewOpenAiPhyExtDao() *OpenAiPhyExtDao {
	return &OpenAiPhyExtDao{
		openaiDao: NewOpenAIExtDao(),
	}
}

// PhyAnalysisRequest represents the input for physiognomy analysis
type PhyAnalysisRequest struct {
	ImageBase64 string // Base64 encoded image
	Sex         string // "male" or "female"
	Age         string // age
}

// FaceFeatures represents extracted facial features
type FaceFeatures struct {
	Eyebrows  FaceFeaturesEyebrowsType `json:"eyebrows"`
	Eyes      FaceFeaturesEyesType     `json:"eyes"`
	Nose      FaceFeaturesNoseType     `json:"nose"`
	Mouth     FaceFeaturesMouthType    `json:"mouth"`
	FaceShape string                   `json:"face_shape"` // "oval" | "round" | "square" | "long" | "heart" | "diamond"
	Notes     string                   `json:"notes"`
}

func (f *FaceFeatures) ToString() string {
	return fmt.Sprintf("Eyebrows: %s, Eyes: %s, Nose: %s, Mouth: %s, FaceShape: %s, Notes: %s", f.Eyebrows.ToString(), f.Eyes.ToString(), f.Nose.ToString(), f.Mouth.ToString(), f.FaceShape, f.Notes)
}

type FaceFeaturesEyebrowsType struct {
	Thickness       string `json:"thickness"`         // "thick" | "thin"
	Shape           string `json:"shape"`             // "straight" | "arched" | "angled"
	Length          string `json:"length"`            // "longer_than_eye" | "shorter_than_eye"
	DistanceFromEye string `json:"distance_from_eye"` // "close" | "far"
	Neatness        string `json:"neatness"`          // "neat" | "messy"
	TailDirection   string `json:"tail_direction"`    // "upward" | "downward"
}

func (f *FaceFeaturesEyebrowsType) ToString() string {
	return fmt.Sprintf("Thickness: %s, Shape: %s, Length: %s, DistanceFromEye: %s, Neatness: %s, TailDirection: %s", f.Thickness, f.Shape, f.Length, f.DistanceFromEye, f.Neatness, f.TailDirection)
}

type FaceFeaturesEyesType struct {
	Size                string `json:"size"`                  // "large" | "medium" | "small"
	Shape               string `json:"shape"`                 // "round" | "almond" | "narrow"
	EyeTailDirection    string `json:"eye_tail_direction"`    // "upward" | "downward" | "neutral"
	DistanceBetweenEyes string `json:"distance_between_eyes"` // "wide" | "average" | "narrow"
	EyelidType          string `json:"eyelid_type"`           // "double" | "single" | "inner_double"
}

func (f *FaceFeaturesEyesType) ToString() string {
	return fmt.Sprintf("Size: %s, Shape: %s, EyeTailDirection: %s, DistanceBetweenEyes: %s, EyelidType: %s", f.Size, f.Shape, f.EyeTailDirection, f.DistanceBetweenEyes, f.EyelidType)
}

type FaceFeaturesNoseType struct {
	BridgeHeight      string `json:"bridge_height"`      // "high" | "medium" | "low"
	BridgeWidth       string `json:"bridge_width"`       // "wide" | "medium" | "narrow"
	TipShape          string `json:"tip_shape"`          // "rounded" | "pointed" | "flat"
	NostrilVisibility string `json:"nostril_visibility"` // "high" | "medium" | "low"
}

func (f *FaceFeaturesNoseType) ToString() string {
	return fmt.Sprintf("BridgeHeight: %s, BridgeWidth: %s, TipShape: %s, NostrilVisibility: %s", f.BridgeHeight, f.BridgeWidth, f.TipShape, f.NostrilVisibility)
}

type FaceFeaturesMouthType struct {
	LipThickness         string `json:"lip_thickness"`          // "thick" | "medium" | "thin"
	MouthWidth           string `json:"mouth_width"`            // "wide" | "medium" | "narrow"
	MouthCornerDirection string `json:"mouth_corner_direction"` // "upward" | "downward" | "neutral"
}

func (f *FaceFeaturesMouthType) ToString() string {
	return fmt.Sprintf("LipThickness: %s, MouthWidth: %s, MouthCornerDirection: %s", f.LipThickness, f.MouthWidth, f.MouthCornerDirection)
}

// PhyAnalysisResponse represents the JSON response from OpenAI interpretation
type PhyAnalysisResponse struct {
	Sex                     string `json:"sex"`
	Age                     string `json:"age"`
	Summary                 string `json:"summary"`
	Content                 string `json:"content"`
	IdealPartnerPhysiognomy struct {
		PartnerSummary           string `json:"partner_summary"`
		PartnerAge               int    `json:"partner_age"`
		PartnerSex               string `json:"partner_sex"`
		FacialFeaturePreferences struct {
			Eyes      FaceFeaturesEyesType  `json:"eyes"`
			Nose      FaceFeaturesNoseType  `json:"nose"`
			Mouth     FaceFeaturesMouthType `json:"mouth"`
			FaceShape string                `json:"face_shape"`
		} `json:"facial_feature_preferences"`
		PersonalityMatch string `json:"personality_match"`
	} `json:"ideal_partner_physiognomy"`
}

func (p *PhyAnalysisResponse) GetAge() int {
	age, err := strconv.Atoi(p.Age)
	if err != nil {
		return 0
	}
	return age
}
func (p *PhyAnalysisResponse) GetPartnerAge() int {
	return p.IdealPartnerPhysiognomy.PartnerAge
}

// buildFaceExtractionPrompt constructs the prompt for face feature extraction
func buildFaceExtractionPrompt() string {
	return GetPrompt(PromptTypeFaceFeatures)
}

// buildInterpretationPrompt constructs the prompt for physiognomy interpretation
func buildInterpretationPrompt(faceFeatures FaceFeatures, sex string, age string) string {
	featuresJSON, _ := json.MarshalIndent(faceFeatures, "", "  ")

	return fmt.Sprintf(GetPrompt(PromptTypePhy), sex, age, string(featuresJSON))
}

// parseLLMJSON extracts JSON from LLM response text
func parseLLMJSON(text string) (map[string]interface{}, error) {
	if text == "" || strings.TrimSpace(text) == "" {
		return nil, fmt.Errorf("LLM returned empty output")
	}

	text = strings.TrimSpace(text)

	// 1. Try direct JSON parse
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(text), &result); err == nil {
		return result, nil
	}

	// 2. Extract JSON from surrounding text
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}") + 1

	if start == -1 || end == 0 {
		return nil, fmt.Errorf("no JSON object found in LLM output:\n%s", text)
	}

	jsonText := text[start:end]
	if err := json.Unmarshal([]byte(jsonText), &result); err != nil {
		return nil, fmt.Errorf("JSON parsing failed:\n%s", text)
	}

	return result, nil
}

// ExtractFaceFeatures extracts facial features from an image
func (dao *OpenAiPhyExtDao) ExtractFaceFeatures(ctx context.Context, imageBase64 string) (*FaceFeatures, error) {
	now := time.Now().UnixMilli()
	prompt := buildFaceExtractionPrompt()

	// Handle base64 string - remove data URL prefix if present
	imageBase64Clean := imageBase64
	if strings.HasPrefix(imageBase64, "data:image/") {
		// Extract base64 part after comma
		parts := strings.Split(imageBase64, ",")
		if len(parts) > 1 {
			imageBase64Clean = parts[1]
		}
	}

	// Decode base64 to bytes
	imageData, err := base64.StdEncoding.DecodeString(imageBase64Clean)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Call Vision API
	responseText, err := dao.openaiDao.VisionAnalysis(ctx, VisionAnalysisRequest{
		Model:       "gpt-4o-mini",
		Prompt:      prompt,
		ImageData:   imageData,
		Temperature: 0,
		MaxTokens:   2000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to analyze image: %w", err)
	}

	// Parse JSON response
	jsonData, err := parseLLMJSON(responseText)
	if err != nil {
		return nil, fmt.Errorf("failed to parse face features JSON: %w", err)
	}

	// Convert to FaceFeatures struct
	jsonBytes, err := json.Marshal(jsonData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON: %w", err)
	}

	var features FaceFeatures
	if err := json.Unmarshal(jsonBytes, &features); err != nil {
		return nil, fmt.Errorf("failed to unmarshal face features: %w", err)
	}

	log.Printf("ExtractFaceFeatures time: %dms", time.Now().UnixMilli()-now)
	return &features, nil
}

// InterpretPhysiognomy interprets facial features and generates personality analysis
func (dao *OpenAiPhyExtDao) InterpretPhysiognomy(ctx context.Context, faceFeatures *FaceFeatures, sex string, age string) (*PhyAnalysisResponse, error) {
	now := time.Now().UnixMilli()
	prompt := buildInterpretationPrompt(*faceFeatures, sex, age)

	// Call Chat API
	chatReq := ChatCompletionRequest{
		Model: "gpt-4o-mini",
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

	// Parse JSON response
	jsonData, err := parseLLMJSON(responseText)
	if err != nil {
		log.Printf("failed to parse interpretation JSON: %v", responseText)
		return nil, fmt.Errorf("failed to parse interpretation JSON: %w", err)
	}

	// Convert to PhyAnalysisResponse struct
	jsonBytes, err := json.Marshal(jsonData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON: %w", err)
	}

	var response PhyAnalysisResponse
	if err := json.Unmarshal(jsonBytes, &response); err != nil {
		log.Printf("failed to unmarshal interpretation: %v", responseText)
		return nil, fmt.Errorf("failed to unmarshal interpretation: %w", err)
	}

	log.Printf("InterpretPhysiognomy time: %dms", time.Now().UnixMilli()-now)
	return &response, nil
}

// buildImagePrompt constructs the prompt for ideal partner image generation
func buildImagePrompt(userData *PhyAnalysisResponse, partnerSex string) string {
	partnerAge := userData.IdealPartnerPhysiognomy.PartnerAge
	prefs := userData.IdealPartnerPhysiognomy.FacialFeaturePreferences

	return fmt.Sprintf(GetPrompt(PromptTypeImage), partnerSex, partnerAge, prefs.Eyes.ToString(), prefs.Nose.ToString(), prefs.Mouth.ToString(), prefs.FaceShape)
}

// GenerateIdealPartnerImage generates an image of the ideal partner based on physiognomy analysis
func (dao *OpenAiPhyExtDao) GenerateIdealPartnerImage(ctx context.Context, userData *PhyAnalysisResponse, partnerSex string) ([]byte, error) {
	prompt := buildImagePrompt(userData, partnerSex)

	log.Printf("GenerateIdealPartnerImage prompt: %s", prompt)
	now := time.Now().UnixMilli()
	// Call Image Generation API
	imageReq := ImageGenerationRequest{
		// Model: "dall-e-3", // or "dall-e-2" if preferred
		Model:  "gpt-image-1-mini",
		Prompt: prompt,
		Size:   "1024x1024", // Note: DALL-E 3 doesn't support 300x300, but we'll use closest available
		N:      1,
	}

	imageBytes, err := dao.openaiDao.GenerateImage(ctx, imageReq)
	if err != nil {
		return nil, fmt.Errorf("failed to generate ideal partner image: %w", err)
	}

	log.Printf("GenerateIdealPartnerImage time: %dms", time.Now().UnixMilli()-now)
	return imageBytes, nil
}
