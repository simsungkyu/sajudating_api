package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"sajudating_api/api/admgql/model"
	extdao "sajudating_api/api/ext_dao"
)

func TestExtractSajuGql_Success(t *testing.T) {
	called := 0
	svc := newExtractSajuPairServiceWithDeps(
		func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error) {
			called++
			if y != 1990 || m != 5 || d != 15 {
				t.Fatalf("unexpected date: %04d-%02d-%02d", y, m, d)
			}
			if hh == nil || mm == nil || *hh != 10 {
				t.Fatalf("unexpected time: hh=%v mm=%v", hh, mm)
			}
			return buildMockSxtwlResult(6, 6, 7, 5, 4, 10, intPtr(9), intPtr(3)), nil
		},
		func() time.Time { return time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC) },
	)

	timePrec := model.ExtractTimePrecisionMinute
	res, err := svc.ExtractSajuGql(context.Background(), model.ExtractSajuInput{
		DtLocal:  "1990-05-15 10:24",
		Tz:       "Asia/Seoul",
		TimePrec: &timePrec,
		Engine:   &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
	})
	if err != nil {
		t.Fatalf("ExtractSajuGql() error = %v", err)
	}
	if !res.Ok {
		msg := ""
		if res.Msg != nil {
			msg = *res.Msg
		}
		t.Fatalf("ok = false, msg = %s", msg)
	}
	if called != 1 {
		t.Fatalf("sxtwl call count = %d, want 1", called)
	}
	node, ok := res.Node.(*model.ExtractSajuDoc)
	if !ok {
		t.Fatalf("node type = %T, want *model.ExtractSajuDoc", res.Node)
	}
	if node.DayMaster != 4 {
		t.Fatalf("dayMaster = %d, want 4", node.DayMaster)
	}
	if len(node.Pillars) != 4 {
		t.Fatalf("pillar count = %d, want 4", len(node.Pillars))
	}
}

func TestExtractSajuGql_FortuneBaseAndRangeLists(t *testing.T) {
	called := 0
	svc := newExtractSajuPairServiceWithDeps(
		func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error) {
			called++
			yStem := y % 10
			yBranch := y % 12
			mStem := m % 10
			mBranch := m % 12
			dStem := d % 10
			dBranch := d % 12
			var hStem, hBranch *int
			if hh != nil {
				hb := ((*hh + 1) / 2) % 12
				hs := hb % 10
				hStem = intPtr(hs)
				hBranch = intPtr(hb)
			}
			return buildMockSxtwlResult(yStem, yBranch, mStem, mBranch, dStem, dBranch, hStem, hBranch), nil
		},
		func() time.Time { return time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC) },
	)

	timePrec := model.ExtractTimePrecisionMinute
	res, err := svc.ExtractSajuGql(context.Background(), model.ExtractSajuInput{
		DtLocal:       "1990-05-15 10:24",
		Tz:            "Asia/Seoul",
		TimePrec:      &timePrec,
		FortuneBaseDt: strPtr("2026-03-20 09:00"),
		SeunFromYear:  intPtr(2025),
		SeunToYear:    intPtr(2027),
		WolunYear:     intPtr(2026),
		IlunYear:      intPtr(2026),
		IlunMonth:     intPtr(3),
		Engine:        &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
	})
	if err != nil {
		t.Fatalf("ExtractSajuGql() error = %v", err)
	}
	if !res.Ok {
		t.Fatalf("ok = false, msg = %v", res.Msg)
	}
	node, ok := res.Node.(*model.ExtractSajuDoc)
	if !ok {
		t.Fatalf("node type = %T, want *model.ExtractSajuDoc", res.Node)
	}
	if node.Seun == nil || node.Seun.Year != 2026 {
		t.Fatalf("seun point = %+v, want year=2026", node.Seun)
	}
	if len(node.SeunList) != 3 {
		t.Fatalf("seunList len = %d, want 3", len(node.SeunList))
	}
	if len(node.WolunList) != 12 {
		t.Fatalf("wolunList len = %d, want 12", len(node.WolunList))
	}
	if len(node.IlunList) != 31 {
		t.Fatalf("ilunList len = %d, want 31", len(node.IlunList))
	}
	if node.SeunList[0].Year != 2025 || node.SeunList[2].Year != 2027 {
		t.Fatalf("seunList years = [%d..%d], want [2025..2027]", node.SeunList[0].Year, node.SeunList[2].Year)
	}
	if node.WolunList[0].Month != 1 || node.WolunList[11].Month != 12 {
		t.Fatalf("wolunList months = [%d..%d], want [1..12]", node.WolunList[0].Month, node.WolunList[11].Month)
	}
	if node.IlunList[0].Day != 1 || node.IlunList[30].Day != 31 {
		t.Fatalf("ilunList days = [%d..%d], want [1..31]", node.IlunList[0].Day, node.IlunList[30].Day)
	}
	const expectedCalls = 1 + 1 + 3 + 12 + 31
	if called != expectedCalls {
		t.Fatalf("sxtwl call count = %d, want %d", called, expectedCalls)
	}
}

func TestExtractSajuGql_InvalidDt(t *testing.T) {
	svc := newExtractSajuPairServiceWithDeps(
		func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error) {
			return nil, errors.New("should not be called")
		},
		nil,
	)
	res, err := svc.ExtractSajuGql(context.Background(), model.ExtractSajuInput{
		DtLocal: "bad-format",
		Engine:  &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
	})
	if err != nil {
		t.Fatalf("ExtractSajuGql() error = %v", err)
	}
	if res.Ok {
		t.Fatal("expected ok=false")
	}
	if res.Msg == nil || !strings.Contains(*res.Msg, "invalid dtLocal") {
		t.Fatalf("msg = %v, want contains invalid dtLocal", res.Msg)
	}
}

func TestExtractPairGql_Success(t *testing.T) {
	call := 0
	svc := newExtractSajuPairServiceWithDeps(
		func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error) {
			call++
			if call == 1 {
				return buildMockSxtwlResult(6, 6, 7, 5, 4, 10, intPtr(9), intPtr(3)), nil
			}
			return buildMockSxtwlResult(1, 1, 6, 8, 8, 4, intPtr(2), intPtr(8)), nil
		},
		func() time.Time { return time.Date(2026, 2, 15, 0, 0, 0, 0, time.UTC) },
	)

	timePrec := model.ExtractTimePrecisionMinute
	in := model.ExtractPairInput{
		A: &model.ExtractSajuInput{
			DtLocal:  "1990-05-15 10:24",
			Tz:       "Asia/Seoul",
			TimePrec: &timePrec,
			Engine:   &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
		},
		B: &model.ExtractSajuInput{
			DtLocal:  "1992-11-03 16:40",
			Tz:       "Asia/Seoul",
			TimePrec: &timePrec,
			Engine:   &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
		},
		Engine: &model.ExtractEngineInput{Name: "pair_engine", Ver: "1"},
	}

	res, err := svc.ExtractPairGql(context.Background(), in)
	if err != nil {
		t.Fatalf("ExtractPairGql() error = %v", err)
	}
	if !res.Ok {
		msg := ""
		if res.Msg != nil {
			msg = *res.Msg
		}
		t.Fatalf("ok = false, msg = %s", msg)
	}
	if call != 2 {
		t.Fatalf("sxtwl call count = %d, want 2", call)
	}
	node, ok := res.Node.(*model.ExtractPairDoc)
	if !ok {
		t.Fatalf("node type = %T, want *model.ExtractPairDoc", res.Node)
	}
	if node.Metrics == nil || node.Metrics.NetIndex == nil {
		t.Fatalf("expected metrics/netIndex: %+v", node.Metrics)
	}
	if node.Charts == nil || node.Charts.A == nil || node.Charts.B == nil {
		t.Fatalf("expected charts: %+v", node.Charts)
	}
}

func TestExtractPairGql_SxtwlError(t *testing.T) {
	call := 0
	svc := newExtractSajuPairServiceWithDeps(
		func(y, m, d int, hh, mm *int, timezone string, longitude *float64) (*extdao.SxtwlResult, error) {
			call++
			if call == 1 {
				return buildMockSxtwlResult(6, 6, 7, 5, 4, 10, intPtr(9), intPtr(3)), nil
			}
			return nil, errors.New("python unavailable")
		},
		nil,
	)
	timePrec := model.ExtractTimePrecisionMinute
	res, err := svc.ExtractPairGql(context.Background(), model.ExtractPairInput{
		A: &model.ExtractSajuInput{
			DtLocal:  "1990-05-15 10:24",
			Tz:       "Asia/Seoul",
			TimePrec: &timePrec,
			Engine:   &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
		},
		B: &model.ExtractSajuInput{
			DtLocal:  "1992-11-03 16:40",
			Tz:       "Asia/Seoul",
			TimePrec: &timePrec,
			Engine:   &model.ExtractEngineInput{Name: "sxtwl", Ver: "1"},
		},
		Engine: &model.ExtractEngineInput{Name: "pair_engine", Ver: "1"},
	})
	if err != nil {
		t.Fatalf("ExtractPairGql() error = %v", err)
	}
	if res.Ok {
		t.Fatal("expected ok=false")
	}
	if res.Msg == nil || !strings.Contains(*res.Msg, "failed to calculate B") {
		t.Fatalf("msg = %v, want contains failed to calculate B", res.Msg)
	}
}

func buildMockSxtwlResult(yTg, yDz, mTg, mDz, dTg, dDz int, hTg, hDz *int) *extdao.SxtwlResult {
	res := &extdao.SxtwlResult{}
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
			Tg:         *hTg,
			Dz:         *hDz,
			ActualHour: 0,
			ActualMin:  0,
		}
	}
	return res
}

func intPtr(v int) *int {
	x := v
	return &x
}

func strPtr(v string) *string {
	x := v
	return &x
}
