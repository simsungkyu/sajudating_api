// Package routes: admin-only extraction test endpoints (saju, pair).
package routes

import (
	"log"

	"sajudating_api/api/service"

	"github.com/go-chi/chi/v5"
)

func RouteAdm(r chi.Router) {
	r.Post("/saju_extract_test", service.RunSajuExtractTest)
	r.Post("/pair_extract_test", service.RunPairExtractTest)
	r.Post("/llm_context_preview", service.RunLLMContextPreview)
	log.Println("Admin extraction test routes initialized")
}
