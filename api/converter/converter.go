package converter

import (
	"encoding/json"
	"log"
	"sajudating_api/api/admgql/model"
	"sajudating_api/api/dao/entity"
)

func stringPtr(value string) *string {
	return &value
}

func SajuProfileToModel(profile *entity.SajuProfile) *model.SajuProfile {

	return &model.SajuProfile{
		UID:                     profile.Uid,
		CreatedAt:               profile.CreatedAt,
		UpdatedAt:               profile.UpdatedAt,
		Sex:                     profile.Sex,
		Birthdate:               profile.Birthdate,
		Palja:                   profile.Palja,
		Email:                   profile.Email,
		ImageMimeType:           profile.ImageMimeType,
		Nickname:                profile.Nickname,
		SajuSummary:             profile.SajuSummary,
		SajuContent:             profile.SajuContent,
		PhySummary:              profile.PhySummary,
		PhyContent:              profile.PhyContent,
		MyFeatureEyes:           profile.MyFeatureEyes,
		MyFeatureNose:           profile.MyFeatureNose,
		MyFeatureMouth:          profile.MyFeatureMouth,
		MyFeatureFaceShape:      profile.MyFeatureFaceShape,
		MyFeatureNotes:          profile.MyFeatureNotes,
		PartnerEmbeddingText:    profile.GeneratePhyPartnerEmbeddingText(),
		PartnerMatchTips:        profile.PartnerMatchTips,
		PartnerSummary:          profile.PartnerSummary,
		PartnerFeatureEyes:      profile.PartnerFeatureEyes,
		PartnerFeatureNose:      profile.PartnerFeatureNose,
		PartnerFeatureMouth:     profile.PartnerFeatureMouth,
		PartnerFeatureFaceShape: profile.PartnerFeatureFaceShape,
		PartnerPersonalityMatch: profile.PartnerPersonalityMatch,
		PartnerSex:              profile.PartnerSex,
		PartnerAge:              profile.PartnerAge,
		PhyPartnerUID:           profile.PhyPartnerUid,
		PhyPartnerSimilarity:    profile.PhyPartnerSimilarity,
	}
}

func AiMetaToModel(meta *entity.AIMeta) *model.AiMeta {
	return &model.AiMeta{
		UID:         meta.Uid,
		CreatedAt:   meta.CreatedAt,
		UpdatedAt:   meta.UpdatedAt,
		MetaType:    meta.MetaType,
		Name:        meta.Name,
		Desc:        meta.Desc,
		Prompt:      meta.Prompt,
		Model:       meta.Model,
		Temperature: meta.Temperature,
		MaxTokens:   meta.MaxTokens,
		Size:        meta.Size,
		InUse:       meta.InUse,
	}
}

func AiExecutionToModel(aiExecution *entity.AiExecution) *model.AiExecution {
	ret := &model.AiExecution{
		UID:          aiExecution.Uid,
		CreatedAt:    aiExecution.CreatedAt,
		UpdatedAt:    aiExecution.UpdatedAt,
		MetaUID:      aiExecution.MetaUid,
		MetaType:     aiExecution.MetaType,
		Status:       aiExecution.Status,
		Prompt:       aiExecution.Prompt,
		ValuedPrompt: aiExecution.ValuedPrompt,
		Model:        aiExecution.Model,
		Temperature:  aiExecution.Temperature,
		MaxTokens:    aiExecution.MaxTokens,
		Size:         aiExecution.Size,
		ElapsedTime:  aiExecution.ElapsedTime,
		InputTokens:  aiExecution.InputTokens,
		OutputTokens: aiExecution.OutputTokens,
		TotalTokens:  aiExecution.TotalTokens,
		ErrorMessage: aiExecution.ErrorMessage,
	}

	// 실행 정보 설정
	if aiExecution.OutputText != "" {
		ret.OutputText = stringPtr(aiExecution.OutputText)
	}
	// RunBy, RunSajuProfileUID 설정
	if aiExecution.RunBy != "" {
		ret.RunBy = stringPtr(aiExecution.RunBy)
	}
	if aiExecution.RunSajuProfileUid != "" {
		ret.RunSajuProfileUID = stringPtr(aiExecution.RunSajuProfileUid)
	}

	if aiExecution.IntputKV_JSON != "" {
		var inputkvs []*model.Kv
		err := json.Unmarshal([]byte(aiExecution.IntputKV_JSON), &inputkvs)
		if err != nil {
			log.Printf("failed to unmarshal inputkvs: %v", err)
		}
		ret.Inputkvs = inputkvs
	}
	if aiExecution.OutputKV_JSON != "" {
		var outputkvs []*model.Kv
		err := json.Unmarshal([]byte(aiExecution.OutputKV_JSON), &outputkvs)
		if err != nil {
			log.Printf("failed to unmarshal outputkvs: %v", err)
		}
		ret.Outputkvs = outputkvs
	}
	return ret
}

func AdminUserToModel(user *entity.AdminUser) *model.AdminUser {
	id := user.Uid
	return &model.AdminUser{
		ID:        &id,
		UID:       user.Uid,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		Username:  user.Username,
		Email:     user.Email,
		IsActive:  user.IsActive,
	}
}

func PhyIdealPartnerToModel(partner *entity.PhyIdealPartner) *model.PhyIdealPartner {
	return &model.PhyIdealPartner{
		UID:              partner.Uid,
		CreatedAt:        partner.CreatedAt,
		UpdatedAt:        partner.UpdatedAt,
		Summary:          partner.Summary,
		FeatureEyes:      partner.FeatureEyes,
		FeatureNose:      partner.FeatureNose,
		FeatureMouth:     partner.FeatureMouth,
		FeatureFaceShape: partner.FeatureFaceShape,
		PersonalityMatch: partner.PersonalityMatch,
		Sex:              partner.Sex,
		Age:              partner.Age,
		EmbeddingModel:   partner.EmbeddingModel,
		EmbeddingText:    partner.EmbeddingText,
		SimilarityScore:  partner.SimilarityScore,
		HasImage:         partner.HasImage,
	}
}

func LocalLogToModel(log *entity.LocalLog) *model.LocalLog {
	return &model.LocalLog{
		UID:       log.Uid,
		CreatedAt: log.CreatedAt,
		ExpiresAt: log.ExpiresAt,
		Status:    log.Status,
		Text:      log.Text,
	}
}

func ItemNCardToModel(card *entity.ItemNCard) *model.ItemNCard {
	id := card.Uid
	return &model.ItemNCard{
		ID:            &id,
		UID:           card.Uid,
		CardID:        card.CardID,
		Version:       card.Version,
		Status:        card.Status,
		RuleSet:       card.RuleSet,
		Scope:         card.Scope,
		Title:         card.Title,
		Category:      card.Category,
		Tags:          card.Tags,
		Domains:       card.Domains,
		Priority:      card.Priority,
		TriggerJSON:   card.TriggerJSON,
		ScoreJSON:     card.ScoreJSON,
		ContentJSON:   card.ContentJSON,
		CooldownGroup: card.CooldownGroup,
		MaxPerUser:    card.MaxPerUser,
		DebugJSON:     card.DebugJSON,
		DeletedAt:     card.DeletedAt,
		CreatedAt:     card.CreatedAt,
		UpdatedAt:     card.UpdatedAt,
	}
}
