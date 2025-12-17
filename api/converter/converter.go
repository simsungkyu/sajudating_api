package converter

import (
	"sajudating_api/api/admgql/model"
	"sajudating_api/api/dao/entity"
)

func stringPtr(value string) *string {
	return &value
}

func SajuProfileToModel(profile *entity.SajuProfile) *model.SajuProfile {

	return &model.SajuProfile{
		ID:                      profile.Uid,
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
		ID:        meta.Uid,
		UID:       meta.Uid,
		CreatedAt: meta.CreatedAt,
		UpdatedAt: meta.UpdatedAt,
		MetaType:  meta.MetaType,
		Name:      meta.Name,
		Desc:      meta.Desc,
		Prompt:    meta.Prompt,
	}
}

func AiExecutionToModel(aiExecution *entity.AiExecution) *model.AiExecution {
	return &model.AiExecution{
		ID:          aiExecution.Uid,
		UID:         aiExecution.Uid,
		CreatedAt:   aiExecution.CreatedAt,
		UpdatedAt:   aiExecution.UpdatedAt,
		MetaUID:     aiExecution.MetaUid,
		MetaType:    aiExecution.MetaType,
		Status:      aiExecution.Status,
		Prompt:      aiExecution.Prompt,
		Params:      aiExecution.Params,
		Model:       aiExecution.Model,
		Temperature: aiExecution.Temperature,
		MaxTokens:   aiExecution.MaxTokens,
		Size:        aiExecution.Size,
		OutputText:  stringPtr(aiExecution.OutputText),
		OutputImage: stringPtr(aiExecution.OutputImage),
	}
}

func PhyIdealPartnerToModel(partner *entity.PhyIdealPartner) *model.PhyIdealPartner {
	return &model.PhyIdealPartner{
		ID:               partner.Uid,
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
		SimilarityScore:  partner.SimilarityScore,
	}
}
