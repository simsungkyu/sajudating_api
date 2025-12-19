package types

type ImageData struct {
	Data     []byte
	MimeType string
}

type APIResponse[T any] struct {
	Data    T       `json:"data,omitempty"`
	Error   *string `json:"error,omitempty"`
	Message *string `json:"message,omitempty"`
}

// SajuStatus
type SajuStatus string

const (
	SajuStatusInitiate   SajuStatus = "initiate"
	SajuStatusInProgress SajuStatus = "inprogress"
	SajuStatusDone       SajuStatus = "done"
	SajuStatusError      SajuStatus = "error"
)

type SajuProfile struct {
	Uid       string     `json:"uid"`
	CreatedAt int64      `json:"created_at,omitempty"`
	Sex       string     `json:"sex,omitempty"`
	Birthdate string     `json:"birthdate,omitempty"`
	Status    SajuStatus `json:"status,omitempty"`

	Palja          string `json:"palja,omitempty"`            // 팔자
	PaljaHanja     string `json:"palja_hanja,omitempty"`      // 팔자 한자
	PaljaMainShape string `json:"palja_main_shape,omitempty"` // 팔자 일주 형상
	Image          string `json:"image,omitempty"`            // base64 encoded image
	PartnerImage   string `json:"partner_image,omitempty"`    // base64 encoded image

	Nickname string          `json:"nickname,omitempty"` // saju
	Saju     SajuContent     `json:"saju,omitempty"`     // saju
	Kwansang KwansangContent `json:"kwansang,omitempty"` // kwansang
}

type SajuContent struct {
	Summary     string `json:"summary,omitempty"`
	Content     string `json:"content,omitempty"`
	PartnerTips string `json:"partner_tips,omitempty"`
}

type KwansangContent struct {
	Summary         string `json:"summary,omitempty"`
	Content         string `json:"content,omitempty"`
	Partner_summary string `json:"partner_summary,omitempty"`
}

type AiMetaType string

const (
	AiMetaTypeSaju                    AiMetaType = "Saju"
	AiMetaTypeFaceFeature             AiMetaType = "FaceFeature"
	AiMetaTypePhy                     AiMetaType = "Phy"
	AiMetaTypeIdealPartnerImageMale   AiMetaType = "IdealPartnerImageMale"
	AiMetaTypeIdealPartnerImageFemale AiMetaType = "IdealPartnerImageFemale"
)
