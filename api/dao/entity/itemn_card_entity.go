// ItemNCard entity for 사주/궁합 데이터 카드 (itemn_cards collection).
package entity

// ItemNCard holds one data card (saju or pair scope) per CardDataStructure/ChemiStructure.
type ItemNCard struct {
	Uid            string   `bson:"uid"`
	CardID         string   `bson:"card_id"`
	Version        int      `bson:"version"`
	Status         string   `bson:"status"` // e.g. published, draft
	RuleSet        string   `bson:"rule_set"`
	Scope          string   `bson:"scope"` // "saju" | "pair", default saju
	Title          string   `bson:"title"`
	Category       string   `bson:"category"`
	Tags           []string `bson:"tags"`
	Domains        []string `bson:"domains"`
	Priority       int      `bson:"priority"`
	TriggerJSON    string   `bson:"trigger_json"`
	ScoreJSON      string   `bson:"score_json"`
	ContentJSON    string   `bson:"content_json"`
	CooldownGroup  string   `bson:"cooldown_group"`
	MaxPerUser     int      `bson:"max_per_user"`
	DebugJSON      string   `bson:"debug_json"`
	DeletedAt      int64    `bson:"deleted_at"` // 0 = not deleted; UnixMilli when soft-deleted (PRD §2-2)
	CreatedAt      int64    `bson:"created_at"`
	UpdatedAt      int64    `bson:"updated_at"`
}
