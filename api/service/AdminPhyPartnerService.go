package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	"sajudating_api/api/dto"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/utils"
)

type AdminPhyPartnerService struct {
	phyPartnerRepo *dao.PhyIdealPartnerRepository
}

func NewAdminPhyPartnerService() *AdminPhyPartnerService {
	return &AdminPhyPartnerService{
		phyPartnerRepo: dao.NewPhyIdealPartnerRepository(),
	}
}

// GetAllPhyPartners retrieves all phy partners
func (s *AdminPhyPartnerService) GetAllPhyPartners(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	partners, err := s.phyPartnerRepo.FindAll()
	if err != nil {
		log.Printf("Failed to get phy partners: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve phy partners")
		return
	}

	var partnerResponses []dto.PhyPartnerResponse
	for _, partner := range partners {
		partnerResponses = append(partnerResponses, dto.PhyPartnerResponse{
			Uid:              partner.Uid,
			Summary:          partner.Summary,
			FeatureEyes:      partner.FeatureEyes,
			FeatureNose:      partner.FeatureNose,
			FeatureMouth:     partner.FeatureMouth,
			FeatureFaceShape: partner.FeatureFaceShape,
			PersonalityMatch: partner.PersonalityMatch,
			Sex:              partner.Sex,
			Age:              partner.Age,
			ImageMimeType:    partner.ImageMimeType,
			HasImage:         partner.HasImage,
			CreatedAt:        partner.CreatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.SuccessResponse{
		Message: "Phy partners retrieved successfully",
		Data:    partnerResponses,
	})
}

func (s *AdminPhyPartnerService) GetPhyPartner(ctx context.Context, uid string) (*model.SimpleResult, error) {
	partner, err := s.phyPartnerRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Phy partner not found: %v", err)),
		}, nil
	}

	return &model.SimpleResult{
		Ok:   true,
		Node: converter.PhyIdealPartnerToModel(partner),
	}, nil
}

// GetPhyPartner retrieves a specific phy partner by UID
func (s *AdminPhyPartnerService) GetPhyPartnerWeb(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	uid := pathParts[len(pathParts)-1]
	partner, err := s.phyPartnerRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Phy partner not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Phy partner not found")
		return
	}

	partnerResponse := dto.PhyPartnerResponse{
		Uid:              partner.Uid,
		Summary:          partner.Summary,
		FeatureEyes:      partner.FeatureEyes,
		FeatureNose:      partner.FeatureNose,
		FeatureMouth:     partner.FeatureMouth,
		FeatureFaceShape: partner.FeatureFaceShape,
		PersonalityMatch: partner.PersonalityMatch,
		Sex:              partner.Sex,
		Age:              partner.Age,
		ImageMimeType:    partner.ImageMimeType,
		HasImage:         partner.HasImage,
		CreatedAt:        partner.CreatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.SuccessResponse{
		Message: "Phy partner retrieved successfully",
		Data:    partnerResponse,
	})
}

// DeletePhyPartner deletes a phy partner by UID
func (s *AdminPhyPartnerService) DeletePhyPartner(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		utils.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	uid := pathParts[len(pathParts)-1]
	if uid == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "UID is required")
		return
	}

	// Check if the partner exists
	_, err := s.phyPartnerRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Phy partner not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Phy partner not found")
		return
	}

	// Delete the partner
	if err := s.phyPartnerRepo.Delete(uid); err != nil {
		log.Printf("Failed to delete phy partner: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete phy partner")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.SuccessResponse{
		Message: "Phy partner deleted successfully",
		Data: map[string]string{
			"uid": uid,
		},
	})
}

func (s *AdminPhyPartnerService) GetPhyPartners(ctx context.Context, input model.PhyIdealPartnerSearchInput) (*model.SimpleResult, error) {
	partners, total, err := s.phyPartnerRepo.FindWithPagination(input.Limit, input.Offset, input.Sex, input.HasImage)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve phy ideal partners: %v", err)),
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
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(input.Offset),
	}, nil
}

func (s *AdminPhyPartnerService) DeletePhyPartnerGql(ctx context.Context, uid string) (*model.SimpleResult, error) {
	if strings.TrimSpace(uid) == "" {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr("uid is required"),
		}, nil
	}

	_, err := s.phyPartnerRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Phy ideal partner not found: %v", err)),
		}, nil
	}

	if err := s.phyPartnerRepo.Delete(uid); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to delete phy ideal partner: %v", err)),
		}, nil
	}

	return &model.SimpleResult{
		Ok:  true,
		UID: &uid,
	}, nil
}

func (s *AdminPhyPartnerService) CreatePhyPartnerGql(ctx context.Context, input model.PhyIdealPartnerCreateInput) (*model.SimpleResult, error) {
	if strings.TrimSpace(input.Summary) == "" || strings.TrimSpace(input.Sex) == "" {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr("summary and sex are required"),
		}, nil
	}

	now := time.Now().UnixMilli()
	partner := &entity.PhyIdealPartner{
		Uid:              utils.GenUid(),
		CreatedAt:        now,
		UpdatedAt:        now,
		CreatedBy:        "Admin",
		Summary:          input.Summary,
		FeatureEyes:      input.FeatureEyes,
		FeatureNose:      input.FeatureNose,
		FeatureMouth:     input.FeatureMouth,
		FeatureFaceShape: input.FeatureFaceShape,
		PersonalityMatch: input.PersonalityMatch,
		Sex:              input.Sex,
		Age:              input.Age,
	}

	if err := s.phyPartnerRepo.Create(partner); err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to create phy ideal partner: %v", err)),
		}, nil
	}

	// 이미지 저장 및 처리
	if input.Image != nil && strings.TrimSpace(*input.Image) != "" {
		imageData, err := decodeBase64Image(*input.Image)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(err.Error()),
			}, nil
		}
		imageMimeType := http.DetectContentType(imageData)
		imageS3Dao := extdao.NewImageS3Dao()
		err, _ = imageS3Dao.SaveImageToS3(utils.GetPhyPartnerImagePath(partner.Uid), imageData)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(fmt.Sprintf("Failed to save image to S3: %v", err)),
			}, nil
		}
		err = s.phyPartnerRepo.UpdateImageMimeType(partner.Uid, imageMimeType)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Msg: utils.StrPtr(fmt.Sprintf("Failed to update phy partner image mime type: %v", err)),
			}, nil
		}
	}

	return &model.SimpleResult{
		Ok:   true,
		UID:  &partner.Uid,
		Node: converter.PhyIdealPartnerToModel(partner),
	}, nil
}

func (s *AdminPhyPartnerService) GetPhyPartnerImage(ctx context.Context, uid string) (string, error) {
	if strings.TrimSpace(uid) == "" {
		return "", fmt.Errorf("uid is required")
	}
	imageS3Dao := extdao.NewImageS3Dao()
	imageData, err, statusCode := imageS3Dao.GetImageFromS3(utils.GetPhyPartnerImagePath(uid))
	if err != nil {
		if statusCode == 404 {
			return "", nil
		}
		log.Printf("Failed to get image from S3: %v (status code: %d)", err, statusCode)
		return "", err
	}
	return base64.StdEncoding.EncodeToString(imageData), nil
}
