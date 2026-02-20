// validation.go: server-side validation for itemncard card payload (trigger/score/content per CardDataStructure/ChemiStructure).
package itemncard

import (
	"encoding/json"
	"fmt"
	"strings"
)

// triggerEntry is one element in trigger.all / any / not.
type triggerEntry struct {
	Token string `json:"token"`
	Src   string `json:"src"` // required for pair scope: P, A, or B
}

// triggerShape is the trigger object (all, any, not arrays).
type triggerShape struct {
	All []triggerEntry `json:"all"`
	Any []triggerEntry `json:"any"`
	Not []triggerEntry `json:"not"`
}

// scoreEntry is one element in bonus_if / penalty_if.
type scoreEntry struct {
	Token string `json:"token"`
	Add   int    `json:"add"`
	Sub   int    `json:"sub"`
	Src   string `json:"src"` // optional for pair
}

// scoreShape is the score object.
type scoreShape struct {
	Base      json.Number   `json:"base"`
	BonusIf   []scoreEntry  `json:"bonus_if"`
	PenaltyIf []scoreEntry  `json:"penalty_if"`
}

// ValidateCardPayload validates trigger (and optionally score/content) for the given scope.
// Returns a short error message suitable for GraphQL/HTTP (e.g. "trigger.all[0]: missing token").
func ValidateCardPayload(scope, triggerJSON, scoreJSON string) error {
	if scope != "saju" && scope != "pair" {
		return fmt.Errorf("scope must be saju or pair")
	}
	if err := validateTrigger(scope, triggerJSON); err != nil {
		return err
	}
	if scoreJSON != "" && scoreJSON != "{}" {
		if err := validateScore(scope, scoreJSON); err != nil {
			return err
		}
	}
	return nil
}

func validateTrigger(scope, raw string) error {
	if raw == "" || raw == "{}" {
		return nil
	}
	var t triggerShape
	if err := json.Unmarshal([]byte(raw), &t); err != nil {
		return fmt.Errorf("trigger: invalid JSON: %w", err)
	}
	checkEntry := func(section string, i int, e triggerEntry) error {
		if strings.TrimSpace(e.Token) == "" {
			return fmt.Errorf("trigger.%s[%d]: missing token", section, i)
		}
		if scope == "pair" {
			s := strings.TrimSpace(e.Src)
			if s != "P" && s != "A" && s != "B" {
				return fmt.Errorf("trigger.%s[%d]: pair trigger entry src must be P, A, or B", section, i)
			}
		}
		return nil
	}
	for i, e := range t.All {
		if err := checkEntry("all", i, e); err != nil {
			return err
		}
	}
	for i, e := range t.Any {
		if err := checkEntry("any", i, e); err != nil {
			return err
		}
	}
	for i, e := range t.Not {
		if err := checkEntry("not", i, e); err != nil {
			return err
		}
	}
	return nil
}

func validateScore(scope, raw string) error {
	var s scoreShape
	if err := json.Unmarshal([]byte(raw), &s); err != nil {
		return fmt.Errorf("score: invalid JSON: %w", err)
	}
	// base is optional; if present should be numeric (already unmarshalled as json.Number)
	_ = s.Base
	checkScoreEntry := func(section string, i int, e scoreEntry) error {
		if strings.TrimSpace(e.Token) == "" {
			return fmt.Errorf("score.%s[%d]: missing token", section, i)
		}
		if scope == "pair" && e.Src != "" {
			src := strings.TrimSpace(e.Src)
			if src != "P" && src != "A" && src != "B" {
				return fmt.Errorf("score.%s[%d]: pair score entry src must be P, A, or B", section, i)
			}
		}
		return nil
	}
	for i, e := range s.BonusIf {
		if err := checkScoreEntry("bonus_if", i, e); err != nil {
			return err
		}
	}
	for i, e := range s.PenaltyIf {
		if err := checkScoreEntry("penalty_if", i, e); err != nil {
			return err
		}
	}
	return nil
}
