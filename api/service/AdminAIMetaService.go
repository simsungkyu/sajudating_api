package service

import (
	"context"
	"fmt"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	"sajudating_api/api/utils"
)

type AdminAIMetaService struct {
	aimetaRepo *dao.AIMetaRepository
}

func NewAdminAIMetaService() *AdminAIMetaService {
	return &AdminAIMetaService{
		aimetaRepo: dao.NewAIMetaRepository(),
	}
}

func (s *AdminAIMetaService) PutAiMeta(ctx context.Context, input model.AiMetaInput) (*model.SimpleResult, error) {
	var meta *entity.AIMeta
	var err error

	// If UID is provided, update existing meta; otherwise, create new one
	if input.UID != nil && *input.UID != "" {
		// Update existing meta
		meta, err = s.aimetaRepo.FindByUID(*input.UID)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(fmt.Sprintf("AI Meta not found: %v", err)),
			}, nil
		}

		meta.Name = input.Name
		meta.Desc = input.Desc
		meta.Prompt = input.Prompt
		if input.MetaType != nil {
			meta.MetaType = *input.MetaType
		}

		if err := s.aimetaRepo.Update(meta); err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(fmt.Sprintf("Failed to update AI Meta: %v", err)),
			}, nil
		}
	} else {
		// Create new meta
		uid := utils.GenUid()
		metaType := ""
		if input.MetaType != nil {
			metaType = *input.MetaType
		}

		meta = &entity.AIMeta{
			Uid:      uid,
			Name:     input.Name,
			Desc:     input.Desc,
			Prompt:   input.Prompt,
			MetaType: metaType,
		}

		if err := s.aimetaRepo.Create(meta); err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(fmt.Sprintf("Failed to create AI Meta: %v", err)),
			}, nil
		}
	}

	return &model.SimpleResult{
		Ok:  true,
		UID: &meta.Uid,
	}, nil
}

func (s *AdminAIMetaService) DelAiMeta(ctx context.Context, uid string) (*model.SimpleResult, error) {
	// Check if the meta exists
	_, err := s.aimetaRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("AI Meta not found: %v", err)),
		}, nil
	}

	// Delete the meta
	if err := s.aimetaRepo.Delete(uid); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to delete AI Meta: %v", err)),
		}, nil
	}

	return &model.SimpleResult{Ok: true}, nil
}

func (s *AdminAIMetaService) SetAiMetaDefault(ctx context.Context, uid string) (*model.SimpleResult, error) {
	// Check if the meta exists
	meta, err := s.aimetaRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("AI Meta not found: %v", err)),
		}, nil
	}

	// For now, just return success. In the future, you might want to add a "is_default" field
	// to the AIMeta entity and update it here.
	return &model.SimpleResult{
		Ok:  true,
		UID: &meta.Uid,
	}, nil
}

func (s *AdminAIMetaService) GetAiMetas(ctx context.Context, input model.AiMetaSearchInput) (*model.SimpleResult, error) {
	metas, total, err := s.aimetaRepo.FindWithPagination(input.Limit, input.Offset, input.MetaType)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve AI Metas: %v", err)),
		}, nil
	}

	nodes := make([]model.Node, len(metas))
	for i, meta := range metas {
		nodes[i] = converter.AiMetaToModel(&meta)
	}

	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(input.Offset),
	}, nil
}

func (s *AdminAIMetaService) GetAiMeta(ctx context.Context, uid string) (*model.SimpleResult, error) {
	meta, err := s.aimetaRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("AI Meta not found: %v", err)),
		}, nil
	}

	return &model.SimpleResult{
		Ok:   true,
		Node: converter.AiMetaToModel(meta),
	}, nil
}
