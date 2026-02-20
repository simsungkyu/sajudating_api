// cardtools.go: MCP tools for itemncard register/update (CardDataStructure or ChemiStructure).
package mcplocal

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/service"
)

// registerCardArgs is the input for the register_card tool (single card JSON per CardDataStructure/ChemiStructure).
type registerCardArgs struct {
	CardJSON string `json:"card_json"`
}

// updateCardArgs is the input for the update_card tool (uid + partial/full card JSON).
type updateCardArgs struct {
	UID      string `json:"uid"`
	CardJSON string `json:"card_json"`
}

// listCardsArgs is the input for the list_cards tool (optional filters).
type listCardsArgs struct {
	Scope    string `json:"scope"`    // "saju" | "pair" | ""
	Status   string `json:"status"`   // e.g. "published" | ""
	Category string `json:"category"` // exact or ""
	CardID   string `json:"card_id"`  // substring match or ""
	Limit    int    `json:"limit"`    // max results (default 50)
}

// cardJSONShape is the parsed card object (snake_case from CardDataStructure/ChemiStructure).
type cardJSONShape struct {
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

func cardJSONToInput(raw string) (model.ItemNCardInput, error) {
	var c cardJSONShape
	if err := json.Unmarshal([]byte(raw), &c); err != nil {
		return model.ItemNCardInput{}, fmt.Errorf("invalid card_json: %w", err)
	}
	if c.CardID == "" {
		return model.ItemNCardInput{}, fmt.Errorf("card_id is required")
	}
	if c.Scope != "saju" && c.Scope != "pair" {
		return model.ItemNCardInput{}, fmt.Errorf("scope must be saju or pair")
	}
	if c.Title == "" {
		return model.ItemNCardInput{}, fmt.Errorf("title is required")
	}
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
	if c.Status == "" {
		c.Status = "draft"
	}
	if c.RuleSet == "" {
		c.RuleSet = "korean_standard_v1"
	}
	if c.Version == 0 {
		c.Version = 1
	}
	return model.ItemNCardInput{
		CardID:        c.CardID,
		Version:       c.Version,
		Status:        c.Status,
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
	}, nil
}

// RegisterCardJSON registers one card from JSON (CardDataStructure/ChemiStructure). Exported for CLI/scripts.
func RegisterCardJSON(ctx context.Context, cardJSON string) (ok bool, uid string, msg string) {
	return runRegisterCard(ctx, cardJSON)
}

func runRegisterCard(ctx context.Context, cardJSON string) (ok bool, uid string, msg string) {
	input, err := cardJSONToInput(cardJSON)
	if err != nil {
		return false, "", err.Error()
	}
	svc := service.NewAdminItemNCardService()
	res, err := svc.CreateItemnCard(ctx, input)
	if err != nil {
		return false, "", err.Error()
	}
	if res == nil || !res.Ok {
		if res != nil && res.Msg != nil {
			return false, "", *res.Msg
		}
		return false, "", "create failed"
	}
	if res.UID != nil {
		return true, *res.UID, ""
	}
	return true, "", ""
}

func runUpdateCard(ctx context.Context, uid, cardJSON string) (ok bool, msg string) {
	if uid == "" {
		return false, "uid is required"
	}
	input, err := cardJSONToInput(cardJSON)
	if err != nil {
		return false, err.Error()
	}
	svc := service.NewAdminItemNCardService()
	res, err := svc.UpdateItemnCard(ctx, uid, input)
	if err != nil {
		return false, err.Error()
	}
	if res == nil || !res.Ok {
		if res != nil && res.Msg != nil {
			return false, *res.Msg
		}
		return false, "update failed"
	}
	return true, ""
}

func formatToolResult(ok bool, uid, msg string) string {
	if ok {
		if uid != "" {
			return fmt.Sprintf(`{"ok":true,"uid":%s}`, strconv.Quote(uid))
		}
		return `{"ok":true}`
	}
	return fmt.Sprintf(`{"ok":false,"msg":%s}`, strconv.Quote(msg))
}

// listCardSummary is one card summary for list_cards output.
type listCardSummary struct {
	CardID string `json:"card_id"`
	UID    string `json:"uid"`
	Scope  string `json:"scope"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

// runListCards returns card summaries for MCP list_cards (calls GetItemnCards).
func runListCards(ctx context.Context, scope, status, category, cardIDSubstr string, limit int) (summaries []listCardSummary, msg string) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	input := model.ItemNCardSearchInput{
		Limit:  limit,
		Offset: 0,
	}
	if scope != "" {
		input.Scope = &scope
	}
	if status != "" {
		input.Status = &status
	}
	if category != "" {
		input.Category = &category
	}
	svc := service.NewAdminItemNCardService()
	res, err := svc.GetItemnCards(ctx, input)
	if err != nil {
		return nil, err.Error()
	}
	if res == nil || !res.Ok {
		if res != nil && res.Msg != nil {
			return nil, *res.Msg
		}
		return nil, "list failed"
	}
	nodes := res.Nodes
	if nodes == nil {
		return []listCardSummary{}, ""
	}
	for _, n := range nodes {
		node, ok := n.(*model.ItemNCard)
		if !ok {
			continue
		}
		if cardIDSubstr != "" && !strings.Contains(node.CardID, cardIDSubstr) {
			continue
		}
		summaries = append(summaries, listCardSummary{
			CardID: node.CardID,
			UID:    node.UID,
			Scope:  node.Scope,
			Title:  node.Title,
			Status: node.Status,
		})
	}
	return summaries, ""
}
