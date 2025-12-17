package routes

import "sajudating_api/api/service"

var sajuProfileService *service.SajuProfileService
var adminService *service.AdminService
var adminSajuProfileService *service.AdminSajuProfileService
var adminPhyPartnerService *service.AdminPhyPartnerService
var adminToolService *service.AdminToolService

func InitRoutes() {
	sajuProfileService = service.NewSajuProfileService()
	adminService = service.NewAdminService()
	adminSajuProfileService = service.NewAdminSajuProfileService()
	adminPhyPartnerService = service.NewAdminPhyPartnerService()
	adminToolService = service.NewAdminToolService()
}
