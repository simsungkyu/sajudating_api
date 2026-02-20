package extdao

import "testing"

func intPtr(v int) *int { return &v }

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

func TestCallSxtwlOptional_MinutePrecisionCompat(t *testing.T) {
	type expect struct {
		yTg int
		yDz int
		mTg int
		mDz int
		dTg int
		dDz int
		hTg int
		hDz int
	}
	tests := []struct {
		name string
		y    int
		m    int
		d    int
		hh   int
		mm   int
		exp  expect
	}{
		{name: "1984-02-02 12:00", y: 1984, m: 2, d: 2, hh: 12, mm: 0, exp: expect{9, 11, 1, 1, 2, 2, 0, 6}},
		{name: "1984-02-04 12:00", y: 1984, m: 2, d: 4, hh: 12, mm: 0, exp: expect{0, 0, 2, 2, 4, 4, 4, 6}},
		{name: "2017-02-03 12:30", y: 2017, m: 2, d: 3, hh: 12, mm: 30, exp: expect{3, 9, 8, 2, 7, 9, 0, 6}},
		{name: "2017-02-04 12:30", y: 2017, m: 2, d: 4, hh: 12, mm: 30, exp: expect{3, 9, 8, 2, 8, 10, 2, 6}},
		{name: "2021-02-03 12:30", y: 2021, m: 2, d: 3, hh: 12, mm: 30, exp: expect{7, 1, 6, 2, 8, 6, 2, 6}},
		{name: "2022-02-01 12:00", y: 2022, m: 2, d: 1, hh: 12, mm: 0, exp: expect{7, 1, 7, 1, 1, 9, 8, 6}},
		{name: "1999-12-31 23:59", y: 1999, m: 12, d: 31, hh: 23, mm: 59, exp: expect{5, 3, 2, 0, 3, 5, 6, 0}},
		{name: "2000-01-01 00:00", y: 2000, m: 1, d: 1, hh: 0, mm: 0, exp: expect{5, 3, 2, 0, 4, 6, 8, 0}},
		{name: "2008-08-08 08:08", y: 2008, m: 8, d: 8, hh: 8, mm: 8, exp: expect{4, 0, 6, 8, 6, 4, 6, 4}},
		{name: "2030-11-07 12:30", y: 2030, m: 11, d: 7, hh: 12, mm: 30, exp: expect{6, 10, 3, 11, 2, 6, 0, 6}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := CallSxtwlOptional(tc.y, tc.m, tc.d, intPtr(tc.hh), intPtr(tc.mm), "Asia/Seoul", nil)
			if err != nil {
				t.Fatalf("CallSxtwlOptional() error = %v", err)
			}
			if got.Pillars.Hour == nil {
				t.Fatalf("hour pillar is nil")
			}

			if got.Pillars.Year.Tg != tc.exp.yTg || got.Pillars.Year.Dz != tc.exp.yDz {
				t.Fatalf("year mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Year.Tg, got.Pillars.Year.Dz, tc.exp.yTg, tc.exp.yDz)
			}
			if got.Pillars.Month.Tg != tc.exp.mTg || got.Pillars.Month.Dz != tc.exp.mDz {
				t.Fatalf("month mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Month.Tg, got.Pillars.Month.Dz, tc.exp.mTg, tc.exp.mDz)
			}
			if got.Pillars.Day.Tg != tc.exp.dTg || got.Pillars.Day.Dz != tc.exp.dDz {
				t.Fatalf("day mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Day.Tg, got.Pillars.Day.Dz, tc.exp.dTg, tc.exp.dDz)
			}
			if got.Pillars.Hour.Tg != tc.exp.hTg || got.Pillars.Hour.Dz != tc.exp.hDz {
				t.Fatalf("hour mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Hour.Tg, got.Pillars.Hour.Dz, tc.exp.hTg, tc.exp.hDz)
			}
		})
	}
}

func TestCallSxtwlOptional_UnknownPrecisionCompat(t *testing.T) {
	type expect struct {
		yTg int
		yDz int
		mTg int
		mDz int
		dTg int
		dDz int
	}
	tests := []struct {
		name string
		y    int
		m    int
		d    int
		exp  expect
	}{
		{name: "1984-02-02", y: 1984, m: 2, d: 2, exp: expect{9, 11, 1, 1, 2, 2}},
		{name: "1984-02-04", y: 1984, m: 2, d: 4, exp: expect{0, 0, 2, 2, 4, 4}},
		{name: "2017-02-03", y: 2017, m: 2, d: 3, exp: expect{3, 9, 8, 2, 7, 9}},
		{name: "2017-02-04", y: 2017, m: 2, d: 4, exp: expect{3, 9, 8, 2, 8, 10}},
		{name: "2021-02-03", y: 2021, m: 2, d: 3, exp: expect{7, 1, 6, 2, 8, 6}},
		{name: "2022-02-01", y: 2022, m: 2, d: 1, exp: expect{7, 1, 7, 1, 1, 9}},
		{name: "1999-12-31", y: 1999, m: 12, d: 31, exp: expect{5, 3, 2, 0, 3, 5}},
		{name: "2000-01-01", y: 2000, m: 1, d: 1, exp: expect{5, 3, 2, 0, 4, 6}},
		{name: "2008-08-08", y: 2008, m: 8, d: 8, exp: expect{4, 0, 6, 8, 6, 4}},
		{name: "2030-11-07", y: 2030, m: 11, d: 7, exp: expect{6, 10, 3, 11, 2, 6}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := CallSxtwlOptional(tc.y, tc.m, tc.d, nil, nil, "Asia/Seoul", nil)
			if err != nil {
				t.Fatalf("CallSxtwlOptional() error = %v", err)
			}
			if got.Pillars.Hour != nil {
				t.Fatalf("hour pillar should be nil for unknown precision")
			}
			if got.Pillars.Year.Tg != tc.exp.yTg || got.Pillars.Year.Dz != tc.exp.yDz {
				t.Fatalf("year mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Year.Tg, got.Pillars.Year.Dz, tc.exp.yTg, tc.exp.yDz)
			}
			if got.Pillars.Month.Tg != tc.exp.mTg || got.Pillars.Month.Dz != tc.exp.mDz {
				t.Fatalf("month mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Month.Tg, got.Pillars.Month.Dz, tc.exp.mTg, tc.exp.mDz)
			}
			if got.Pillars.Day.Tg != tc.exp.dTg || got.Pillars.Day.Dz != tc.exp.dDz {
				t.Fatalf("day mismatch got=(%d,%d) exp=(%d,%d)",
					got.Pillars.Day.Tg, got.Pillars.Day.Dz, tc.exp.dTg, tc.exp.dDz)
			}
		})
	}
}
