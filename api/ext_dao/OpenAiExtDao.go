package extdao

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"time"

	"sajudating_api/api/config"

	"github.com/sashabaranov/go-openai"
)

type OpenAIExtDao struct {
	client *openai.Client
}

// NewOpenAIExtDao creates a new OpenAI DAO instance
func NewOpenAIExtDao() *OpenAIExtDao {
	apiKey := config.AppConfig.OpenAI.APIKey
	if apiKey == "" {
		log.Fatal("OpenAI API key is not configured")
	}

	client := openai.NewClient(apiKey)
	return &OpenAIExtDao{
		client: client,
	}
}

// ChatCompletionRequest represents a simple chat completion request
type ChatCompletionRequest struct {
	Model       string
	Messages    []ChatMessage
	Temperature float32
	MaxTokens   int
}

// ChatMessage represents a single message in the conversation
type ChatMessage struct {
	Role    string // "system", "user", or "assistant"
	Content string
}

type Usage struct {
	Input  int
	Output int
	Total  int
}

// ChatCompletion sends a chat completion request to OpenAI
func (dao *OpenAIExtDao) ChatCompletion(ctx context.Context, req ChatCompletionRequest) (string, *Usage, error) {
	if req.Model == "" {
		req.Model = openai.GPT4o
	}

	messages := make([]openai.ChatCompletionMessage, len(req.Messages))
	for i, msg := range req.Messages {
		messages[i] = openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	chatReq := openai.ChatCompletionRequest{
		Model:       req.Model,
		Messages:    messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
	}

	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	resp, err := dao.client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		return "", nil, fmt.Errorf("failed to create chat completion: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", nil, fmt.Errorf("no response choices returned")
	}
	usage := Usage{
		Input:  resp.Usage.PromptTokens,
		Output: resp.Usage.CompletionTokens,
		Total:  resp.Usage.TotalTokens,
	}
	return resp.Choices[0].Message.Content, &usage, nil
}

// VisionAnalysisRequest represents a vision analysis request
type VisionAnalysisRequest struct {
	Model       string
	Prompt      string
	ImageData   []byte // Image as bytes
	ImageURL    string // Or image URL
	Temperature float32
	MaxTokens   int
}

// VisionAnalysis sends an image analysis request to OpenAI Vision API
func (dao *OpenAIExtDao) VisionAnalysis(ctx context.Context, req VisionAnalysisRequest) (string, *Usage, error) {
	if req.Model == "" {
		req.Model = openai.GPT4o
	}

	var imageURL string
	if req.ImageURL != "" {
		imageURL = req.ImageURL
	} else if len(req.ImageData) > 0 {
		// Convert image bytes to base64 data URL
		base64Image := base64.StdEncoding.EncodeToString(req.ImageData)
		imageURL = fmt.Sprintf("data:image/jpeg;base64,%s", base64Image)
	} else {
		return "", nil, fmt.Errorf("either ImageData or ImageURL must be provided")
	}

	messages := []openai.ChatCompletionMessage{
		{
			Role: openai.ChatMessageRoleUser,
			MultiContent: []openai.ChatMessagePart{
				{
					Type: openai.ChatMessagePartTypeText,
					Text: req.Prompt,
				},
				{
					Type: openai.ChatMessagePartTypeImageURL,
					ImageURL: &openai.ChatMessageImageURL{
						URL: imageURL,
					},
				},
			},
		},
	}

	chatReq := openai.ChatCompletionRequest{
		Model:       req.Model,
		Messages:    messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
	}

	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	resp, err := dao.client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		return "", nil, fmt.Errorf("failed to analyze image: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", nil, fmt.Errorf("no response choices returned")
	}

	usage := Usage{
		Input:  resp.Usage.PromptTokens,
		Output: resp.Usage.CompletionTokens,
		Total:  resp.Usage.TotalTokens,
	}

	return resp.Choices[0].Message.Content, &usage, nil
}

// StreamChatCompletion sends a streaming chat completion request
func (dao *OpenAIExtDao) StreamChatCompletion(ctx context.Context, req ChatCompletionRequest, onChunk func(string) error) error {
	if req.Model == "" {
		req.Model = openai.GPT4o
	}

	messages := make([]openai.ChatCompletionMessage, len(req.Messages))
	for i, msg := range req.Messages {
		messages[i] = openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	chatReq := openai.ChatCompletionRequest{
		Model:       req.Model,
		Messages:    messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      true,
	}

	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	stream, err := dao.client.CreateChatCompletionStream(ctx, chatReq)
	if err != nil {
		return fmt.Errorf("failed to create chat completion stream: %w", err)
	}
	defer stream.Close()

	for {
		response, err := stream.Recv()
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return fmt.Errorf("stream error: %w", err)
		}

		if len(response.Choices) > 0 {
			chunk := response.Choices[0].Delta.Content
			if chunk != "" {
				if err := onChunk(chunk); err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// EmbeddingRequest represents an embedding request
type EmbeddingRequest struct {
	Model string
	Input string
}

// CreateEmbedding creates an embedding for the given text
func (dao *OpenAIExtDao) CreateEmbedding(ctx context.Context, model, input string) ([]float32, error) {
	EmbeddingModel := openai.SmallEmbedding3
	if model != "" {
		EmbeddingModel = openai.EmbeddingModel(model)
	}
	embReq := openai.EmbeddingRequest{
		Input: []string{input},
		Model: EmbeddingModel,
	}

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	resp, err := dao.client.CreateEmbeddings(ctx, embReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create embedding: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embedding data returned")
	}

	return resp.Data[0].Embedding, nil
}

// ImageGenerationRequest represents an image generation request
type ImageGenerationRequest struct {
	Model  string // "dall-e-2" or "dall-e-3"
	Prompt string
	Size   string // "256x256", "512x512", "1024x1024" for dall-e-2, "1024x1024", "1792x1024", "1024x1792" for dall-e-3
	N      int    // Number of images (1 for dall-e-3, 1-10 for dall-e-2)
}

// GenerateImage generates an image using OpenAI DALL-E API
func (dao *OpenAIExtDao) GenerateImage(ctx context.Context, req ImageGenerationRequest) ([]byte, *Usage, error) {
	if req.Model == "" {
		req.Model = "dall-e-3"
	}
	if req.Size == "" {
		req.Size = "1024x1024"
	}
	if req.N == 0 {
		req.N = 1
	}

	imageReq := openai.ImageRequest{
		Model:  req.Model,
		Prompt: req.Prompt,
		Size:   req.Size,
		N:      req.N,
		// ResponseFormat: openai.CreateImageResponseFormatB64JSON,
	}

	if imageReq.Model == openai.CreateImageModelDallE3 {
		imageReq.ResponseFormat = openai.CreateImageResponseFormatB64JSON
	}

	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	resp, err := dao.client.CreateImage(ctx, imageReq)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate image: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, nil, fmt.Errorf("no image data returned")
	}

	// Handle base64 JSON response
	if resp.Data[0].B64JSON != "" {
		imageBytes, err := base64.StdEncoding.DecodeString(resp.Data[0].B64JSON)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to decode base64 image: %w", err)
		}
		usage := Usage{
			Input:  resp.Usage.InputTokens,
			Output: resp.Usage.OutputTokens,
			Total:  resp.Usage.TotalTokens,
		}
		return imageBytes, &usage, nil
	}

	// Handle URL response (download the image)
	if resp.Data[0].URL != "" {
		// For URL responses, we would need to download the image
		// For now, return an error suggesting to use B64JSON format
		return nil, nil, fmt.Errorf("URL response not supported, use B64JSON format")
	}

	return nil, nil, fmt.Errorf("no valid image data in response")
}

// 쿼리를 위한 공통메소드
func (dao *OpenAIExtDao) Query(ctx context.Context,
	modelType string, // text, vision, image
	model, valuedPrompt string, temperature float32, maxTokens int, size string, imageData []byte) (string, *Usage, error) {

	if model == "" {
		model = openai.GPT4oMini
	}

	if modelType == "text" {
		result, resp, err := dao.ChatCompletion(ctx, ChatCompletionRequest{
			Model: model,
			Messages: []ChatMessage{
				{
					Role:    "user",
					Content: valuedPrompt,
				},
			},
			Temperature: temperature,
			MaxTokens:   maxTokens,
		})
		if err != nil {
			return "", nil, fmt.Errorf("failed to chat completion: %w", err)
		}
		return result, resp, err
	} else if modelType == "vision" {
		result, resp, err := dao.VisionAnalysis(ctx, VisionAnalysisRequest{
			Model:       model,
			Prompt:      valuedPrompt,
			ImageData:   imageData,
			ImageURL:    "",
			Temperature: temperature,
			MaxTokens:   maxTokens,
		})
		if err != nil {
			return "", nil, fmt.Errorf("failed to vision analysis: %w", err)
		}
		return result, resp, err
	} else if modelType == "image" {
		result, resp, err := dao.GenerateImage(ctx, ImageGenerationRequest{
			Model:  model,
			Prompt: valuedPrompt,
			Size:   size,
			N:      1,
		})
		if err != nil {
			return "", nil, fmt.Errorf("failed to generate image: %w", err)
		}
		// return base64 encoded image
		return base64.StdEncoding.EncodeToString(result), resp, nil
	} else {
		return "", nil, fmt.Errorf("invalid model type: %s", modelType)
	}

}
