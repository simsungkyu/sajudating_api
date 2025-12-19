package entity

// ai meta 정보

type AIMeta struct {
	Uid         string  `bson:"uid"`
	Name        string  `bson:"name"`
	Desc        string  `bson:"desc"`
	Prompt      string  `bson:"prompt"`
	MetaType    string  `bson:"meta_type"`
	Model       string  `bson:"model"`
	Temperature float64 `bson:"temperature"`
	MaxTokens   int     `bson:"max_tokens"`
	Size        string  `bson:"size"`
	InUse       bool    `bson:"in_use"`
	CreatedAt   int64   `bson:"created_at"`
	UpdatedAt   int64   `bson:"updated_at"`
}

type AiExecution struct {
	Uid       string `bson:"uid"`
	CreatedAt int64  `bson:"created_at"`
	UpdatedAt int64  `bson:"updated_at"`

	MetaUid       string  `bson:"meta_uid"`
	MetaType      string  `bson:"meta_type"`
	PromptType    string  `bson:"prompt_type"` // text, vision, image
	Prompt        string  `bson:"prompt"`
	ValuedPrompt  string  `bson:"valued_prompt"`
	IntputKV_JSON string  `bson:"intput_kv_json"`
	OutputKV_JSON string  `bson:"output_kv_json"`
	Model         string  `bson:"model"`
	Temperature   float64 `bson:"temperature"`
	MaxTokens     int     `bson:"max_tokens"`
	Size          string  `bson:"size"`
	Status        string  `bson:"status"` // running, done, failed
	ErrorMessage  string  `bson:"error_message"`

	//
	ElapsedTime  int    `bson:"elapsed_time"`
	OutputText   string `bson:"output_text"`
	InputTokens  int    `bson:"input_tokens"`
	OutputTokens int    `bson:"output_tokens"`
	TotalTokens  int    `bson:"total_tokens"`

	RunBy             string `bson:"run_by"` // admin, system
	RunSajuProfileUid string `bson:"run_saju_profile_uid"`
}
