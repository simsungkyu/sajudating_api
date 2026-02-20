// Package-level service initialization with lazy loading to avoid nil pointer errors during package init
package admgql

import (
	"sync"

	"sajudating_api/api/service"
)

var (
	adminAiMetaService          *service.AdminAIMetaService
	adminAiMetaServiceOnce      sync.Once
	adminAiExecutionService     *service.AdminAiExecutionService
	adminAiExecutionServiceOnce sync.Once
	adminSajuProfileService     *service.AdminSajuProfileService
	adminSajuProfileServiceOnce sync.Once
	adminPhyPartnerService      *service.AdminPhyPartnerService
	adminPhyPartnerServiceOnce  sync.Once
	adminToolService            *service.AdminToolService
	adminToolServiceOnce        sync.Once
	adminUserService            *service.AdminUserService
	adminUserServiceOnce        sync.Once
	localLogService             *service.LocalLogService
	localLogServiceOnce         sync.Once
	adminItemNCardService       *service.AdminItemNCardService
	adminItemNCardServiceOnce   sync.Once
	adminExtractService         *service.AdminExtractService
	adminExtractServiceOnce     sync.Once
	extractSajuPairService      *service.ExtractSajuPairService
	extractSajuPairServiceOnce  sync.Once
)

func getAdminAiMetaService() *service.AdminAIMetaService {
	adminAiMetaServiceOnce.Do(func() {
		adminAiMetaService = service.NewAdminAIMetaService()
	})
	return adminAiMetaService
}

func getAdminAiExecutionService() *service.AdminAiExecutionService {
	adminAiExecutionServiceOnce.Do(func() {
		adminAiExecutionService = service.NewAdminAiExecutionService()
	})
	return adminAiExecutionService
}

func getAdminSajuProfileService() *service.AdminSajuProfileService {
	adminSajuProfileServiceOnce.Do(func() {
		adminSajuProfileService = service.NewAdminSajuProfileService()
	})
	return adminSajuProfileService
}

func getAdminPhyPartnerService() *service.AdminPhyPartnerService {
	adminPhyPartnerServiceOnce.Do(func() {
		adminPhyPartnerService = service.NewAdminPhyPartnerService()
	})
	return adminPhyPartnerService
}

func getAdminToolService() *service.AdminToolService {
	adminToolServiceOnce.Do(func() {
		adminToolService = service.NewAdminToolService()
	})
	return adminToolService
}

func getAdminUserService() *service.AdminUserService {
	adminUserServiceOnce.Do(func() {
		adminUserService = service.NewAdminUserService()
	})
	return adminUserService
}

func getLocalLogService() *service.LocalLogService {
	localLogServiceOnce.Do(func() {
		localLogService = service.NewLocalLogService()
	})
	return localLogService
}

func getAdminItemNCardService() *service.AdminItemNCardService {
	adminItemNCardServiceOnce.Do(func() {
		adminItemNCardService = service.NewAdminItemNCardService()
	})
	return adminItemNCardService
}

func getAdminExtractService() *service.AdminExtractService {
	adminExtractServiceOnce.Do(func() {
		adminExtractService = service.NewAdminExtractService()
	})
	return adminExtractService
}

func getExtractSajuPairService() *service.ExtractSajuPairService {
	extractSajuPairServiceOnce.Do(func() {
		extractSajuPairService = service.NewExtractSajuPairService()
	})
	return extractSajuPairService
}
