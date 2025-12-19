package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/utils"
	"time"
)

type AdminAiExecutionService struct {
	aiExecutionRepo *dao.AiExecutionRepository
}

func NewAdminAiExecutionService() *AdminAiExecutionService {
	return &AdminAiExecutionService{
		aiExecutionRepo: dao.NewAiExecutionRepository(),
	}
}

func (s *AdminAiExecutionService) GetAiExecutions(ctx context.Context, input model.AiExecutionSearchInput) (*model.SimpleResult, error) {
	executions, total, err := s.aiExecutionRepo.FindWithPagination(input.Limit, input.Offset, input.MetaUID, input.MetaType, input.RunBy, input.RunSajuProfileUID)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve ai executions: %v", err)),
		}, nil
	}

	nodes := make([]model.Node, len(executions))
	for i := range executions {
		nodes[i] = converter.AiExecutionToModel(&executions[i])
	}

	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(input.Offset),
	}, nil
}

func (s *AdminAiExecutionService) GetAiExecution(ctx context.Context, uid string) (*model.SimpleResult, error) {
	aiExecution, err := s.aiExecutionRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to get ai execution: %v", err)),
		}, nil
	}

	node := converter.AiExecutionToModel(aiExecution)
	imageS3Dao := extdao.NewImageS3Dao()
	if aiExecution.PromptType == "vision" {
		imageData, err, _ := imageS3Dao.GetImageFromS3(utils.GetAiExecutionInputImagePath(aiExecution.Uid))
		if err != nil {
			node.InputImageBase64 = nil
		} else {
			node.InputImageBase64 = utils.StrPtr(base64.StdEncoding.EncodeToString(imageData))
		}
	}
	if aiExecution.PromptType == "image" {
		imageData, err, _ := imageS3Dao.GetImageFromS3(utils.GetAiExecutionOutputImagePath(aiExecution.Uid))
		if err != nil {
			node.OutputImageBase64 = nil
		} else {
			node.OutputImageBase64 = utils.StrPtr(base64.StdEncoding.EncodeToString(imageData))
		}
	}

	return &model.SimpleResult{
		Ok:   true,
		Node: node,
	}, nil
}

func (s *AdminAiExecutionService) RunAiExecution(ctx context.Context, input model.AiExcutionInput, runBy, runSajuProfileUid *string) (*model.SimpleResult, error) {
	now := time.Now().UnixMilli()
	// 받은 정보를 기반으로 데이터 저장
	inputKV_JSON, errOfInputKV := json.Marshal(input.Inputkvs)
	if errOfInputKV != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to marshal input kvs: %v", errOfInputKV)),
		}, nil
	}
	outputKV_JSON, errOfOutputKV := json.Marshal(input.Outputkvs)
	if errOfOutputKV != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to marshal output kvs: %v", errOfOutputKV)),
		}, nil
	}
	aiExecution := entity.AiExecution{
		Uid:           utils.GenUid(),
		CreatedAt:     now,
		UpdatedAt:     now,
		MetaUid:       input.MetaUID,
		MetaType:      input.MetaType,
		PromptType:    input.PromptType,
		Prompt:        input.Prompt,
		ValuedPrompt:  input.ValuedPrompt,
		IntputKV_JSON: string(inputKV_JSON),
		OutputKV_JSON: string(outputKV_JSON),
		Model:         input.Model,
		OutputText:    "",
		Status:        "running",
		ErrorMessage:  "",
	}
	if runBy != nil {
		aiExecution.RunBy = *runBy
	}
	if runSajuProfileUid != nil {
		aiExecution.RunSajuProfileUid = *runSajuProfileUid
	}
	if input.PromptType == "image" {
		aiExecution.Size = input.Size
	} else {
		aiExecution.Temperature = input.Temperature
		aiExecution.MaxTokens = input.MaxTokens
	}

	if err := s.aiExecutionRepo.Create(&aiExecution); err != nil {
		return nil, fmt.Errorf("failed to create ai execution: %w", err)
	}
	openAiExtDao := extdao.NewOpenAIExtDao()
	imageData := []byte{}
	var err error
	modelType := "text"
	switch input.PromptType {
	case "vision":
		modelType = "vision"
		imageData, err = decodeBase64Image(*input.InputImageBase64)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr(fmt.Sprintf("Failed to decode input image base64: %v", err)),
			}, nil
		}
		imageS3Dao := extdao.NewImageS3Dao()
		err, _ = imageS3Dao.SaveImageToS3(utils.GetAiExecutionInputImagePath(aiExecution.Uid), imageData)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr(fmt.Sprintf("Failed to save image to S3: %v", err)),
			}, nil
		}
	case "image":
		modelType = "image"
	}
	runnedTime := time.Now().UnixMilli()
	result, usage, err := openAiExtDao.Query(ctx, modelType, input.Model, input.ValuedPrompt, float32(input.Temperature), input.MaxTokens, input.Size, imageData)
	if err != nil {
		aiExecution.Status = "failed"
		aiExecution.ErrorMessage = err.Error()
		if err := s.aiExecutionRepo.Update(&aiExecution); err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr(fmt.Sprintf("Failed to update ai execution: %v", err)),
			}, nil
		}
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to run ai execution: %v", err)),
		}, nil
	}
	aiExecution.InputTokens = usage.Input
	aiExecution.OutputTokens = usage.Output
	aiExecution.TotalTokens = usage.Total
	aiExecution.ElapsedTime = int(time.Now().UnixMilli() - runnedTime)

	if input.PromptType == "image" {
		imageData, err = base64.StdEncoding.DecodeString(result)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr(fmt.Sprintf("Failed to decode base64 image: %v", err)),
			}, nil
		}
		imageS3Dao := extdao.NewImageS3Dao()
		err, _ = imageS3Dao.SaveImageToS3(utils.GetAiExecutionOutputImagePath(aiExecution.Uid), imageData)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr(fmt.Sprintf("Failed to save image to S3: %v", err)),
			}, nil
		}
	} else {
		aiExecution.OutputText = result
	}

	aiExecution.Status = "done"

	if err := s.aiExecutionRepo.Update(&aiExecution); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to update ai execution: %v", err)),
		}, nil
	}
	// openAI 수행 - 메타타입에 따라 필요 수행메소드 변경
	// 결과를 데이터베이스에 저장
	// 결과를 반환
	ret := &model.SimpleResult{
		Ok:  true,
		UID: utils.StrPtr(aiExecution.Uid),
		Msg: utils.StrPtr(fmt.Sprintf("Ai execution completed: %v", aiExecution.Uid)),
	}
	if input.PromptType == "image" {
		ret.Base64Value = utils.StrPtr(base64.StdEncoding.EncodeToString(imageData))
	} else {
		ret.Value = utils.StrPtr(aiExecution.OutputText)
	}
	return ret, nil
}
