// Package itemncard: unit tests for 大運 (Daesoon) pillar computation.
package itemncard

import (
	"testing"
)

func TestIsMale(t *testing.T) {
	tests := []struct {
		g    string
		want bool
	}{
		{"male", true},
		{"Male", true},
		{"MALE", true},
		{"남", true},
		{"男", true},
		{"m", true},
		{"female", false},
		{"여", false},
		{"女", false},
		{"", false},
		{"unknown", false},
	}
	for _, tt := range tests {
		if got := isMale(tt.g); got != tt.want {
			t.Errorf("isMale(%q) = %v, want %v", tt.g, got, tt.want)
		}
	}
}

// TestDaesoonPillars_Structure calls DaesoonPillars with fixed birth; when sxtwl is available, checks period and that 年柱=月柱 for step 0.
func TestDaesoonPillars_Structure(t *testing.T) {
	hh, mm := 10, 0
	pillars, period, err := DaesoonPillars(1990, 5, 15, &hh, &mm, "Asia/Seoul", "male", 0)
	if err != nil {
		t.Skipf("DaesoonPillars requires sxtwl (birth pillars): %v", err)
		return
	}
	if period != "대운 0" {
		t.Errorf("period = %q, want 대운 0", period)
	}
	if pillars.Year != pillars.Month {
		t.Errorf("for step 0, 年柱 should equal 月柱; got Year=%q Month=%q", pillars.Year, pillars.Month)
	}
	if pillars.Year == "" || pillars.Month == "" {
		t.Error("Year and Month should be non-empty")
	}
	if pillars.Day == "" || pillars.Hour == "" {
		t.Error("Day and Hour (from birth) should be non-empty")
	}
}

// TestDaesoonPillars_Step1 checks that step 1 produces a different 年/月 pillar from step 0 (when sxtwl available).
func TestDaesoonPillars_Step1(t *testing.T) {
	hh, mm := 10, 0
	p0, _, err := DaesoonPillars(1990, 5, 15, &hh, &mm, "Asia/Seoul", "male", 0)
	if err != nil {
		t.Skipf("DaesoonPillars requires sxtwl: %v", err)
		return
	}
	p1, period1, err := DaesoonPillars(1990, 5, 15, &hh, &mm, "Asia/Seoul", "male", 1)
	if err != nil {
		t.Fatalf("DaesoonPillars step 1: %v", err)
	}
	if period1 != "대운 1" {
		t.Errorf("period = %q, want 대운 1", period1)
	}
	if p1.Year == p0.Year && p1.Month == p0.Month {
		t.Errorf("step 1 should differ from step 0; got same 年/月 %q", p1.Year)
	}
}
