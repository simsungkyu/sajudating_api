package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
)

type IntOrString struct {
	raw   string // 항상 문자열 형태로 보관 (int로 오면 "123"로 저장)
	valid bool   // null/누락/"" 같은 “값 없음” 상태 구분용

	intV   int
	intOK  bool  // int로 해석 가능 여부
	intErr error // int로 못 바꾸는 이유(비숫자 문자열 등)
}

// UnmarshalJSON: int(123) / string("123") / string("N/A") / null 모두 수용
func (ios *IntOrString) UnmarshalJSON(b []byte) error {
	b = bytes.TrimSpace(b)

	// 기본 초기화
	*ios = IntOrString{}

	// null
	if bytes.Equal(b, []byte("null")) {
		return nil
	}

	// number -> raw="123", intOK=true
	var n int
	if err := json.Unmarshal(b, &n); err == nil {
		ios.valid = true
		ios.raw = strconv.Itoa(n)
		ios.intV = n
		ios.intOK = true
		return nil
	}

	// string -> raw=그대로, intOK는 숫자면 true
	var s string
	if err := json.Unmarshal(b, &s); err == nil {
		ios.valid = true
		ios.raw = s

		if s == "" {
			// 빈 문자열은 “값 없음”으로 취급(정책)
			ios.valid = false
			return nil
		}

		x, err := strconv.Atoi(s)
		if err != nil {
			ios.intOK = false
			ios.intErr = fmt.Errorf("not an int: %q", s)
			return nil // Unmarshal 자체는 성공시키고, int로 뽑을 때 에러를 주는 정책
		}

		ios.intV = x
		ios.intOK = true
		return nil
	}

	// 그 외 타입은 JSON 형태가 이상하므로 Unmarshal 실패
	return fmt.Errorf("IntOrString: expected int/string/null, got %s", string(b))
}

// Int: int 값을 가져올 때는 에러를 함께 전달
func (ios IntOrString) Int() (int, error) {
	if !ios.valid {
		return 0, fmt.Errorf("value is missing (null/empty/missing)")
	}
	if ios.intOK {
		return ios.intV, nil
	}
	if ios.intErr != nil {
		return 0, ios.intErr
	}
	return 0, fmt.Errorf("value %q cannot be parsed as int", ios.raw)
}

// String (toString): 무조건 에러 없이 문자열 반환
func (ios IntOrString) String() string {
	if !ios.valid {
		return "" // null/누락/"" 정책: 빈 문자열 반환
	}
	return ios.raw
}

// Optional: 값 존재 여부
func (ios IntOrString) Valid() bool { return ios.valid }
