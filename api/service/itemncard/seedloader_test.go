// seedloader_test.go: Unit tests for LoadSeedCardsByScope and GetSeedDir.
// Fix: testdata path was cwd-relative and failed when go test runs from package dir; use runtime.Caller(0) to resolve testdata next to this file.
package itemncard

import (
	"path/filepath"
	"runtime"
	"testing"
)

// testdataDir returns the testdata directory next to this test file (works from any cwd).
func testdataDir(t *testing.T) string {
	_, file, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(file), "testdata")
}

func TestLoadSeedCardsByScope_saju(t *testing.T) {
	testdataDir := testdataDir(t)
	cards, err := LoadSeedCardsByScope(testdataDir, "saju")
	if err != nil {
		t.Fatalf("LoadSeedCardsByScope(saju): %v", err)
	}
	if len(cards) < 1 {
		t.Fatalf("expected at least 1 saju card from testdata, got %d", len(cards))
	}
	found := false
	for _, c := range cards {
		if c.CardID == "오행_금_강함_v1" && c.Scope == "saju" {
			found = true
			if c.Uid != "seed-오행_금_강함_v1" {
				t.Errorf("expected uid seed-오행_금_강함_v1, got %s", c.Uid)
			}
			if c.TriggerJSON == "" {
				t.Error("expected trigger_json set")
			}
			if c.Status != "published" {
				t.Errorf("expected status published, got %s", c.Status)
			}
			break
		}
	}
	if !found {
		t.Errorf("expected card 오행_금_강함_v1 (saju) in results; got %d cards", len(cards))
	}
}

func TestLoadSeedCardsByScope_pair(t *testing.T) {
	testdataDir := testdataDir(t)
	cards, err := LoadSeedCardsByScope(testdataDir, "pair")
	if err != nil {
		t.Fatalf("LoadSeedCardsByScope(pair): %v", err)
	}
	if len(cards) < 1 {
		t.Fatalf("expected at least 1 pair card from testdata, got %d", len(cards))
	}
	found := false
	for _, c := range cards {
		if c.CardID == "궁합_합_일지_v1" && c.Scope == "pair" {
			found = true
			if c.Uid != "seed-궁합_합_일지_v1" {
				t.Errorf("expected uid seed-궁합_합_일지_v1, got %s", c.Uid)
			}
			if c.TriggerJSON == "" {
				t.Error("expected trigger_json set")
			}
			break
		}
	}
	if !found {
		t.Errorf("expected card 궁합_합_일지_v1 (pair) in results; got %d cards", len(cards))
	}
}

func TestLoadSeedCardsByScope_unknownScope(t *testing.T) {
	testdataDir := testdataDir(t)
	cards, err := LoadSeedCardsByScope(testdataDir, "unknown")
	if err != nil {
		t.Fatalf("LoadSeedCardsByScope(unknown): unexpected error %v", err)
	}
	if len(cards) != 0 {
		t.Errorf("expected 0 cards for unknown scope, got %d", len(cards))
	}
}

func TestGetSeedDir(t *testing.T) {
	dir := GetSeedDir()
	if dir == "" {
		t.Error("GetSeedDir returned empty")
	}
	// Should contain "itemNcard" and "seed" in path when unset
	if !filepath.IsAbs(dir) {
		// relative path should end with docs/saju/itemNcard/seed or similar
		if dir != "" && len(dir) < 5 {
			t.Errorf("GetSeedDir returned suspicious short path: %s", dir)
		}
	}
}
