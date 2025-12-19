package utils

import (
	"testing"
)

func TestConvertPaljaToWithHanja(t *testing.T) {
	tests := []struct {
		name     string
		palja    string
		expected string
	}{
		{
			name:     "8글자 팔자 (연월일시)",
			palja:    "갑자을축병인정묘",
			expected: "갑자(甲子) 을축(乙丑) 병인(丙寅) 정묘(丁卯) ",
		},
		{
			name:     "6글자 팔자 (연월일)",
			palja:    "갑자을축병인",
			expected: "갑자(甲子) 을축(乙丑) 병인(丙寅) ",
		},
		{
			name:     "단일 간지",
			palja:    "무진",
			expected: "무진(戊辰) ",
		},
		{
			name:     "모든 천간지지 조합 샘플",
			palja:    "임자계해",
			expected: "임자(壬子) 계해(癸亥) ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConvertPaljaToWithHanja(tt.palja)
			if result != tt.expected {
				t.Errorf("ConvertPaljaToWithHanja(%q) = %q, expected %q", tt.palja, result, tt.expected)
			}
		})
	}
}

func TestCalculateTenStems(t *testing.T) {
	// TenStems = []string{"비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"}
	// 인덱스: 비견=0, 겁재=1, 식신=2, 상관=3, 편재=4, 정재=5, 편관=6, 정관=7, 편인=8, 정인=9
	// TG_ARRAY = []string{"갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"}
	// DZ_ARRAY = []string{"자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"}
	// TG_FE_INDEXES = []int{0, 0, 1, 1, 2, 2, 3, 3, 4, 4} (목,목,화,화,토,토,금,금,수,수)
	// DZ_FE_INDEXES = []int{4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4} (수,토,목,목,토,화,화,토,금,금,토,수)
	// JiJangGanPM = []int{1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0} (지지 음양: 0=양, 1=음)
	//
	// 계산식: diffFeIdx*2 + diffEng
	// diffFeIdx: (chFEIdx - benonFEIdx + 5) % 5
	// diffEng: benonTGIdx%2 != JiJangGanPM[chIdx] 일 때 1 (음양 다름)

	tests := []struct {
		name     string
		palja    string
		expected string
	}{
		{
			// 갑자을축병인정묘 - 본원(일간)은 '병'(화, TG idx=2, 오행=1, 양=0)
			// 갑(TG idx=0, 오행=0, 양=0) -> diffFE=4, 병양(0)!=JiJangGanPM[0]=1 -> diffEng=1 -> 정인
			// 자(DZ idx=0, 오행=4, JiJangGanPM[0]=1) -> diffFE=3, 병양(0)!=1 -> diffEng=1 -> 정관
			// 을(TG idx=1, 오행=0, 음=1) -> diffFE=4, 병양(0)!=JiJangGanPM[1]=1 -> diffEng=1 -> 정인
			// 축(DZ idx=1, 오행=2, JiJangGanPM[1]=1) -> diffFE=1, 병양(0)!=1 -> diffEng=1 -> 상관
			// 병 -> 본원
			// 인(DZ idx=2, 오행=0, JiJangGanPM[2]=0) -> diffFE=4, 병양(0)!=0 -> diffEng=0 -> 편인
			// 정(TG idx=3, 오행=1, 음=1) -> diffFE=0, 병양(0)!=JiJangGanPM[3]=1 -> diffEng=1 -> 겁재
			// 묘(DZ idx=3, 오행=0, JiJangGanPM[3]=1) -> diffFE=4, 병양(0)!=1 -> diffEng=1 -> 정인
			name:     "갑자을축병인정묘 - 병일간",
			palja:    "갑자을축병인정묘",
			expected: "정인 정관 정인 상관 본원 편인 겁재 정인 ",
		},
		{
			// 갑자갑자갑자갑자 - 본원(일간)은 '갑'(목, TG idx=0, 오행=0, 양=0)
			// 갑(TG idx=0, 양) -> diffFE=0, 갑양(0)!=JiJangGanPM[0]=1 -> diffEng=1 -> 겁재
			// 자(DZ idx=0, JiJangGanPM[0]=1) -> diffFE=4, 갑양(0)!=1 -> diffEng=1 -> 정인
			// ...
			name:     "갑자갑자갑자갑자 - 모두 같은 간지",
			palja:    "갑자갑자갑자갑자",
			expected: "겁재 정인 겁재 정인 본원 정인 겁재 정인 ",
		},
		{
			// 무진무진무진무진 - 본원(일간)은 '무'(토, TG idx=4, 오행=2, 양=0)
			// 무(TG idx=4, 양) -> diffFE=0, 무양(0)!=JiJangGanPM[4]=0 -> diffEng=0 -> 비견
			// 진(DZ idx=4, JiJangGanPM[4]=0) -> diffFE=0, 무양(0)!=0 -> diffEng=0 -> 비견
			name:     "무진무진무진무진 - 무토일간",
			palja:    "무진무진무진무진",
			expected: "비견 비견 비견 비견 본원 비견 비견 비견 ",
		},
		{
			// 6글자 팔자 테스트: 갑자을축병인
			// 본원(일간)은 '병'(화, TG idx=2, 오행=1, 양=0)
			name:     "6글자 팔자 - 갑자을축병인",
			palja:    "갑자을축병인",
			expected: "정인 정관 정인 상관 본원 편인 ",
		},
		{
			// 경신경신경신경신 - 본원(일간)은 '경'(금, TG idx=6, 오행=3, 양=0)
			// 경(TG idx=6, 양) -> diffFE=0, 경양(0)!=JiJangGanPM[6]=1 -> diffEng=1 -> 겁재
			// 신(DZ idx=8, JiJangGanPM[8]=0) -> diffFE=0, 경양(0)!=0 -> diffEng=0 -> 비견
			// 주의: '신'은 지지에서 idx=8 (申)
			name:     "경신경신경신경신 - 경금일간",
			palja:    "경신경신경신경신",
			expected: "겁재 비견 겁재 비견 본원 비견 겁재 비견 ",
		},
		{
			// 임자임자임자임자 - 본원(일간)은 '임'(수, TG idx=8, 오행=4, 양=0)
			// 임(TG idx=8, 양) -> diffFE=0, 임양(0)!=JiJangGanPM[8]=0 -> diffEng=0 -> 비견
			// 자(DZ idx=0, JiJangGanPM[0]=1) -> diffFE=0, 임양(0)!=1 -> diffEng=1 -> 겁재
			name:     "임자임자임자임자 - 임수일간",
			palja:    "임자임자임자임자",
			expected: "비견 겁재 비견 겁재 본원 겁재 비견 겁재 ",
		},
		{
			// 임술신해무오계축 - 본원(일간)은 '무'(토, TG idx=4, 오행=2, 양=0)
			// 임(TG idx=8, 오행=4, 양) -> diffFE=2, 무양(0)!=JiJangGanPM[8]=0 -> diffEng=0 -> 편재
			// 술(DZ idx=10, 오행=2, JiJangGanPM[10]=0) -> diffFE=0, 무양(0)!=0 -> diffEng=0 -> 비견
			// 신(TG idx=7, 오행=3, 음) -> diffFE=1, 무양(0)!=JiJangGanPM[7]=1 -> diffEng=1 -> 상관
			// 해(DZ idx=11, 오행=4, JiJangGanPM[11]=0) -> diffFE=2, 무양(0)!=0 -> diffEng=0 -> 편재
			// 무 -> 본원
			// 오(DZ idx=6, 오행=1, JiJangGanPM[6]=1) -> diffFE=4, 무양(0)!=1 -> diffEng=1 -> 정인
			// 계(TG idx=9, 오행=4, 음) -> diffFE=2, 무양(0)!=JiJangGanPM[9]=1 -> diffEng=1 -> 정재
			// 축(DZ idx=1, 오행=2, JiJangGanPM[1]=1) -> diffFE=0, 무양(0)!=1 -> diffEng=1 -> 겁재
			name:     "임술신해무오계축 - 무토일간",
			palja:    "임술신해무오계축",
			expected: "편재 비견 상관 편재 본원 정인 정재 겁재 ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculateTenStems(tt.palja)
			if result != tt.expected {
				t.Errorf("CalculateTenStems(%q) = %q, expected %q", tt.palja, result, tt.expected)
			}
		})
	}
}

// TestCalculateTenStems_AllTianGan tests ten stems calculation for all 10 heavenly stems as day master
// 새 로직: 음양 비교가 JiJangGanPM 배열 기준으로 변경됨
func TestCalculateTenStems_AllTianGan(t *testing.T) {
	// 천간은 짝수 인덱스 위치에 있고, JiJangGanPM[chIdx]로 음양 비교함
	// 테스트 팔자: targetChar + "자" + dayMaster + "자" + dayMaster + "자" + dayMaster + "자"
	// 첫 글자(연간=천간)의 십성을 확인
	//
	// 주의: 천간 위치(짝수 인덱스)에서도 JiJangGanPM[chIdx]를 사용함
	// chIdx는 천간이면 TG_ARRAY에서의 인덱스, 지지면 DZ_ARRAY에서의 인덱스
	// 하지만 JiJangGanPM은 지지(12개) 기준 배열이므로 천간(10개)에서 인덱스 범위 초과 가능
	// 실제 코드를 다시 확인하면 천간도 동일하게 JiJangGanPM[chIdx] 사용

	tests := []struct {
		name       string
		dayMaster  string // 일간 (5번째 글자)
		targetChar string // 비교할 천간
		expected   string // 예상 십성
	}{
		// 갑(목양, idx=0)일간 기준 - JiJangGanPM에서 갑양(0) 기준으로 비교
		// targetChar(천간)도 JiJangGanPM[chIdx]로 음양 판단
		{"갑일간-갑", "갑", "갑", "겁재"}, // 갑(idx=0), JiJangGanPM[0]=1, 갑양(0)!=1 -> 겁재
		{"갑일간-을", "갑", "을", "겁재"}, // 을(idx=1), JiJangGanPM[1]=1, 갑양(0)!=1 -> 겁재
		{"갑일간-병", "갑", "병", "식신"}, // 병(idx=2), JiJangGanPM[2]=0, 갑양(0)==0 -> 식신
		{"갑일간-정", "갑", "정", "상관"}, // 정(idx=3), JiJangGanPM[3]=1, 갑양(0)!=1 -> 상관
		{"갑일간-무", "갑", "무", "편재"}, // 무(idx=4), JiJangGanPM[4]=0, 갑양(0)==0 -> 편재
		{"갑일간-기", "갑", "기", "편재"}, // 기(idx=5), JiJangGanPM[5]=0, 갑양(0)==0 -> 편재
		{"갑일간-경", "갑", "경", "정관"}, // 경(idx=6), JiJangGanPM[6]=1, 갑양(0)!=1 -> 정관
		{"갑일간-신", "갑", "신", "정관"}, // 신(idx=7), JiJangGanPM[7]=1, 갑양(0)!=1 -> 정관
		{"갑일간-임", "갑", "임", "편인"}, // 임(idx=8), JiJangGanPM[8]=0, 갑양(0)==0 -> 편인
		{"갑일간-계", "갑", "계", "정인"}, // 계(idx=9), JiJangGanPM[9]=1, 갑양(0)!=1 -> 정인
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 팔자 구성: 연간지+월간지+일간지+시간지
			// 일간이 5번째 글자가 되도록 구성
			// 테스트할 글자는 1번째(연간)에 위치
			palja := tt.targetChar + "자" + tt.dayMaster + "자" + tt.dayMaster + "자" + tt.dayMaster + "자"

			result := CalculateTenStems(palja)
			// 첫 번째 십성만 확인 (공백으로 구분됨)
			firstTenStem := ""
			for _, r := range result {
				if r == ' ' {
					break
				}
				firstTenStem += string(r)
			}

			if firstTenStem != tt.expected {
				t.Errorf("CalculateTenStems 첫글자(%s일간, %s) = %q, expected %q (full result: %s)",
					tt.dayMaster, tt.targetChar, firstTenStem, tt.expected, result)
			}
		})
	}
}

// TestJiJangGanPM_Values tests that JiJangGanPM array has correct values
func TestJiJangGanPM_Values(t *testing.T) {
	// JiJangGanPM = []int{1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0}
	// 지지: 자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해
	expected := []int{1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0}

	if len(JiJangGanPM) != 12 {
		t.Errorf("JiJangGanPM length = %d, expected 12", len(JiJangGanPM))
	}

	for i, v := range expected {
		if JiJangGanPM[i] != v {
			t.Errorf("JiJangGanPM[%d] (%s) = %d, expected %d",
				i, DZ_ARRAY[i], JiJangGanPM[i], v)
		}
	}
}

// TestCalculateTenStems_DiZhi tests ten stems calculation focusing on earthly branches (지지)
func TestCalculateTenStems_DiZhi(t *testing.T) {
	// 지지의 음양은 JiJangGanPM 배열로 결정됨
	// JiJangGanPM = []int{1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0}
	// 지지:            자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해
	// 0=양, 1=음

	tests := []struct {
		name      string
		dayMaster string // 일간
		dz        string // 테스트할 지지
		dzIdx     int    // DZ_ARRAY 인덱스
		expected  string // 예상 십성
	}{
		// 갑(목양, TG idx=0)일간 기준
		// 갑은 양(0), 오행=목(0)
		{"갑일간-자", "갑", "자", 0, "정인"},  // 자(오행=수4, JiJangGanPM=1), diffFE=4->인성, 갑양(0)!=1 -> 정인
		{"갑일간-축", "갑", "축", 1, "정재"},  // 축(오행=토2, JiJangGanPM=1), diffFE=2->재성, 갑양(0)!=1 -> 정재
		{"갑일간-인", "갑", "인", 2, "비견"},  // 인(오행=목0, JiJangGanPM=0), diffFE=0->비겁, 갑양(0)==0 -> 비견
		{"갑일간-묘", "갑", "묘", 3, "겁재"},  // 묘(오행=목0, JiJangGanPM=1), diffFE=0->비겁, 갑양(0)!=1 -> 겁재
		{"갑일간-진", "갑", "진", 4, "편재"},  // 진(오행=토2, JiJangGanPM=0), diffFE=2->재성, 갑양(0)==0 -> 편재
		{"갑일간-사", "갑", "사", 5, "식신"},  // 사(오행=화1, JiJangGanPM=0), diffFE=1->식상, 갑양(0)==0 -> 식신
		{"갑일간-오", "갑", "오", 6, "상관"},  // 오(오행=화1, JiJangGanPM=1), diffFE=1->식상, 갑양(0)!=1 -> 상관
		{"갑일간-미", "갑", "미", 7, "정재"},  // 미(오행=토2, JiJangGanPM=1), diffFE=2->재성, 갑양(0)!=1 -> 정재
		{"갑일간-신", "갑", "신", 8, "편관"},  // 신(오행=금3, JiJangGanPM=0), diffFE=3->관성, 갑양(0)==0 -> 편관
		{"갑일간-유", "갑", "유", 9, "정관"},  // 유(오행=금3, JiJangGanPM=1), diffFE=3->관성, 갑양(0)!=1 -> 정관
		{"갑일간-술", "갑", "술", 10, "편재"}, // 술(오행=토2, JiJangGanPM=0), diffFE=2->재성, 갑양(0)==0 -> 편재
		{"갑일간-해", "갑", "해", 11, "편인"}, // 해(오행=수4, JiJangGanPM=0), diffFE=4->인성, 갑양(0)==0 -> 편인
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 팔자: 갑+지지 + 갑+지지 + 갑+지지 + 갑+지지
			// 2번째 글자(연지)가 테스트 대상
			palja := tt.dayMaster + tt.dz + tt.dayMaster + tt.dz + tt.dayMaster + tt.dz + tt.dayMaster + tt.dz

			result := CalculateTenStems(palja)
			// 두 번째 십성 확인 (공백으로 구분)
			parts := []string{}
			current := ""
			for _, r := range result {
				if r == ' ' {
					if current != "" {
						parts = append(parts, current)
						current = ""
					}
				} else {
					current += string(r)
				}
			}

			if len(parts) < 2 {
				t.Fatalf("결과 파싱 실패: %s", result)
			}

			secondTenStem := parts[1] // 두 번째 십성 (지지)

			if secondTenStem != tt.expected {
				t.Errorf("CalculateTenStems 지지(%s일간, %s) = %q, expected %q (full result: %s)",
					tt.dayMaster, tt.dz, secondTenStem, tt.expected, result)
			}
		})
	}
}
