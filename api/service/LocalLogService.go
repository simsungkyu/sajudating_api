// LocalLogService provides business logic for local log operations
package service

import (
	"context"
	"fmt"
	"os"
	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/utils"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

type LocalLogService struct {
	localLogRepo *dao.LocalLogRepository
}

func NewLocalLogService() *LocalLogService {
	return &LocalLogService{
		localLogRepo: dao.NewLocalLogRepository(),
	}
}

func (s *LocalLogService) GetLocalLogs(ctx context.Context, input model.LocalLogSearchInput) (*model.SimpleResult, error) {
	offset := 0
	if input.Offset != nil {
		offset = *input.Offset
	}

	logs, total, err := s.localLogRepo.FindWithPagination(input.Limit, offset, input.Status, nil, nil)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Msg: utils.StrPtr(fmt.Sprintf("Failed to retrieve local logs: %v", err)),
		}, nil
	}

	nodes := make([]model.Node, len(logs))
	for i := range logs {
		nodes[i] = converter.LocalLogToModel(&logs[i])
	}

	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(int(total)),
		Limit:  utils.IntPtr(input.Limit),
		Offset: utils.IntPtr(offset),
	}, nil
}

func (s *LocalLogService) GetSystemStats(ctx context.Context) (*model.SimpleResult, error) {
	// Get hostname
	hostname := "localhost"
	if hostInfo, err := host.Info(); err == nil && hostInfo != nil {
		hostname = hostInfo.Hostname
	} else {
		// Fallback to environment variable or system hostname
		if h, err := os.Hostname(); err == nil {
			hostname = h
		}
	}

	// Get CPU usage (1 second interval)
	cpuPercent := 0.0
	if cpuPercents, err := cpu.Percent(time.Second, false); err == nil && len(cpuPercents) > 0 {
		cpuPercent = cpuPercents[0]
	}

	// Get memory information
	memoryUsage := int64(0)
	memoryTotal := int64(0)
	if memInfo, err := mem.VirtualMemory(); err == nil && memInfo != nil {
		memoryUsage = int64(memInfo.Used)
		memoryTotal = int64(memInfo.Total)
	}

	return &model.SimpleResult{
		Ok: true,
		Node: &model.SystemStats{
			Hostname:    hostname,
			CPUUsage:    cpuPercent,
			MemoryUsage: int(memoryUsage),
			MemoryTotal: int(memoryTotal),
		},
	}, nil
}
