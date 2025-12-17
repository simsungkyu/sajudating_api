# API Specification

## 사주 프로필 API

### 1. 사주 프로필 생성
- (POST) /api/saju_profile
- 사용자의 사진, 성별, 생년월일 정보로 사주 프로필 생성
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `image`: File (이미지 파일)
  - `sex`: string (male/female)
  - `birthdate`: string (YYYYMMDDHHmm)
- **Response**:
  ```json
  {
    "uid": "string"
  }
  ```

### 2. 내 이미지 조회
- (GET) /api/saju_profile/:uid/my_image
- 해당 사주 프로필의 내 이미지 전달
- Path Parameters:
  - `uid`: 사주 프로필 고유 ID
- Response: Image file

### 3. 파트너 예시 이미지 조회
- (GET) /api/saju_profile/:uid/partner_image
- 해당 사주 프로필의 파트너 예시 이미지 전달
- Path Parameters:
  - `uid`: 사주 프로필 고유 ID
- Response: Image file

### 4. 사주 풀이 결과 조회
- (GET) /api/saju_profile/:uid/result
- 사주 풀이 및 텍스트 기반 결과 출력
- Path Parameters:
  - `uid`: 사주 프로필 고유 ID
- Response:
  ```json
  {
    "result": "string (사주 풀이 텍스트)"
  }
  ```

## 관리자 API

### Admin 기능
- (POST) /api/admin/auth - 관리자 인증
- (GET) /api/admin/saju_profiles 사주 프로필 목록 조회
- (GET) /api/admin/saju_profile/:uid  특정 사주 프로필 조회
- (GET) /api/admin/saju_profile/:uid/my_image  특정 사주 프로필의 내 이미지 조회
- (GET) /api/admin/saju_profile/:uid/partner_image  특정 사주 프로필의 파트너 예시 이미지 조회
- (GET) /api/admin/saju_profile/:uid/result  특정 사주 프로필의 사주 풀이 결과 조회
- (POST) /api/admin/saju_profile 사주 프로필 생성
- (PUT) /api/admin/saju_profile/:uid 특정 사주 프로필 수정
- (DELETE) /api/admin/saju_profile/:uid 특정 사주 프로필 삭제
- (POST) /api/admin/saju_profile/:uid/request_saju 사주 추론 동작 임의 요청
- (POST) /api/admin/saju_profile/:uid/request_phy 관상 추론 동작 임의 요청

- (GET) /api/admin/phy_partners 관상 파트너 목록 조회
- (GET) /api/admin/phy_partners/:uid 특정 관상 파트너 조회
- (POST) /api/admin/phy_partner 관상 파트너 생성
- (DELETE) /api/admin/phy_partner/:uid 특정 관상 파트너 삭제

- (GET) /api/admin/sxtwl 만세력 계산 birth=YYYYMMDDHHmm timezone=Asia/Seoul 형태로 요청시 만세력 계산 결과 반환