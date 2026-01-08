package entity

type AdminUser struct {
	Uid       string `bson:"uid"`
	CreatedAt int64  `bson:"created_at"`
	UpdatedAt int64  `bson:"updated_at"`
	Username  string `bson:"username"`
	Email     string `bson:"email"`      // required email for login
	Password  string `bson:"password"`   // hashed password
	SecretKey string `bson:"secret_key"` // secret key for google otp
	IsActive  bool   `bson:"is_active"`  // active status

	LastLoginAt int64  `bson:"last_login_at"`
	SessionKey  string `bson:"session_key"` // 로그인 세션키 - 로그인시 세션키 생성
}

type AdminUserLog struct {
	Uid       string `bson:"uid"`
	AdminUid  string `bson:"admin_uid"`
	CreatedAt int64  `bson:"created_at"`
	Type      string `bson:"type"` // login, logout
	Msg       string `bson:"msg"`
}
