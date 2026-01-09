package dslog

import (
	"log"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	"sajudating_api/api/utils"
	"time"
)

var localLogRepo *dao.LocalLogRepository

func InitDsLog() {
	localLogRepo = dao.NewLocalLogRepository()
}

func Log(status string, text string) {
	log.Printf("[DSLog-%s] %s", status, text)
	log := &entity.LocalLog{
		Uid:       utils.GenUid(),
		CreatedAt: time.Now().UnixMilli(),
		ExpiresAt: time.Now().Add(24 * time.Hour).UnixMilli(),
		Status:    status,
		Text:      text,
	}
	localLogRepo.Create(log)
}
