package routes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RouteSajuProfile(r chi.Router) {
	r.Get("/{uid}", sajuProfileService.GetSajuProfile)                                 // 프로필 조회 모든 영역
	r.Get("/{uid}/saju", sajuProfileService.GetSajuProfileSajuResult)                  // 사주 결과만 조회
	r.Get("/{uid}/kwansang", sajuProfileService.GetSajuProfileKwansangResult)          // 관상 결과만 조회
	r.Get("/{uid}/partner_image", sajuProfileService.GetSajuProfilePartnerImageResult) // 파트너 이미지 조회

	r.Post("/", sajuProfileService.CreateSajuProfile)
	r.Put("/{uid}", sajuProfileService.UpdateSajuProfile) // 이메일 업데이트

	// r.Get("/{uid}/partner", sajuProfileService.GetSajuProfilePartnerResult)   // 파트너 결과만 조회
	// r.Get("/{uid}/my_image", sajuProfileService.GetSajuProfileImage)             // TODO
	// r.Get("/{uid}/partner_image", sajuProfileService.GetSajuProfilePartnerImage) // TODO
	log.Println("Saju Profile routes initialized")

	r.Get("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Hello, World!"})
	})
}
