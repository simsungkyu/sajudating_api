package extdao

import "testing"

func buildSxtwlResult(yTg, yDz, mTg, mDz, dTg, dDz int, hTg, hDz *int) *SxtwlResult {
	res := &SxtwlResult{}
	res.Pillars.Year.Tg = yTg
	res.Pillars.Year.Dz = yDz
	res.Pillars.Month.Tg = mTg
	res.Pillars.Month.Dz = mDz
	res.Pillars.Day.Tg = dTg
	res.Pillars.Day.Dz = dDz

	if hTg != nil && hDz != nil {
		res.Pillars.Hour = &struct {
			Tg         int `json:"tg"`
			Dz         int `json:"dz"`
			DzIndex    int `json:"dz_index"`
			ActualHour int `json:"actual_hour"`
			ActualMin  int `json:"actual_minute"`
		}{
			Tg: *hTg,
			Dz: *hDz,
		}
	}

	return res
}

func TestGetPalja(t *testing.T) {
	hTg, hDz := 3, 3
	withHour := buildSxtwlResult(0, 0, 1, 1, 2, 2, &hTg, &hDz)
	withoutHour := buildSxtwlResult(0, 0, 1, 1, 2, 2, nil, nil)

	tests := []struct {
		name     string
		input    *SxtwlResult
		expected string
	}{
		{
			name:     "hour included",
			input:    withHour,
			expected: "갑자을축병인정묘",
		},
		{
			name:     "hour omitted",
			input:    withoutHour,
			expected: "갑자을축병인",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.input.GetPalja(); got != tt.expected {
				t.Errorf("GetPalja() = %q, expected %q", got, tt.expected)
			}
		})
	}
}

func TestGetFullPalja(t *testing.T) {
	hTg, hDz := 3, 3
	withHour := buildSxtwlResult(0, 0, 1, 1, 2, 2, &hTg, &hDz)
	withoutHour := buildSxtwlResult(0, 0, 1, 1, 2, 2, nil, nil)

	tests := []struct {
		name     string
		input    *SxtwlResult
		expected string
	}{
		{
			name:     "hour included",
			input:    withHour,
			expected: "00112233",
		},
		{
			name:     "hour omitted",
			input:    withoutHour,
			expected: "001122",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.input.GetFullPalja(); got != tt.expected {
				t.Errorf("GetFullPalja() = %q, expected %q", got, tt.expected)
			}
		})
	}
}

func TestGetPaljaKorean(t *testing.T) {
	hTg, hDz := 3, 3
	withHour := buildSxtwlResult(0, 0, 1, 1, 2, 2, &hTg, &hDz)
	withoutHour := buildSxtwlResult(0, 0, 1, 1, 2, 2, nil, nil)

	tests := []struct {
		name     string
		input    *SxtwlResult
		expected string
	}{
		{
			name:     "hour included",
			input:    withHour,
			expected: "갑자 을축 병인 정묘",
		},
		{
			name:     "hour omitted",
			input:    withoutHour,
			expected: "갑자 을축 병인",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.input.GetPaljaKorean(); got != tt.expected {
				t.Errorf("GetPaljaKorean() = %q, expected %q", got, tt.expected)
			}
		})
	}
}
