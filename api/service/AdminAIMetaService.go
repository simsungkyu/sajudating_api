package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	extdao "sajudating_api/api/ext_dao"
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
		meta.Model = input.Model
		meta.Temperature = input.Temperature
		meta.MaxTokens = input.MaxTokens
		meta.Size = input.Size
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
			Uid:         uid,
			Name:        input.Name,
			Desc:        input.Desc,
			Prompt:      input.Prompt,
			MetaType:    metaType,
			Model:       input.Model,
			Temperature: input.Temperature,
			MaxTokens:   input.MaxTokens,
			Size:        input.Size,
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
	metas, total, err := s.aimetaRepo.FindWithPagination(input.Limit, input.Offset, input.MetaType, input.InUse)
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

func (s *AdminAIMetaService) GetAiMetaKVs(ctx context.Context, input model.AiMetaKVsInput) (*model.SimpleResult, error) {
	// 입력된 메타 값에 따른 결과물 출력?
	inputValues := make(map[string]string)
	for _, kv := range input.Kvs {
		inputValues[kv.K] = kv.V
	}

	ret := GetAiMetaValues(input.Type, inputValues)
	kvs := []*model.Kv{}
	for k, v := range ret {
		kvs = append(kvs, &model.Kv{K: k, V: v})
	}

	return &model.SimpleResult{Ok: true, Kvs: kvs}, nil
}

func (s *AdminAIMetaService) GetAiMetaTypes(ctx context.Context) (*model.SimpleResult, error) {
	metaTypes := []model.Node{}

	metaTypes = append(metaTypes, model.AiMetaType{
		ID:             "saju",
		Type:           "Saju",
		InputFields:    []string{"sex", "birthdate"},
		OutputFields:   []string{"partner_sex", "palja", "age"},
		HasInputImage:  false,
		HasOutputImage: false,
	})

	metaTypes = append(metaTypes, model.AiMetaType{
		ID:             "face_feature",
		Type:           "FaceFeature",
		InputFields:    []string{"sex", "birthdate"},
		OutputFields:   []string{"partner_sex", "palja", "age"},
		HasInputImage:  true,
		HasOutputImage: false,
	})

	metaTypes = append(metaTypes, model.AiMetaType{
		ID:   "phy",
		Type: "Phy",
		InputFields: []string{"sex", "birthdate",
			"phy_features_json"},
		OutputFields: []string{
			"partner_sex", "palja", "age", // gen by sex, birthdate
		},
		HasInputImage:  false,
		HasOutputImage: false,
	})

	metaTypes = append(metaTypes, model.AiMetaType{
		ID:   "ideal_partner_image_male",
		Type: "IdealPartnerImageMale",
		InputFields: []string{"sex", "birthdate",
			"partner_age", "partner_eyes", "partner_nose", "partner_mouth", "partner_face_shape"},
		OutputFields: []string{
			"partner_sex", "palja", "age", // gen by sex, birthdate
		},
		HasInputImage:  false,
		HasOutputImage: true,
	})

	metaTypes = append(metaTypes, model.AiMetaType{
		ID:   "ideal_partner_image_female",
		Type: "IdealPartnerImageFemale",
		InputFields: []string{"sex", "birthdate",
			"partner_age", "partner_eyes", "partner_nose", "partner_mouth", "partner_face_shape"},
		OutputFields: []string{
			"partner_sex", "palja", "age", // gen by sex, birthdate
		},
		HasInputImage:  false,
		HasOutputImage: true,
	})

	return &model.SimpleResult{Ok: true, Nodes: metaTypes}, nil
}

func GetAiMetaValues(metaType string, inputValues map[string]string) map[string]string {
	ret := make(map[string]string)

	for k, v := range inputValues {
		ret[k] = v
	}

	// 성별에 따른 기본값
	ret["sex"] = "male"
	ret["partner_sex"] = "female"
	if inputValues["sex"] == "female" {
		ret["sex"] = "female"
		ret["partner_sex"] = "male"
	}

	// 생년월일에 따른 기본값
	ret["birthdate"] = inputValues["birthdate"]
	ret["age"] = "0"
	if len(ret["birthdate"]) >= 8 {
		ret["age"] = utils.GetAgeFromBirthdate(ret["birthdate"])
		palja, err := extdao.GenPalja(ret["birthdate"], "Asia/Seoul")
		if err != nil {
			log.Printf("Failed to generate palja: %v", err)
			return ret
		}
		if palja == nil {
			log.Printf("Failed to generate palja: empty result")
			return ret
		}
		ret["palja"] = palja.GetPaljaKorean()
		ret["palja_tenstems"] = utils.CalculateTenStems(ret["palja"])
		ret["palja_YT"] = utils.TG_ARRAY[palja.Pillars.Year.Tg]
		ret["palja_TB"] = utils.DZ_ARRAY[palja.Pillars.Year.Dz]
		ret["palja_MT"] = utils.TG_ARRAY[palja.Pillars.Month.Tg]
		ret["palja_MB"] = utils.DZ_ARRAY[palja.Pillars.Month.Dz]
		ret["palja_DT"] = utils.TG_ARRAY[palja.Pillars.Day.Tg]
		ret["palja_DB"] = utils.DZ_ARRAY[palja.Pillars.Day.Dz]
		if palja.Pillars.Hour != nil {
			ret["palja_HT"] = utils.TG_ARRAY[palja.Pillars.Hour.Tg]
			ret["palja_HB"] = utils.DZ_ARRAY[palja.Pillars.Hour.Dz]
		}
		tenstemsArray := strings.Split(ret["palja_tenstems"], " ")
		if len(tenstemsArray) >= 6 {
			ret["palja_YT10"] = tenstemsArray[0]
			ret["palja_TB10"] = tenstemsArray[1]
			ret["palja_MT10"] = tenstemsArray[2]
			ret["palja_MB10"] = tenstemsArray[3]
			ret["palja_DT10"] = tenstemsArray[4]
			ret["palja_DB10"] = tenstemsArray[5]
		}
		if palja.Pillars.Hour != nil && len(tenstemsArray) >= 8 {
			ret["palja_HT10"] = tenstemsArray[6]
			ret["palja_HB10"] = tenstemsArray[7]
		}
	}

	return ret
}

func (s *AdminAIMetaService) SetAiMetaInUse(ctx context.Context, uid string) (*model.SimpleResult, error) {
	// Check if the meta exists
	meta, err := s.aimetaRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("AI Meta not found: %v", err)),
		}, nil
	}

	if err := s.aimetaRepo.UpdateNotInUseByMetaType(meta.MetaType, uid); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to update AI Meta: %v", err)),
		}, nil
	}

	if err := s.aimetaRepo.UpdateInUse(uid); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to update AI Meta: %v", err)),
		}, nil
	}

	return &model.SimpleResult{Ok: true}, nil
}
