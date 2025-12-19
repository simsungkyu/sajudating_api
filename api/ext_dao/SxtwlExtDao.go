package extdao

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	utils "sajudating_api/api/utils"
)

type SxtwlResult struct {
	Input   map[string]any `json:"input"`
	Pillars struct {
		Year struct {
			Tg int `json:"tg"`
			Dz int `json:"dz"`
		} `json:"year"`
		Month struct {
			Tg int `json:"tg"`
			Dz int `json:"dz"`
		} `json:"month"`
		Day struct {
			Tg int `json:"tg"`
			Dz int `json:"dz"`
		} `json:"day"`
		Hour *struct {
			Tg         int `json:"tg"`
			Dz         int `json:"dz"`
			DzIndex    int `json:"dz_index"`    // 하위 호환성
			ActualHour int `json:"actual_hour"` // 실제 시간
			ActualMin  int `json:"actual_minute"`
		} `json:"hour_hint"` // Python에서 hour_hint로 반환
	} `json:"pillars"`
	Meta map[string]any `json:"meta"`
}

// return 6 or 8 characters palja (천간지지, 연월일시 순) 한글 배열을 참고하여 한글로 변환, 6자에서 8자
func (r *SxtwlResult) GetPalja() string {
	y := utils.TG_ARRAY[r.Pillars.Year.Tg] + utils.DZ_ARRAY[r.Pillars.Year.Dz]
	m := utils.TG_ARRAY[r.Pillars.Month.Tg] + utils.DZ_ARRAY[r.Pillars.Month.Dz]
	d := utils.TG_ARRAY[r.Pillars.Day.Tg] + utils.DZ_ARRAY[r.Pillars.Day.Dz]
	if r.Pillars.Hour != nil {
		h := utils.TG_ARRAY[r.Pillars.Hour.Tg] + utils.DZ_ARRAY[r.Pillars.Hour.Dz]
		return y + m + d + h
	}
	return y + m + d
}

// GetFullPalja returns full palja string with both 천간(Tg) and 지지(Dz)
// Returns 6 characters (YMD) or 8 characters (YMDH) palja
func (r *SxtwlResult) GetFullPalja() string {
	if r.Pillars.Hour != nil {
		return fmt.Sprintf("%d%d%d%d%d%d%d%d",
			r.Pillars.Year.Tg, r.Pillars.Year.Dz,
			r.Pillars.Month.Tg, r.Pillars.Month.Dz,
			r.Pillars.Day.Tg, r.Pillars.Day.Dz,
			r.Pillars.Hour.Tg, r.Pillars.Hour.Dz)
	}
	return fmt.Sprintf("%d%d%d%d%d%d",
		r.Pillars.Year.Tg, r.Pillars.Year.Dz,
		r.Pillars.Month.Tg, r.Pillars.Month.Dz,
		r.Pillars.Day.Tg, r.Pillars.Day.Dz)
}

// GetPaljaKorean returns palja in Korean characters
func (r *SxtwlResult) GetPaljaKorean() string {
	yearStr := utils.TG_ARRAY[r.Pillars.Year.Tg] + utils.DZ_ARRAY[r.Pillars.Year.Dz]
	monthStr := utils.TG_ARRAY[r.Pillars.Month.Tg] + utils.DZ_ARRAY[r.Pillars.Month.Dz]
	dayStr := utils.TG_ARRAY[r.Pillars.Day.Tg] + utils.DZ_ARRAY[r.Pillars.Day.Dz]

	if r.Pillars.Hour != nil {
		hourStr := utils.TG_ARRAY[r.Pillars.Hour.Tg] + utils.DZ_ARRAY[r.Pillars.Hour.Dz]
		return yearStr + " " + monthStr + " " + dayStr + " " + hourStr
	}
	return yearStr + " " + monthStr + " " + dayStr
}

func GenPalja(birthdate string, timezone string) (*SxtwlResult, error) {
	// 타임존이 비어있으면 기본값 서울로 설정
	if timezone == "" {
		timezone = "Asia/Seoul"
	}

	y, err := strconv.Atoi(birthdate[0:4])
	if err != nil {
		return nil, fmt.Errorf("invalid year: %w", err)
	}
	m, err := strconv.Atoi(birthdate[4:6])
	if err != nil {
		return nil, fmt.Errorf("invalid month: %w", err)
	}
	d, err := strconv.Atoi(birthdate[6:8])
	if err != nil {
		return nil, fmt.Errorf("invalid day: %w", err)
	}
	var hh *int
	var mm *int
	if len(birthdate) == 12 {
		hhInt, err := strconv.Atoi(birthdate[8:10])
		if err != nil {
			return nil, fmt.Errorf("invalid hour: %w", err)
		}
		mmInt, err := strconv.Atoi(birthdate[10:12])
		if err != nil {
			return nil, fmt.Errorf("invalid minute: %w", err)
		}
		hh = &hhInt
		mm = &mmInt
	}

	palja, err := CallSxtwlOptional(y, m, d, hh, mm, timezone, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call sxtwl: %w", err)
	}
	return palja, nil
}

func CallSxtwl(y, m, d, hh, mm int, timezone string, longitude *float64) (*SxtwlResult, error) {
	return CallSxtwlOptional(y, m, d, &hh, &mm, timezone, longitude)
}

// CallSxtwlOptional calls the python sxtwl service with optional time params.
// If hh or mm is nil, time args are omitted and the service will not return hour-related values.
// timezone: IANA timezone string (e.g., "Asia/Seoul", "UTC"). Defaults to "Asia/Seoul" if empty.
// longitude: Optional longitude for solar time correction.
func CallSxtwlOptional(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*SxtwlResult, error) {
	// 타임존이 비어있으면 기본값 서울로 설정
	if timezone == "" {
		timezone = "Asia/Seoul"
	}
	// 타임아웃 권장 (python이 뻗거나 hang될 때 대비)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Find Python script path (Docker or local environment)
	scriptPath, err := findSxtwlScriptPath()
	if err != nil {
		return nil, fmt.Errorf("sxtwl script not found: %w", err)
	}

	// Find Python executable (venv or system python)
	pythonExec := findPythonExecutable()

	args := []string{
		scriptPath,
		"--y", fmt.Sprint(y),
		"--m", fmt.Sprint(m),
		"--d", fmt.Sprint(d),
		"--tz", timezone,
	}
	if hh != nil && mm != nil {
		args = append(args,
			"--hh", fmt.Sprint(*hh),
			"--mm", fmt.Sprint(*mm),
		)
	}
	if longitude != nil {
		args = append(args,
			"--lng", fmt.Sprintf("%.6f", *longitude),
		)
	}
	cmd := exec.CommandContext(ctx, pythonExec, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		return nil, fmt.Errorf("sxtwl timeout: %w", ctx.Err())
	}
	if err != nil {
		return nil, fmt.Errorf("sxtwl failed: %w; stderr=%s", err, stderr.String())
	}

	var res SxtwlResult
	if err := json.Unmarshal(stdout.Bytes(), &res); err != nil {
		return nil, fmt.Errorf("invalid json from sxtwl: %w; raw=%s; stderr=%s",
			err, stdout.String(), stderr.String())
	}
	return &res, nil
}

// findSxtwlScriptPath finds the sxtwl_service.py script path
// Tries multiple locations to support both Docker and local environments
func findSxtwlScriptPath() (string, error) {
	// Possible paths (in order of priority)
	possiblePaths := []string{
		"/app/python_tool/sxtwl_service.py",                              // Docker
		"./python_tool/sxtwl_service.py",                                 // Local (from api directory)
		"python_tool/sxtwl_service.py",                                   // Local (relative)
		"/Users/sof/dev/sajudating_api/api/python_tool/sxtwl_service.py", // Absolute local path
	}

	// Get current working directory for relative path resolution
	cwd, _ := os.Getwd()

	for _, path := range possiblePaths {
		// Try absolute path first
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}

		// Try relative to cwd
		absPath := filepath.Join(cwd, path)
		if _, err := os.Stat(absPath); err == nil {
			return absPath, nil
		}
	}

	return "", fmt.Errorf("sxtwl_service.py not found in any of the expected locations")
}

// findPythonExecutable finds the Python executable
// Prefers venv python, falls back to system python3
func findPythonExecutable() string {
	// Possible Python executables (in order of priority)
	possiblePythons := []string{
		"/app/python_tool/venv/bin/python",                              // Docker venv
		"./python_tool/venv/bin/python",                                 // Local venv (from api directory)
		"python_tool/venv/bin/python",                                   // Local venv (relative)
		"/Users/sof/dev/sajudating_api/api/python_tool/venv/bin/python", // Absolute local venv
		"python3", // System python3
	}

	cwd, _ := os.Getwd()

	for _, pythonPath := range possiblePythons {
		// If it's a relative or simple command, try it
		if pythonPath == "python3" || pythonPath == "python" {
			return pythonPath
		}

		// Try absolute path first
		if _, err := os.Stat(pythonPath); err == nil {
			return pythonPath
		}

		// Try relative to cwd
		absPath := filepath.Join(cwd, pythonPath)
		if _, err := os.Stat(absPath); err == nil {
			return absPath
		}
	}

	// Default fallback
	return "python3"
}
