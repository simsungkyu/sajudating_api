package dto

type UserCreateRequest struct {
	Email     string `json:"email"`
	Birthdate string `json:"birthdate"`
}

type UserResponse struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Birthdate     string `json:"birthdate"`
	ImageMimeType string `json:"image_mime_type,omitempty"`
	HasImage      bool   `json:"has_image"`
	CreatedAt     string `json:"created_at"`
}

type SajuProfileResponse struct {
	Uid           string `json:"uid"`
	Email         string `json:"email"`
	Sex           string `json:"sex"`
	Birthdate     string `json:"birthdate"`
	ImageMimeType string `json:"image_mime_type,omitempty"`
	HasImage      bool   `json:"has_image"`
	CreatedAt     int64  `json:"created_at"`
}

type AdminAuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AdminAuthResponse struct {
	Token   string `json:"token"`
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PhyPartnerResponse struct {
	Uid              string `json:"uid"`
	Summary          string `json:"summary"`
	FeatureEyes      string `json:"feature_eyes"`
	FeatureNose      string `json:"feature_nose"`
	FeatureMouth     string `json:"feature_mouth"`
	FeatureFaceShape string `json:"feature_face_shape"`
	PersonalityMatch string `json:"personality_match"`
	Sex              string `json:"sex"`
	Age              string `json:"age"`
	ImageMimeType    string `json:"image_mime_type,omitempty"`
	HasImage         bool   `json:"has_image"`
	CreatedAt        int64  `json:"created_at"`
}

type PhyPartnerCreateRequest struct {
	PhyDesc       string `json:"phy_desc"`
	Sex           string `json:"sex"`
	Age           int    `json:"age"`
	ImageMimeType string `json:"image_mime_type,omitempty"`
}
