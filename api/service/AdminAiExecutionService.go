package service

import (
	"context"
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
	executions, total, err := s.aiExecutionRepo.FindWithPagination(input.Limit, input.Offset, input.MetaUID, input.MetaType)
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

	return &model.SimpleResult{
		Ok:   true,
		Node: converter.AiExecutionToModel(aiExecution),
	}, nil
}

func (s *AdminAiExecutionService) RunAiExecution(ctx context.Context, input model.AiExcutionInput) (*model.SimpleResult, error) {
	now := time.Now().UnixMilli()
	// 받은 정보를 기반으로 데이터 저장
	aiExecution := entity.AiExecution{
		Uid:          utils.GenUid(),
		CreatedAt:    now,
		UpdatedAt:    now,
		MetaUid:      input.MetaUID,
		MetaType:     input.MetaType,
		Prompt:       input.Prompt,
		Params:       input.Params,
		Model:        input.Model,
		Temperature:  input.Temperature,
		MaxTokens:    input.MaxTokens,
		Size:         input.Size,
		OutputText:   "",
		OutputImage:  "",
		Status:       "running",
		ErrorMessage: "",
	}

	if err := s.aiExecutionRepo.Create(&aiExecution); err != nil {
		return nil, fmt.Errorf("failed to create ai execution: %w", err)
	}
	openAiExtDao := extdao.NewOpenAIExtDao()
	result, err := openAiExtDao.Query(ctx, input.Model, input.Prompt, float32(input.Temperature), input.MaxTokens, "1024x1024")
	if err != nil {
		aiExecution.Status = "failed"
		aiExecution.ErrorMessage = err.Error()
		if err := s.aiExecutionRepo.Update(&aiExecution); err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(fmt.Sprintf("Failed to update ai execution: %v", err)),
			}, nil
		}
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to run ai execution: %v", err)),
		}, nil
	}

	if input.MetaType == "IdealPartnerImage" {
		aiExecution.OutputImage = result
	} else {
		aiExecution.OutputText = result
	}
	if err := s.aiExecutionRepo.Update(&aiExecution); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to update ai execution: %v", err)),
		}, nil
	}
	// openAI 수행 - 메타타입에 따라 필요 수행메소드 변경
	// 결과를 데이터베이스에 저장
	// 결과를 반환
	return &model.SimpleResult{
		Ok:  true,
		UID: utils.StrPtr(aiExecution.Uid),
		Msg: utils.StrPtr(fmt.Sprintf("Ai execution completed: %v", aiExecution.Uid)),
	}, nil
}
