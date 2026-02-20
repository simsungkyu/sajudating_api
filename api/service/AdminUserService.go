// AdminUserService handles admin user authentication and management operations
package service

import (
	"context"
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"strings"

	"sajudating_api/api/admgql/model"
	"sajudating_api/api/converter"
	"sajudating_api/api/dao"
	"sajudating_api/api/dao/entity"
	"sajudating_api/api/utils"

	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type AdminUserService struct {
	adminUserRepo    *dao.AdminUserRepo
	adminUserLogRepo *dao.AdminUserLogRepo
}

func NewAdminUserService() *AdminUserService {
	return &AdminUserService{
		adminUserRepo:    dao.NewAdminUserRepo(),
		adminUserLogRepo: dao.NewAdminUserLogRepo(),
	}
}

// 로그인 - 권한없이 가능 - 로그인시 랜덤한 세션키를 생성하여, jwt 로 감싸서 전달.
// 로그인시 이메일 패스워드 그리고 google authentication 을 통해 생성된 opt 입력
// AdminUser의 이름은 jwt 내부 평문으로 리턴
// {uid: string, sessionkey: string} 의 JSON string을 jwt의 hashed 라는 필드로 환경변수 SECRET_KEY를 활용하여 암호화한뒤 전달
// 이후 인증서버에서는 이 암호화를 다시 복호화하여 유저uid를 참조한다.
// 로그인 시도 실패,성공 모두 로그 기록
func (s *AdminUserService) Login(ctx context.Context, email string, password string, otpCode string) (*model.SimpleResult, error) {
	// Find user by email
	user, err := s.adminUserRepo.FindByEmail(email)
	if err != nil {
		// Log failed login attempt
		s.logAdminUserAction(ctx, "", "login", fmt.Sprintf("Login failed: user not found - %s", email), false)
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Invalid email or password"),
		}, nil
	}

	// Check if user is active
	if !user.IsActive {
		s.logAdminUserAction(ctx, user.Uid, "login", fmt.Sprintf("Login failed: user not active - %s", email), false)
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("User account is not active"),
		}, nil
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		s.logAdminUserAction(ctx, user.Uid, "login", fmt.Sprintf("Login failed: invalid password - %s", email), false)
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Invalid email or password"),
		}, nil
	}

	// Verify OTP
	valid := totp.Validate(otpCode, user.SecretKey)
	if !valid {
		s.logAdminUserAction(ctx, user.Uid, "login", fmt.Sprintf("Login failed: invalid OTP - %s", email), false)
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Invalid OTP code"),
		}, nil
	}

	// Generate session key
	sessionKey := utils.GenUid()

	// Update user session key and last login time
	err = s.adminUserRepo.UpdateSessionKey(user.Uid, sessionKey)
	if err != nil {
		s.logAdminUserAction(ctx, user.Uid, "login", fmt.Sprintf("Login failed: database error - %s", err.Error()), false)
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Failed to update session"),
		}, nil
	}

	// Generate JWT token
	token, err := utils.GenerateAdminToken(user.Uid, sessionKey)
	if err != nil {
		s.logAdminUserAction(ctx, user.Uid, "login", fmt.Sprintf("Login failed: token generation error - %s", err.Error()), false)
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Failed to generate token"),
		}, nil
	}

	// Log successful login
	s.logAdminUserAction(ctx, user.Uid, "login", fmt.Sprintf("Login successful - %s", email), true)

	return &model.SimpleResult{
		Ok:    true,
		Value: utils.StrPtr(token),
		Msg:   utils.StrPtr(user.Username),
	}, nil
}

// 로그아웃 - 로그인 권한 필요
func (s *AdminUserService) Logout(ctx context.Context) (*model.SimpleResult, error) {
	adminUID, err := utils.GetAdminUserUIDFromContext(ctx)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Authentication required"),
		}, nil
	}

	// Log logout
	s.logAdminUserAction(ctx, adminUID, "logout", "Logout successful", true)

	return &model.SimpleResult{
		Ok:  true,
		Msg: utils.StrPtr("Logout successful"),
	}, nil
}

// 관리자 생성 join - 권한없이 가능 - 이메일 중복체크 필요
// 계정생성시, SecretKey 랜덤생성하여 유저 전달 => ui에서 google otp 생성하는 qr code를 보여줄 예정
// isActive 기본값 false
func (s *AdminUserService) CreateAdminUser(ctx context.Context, email string, password string) (*model.SimpleResult, error) {
	// Check email duplication
	existingUser, err := s.adminUserRepo.FindByEmail(email)
	if err == nil && existingUser != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Email already exists"),
		}, nil
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Failed to hash password"),
		}, nil
	}

	// Generate OTP key and URL for QR code
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Y2SL Admin",
		AccountName: email,
	})
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Failed to generate OTP key"),
		}, nil
	}

	// Get the secret key from the generated key
	secretKey := key.Secret()

	// Create admin user
	user := &entity.AdminUser{
		Uid:       utils.GenUid(),
		Email:     email,
		Password:  string(hashedPassword),
		SecretKey: secretKey,
		IsActive:  false,
		Username:  email, // Use email as username by default
	}

	err = s.adminUserRepo.Create(user)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to create user: %s", err.Error())),
		}, nil
	}

	// Log user creation
	s.logAdminUserAction(ctx, user.Uid, "create", fmt.Sprintf("Admin user created - %s", email), true)

	// Return OTP URL for QR code generation
	return &model.SimpleResult{
		Ok:    true,
		UID:   utils.StrPtr(user.Uid),
		Value: utils.StrPtr(key.URL()), // OTP URL for QR code
		Msg:   utils.StrPtr("Admin user created successfully. Please scan QR code to set up OTP."),
	}, nil
}

// 관리자 활성화 비활성화 - 로그인 권한 필요 - 활성화 비활성화시 로그 기록
func (s *AdminUserService) SetAdminUserActive(ctx context.Context, uid string, active bool) (*model.SimpleResult, error) {
	// Get admin user from context (the one performing the action)
	adminUID, err := utils.GetAdminUserUIDFromContext(ctx)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Authentication required"),
		}, nil
	}

	// Find target user
	user, err := s.adminUserRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("User not found"),
		}, nil
	}

	// Update active status
	err = s.adminUserRepo.UpdateActive(uid, active)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to update user status: %s", err.Error())),
		}, nil
	}

	// Log the action
	action := "deactivate"
	if active {
		action = "activate"
	}
	s.logAdminUserAction(ctx, adminUID, action, fmt.Sprintf("User %s %sd by admin %s", user.Email, action, adminUID), true)

	return &model.SimpleResult{
		Ok:  true,
		Msg: utils.StrPtr(fmt.Sprintf("User %s successfully", action+"d")),
	}, nil
}

// 관리자 정보 수정 - 로그인 권한 필요
// 정보 수정시 로그 기록
func (s *AdminUserService) UpdateAdminUser(ctx context.Context, uid string, email string, password string) (*model.SimpleResult, error) {
	// Get admin user from context
	adminUID, err := utils.GetAdminUserUIDFromContext(ctx)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("Authentication required"),
		}, nil
	}

	// Find user to update
	user, err := s.adminUserRepo.FindByUID(uid)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr("User not found"),
		}, nil
	}

	// Check email duplication if email is being changed
	if user.Email != email {
		existingUser, err := s.adminUserRepo.FindByEmail(email)
		if err == nil && existingUser != nil && existingUser.Uid != uid {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr("Email already exists"),
			}, nil
		}
		user.Email = email
		user.Username = email // Update username to match email
	}

	// Hash new password if provided
	if password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return &model.SimpleResult{
				Ok:  false,
				Err: utils.StrPtr("Failed to hash password"),
			}, nil
		}
		user.Password = string(hashedPassword)
	}

	// Update user
	err = s.adminUserRepo.Update(user)
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to update user: %s", err.Error())),
		}, nil
	}

	// Log the action
	s.logAdminUserAction(ctx, adminUID, "update", fmt.Sprintf("User %s updated by admin %s", user.Email, adminUID), true)

	return &model.SimpleResult{
		Ok:  true,
		Msg: utils.StrPtr("User updated successfully"),
	}, nil
}

// GetAdminUsers returns all admin users as SimpleResult with nodes and total.
func (s *AdminUserService) GetAdminUsers(ctx context.Context) (*model.SimpleResult, error) {
	users, err := s.adminUserRepo.FindAll()
	if err != nil {
		return &model.SimpleResult{
			Ok:  false,
			Err: utils.StrPtr(fmt.Sprintf("Failed to list admin users: %v", err)),
		}, nil
	}
	nodes := make([]model.Node, len(users))
	for i := range users {
		nodes[i] = converter.AdminUserToModel(users[i])
	}
	return &model.SimpleResult{
		Ok:     true,
		Nodes:  nodes,
		Total:  utils.IntPtr(len(users)),
		Limit:  utils.IntPtr(len(users)),
		Offset: utils.IntPtr(0),
	}, nil
}

// Helper function to log admin user actions
func (s *AdminUserService) logAdminUserAction(ctx context.Context, adminUID string, logType string, msg string, success bool) {
	log := &entity.AdminUserLog{
		Uid:      utils.GenUid(),
		AdminUid: adminUID,
		Type:     logType,
		Msg:      msg,
	}

	// Try to get admin UID from context if not provided
	if adminUID == "" {
		if uid, err := utils.GetAdminUserUIDFromContext(ctx); err == nil {
			log.AdminUid = uid
		}
	}

	// Log the action (ignore errors)
	_ = s.adminUserLogRepo.Create(log)
}

// Helper function to generate secret key for OTP
func generateSecretKey() (string, error) {
	// Generate 20 random bytes
	bytes := make([]byte, 20)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	// Encode to base32 (standard for TOTP)
	secret := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(bytes)
	return strings.ToUpper(secret), nil
}
