// seedloader.go: Load itemNcard seed JSON from a directory (CardDataStructure/ChemiStructure) into entity.ItemNCard.
package itemncard

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"

	"sajudating_api/api/dao/entity"
)

// seedJSONShape parses seed file JSON (snake_case per CardDataStructure/ChemiStructure).
type seedJSONShape struct {
	CardID        string          `json:"card_id"`
	Scope         string          `json:"scope"`
	Title         string          `json:"title"`
	Trigger       json.RawMessage `json:"trigger"`
	Score         json.RawMessage `json:"score"`
	Content       json.RawMessage `json:"content"`
	Debug         json.RawMessage `json:"debug"`
	Status        string          `json:"status"`
	RuleSet       string          `json:"rule_set"`
	Category      string          `json:"category"`
	Tags          []string        `json:"tags"`
	Domains       []string        `json:"domains"`
	Priority      int             `json:"priority"`
	CooldownGroup string          `json:"cooldown_group"`
	MaxPerUser    int             `json:"max_per_user"`
	Version       int             `json:"version"`
}

// GetSeedDir returns the seed directory path: ITEMNCARD_SEED_DIR if set (absolute or cwd-relative),
// else ../docs/saju/itemNcard/seed when cwd is api/, or docs/saju/itemNcard/seed when cwd is repo root.
func GetSeedDir() string {
	if dir := os.Getenv("ITEMNCARD_SEED_DIR"); dir != "" {
		if filepath.IsAbs(dir) {
			return dir
		}
		cwd, _ := os.Getwd()
		return filepath.Join(cwd, dir)
	}
	cwd, _ := os.Getwd()
	if strings.HasSuffix(filepath.Clean(cwd), "api") {
		return filepath.Join(cwd, "..", "docs", "saju", "itemNcard", "seed")
	}
	return filepath.Join(cwd, "docs", "saju", "itemNcard", "seed")
}

// seedToEntity maps a parsed seed JSON shape to entity.ItemNCard (uid = "seed-" + card_id, status default published).
func seedToEntity(c *seedJSONShape) entity.ItemNCard {
	triggerStr := "{}"
	if len(c.Trigger) > 0 {
		triggerStr = string(c.Trigger)
	}
	scoreStr := "{}"
	if len(c.Score) > 0 {
		scoreStr = string(c.Score)
	}
	contentStr := "{}"
	if len(c.Content) > 0 {
		contentStr = string(c.Content)
	}
	debugStr := "{}"
	if len(c.Debug) > 0 {
		debugStr = string(c.Debug)
	}
	status := c.Status
	if status == "" {
		status = "published"
	}
	if c.RuleSet == "" {
		c.RuleSet = "korean_standard_v1"
	}
	if c.Version == 0 {
		c.Version = 1
	}
	return entity.ItemNCard{
		Uid:           "seed-" + c.CardID,
		CardID:        c.CardID,
		Version:       c.Version,
		Status:        status,
		RuleSet:       c.RuleSet,
		Scope:         c.Scope,
		Title:         c.Title,
		Category:      c.Category,
		Tags:          c.Tags,
		Domains:       c.Domains,
		Priority:      c.Priority,
		TriggerJSON:   triggerStr,
		ScoreJSON:     scoreStr,
		ContentJSON:   contentStr,
		CooldownGroup: c.CooldownGroup,
		MaxPerUser:    c.MaxPerUser,
		DebugJSON:     debugStr,
		DeletedAt:     0,
		CreatedAt:     0,
		UpdatedAt:     0,
	}
}

// LoadSeedCardsByScope reads *.json from seedDir, filters by scope (saju_* -> saju, pair_* -> pair), and returns []entity.ItemNCard.
// Parse errors are logged and that file is skipped.
func LoadSeedCardsByScope(seedDir string, scope string) ([]entity.ItemNCard, error) {
	entries, err := os.ReadDir(seedDir)
	if err != nil {
		return nil, err
	}
	var prefix string
	switch scope {
	case "saju":
		prefix = "saju_"
	case "pair":
		prefix = "pair_"
	default:
		return nil, nil
	}
	var cards []entity.ItemNCard
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".json") {
			continue
		}
		if !strings.HasPrefix(e.Name(), prefix) {
			continue
		}
		path := filepath.Join(seedDir, e.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			log.Printf("[seedloader] read %s: %v", path, err)
			continue
		}
		var c seedJSONShape
		if err := json.Unmarshal(data, &c); err != nil {
			log.Printf("[seedloader] parse %s: %v", path, err)
			continue
		}
		if c.CardID == "" || c.Scope == "" {
			log.Printf("[seedloader] skip %s: missing card_id or scope", path)
			continue
		}
		if c.Scope != scope {
			continue
		}
		cards = append(cards, seedToEntity(&c))
	}
	return cards, nil
}
