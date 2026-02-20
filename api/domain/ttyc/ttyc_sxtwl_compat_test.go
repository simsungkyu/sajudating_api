package domain

import "testing"

func TestCalculatePillars_SxtwlCompatCases(t *testing.T) {
	tz := 9 * 60

	tests := []struct {
		name string
		year int
		mon  int
		day  int
		hour int
		min  int

		yStem int
		yBr   int
		mStem int
		mBr   int
		dStem int
		dBr   int
		hStem int
		hBr   int
	}{
		{name: "1984-02-02", year: 1984, mon: 2, day: 2, hour: 12, min: 0, yStem: 9, yBr: 11, mStem: 1, mBr: 1, dStem: 2, dBr: 2, hStem: 0, hBr: 6},
		{name: "1984-02-04", year: 1984, mon: 2, day: 4, hour: 12, min: 0, yStem: 0, yBr: 0, mStem: 2, mBr: 2, dStem: 4, dBr: 4, hStem: 4, hBr: 6},
		{name: "2017-02-03", year: 2017, mon: 2, day: 3, hour: 12, min: 30, yStem: 3, yBr: 9, mStem: 8, mBr: 2, dStem: 7, dBr: 9, hStem: 0, hBr: 6},
		{name: "2017-02-04", year: 2017, mon: 2, day: 4, hour: 12, min: 30, yStem: 3, yBr: 9, mStem: 8, mBr: 2, dStem: 8, dBr: 10, hStem: 2, hBr: 6},
		{name: "2021-02-03", year: 2021, mon: 2, day: 3, hour: 12, min: 30, yStem: 7, yBr: 1, mStem: 6, mBr: 2, dStem: 8, dBr: 6, hStem: 2, hBr: 6},
		{name: "2022-02-01", year: 2022, mon: 2, day: 1, hour: 12, min: 0, yStem: 7, yBr: 1, mStem: 7, mBr: 1, dStem: 1, dBr: 9, hStem: 8, hBr: 6},
		{name: "1999-12-31", year: 1999, mon: 12, day: 31, hour: 23, min: 59, yStem: 5, yBr: 3, mStem: 2, mBr: 0, dStem: 3, dBr: 5, hStem: 6, hBr: 0},
		{name: "2000-01-01", year: 2000, mon: 1, day: 1, hour: 0, min: 0, yStem: 5, yBr: 3, mStem: 2, mBr: 0, dStem: 4, dBr: 6, hStem: 8, hBr: 0},
		{name: "2008-08-08", year: 2008, mon: 8, day: 8, hour: 8, min: 8, yStem: 4, yBr: 0, mStem: 6, mBr: 8, dStem: 6, dBr: 4, hStem: 6, hBr: 4},
		{name: "2030-11-07", year: 2030, mon: 11, day: 7, hour: 12, min: 30, yStem: 6, yBr: 10, mStem: 3, mBr: 11, dStem: 2, dBr: 6, hStem: 0, hBr: 6},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, err := ToUnixTimestamp(TtycTimestampParts{
				Year: tt.year, Month: tt.mon, Day: tt.day, Hour: tt.hour, Minute: tt.min,
			}, &tz)
			if err != nil {
				t.Fatalf("ToUnixTimestamp() error = %v", err)
			}

			got, err := CalculatePillars(TtycPillarCalcInput{
				Ts:              ts,
				TzOffsetMinutes: &tz,
				TimePrecision:   TtycTimePrecisionMinute,
			})
			if err != nil {
				t.Fatalf("CalculatePillars() error = %v", err)
			}
			if got.Pillars.Hour == nil {
				t.Fatalf("hour pillar is nil")
			}

			if got.Pillars.Year.Stem != tt.yStem || got.Pillars.Year.Branch != tt.yBr ||
				got.Pillars.Month.Stem != tt.mStem || got.Pillars.Month.Branch != tt.mBr ||
				got.Pillars.Day.Stem != tt.dStem || got.Pillars.Day.Branch != tt.dBr ||
				got.Pillars.Hour.Stem != tt.hStem || got.Pillars.Hour.Branch != tt.hBr {
				t.Fatalf("pillars mismatch got Y(%d,%d) M(%d,%d) D(%d,%d) H(%d,%d)",
					got.Pillars.Year.Stem, got.Pillars.Year.Branch,
					got.Pillars.Month.Stem, got.Pillars.Month.Branch,
					got.Pillars.Day.Stem, got.Pillars.Day.Branch,
					got.Pillars.Hour.Stem, got.Pillars.Hour.Branch,
				)
			}
		})
	}
}
