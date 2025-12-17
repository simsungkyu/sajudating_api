package entity

// ai meta 정보

type AIMeta struct {
	Uid       string `bson:"uid"`
	Name      string `bson:"name"`
	Desc      string `bson:"desc"`
	Prompt    string `bson:"prompt"`
	MetaType  string `bson:"meta_type"`
	CreatedAt int64  `bson:"created_at"`
	UpdatedAt int64  `bson:"updated_at"`
}

type AiExecution struct {
	Uid          string   `bson:"uid"`
	CreatedAt    int64    `bson:"created_at"`
	UpdatedAt    int64    `bson:"updated_at"`
	MetaUid      string   `bson:"meta_uid"`
	MetaType     string   `bson:"meta_type"`
	Prompt       string   `bson:"prompt"`
	Params       []string `bson:"params"`
	Model        string   `bson:"model"`
	Temperature  float64  `bson:"temperature"`
	MaxTokens    int      `bson:"max_tokens"`
	Size         string   `bson:"size"`
	Status       string   `bson:"status"` // running, done, failed
	ErrorMessage string   `bson:"error_message"`
	//
	OutputText  string `bson:"output_text"`
	OutputImage string `bson:"output_image"`
}
