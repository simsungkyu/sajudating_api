// SajuProfileService provides business logic for saju profile operations including creation, retrieval, and analysis.
package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	extdao "sajudating_api/api/ext_dao"
	"sajudating_api/api/types"
	"sajudating_api/api/utils"

	"github.com/go-chi/chi/v5"
)

type SajuProfileService struct {
	sajuProfileRepo     *dao.SajuProfileRepository
	phyIdealPartnerRepo *dao.PhyIdealPartnerRepository
	sajuProfileLogRepo  *dao.SajuProfileLogRepository
}

func NewSajuProfileService() *SajuProfileService {
	return &SajuProfileService{
		sajuProfileRepo:     dao.NewSajuProfileRepository(),
		phyIdealPartnerRepo: dao.NewPhyIdealPartnerRepository(),
		sajuProfileLogRepo:  dao.NewSajuProfileLogRepository(),
	}
}

// Create Saju Profile Log
func (s *SajuProfileService) log(uid string, status string, text string) error {
	uuid := utils.GenUid()
	log.Printf("[SajuLog-%s|%s] %s", uuid, status, text)
	log := &entity.SajuProfileLog{
		Uid:     uuid,
		SajuUid: uid,
		Status:  status,
		Text:    text,
	}
	return s.sajuProfileLogRepo.Create(log)
}

// POST /api/saju_profile
// 프로필 생성 직후 리턴, 내부 추론 과정은 별도 스레드로 처리
func (s *SajuProfileService) CreateSajuProfile(w http.ResponseWriter, r *http.Request) {
	profileUid := utils.GenUid()
	s.log(profileUid, "info", fmt.Sprintf("[CreateSajuProfile] Request started - Method: %s, URL: %s", r.Method, r.URL.Path))

	s.log(profileUid, "info", "[CreateSajuProfile] Parsing multipart form (max size: 10MB)")
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		s.log(profileUid, "error", fmt.Sprintf("[CreateSajuProfile] Failed to parse form data: %v", err))
		utils.RespondWithError(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}
	s.log(profileUid, "info", "[CreateSajuProfile] Form data parsed successfully")

	birthdate := r.FormValue("birthdate")
	sex := r.FormValue("sex")
	s.log(profileUid, "info", fmt.Sprintf("[CreateSajuProfile] Extracted form values - Birthdate: %s, Sex: %s", birthdate, sex))

	if birthdate == "" || sex == "" {
		s.log(profileUid, "error", fmt.Sprintf("[CreateSajuProfile] Validation failed - missing required fields (birthdate: %s, sex: %s)", birthdate, sex))
		utils.RespondWithError(w, http.StatusBadRequest, "Birthdate and sex are required")
		return
	}

	profile := &entity.SajuProfile{
		Uid:       profileUid,
		Birthdate: birthdate,
		Sex:       sex,
	}

	imageS3Dao := extdao.NewImageS3Dao()

	// 이미지 처리
	file, header, err := r.FormFile("image")
	if err != nil {
		s.log(profileUid, "error", fmt.Sprintf("[CreateSajuProfile] No image file provided: %v", err))
		utils.RespondWithError(w, http.StatusBadRequest, "No image file provided")
		return
	}
	s.log(profileUid, "info", fmt.Sprintf("[CreateSajuProfile] Image file found - Filename: %s, Content-Type: %s", header.Filename, header.Header.Get("Content-Type")))
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		s.log(profileUid, "error", fmt.Sprintf("[CreateSajuProfile] Failed to read image file: %v", err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to read image")
		return
	}

	// 이미지를 S3에 저장
	imagePath := utils.GetSajuProfileImagePath(profileUid)
	err, _ = imageS3Dao.SaveImageToS3(imagePath, imageData)
	if err != nil {
		s.log(profileUid, "error", fmt.Sprintf("[CreateSajuProfile] Failed to save image to S3: %v", err))
		// utils.RespondWithError(w, http.StatusInternalServerError, "Failed to save image to S3")
		// return
	}

	// profile.ImageData = imageData
	profile.ImageMimeType = header.Header.Get("Content-Type")
	s.log(profileUid, "info", fmt.Sprintf("[CreateSajuProfile] Image processed successfully - Size: %d bytes, MimeType: %s", len(imageData), profile.ImageMimeType))

	// 팔자 생성
	paljaResult, err := extdao.GenPalja(profile.Birthdate, "") // 빈 문자열 = 기본값 Asia/Seoul 사용
	if err != nil {
		s.log(profileUid, "error", fmt.Sprintf("[GenPalja] Failed to call sxtwl: %v", err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to call sxtwl")
		return
	}
	profile.Palja = paljaResult.GetPalja()

	// Save profile initiated
	if err := s.sajuProfileRepo.Create(profile); err != nil {
		s.log(profileUid, "error", fmt.Sprintf("[CreateSajuProfile] Failed to create saju profile: %v", err))
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create saju profile")
		return
	}

	go func(uid string, birthdate string, sex string, palja string) {
		response, err := s.RequestSaju(uid, birthdate, sex, palja)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[RequestSaju] Failed to request saju: %v", err))
			return
		}
		err = s.sajuProfileRepo.UpdateSajuSummary(uid, response.Summary, response.Content, response.Nickname, response.PartnerTips)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[updateSajuSummary] Failed to update saju profile: %v", err))
			return
		}

	}(profile.Uid, profile.Birthdate, profile.Sex, profile.Palja)

	// request phy analysis
	base64Image := base64.StdEncoding.EncodeToString(imageData)
	go func(uid, base64Image, sex, birthdate string) {
		faceFeatures, phyAnalysisResponse, phyPartnerUid, err := s.RequestPhy(uid, base64Image, profile.Sex, profile.Birthdate)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[CreateSajuProfile] Failed to request phy analysis: %v", err))
			s.sajuProfileRepo.UpdateStatus(uid, utils.StrPtr("error"), nil, nil, nil)
			return
		}
		sajuProfile, err := dao.NewSajuProfileRepository().FindByUID(uid)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[CreateSajuProfile] Saju profile not found: %v", err))
			return
		}

		sajuProfile.PhySummary = phyAnalysisResponse.Summary
		sajuProfile.PhyContent = phyAnalysisResponse.Content
		sajuProfile.MyFeatureEyes = faceFeatures.Eyes.ToString()
		sajuProfile.MyFeatureNose = faceFeatures.Nose.ToString()
		sajuProfile.MyFeatureMouth = faceFeatures.Mouth.ToString()
		sajuProfile.MyFeatureFaceShape = faceFeatures.FaceShape
		sajuProfile.MyFeatureNotes = faceFeatures.Notes
		sajuProfile.PartnerSummary = phyAnalysisResponse.IdealPartnerPhysiognomy.PartnerSummary
		sajuProfile.PartnerFeatureEyes = phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.Eyes.ToString()
		sajuProfile.PartnerFeatureNose = phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.Nose.ToString()
		sajuProfile.PartnerFeatureMouth = phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.Mouth.ToString()
		sajuProfile.PartnerFeatureFaceShape = phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.FaceShape
		sajuProfile.PartnerPersonalityMatch = phyAnalysisResponse.IdealPartnerPhysiognomy.PersonalityMatch
		sajuProfile.PartnerSex = "male"
		if sex == "male" {
			sajuProfile.PartnerSex = "female"
		}
		sajuProfile.PartnerAge = phyAnalysisResponse.GetPartnerAge()
		sajuProfile.PhyPartnerUid = phyPartnerUid
		sajuProfile.UpdatedAt = time.Now().UnixMilli()
		dao.NewSajuProfileRepository().Update(sajuProfile)
	}(profile.Uid, base64Image, profile.Sex, profile.Birthdate)

	result := types.SajuProfile{
		Uid:            profile.Uid,
		Palja:          profile.Palja,
		PaljaHanja:     utils.ConvertPaljaToWithHanja(profile.Palja),
		PaljaMainShape: utils.GetImageSentenceOfIlju(profile.Palja),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(types.APIResponse[types.SajuProfile]{
		Data: result,
	})
	s.log(profileUid, "success", fmt.Sprintf("[CreateSajuProfile] Request completed successfully - UID: %s", profile.Uid))
}

// GET /api/saju_profile/:uid
func (s *SajuProfileService) GetSajuProfile(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")
	hasAllResult := true
	profile, err := s.sajuProfileRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Saju profile not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Saju profile not found")
		return
	}

	imageS3Dao := extdao.NewImageS3Dao()
	imageData, err, _ := imageS3Dao.GetImageFromS3(fmt.Sprintf("saju_profile/%s", uid))
	if err != nil {
		log.Printf("Failed to get image from S3: %v", err)
		imageData = []byte{}
	}
	imageBase64 := base64.StdEncoding.EncodeToString(imageData)

	partnerImageBase64 := ""
	if profile.PhyPartnerUid != "" {
		partnerImageData, err, _ := imageS3Dao.GetImageFromS3(utils.GetPhyPartnerImagePath(profile.PhyPartnerUid))
		if err != nil {
			log.Printf("Failed to get partner image from S3: %v", err)
			partnerImageData = []byte{}
		}
		partnerImageBase64 = base64.StdEncoding.EncodeToString(partnerImageData)
	}

	data := types.SajuProfile{
		Uid: profile.Uid,
		// input
		Birthdate:      profile.Birthdate,
		Sex:            profile.Sex,
		Image:          imageBase64,
		Palja:          profile.Palja,
		PaljaHanja:     utils.ConvertPaljaToWithHanja(profile.Palja),
		PaljaMainShape: utils.GetImageSentenceOfIlju(profile.Palja),
		// result
		PartnerImage: partnerImageBase64,
		Nickname:     profile.Nickname,
		Status:       types.SajuStatus(profile.Status),
		Saju: types.SajuContent{
			Summary:     profile.SajuSummary,
			Content:     profile.SajuContent,
			PartnerTips: profile.PartnerMatchTips,
		},
		Kwansang: types.KwansangContent{
			Summary:         profile.PhySummary,
			Content:         profile.PhyContent,
			Partner_summary: profile.PartnerSummary,
		},
	}

	if data.PartnerImage == "" || data.Saju.Summary == "" || data.Kwansang.Summary == "" {
		hasAllResult = false
	}

	w.Header().Set("Content-Type", "application/json")
	if !hasAllResult {
		w.WriteHeader(http.StatusAccepted)
	} else {
		w.WriteHeader(http.StatusOK)
	}
	json.NewEncoder(w).Encode(types.APIResponse[types.SajuProfile]{
		Data: data,
	})
}

func convertMapToKVs(inputMap map[string]string) []*model.KVInput {
	kvs := []*model.KVInput{}
	for k, v := range inputMap {
		kvs = append(kvs, &model.KVInput{K: k, V: v})
	}
	return kvs
}

func replaceParams(prompt string, inputMap map[string]string) string {
	for k, v := range inputMap {
		prompt = strings.ReplaceAll(prompt, "{{"+k+"}}", v)
	}
	return prompt
}

// 사주 추론 하여 저장 및 결과 반환
// 사주 정보를 기반으로 사주 추론 결과를 생성하고 저장
func (s *SajuProfileService) RequestSaju(uid, birth, sex, palja string) (*extdao.SajuAnalysisResponse, error) {
	// extDao := extdao.NewOpenAiSajuExtDao()
	// response, err := extDao.AnalyzeSaju(context.Background(), extdao.SajuAnalysisRequest{
	// 	Gender: sex,
	// 	Birth:  birth,
	// 	Palja:  palja,
	// })
	// if err != nil {
	// 	log.Printf("[RequestSaju] Failed to analyze saju: %v", err)
	// 	return nil, err
	// }
	// // Sample log
	// responseJson, err := json.Marshal(response)
	// if err != nil {
	// 	log.Printf("[RequestSaju] Failed to marshal response: %v", err)
	// 	return nil, err
	// }
	// log.Printf("[RequestSaju] AiSajuExtDao result: %+v", string(responseJson))

	return s.runSaju(uid, sex, birth)
}

// 관상 추론하여 결과 저장 및 반환
// 1. 이미지 기반으로 얼굴의 특징 분석 (OpenAiPhyExtDao.ExtractFaceFeatures)
// 2. 얼굴의 특징 및 성별을 기반으로 관상 추론 결과 및 상대방 이상형 특징 추론 (OpenAiPhyExtDao.InterpretPhysiognomy)
// 데이터 업데이트
// 이미지 생성을 분리
// 3. 상대방 이상형 특징 추론 결과를 바탕으로 이미지 생성 (OpenAiPhyExtDao.GenerateIdealPartnerImage)
func (s *SajuProfileService) RequestPhy(uid, imageBase64, sex, birth string) (
	*extdao.FaceFeatures, *extdao.PhyAnalysisResponse, string, error,
) {

	partnerSex := "male"
	if sex == "male" {
		partnerSex = "female"
	}
	// extDao := extdao.NewOpenAiPhyExtDao()
	// // 얼굴 특징 추론
	// faceFeatures, err := extDao.ExtractFaceFeatures(context.Background(), imageBase64)
	// if err != nil {
	// 	log.Printf("[RequestPhy] Failed to extract face features: %v", err)
	// 	return nil, nil, "", err
	// }
	faceFeatures, err := s.runFaceFeature(uid, imageBase64, sex, birth)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to extract face features: %v", err))
		return nil, nil, "", err
	}
	s.sajuProfileRepo.UpdateFaceFeatures(uid,
		faceFeatures.Eyes.ToString(),
		faceFeatures.Nose.ToString(),
		faceFeatures.Mouth.ToString(),
		faceFeatures.FaceShape,
		faceFeatures.Notes,
	)

	// 관상 추론
	// log.Printf("[RequestPhy] InterpretPhysiognomy: %s, %s, %s", sex, age, faceFeatures.ToString())
	// phyAnalysisResponse, err := extDao.InterpretPhysiognomy(context.Background(), faceFeatures, sex, age)
	// if err != nil {
	// 	log.Printf("[RequestPhy] Failed to interpret physiognomy: %v", err)
	// 	return nil, nil, "", err
	// }
	phyAnalysisResponse, err := s.runPhy(uid, faceFeatures, sex, birth)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to interpret physiognomy: %v", err))
		return nil, nil, "", err
	}
	s.updatePhyAnalysisResponse(uid, phyAnalysisResponse)
	phyPartner, err := s.createPhyPartner(uid, phyAnalysisResponse, partnerSex)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to create phy partner: %v", err))
		return nil, nil, "", err
	}
	// 유사한 이미지 조회 후 조건부 이미지 생성
	openaiDao := extdao.NewOpenAIExtDao()
	embedding, err := openaiDao.CreateEmbedding(context.Background(), "", phyPartner.GenerateEmbeddingText())
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to create embedding: %v", err))
		return nil, nil, "", err
	}
	phyPartner.Embedding = utils.ConvertFloat32ToFloat64(embedding)

	similarPhyPartner, similarityScore, err := s.phyIdealPartnerRepo.FindMostSimilarByEmbedding(
		phyPartner.Embedding, partnerSex, 0.99,
	)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to find similar phy partner: %v", err))
		// return nil, nil, "", err
	}

	matchedPartnerUid := ""
	if similarPhyPartner != nil { // 유사 이미지 존재시 유사이미지로 업데이트, 스코어와 함께
		matchedPartnerUid = similarPhyPartner.Uid
		s.updatePartner(uid, similarPhyPartner.Uid, similarityScore)
	} else {
		matchedPartnerUid = phyPartner.Uid
		// 이미지 생성.
		s.log(uid, "info", fmt.Sprintf("[RequestPhy] GenerateIdealPartnerImage: %s, %d, %s", phyAnalysisResponse.Summary, phyAnalysisResponse.GetPartnerAge(), partnerSex))
		// idealPartnerImage, err := extDao.GenerateIdealPartnerImage(context.Background(), phyAnalysisResponse, partnerSex)
		// if err != nil {
		// 	log.Printf("[RequestPhy] Failed to generate ideal partner image: %v", err)
		// 	return nil, nil, "", err
		// }
		idealPartnerImage, err := s.runIdealPartnerImage(uid, sex, birth, phyAnalysisResponse)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to generate ideal partner image: %v", err))
			return nil, nil, "", err
		}
		// 파트너 이미지 S3에 저장
		imageS3Dao := extdao.NewImageS3Dao()
		imagePath := utils.GetPhyPartnerImagePath(phyPartner.Uid)
		err, _ = imageS3Dao.SaveImageToS3(imagePath, idealPartnerImage)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to save image to S3: %v", err))
			return nil, nil, "", err
		}
		// 파트너에 파일 메타정보 업데이트
		err = s.phyIdealPartnerRepo.UpdateImageMimeType(phyPartner.Uid, "image/png")
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[RequestPhy] Failed to update phy partner image mime type: %v", err))
			return nil, nil, "", err
		}

		// 파트너 바인딩 업데이트 내 설명으로 생성되었으므로 유사도는 1
		s.updatePartner(uid, phyPartner.Uid, 1.0)
	}

	return faceFeatures, phyAnalysisResponse, matchedPartnerUid, nil
}

// ! SajuResult
type SajuResult struct {
	Summary     string `json:"summary"`
	Content     string `json:"content"`
	PartnerTips string `json:"partner_tips"`
}

// GET /api/saju_profile/:uid/saju
// 사주 결과 조회
func (s *SajuProfileService) GetSajuProfileSajuResult(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")
	result := SajuResult{}
	sajuProfile, err := s.sajuProfileRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Saju profile not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Saju profile not found")
		return
	}
	result.Summary = sajuProfile.SajuSummary
	result.Content = sajuProfile.SajuContent
	result.PartnerTips = sajuProfile.PartnerMatchTips
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(types.APIResponse[SajuResult]{
		Data: result,
	})
}

// ! KwansangResult
type KwansangResult struct {
	Summary         string `json:"summary"`
	Content         string `json:"content"`
	Partner_summary string `json:"partner_summary"`
}

// GET /api/saju_profile/:uid/kwansang
// 관상 결과 조회
func (s *SajuProfileService) GetSajuProfileKwansangResult(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")
	result := KwansangResult{}
	sajuProfile, err := s.sajuProfileRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Saju profile not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Saju profile not found")
		return
	}

	if sajuProfile.PhyStatus != "done" {
		utils.RespondWithError(w, http.StatusAccepted, "Phy analysis not completed yet. Please try again later.")
		return
	}
	result.Summary = sajuProfile.PhySummary
	result.Content = sajuProfile.PhyContent
	result.Partner_summary = sajuProfile.PartnerSummary
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(types.APIResponse[KwansangResult]{
		Data: result,
	})
}

// GET /api/saju_profile/:uid/partner_image (BASE64 ENCODED IMAGE)
type PartnerImageResult struct {
	PartnerImage string `json:"partner_image"` // base64 encoded image
}

func (s *SajuProfileService) GetSajuProfilePartnerImageResult(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")
	result := PartnerImageResult{}
	sajuProfile, err := s.sajuProfileRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Saju profile not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Saju profile not found")
		return
	}
	if sajuProfile.PhyPartnerUid != "" {
		imageS3Dao := extdao.NewImageS3Dao()
		imageData, err, _ := imageS3Dao.GetImageFromS3(utils.GetPhyPartnerImagePath(sajuProfile.PhyPartnerUid))
		if err != nil {
			log.Printf("Failed to get image from S3: %v", err)
			imageData = []byte{}
		}
		result.PartnerImage = base64.StdEncoding.EncodeToString(imageData)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(types.APIResponse[PartnerImageResult]{
			Data: result,
		})
	} else {
		result.PartnerImage = ""
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(types.APIResponse[PartnerImageResult]{
			Data: result,
		})
	}
}

// ! PartnerResult
type PartnerResult struct {
	Uid     string `json:"uid"`
	Summary string `json:"summary"`
	Tips    string `json:"tips"`
	Image   string `json:"image"` // base64 encoded image
}

func (s *SajuProfileService) GetSajuProfilePartnerResult(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")
	result := PartnerResult{Uid: uid}
	sajuProfile, err := s.sajuProfileRepo.FindByUID(uid)
	if err != nil {
		log.Printf("Saju profile not found: %v", err)
		utils.RespondWithError(w, http.StatusNotFound, "Saju profile not found")
		return
	}
	result.Summary = sajuProfile.PartnerSummary
	result.Tips = sajuProfile.PartnerMatchTips

	if sajuProfile.PhyPartnerUid != "" {
		// phyPartner, err := s.phyIdealPartnerRepo.FindByUID(sajuProfile.PhyPartnerUid)
		// if err != nil {
		// 	log.Printf("Phy partner not found: %v", err)
		// 	utils.RespondWithError(w, http.StatusNotFound, "Phy partner not found")
		// 	return
		// }
		// result.Image = base64.StdEncoding.EncodeToString(phyPartner.ImageData)
		imageS3Dao := extdao.NewImageS3Dao()
		imageData, err, _ := imageS3Dao.GetImageFromS3(utils.GetPhyPartnerImagePath(sajuProfile.PhyPartnerUid))
		if err != nil {
			log.Printf("Failed to get image from S3: %v", err)
			imageData = []byte{}
		}
		result.Image = base64.StdEncoding.EncodeToString(imageData)
	} else {
		result.Image = ""
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(types.APIResponse[PartnerResult]{
		Data: result,
	})
}

func (s *SajuProfileService) updatePhyAnalysisResponse(uid string, response *extdao.PhyAnalysisResponse) error {
	return s.sajuProfileRepo.UpdatePhyAnalysisResponse(uid,
		response.Summary, response.Content, response.GetAge(),
		response.IdealPartnerPhysiognomy.PartnerSummary,
		response.IdealPartnerPhysiognomy.FacialFeaturePreferences.Eyes.ToString(),
		response.IdealPartnerPhysiognomy.FacialFeaturePreferences.Nose.ToString(),
		response.IdealPartnerPhysiognomy.FacialFeaturePreferences.Mouth.ToString(),
		response.IdealPartnerPhysiognomy.FacialFeaturePreferences.FaceShape,
		response.IdealPartnerPhysiognomy.PersonalityMatch,
		response.IdealPartnerPhysiognomy.PartnerSex,
		response.GetPartnerAge(),
	)
}

func (s *SajuProfileService) updatePartner(uid string, partner_uid string, partner_similarity float64) error {
	return s.sajuProfileRepo.UpdatePartner(uid, partner_uid, partner_similarity)
}

// PhyIdealPartner 생성
func (s *SajuProfileService) createPhyPartner(uid string, response *extdao.PhyAnalysisResponse, sex string) (*entity.PhyIdealPartner, error) {
	now := time.Now().UnixMilli()
	phyPartner := &entity.PhyIdealPartner{
		Uid:              utils.GenUid(),
		CreatedAt:        now,
		UpdatedAt:        now,
		CreatedBy:        "Openai",
		Summary:          response.IdealPartnerPhysiognomy.PartnerSummary,
		FeatureEyes:      response.IdealPartnerPhysiognomy.FacialFeaturePreferences.Eyes.ToString(),
		FeatureNose:      response.IdealPartnerPhysiognomy.FacialFeaturePreferences.Nose.ToString(),
		FeatureMouth:     response.IdealPartnerPhysiognomy.FacialFeaturePreferences.Mouth.ToString(),
		FeatureFaceShape: response.IdealPartnerPhysiognomy.FacialFeaturePreferences.FaceShape,
		PersonalityMatch: response.IdealPartnerPhysiognomy.PersonalityMatch,
		Sex:              sex,
		Age:              response.GetPartnerAge(),
		HasImage:         false,
	}
	phyPartner.EmbeddingText = phyPartner.GenerateEmbeddingText()
	openaiDao := extdao.NewOpenAIExtDao()
	embedding, err := openaiDao.CreateEmbedding(context.Background(), "", phyPartner.EmbeddingText)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[createPhyPartner] Failed to create embedding: %v", err))
		return nil, err
	}
	phyPartner.Embedding = utils.ConvertFloat32ToFloat64(embedding)
	phyPartner.EmbeddingModel = "text-embedding-3-small"

	if err := s.phyIdealPartnerRepo.Create(phyPartner); err != nil {
		s.log(uid, "error", fmt.Sprintf("[createPhyPartner] Failed to save PhyIdealPartner to database: %v", err))
		return nil, err
	}
	return phyPartner, nil
}

func (s *SajuProfileService) UpdateSajuProfile(w http.ResponseWriter, r *http.Request) {
	uid := chi.URLParam(r, "uid")

	var requestBody struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if requestBody.Email == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "Email is required")
		return
	}

	err := s.sajuProfileRepo.UpdateEmail(uid, requestBody.Email)
	if err != nil {
		log.Printf("Failed to update email: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update email")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(types.APIResponse[string]{
		Message: utils.StrPtr("Email updated successfully"),
	})
}

// AiExecution 수행
func (s *SajuProfileService) runSaju(uid, sex, birth string) (*extdao.SajuAnalysisResponse, error) {
	// AI Execution 생성 및 수행
	metaType := string(types.AiMetaTypeSaju)
	aiMeta, err := dao.NewAIMetaRepository().FindInUseByMetaType(metaType)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runSaju] Failed to find ai meta: %v", err))
		return nil, err
	}
	// aiMeta 조회
	inputMap := map[string]string{
		"sex":       sex,
		"birthdate": birth,
	}
	outputMap := GetAiMetaValues(metaType, inputMap)
	aiExecutionInput := model.AiExcutionInput{
		MetaUID:      aiMeta.Uid,
		MetaType:     aiMeta.MetaType,
		PromptType:   "text",
		Prompt:       aiMeta.Prompt,
		ValuedPrompt: replaceParams(aiMeta.Prompt, outputMap),
		Inputkvs:     convertMapToKVs(inputMap),
		Outputkvs:    convertMapToKVs(outputMap),
		Model:        aiMeta.Model,
		Temperature:  aiMeta.Temperature,
		MaxTokens:    aiMeta.MaxTokens,
		Size:         aiMeta.Size,
	}
	adminAiExecutionService := NewAdminAiExecutionService()
	sr, err := adminAiExecutionService.RunAiExecution(context.Background(),
		aiExecutionInput, utils.StrPtr("system"), utils.StrPtr(uid),
	)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runSaju] Failed to run ai execution: %v", err))
		return nil, err
	}
	if !sr.Ok {
		s.log(uid, "error", fmt.Sprintf("[runSaju] Failed to run ai execution: %v", sr.Err))
		return nil, fmt.Errorf("%v: %v", sr.Err, sr.Msg)
	}
	if sr.Value != nil {
		// log.Printf("[runSaju] Ai execution result: %s", *sr.Value)
		var resp extdao.SajuAnalysisResponse
		errOfUnmarshal := json.Unmarshal([]byte(*sr.Value), &resp)
		if errOfUnmarshal != nil {
			s.log(uid, "error", fmt.Sprintf("[runSaju] Failed to unmarshal response: %v", errOfUnmarshal))
			return nil, errOfUnmarshal
		}
		return &resp, nil
	}
	return nil, fmt.Errorf("[runSaju]failed to get ai execution result")
}

func (s *SajuProfileService) runFaceFeature(uid, imageBase64, sex, birth string) (*extdao.FaceFeatures, error) {
	metaType := string(types.AiMetaTypeFaceFeature)
	aiMeta, err := dao.NewAIMetaRepository().FindInUseByMetaType(metaType)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runFaceFeature] Failed to find ai meta: %v", err))
		return nil, err
	}
	// aiMeta 조회
	inputMap := map[string]string{
		"sex":       sex,
		"birthdate": birth,
	}
	outputMap := GetAiMetaValues(metaType, inputMap)
	aiExecutionInput := model.AiExcutionInput{
		MetaUID:          aiMeta.Uid,
		MetaType:         aiMeta.MetaType,
		PromptType:       "text",
		Prompt:           aiMeta.Prompt,
		ValuedPrompt:     replaceParams(aiMeta.Prompt, outputMap),
		Inputkvs:         convertMapToKVs(inputMap),
		Outputkvs:        convertMapToKVs(outputMap),
		Model:            aiMeta.Model,
		Temperature:      aiMeta.Temperature,
		MaxTokens:        aiMeta.MaxTokens,
		Size:             aiMeta.Size,
		InputImageBase64: &imageBase64,
	}
	adminAiExecutionService := NewAdminAiExecutionService()
	sr, err := adminAiExecutionService.RunAiExecution(context.Background(),
		aiExecutionInput, utils.StrPtr("system"), utils.StrPtr(uid),
	)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runFaceFeature] Failed to run ai execution: %v", err))
		return nil, err
	}
	if !sr.Ok {
		s.log(uid, "error", fmt.Sprintf("[runFaceFeature] Failed to run ai execution: %v", sr.Err))
		return nil, fmt.Errorf("%v: %v", sr.Err, sr.Msg)
	}
	if sr.Value != nil {
		// log.Printf("[runFaceFeature] Ai execution result: %s", *sr.Value)
		var resp extdao.FaceFeatures
		errOfUnmarshal := json.Unmarshal([]byte(*sr.Value), &resp)
		if errOfUnmarshal != nil {
			s.log(uid, "error", fmt.Sprintf("[runFaceFeature] Failed to unmarshal response: %v", errOfUnmarshal))
			return nil, errOfUnmarshal
		}
		return &resp, nil
	}
	return nil, fmt.Errorf("failed to get ai execution result")
}

func (s *SajuProfileService) runPhy(uid string, faceFeatures *extdao.FaceFeatures, sex, birth string) (*extdao.PhyAnalysisResponse, error) {
	metaType := string(types.AiMetaTypePhy)
	aiMeta, err := dao.NewAIMetaRepository().FindInUseByMetaType(metaType)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runPhy] Failed to find ai meta: %v", err))
		return nil, err
	}
	// aiMeta 조회
	inputMap := map[string]string{
		"sex":               sex,
		"birthdate":         birth,
		"phy_features_json": faceFeatures.ToJSON(),
	}
	outputMap := GetAiMetaValues(metaType, inputMap)
	aiExecutionInput := model.AiExcutionInput{
		MetaUID:      aiMeta.Uid,
		MetaType:     aiMeta.MetaType,
		PromptType:   "text",
		Prompt:       aiMeta.Prompt,
		ValuedPrompt: replaceParams(aiMeta.Prompt, outputMap),
		Inputkvs:     convertMapToKVs(inputMap),
		Outputkvs:    convertMapToKVs(outputMap),
		Model:        aiMeta.Model,
		Temperature:  aiMeta.Temperature,
		MaxTokens:    aiMeta.MaxTokens,
		Size:         aiMeta.Size,
	}
	adminAiExecutionService := NewAdminAiExecutionService()
	sr, err := adminAiExecutionService.RunAiExecution(context.Background(),
		aiExecutionInput, utils.StrPtr("system"), utils.StrPtr(uid),
	)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runPhy] Failed to run ai execution: %v", err))
		return nil, err
	}
	if !sr.Ok {
		s.log(uid, "error", fmt.Sprintf("[runPhy] Failed to run ai execution: %v", sr.Err))
		return nil, fmt.Errorf("%v: %v", sr.Err, sr.Msg)
	}
	if sr.Value != nil {
		// log.Printf("[runPhy] Ai execution result: %s", *sr.Value)
		var resp extdao.PhyAnalysisResponse
		errOfUnmarshal := json.Unmarshal([]byte(*sr.Value), &resp)
		if errOfUnmarshal != nil {
			s.log(uid, "error", fmt.Sprintf("[runPhy] Failed to unmarshal response: %v", errOfUnmarshal))
			return nil, errOfUnmarshal
		}
		return &resp, nil
	}
	return nil, fmt.Errorf("failed to get ai execution result")
}

func (s *SajuProfileService) runIdealPartnerImage(uid, sex, birth string, phyAnalysisResponse *extdao.PhyAnalysisResponse) ([]byte, error) {
	metaType := string(types.AiMetaTypeIdealPartnerImageMale)
	if sex == "female" {
		metaType = string(types.AiMetaTypeIdealPartnerImageFemale)
	}
	aiMeta, err := dao.NewAIMetaRepository().FindInUseByMetaType(metaType)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runIdealPartnerImage] Failed to find ai meta: %v", err))
		return nil, err
	}
	// aiMeta 조회
	inputMap := map[string]string{
		"sex":                sex,
		"birthdate":          birth,
		"partner_eyes":       phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.Eyes.ToString(),
		"partner_nose":       phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.Nose.ToString(),
		"partner_mouth":      phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.Mouth.ToString(),
		"partner_face_shape": phyAnalysisResponse.IdealPartnerPhysiognomy.FacialFeaturePreferences.FaceShape,
		"partner_age":        fmt.Sprintf("%d", phyAnalysisResponse.GetPartnerAge()),
	}
	outputMap := GetAiMetaValues(metaType, inputMap)
	aiExecutionInput := model.AiExcutionInput{
		MetaUID:      aiMeta.Uid,
		MetaType:     aiMeta.MetaType,
		PromptType:   "image",
		Prompt:       aiMeta.Prompt,
		ValuedPrompt: replaceParams(aiMeta.Prompt, outputMap),
		Inputkvs:     convertMapToKVs(inputMap),
		Outputkvs:    convertMapToKVs(outputMap),
		Model:        aiMeta.Model,
		Temperature:  aiMeta.Temperature,
		MaxTokens:    aiMeta.MaxTokens,
		Size:         aiMeta.Size,
	}
	adminAiExecutionService := NewAdminAiExecutionService()
	sr, err := adminAiExecutionService.RunAiExecution(context.Background(),
		aiExecutionInput, utils.StrPtr("system"), utils.StrPtr(uid),
	)
	if err != nil {
		s.log(uid, "error", fmt.Sprintf("[runIdealPartnerImage] Failed to run ai execution: %v", err))
		return nil, err
	}
	if !sr.Ok {
		s.log(uid, "error", fmt.Sprintf("[runIdealPartnerImage] Failed to run ai execution: %v", sr.Err))
		return nil, fmt.Errorf("%v: %v", sr.Err, sr.Msg)
	}
	if sr.Base64Value != nil {
		imageData, err := base64.StdEncoding.DecodeString(*sr.Base64Value)
		if err != nil {
			s.log(uid, "error", fmt.Sprintf("[runIdealPartnerImage] Failed to decode base64 value: %v", err))
			return nil, err
		}

		return imageData, nil
	}
	return nil, fmt.Errorf("[runIdealPartnerImage] failed to get ai execution result")
}
