package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/utils"
)

type AdminSajuProfileService struct {
	sajuRepo           *dao.SajuProfileRepository
	sajuProfileLogRepo *dao.SajuProfileLogRepository
}

func NewAdminSajuProfileService() *AdminSajuProfileService {
	return &AdminSajuProfileService{
		sajuRepo:           dao.NewSajuProfileRepository(),
		sajuProfileLogRepo: dao.NewSajuProfileLogRepository(),
	}
}

// GetSajuProfile retrieves a specific saju profile by UID
func (s *AdminSajuProfileService) GetSajuProfile(ctx context.Context, uid string) (*model.SimpleResult, error) {
	profile, err := s.sajuRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Saju profile not found: %v", err)),
		}, nil
	}

	return &model.SimpleResult{
		Ok:   true,
		Node: converter.SajuProfileToModel(profile),
	}, nil
}

func (s *AdminSajuProfileService) GetSajuProfiles(ctx context.Context, input model.SajuProfileSearchInput) (*model.SimpleResult, error) {
	profiles, total, err := s.sajuRepo.FindWithPagination(input.Limit, input.Offset, input.OrderBy, input.OrderDirection)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve saju profiles: %v", err)),
		}, nil
	}

	nodes := make([]model.Node, len(profiles))
	for i := range profiles {
		nodes[i] = converter.SajuProfileToModel(&profiles[i])
	}

	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(input.Offset),
	}, nil
}

func (s *AdminSajuProfileService) DeleteSajuProfileGql(ctx context.Context, uid string) (*model.SimpleResult, error) {
	if strings.TrimSpace(uid) == "" {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr("uid is required"),
		}, nil
	}

	_, err := s.sajuRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Saju profile not found: %v", err)),
		}, nil
	}

	if err := s.sajuRepo.Delete(uid); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to delete saju profile: %v", err)),
		}, nil
	}

	return &model.SimpleResult{
		Ok:  true,
		UID: &uid,
	}, nil
}

func (s *AdminSajuProfileService) CreateSajuProfileGql(ctx context.Context, input model.SajuProfileCreateInput) (*model.SimpleResult, error) {
	if strings.TrimSpace(input.Birthdate) == "" || strings.TrimSpace(input.Sex) == "" {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr("birthdate and sex are required"),
		}, nil
	}

	imageData, err := decodeBase64Image(input.Image)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(err.Error()),
		}, nil
	}

	now := time.Now().UnixMilli()
	profile := &entity.SajuProfile{
		Uid:           utils.GenUid(),
		CreatedAt:     now,
		UpdatedAt:     now,
		Sex:           input.Sex,
		Birthdate:     input.Birthdate,
		ImageMimeType: http.DetectContentType(imageData),
		Status:        "initiate",
	}

	if err := s.sajuRepo.Create(profile); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to create saju profile: %v", err)),
		}, nil
	}

	// Save image to S3
	imageS3Dao := extdao.NewImageS3Dao()
	imagePath := utils.GetSajuProfileImagePath(profile.Uid)
	err, _ = imageS3Dao.SaveImageToS3(imagePath, imageData)
	if err != nil {
		log.Printf("Failed to save image to S3: %v", err)
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to save image to S3: %v", err)),
		}, nil
	}

	return &model.SimpleResult{
		Ok:   true,
		UID:  &profile.Uid,
		Node: converter.SajuProfileToModel(profile),
	}, nil
}

// GetSajuProfileSimilarPartners retrieves similar partners for a specific saju profile
func (s *AdminSajuProfileService) GetSajuProfileSimilarPartners(ctx context.Context, uid string, limit int, offset int) (*model.SimpleResult, error) {
	if strings.TrimSpace(uid) == "" {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr("uid is required"),
		}, nil
	}

	sajuProfile, err := s.sajuRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Saju profile not found: %v", err)),
		}, nil
	}
	embeddingText := sajuProfile.GeneratePhyPartnerEmbeddingText()
	openaiDao := extdao.NewOpenAIExtDao()
	embedding, err := openaiDao.CreateEmbedding(context.Background(), "", embeddingText)
	if err != nil {
		log.Printf("Failed to create embedding: %v", err)
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to create embedding: %v", err.Error())),
		}, nil
	}
	partnerSex := sajuProfile.PartnerSex
	embeddingVector := utils.ConvertFloat32ToFloat64(embedding)
	partners, total, err := dao.NewPhyIdealPartnerRepository().FindSimilarByEmbeddingWithPagination(
		embeddingVector, limit, offset, partnerSex)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve similar partners: %v", err)),
		}, nil
	}

	nodes := make([]model.Node, len(partners))
	for i := range partners {
		nodes[i] = converter.PhyIdealPartnerToModel(&partners[i])
	}

	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(limit),
		Offset: utils.IntPtr(offset),
	}, nil
}

func (s *AdminSajuProfileService) GetSajuProfileImage(ctx context.Context, uid string) (string, error) {
	if strings.TrimSpace(uid) == "" {
		return "", fmt.Errorf("uid is required")
	}
	imageS3Dao := extdao.NewImageS3Dao()
	imageData, err, statusCode := imageS3Dao.GetImageFromS3(utils.GetSajuProfileImagePath(uid))
	if err != nil {
		if statusCode == 404 {
			return "", nil
		}
		log.Printf("Failed to get image from S3: %v (status code: %d)", err, statusCode)
		return "", err
	}
	return base64.StdEncoding.EncodeToString(imageData), nil
}

// Load Saju Profile Logs
func (s *AdminSajuProfileService) GetSajuProfileLogs(ctx context.Context, input model.SajuProfileLogSearchInput) (*model.SimpleResult, error) {
	logs, total, err := s.sajuProfileLogRepo.FindWithPagination(input.Limit, input.Offset, input.SajuUID, input.Status)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve saju profile logs: %v", err)),
		}, nil
	}
	nodes := []model.Node{}
	for _, log := range logs {
		nodes = append(nodes, model.SajuProfileLog{
			UID:       log.Uid,
			CreatedAt: log.CreatedAt,
			SajuUID:   log.SajuUid,
			Status:    log.Status,
			Text:      log.Text,
		})
	}
	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(input.Offset),
	}, nil
}
