package entity

import "fmt"

type LocalLog struct {
	Uid       string `bson:"uid"`
	CreatedAt int64  `bson:"created_at"`
	ExpiresAt int64  `bson:"expires_at"` // 만료시간 - 삭제됨
	Status    string `bson:"status"`     // init / ing / done / error
	Text      string `bson:"text"`
}

type SajuProfile struct {
	Uid       string `bson:"uid"`
	CreatedAt int64  `bson:"created_at"`
	UpdatedAt int64  `bson:"updated_at"`
	Sex       string `bson:"sex"`       // 필수
	Palja     string `bson:"palja"`     // 팔자
	Birthdate string `bson:"birthdate"` // yyyymmddhhmm format (hhmm optional)
	// ImageData     []byte `bson:"image_data"` - 삭제됨
	ImageMimeType string `bson:"image_mime_type"`
	Email         string `bson:"email"`          // optional
	Status        string `bson:"status"`         // init / ing / done / error
	SajuStatus    string `bson:"saju_status"`    // init / ing / done / error
	PhyStatus     string `bson:"phy_status"`     // init / ing / done / error
	PartnerStatus string `bson:"partner_status"` // init / ing / done / error

	// 추론결과정보
	Nickname string `bson:"nickname"` // 사주기반
	// 내 사주요약
	SajuSummary string `bson:"saju_summary"`
	SajuContent string `bson:"saju_content"`

	// 내 얼굴특징정보
	MyFeatureEyes      string `bson:"my_feature_eyes"`
	MyFeatureNose      string `bson:"my_feature_nose"`
	MyFeatureMouth     string `bson:"my_feature_mouth"`
	MyFeatureFaceShape string `bson:"my_feature_face_shape"`
	MyFeatureNotes     string `bson:"my_feature_notes"`

	// 내 관상요약
	PhySummary string `bson:"phy_summary"`
	PhyContent string `bson:"phy_content"`
	PhyAge     int    `bson:"phy_age"` // 관상 추론 나이

	// Ideal match tips - 어떤 상대가 나에게 잘 맞는지 사주기반
	PartnerMatchTips string `bson:"partner_match_tips"`
	// 파트너 관상요약
	PartnerSummary          string `bson:"partner_summary"`
	PartnerFeatureEyes      string `bson:"partner_feature_eyes"`
	PartnerFeatureNose      string `bson:"partner_feature_nose"`
	PartnerFeatureMouth     string `bson:"partner_feature_mouth"`
	PartnerFeatureFaceShape string `bson:"partner_feature_face_shape"`
	PartnerPersonalityMatch string `bson:"partner_personality_match"`
	PartnerSex              string `bson:"partner_sex"`
	PartnerAge              int    `bson:"partner_age"`

	// 파트너 정보
	PhyPartnerUid        string  `bson:"phy_partner_uid"`        // 파트너 관상 UID
	PhyPartnerSimilarity float64 `bson:"phy_partner_similarity"` // 파트너 관상 유사도 - 생성시 1, 캐시에서 찾았다면 해당 유사도 값으로 설정
}

func (p *SajuProfile) GeneratePhyPartnerEmbeddingText() string {
	return fmt.Sprintf("요약:%s, 눈:%s, 코:%s, 입:%s, 얼굴형:%s, 성향:%s, 성별:%s, 나이:%d,",
		p.PartnerSummary, p.PartnerFeatureEyes, p.PartnerFeatureNose, p.PartnerFeatureMouth,
		p.PartnerFeatureFaceShape, p.PartnerPersonalityMatch, p.PartnerSex, p.PartnerAge)
}

// 파트너관상 이미지
// SajuProfile의 이미지 기반으로 상대방 이상형 특징 추론 결과 저장 및 이미지 생성 수정없음.
type PhyIdealPartner struct {
	Uid       string `bson:"uid"`
	CreatedAt int64  `bson:"created_at"`
	UpdatedAt int64  `bson:"updated_at"`
	CreatedBy string `bson:"created_by"` // Openai / Admin
	// Input - SajuProfile에서의 Ideal Partner Info와 동일하게 데이터 저장해준다. 추후 동일 input이 아니라도 유사도로써 판단 가능
	Summary          string `bson:"summary"`
	FeatureEyes      string `bson:"feature_eyes"`
	FeatureNose      string `bson:"feature_nose"`
	FeatureMouth     string `bson:"feature_mouth"`
	FeatureFaceShape string `bson:"feature_face_shape"`
	PersonalityMatch string `bson:"personality_match"`
	Sex              string `bson:"sex"`
	Age              int    `bson:"age"`

	// 임베딩 - 위의 input 값을 조합하여 임베딩 텍스트를 설정하고 임베딩 텍스트 기반으로 임베딩 벡터를 생성한다.
	EmbeddingModel string    `bson:"embedding_model"`
	EmbeddingText  string    `bson:"embedding_text"`
	Embedding      []float64 `bson:"embedding"`

	// Result 결과 저장
	HasImage      bool   `bson:"has_image"` // 이미지 생성 여부 - 임베딩 조회시 조건 설정
	ImageMimeType string `bson:"image_mime_type"`
	// ImageData     []byte `bson:"image_data"`

	// 유사도
	SimilarityScore float64 `bson:"similarity_score"`
}

func (p *PhyIdealPartner) GenerateEmbeddingText() string {
	return fmt.Sprintf("요약:%s, 눈:%s, 코:%s, 입:%s, 얼굴형:%s, 성향:%s, 성별:%s, 나이:%d,",
		p.Summary, p.FeatureEyes, p.FeatureNose, p.FeatureMouth, p.FeatureFaceShape, p.PersonalityMatch, p.Sex, p.Age)
}

type SajuProfileLog struct {
	Uid       string `bson:"uid"`
	SajuUid   string `bson:"saju_uid"`
	CreatedAt int64  `bson:"created_at"`
	Status    string `bson:"status"` // debug, error
	Text      string `bson:"text"`
}
