package utils

// * 음양에서 idx가 짝수는 양, 홀수는 음으로 판단한다.

// 한글로 변환할 천간(天干) 및 지지(地支) 배열
var FIVE_ELEMENTS = []string{"목", "화", "토", "금", "수"}
var TG_ARRAY = []string{"갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"}
var TG_FE_INDEXES = []int{0, 0, 1, 1, 2, 2, 3, 3, 4, 4}
var DZ_ARRAY = []string{"자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"}
var DZ_FE_INDEXES = []int{4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4}
var TGH_ARRAY = []string{"甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"}
var DZH_ARRAY = []string{"子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"}
var TenStems = []string{"비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"}

// 지지 지장간의 천간 음양  - 양=0, 음=1
var JiJangGanPM = []int{
	1, // 자 - 양
	1, // 축 - 양
	0, // 인 - 음
	1, // 묘 - 양
	0, // 진 - 음
	0, // 사 - 음
	1, // 오 - 양
	1, // 미 - 양
	0, // 신 - 음
	1, // 유 - 양
	0, // 술 - 음
	0, // 해 - 음
}

// 팔자를 기반으로 팔자에따른 한자를 더한 스트링을 반환한다. 글자는 6글자 혹은 8글자이다 2글자씩 끊어서 갑자(甲子) 형태로
func ConvertPaljaToWithHanja(palja string) string {
	// 한글을 rune 배열로 변환 (문자 단위 처리)
	runes := []rune(palja)
	ret := ""

	// 2글자(천간+지지)씩 처리
	for i := 0; i < len(runes); i += 2 {
		if i+1 >= len(runes) {
			break // 마지막 글자가 홀수개인 경우 중단
		}

		tg := string(runes[i])   // 천간 (1글자)
		dz := string(runes[i+1]) // 지지 (1글자)

		// 천간 인덱스 찾기
		tgIdx := 0
		for j := 0; j < len(TG_ARRAY); j++ {
			if TG_ARRAY[j] == tg {
				tgIdx = j
				break
			}
		}

		// 지지 인덱스 찾기
		dzIdx := 0
		for j := 0; j < len(DZ_ARRAY); j++ {
			if DZ_ARRAY[j] == dz {
				dzIdx = j
				break
			}
		}

		// 한자 추가
		tgh := TGH_ARRAY[tgIdx]
		dzh := DZH_ARRAY[dzIdx]
		ret += tg + dz + "(" + tgh + dzh + ") "
	}

	return ret
}

// 팔자를 기반으로 십성을 계산한다.
// Input: 팔자 (6글자 혹은 8글자)
// Output: 팔자에 따른 십성 배열, 십성 배열에서 참조
//   - TG_ARRAY, DZ_ARRAY에서의 인덱스 번호가 짝수인경우 양, 홀수인경우 음으로 음양판단
//   - 5번째 글자가 본원 글자이다.
//   - 본원 글자의 오행(FIVE_ELEMENTS)을 참조하여 십성을 계산한다.
//   - 본원글자의 오행과 동일한 글자면 0,1 번째 십성 중, 본원글자의 음양이 같다면 0번째 십성, 다르다면 1번째 십성
//   - 본원글자의 오행인덱스가 같다면 비겁
//   - 본원글자의 오행인덱스 보다 1 큰 오행인덱스라면, 식상
//   - 본원글자의 오행인덱스 보다 2 큰 오행인덱스라면, 재성
//   - 본원글자의 오행인덱스 보다 3 큰 오행인덱스라면, 관성
//   - 본원글자의 오행인덱스 보다 4 큰 오행인덱스라면, 인성
func CalculateTenStems(palja string) string {
	// 본원 글자를 찾는다
	runes := []rune(palja)
	benon := string(runes[4])
	benonTGIdx := 0 // 천간내 인덱스
	for i := 0; i < len(TG_ARRAY); i++ {
		if TG_ARRAY[i] == benon {
			benonTGIdx = i
			break
		}
	}
	benonFEIdx := TG_FE_INDEXES[benonTGIdx] // 오행내 인덱스

	ret := ""
	// 한글자씩 순회하며 십성을 덧붙인다
	for i := 0; i < len(runes); i++ {
		if i == 4 {
			ret += "본원 "
			continue
		}
		ch := string(runes[i])
		chIdx := 0    // 글자 인덱스
		if i%2 == 0 { // 짝수면 천간
			for j := 0; j < len(TG_ARRAY); j++ {
				if TG_ARRAY[j] == ch {
					chIdx = j
					break
				}
			}
		} else { // 홀수면 지지
			for j := 0; j < len(DZ_ARRAY); j++ {
				if DZ_ARRAY[j] == ch {
					chIdx = j
					break
				}
			}
		}
		chFEIdx := 0  // 오행내 인덱스
		if i%2 == 0 { // 짝수면 천간
			chFEIdx = TG_FE_INDEXES[chIdx]
		} else { // 홀수면 지지
			chFEIdx = DZ_FE_INDEXES[chIdx]
		}

		diffFeIdx := (chFEIdx - benonFEIdx + 5) % 5
		diffEng := 0                            // 음양차이 = 0 이면 같음, 1 이면 다름
		if benonTGIdx%2 != JiJangGanPM[chIdx] { // 음양이 다르다면 음
			diffEng = 1
		}

		ret += TenStems[diffFeIdx*2+diffEng] + " "
	}

	return ret
}

var IMAGE_SENTENCE_OF_ILJU = map[string]string{
	"갑자": "물결 밑 새순",
	"갑인": "호랑이길 나무",
	"갑진": "젖은 바람 나무",
	"갑오": "햇빛을 가른 줄기",
	"갑신": "칼바람의 새줄기",
	"갑술": "바람막는 나무",

	"을축": "서릿길의 새싹",
	"을묘": "연둣빛 숨결",
	"을사": "햇살 감은 덩굴",
	"을미": "햇살 먹은 풀내음",
	"을유": "바람에 닿은 잎",
	"을해": "심해에 핀 새잎",

	"병자": "물결에 번진 빛",
	"병인": "봄숲을 깨운 햇불",
	"병진": "봄안개 속 햇빛",
	"병오": "정오의 붉은 파도",
	"병신": "빛나는 금바람",
	"병술": "사막의 톨게이트",

	"정축": "서리 속 불씨",
	"정묘": "봄빛 숨은 토끼",
	"정사": "불빛 감은 뱀",
	"정미": "노을빛 양털",
	"정유": "불빛 스친 칼날",
	"정해": "겨울 바다 등불",

	"무자": "물가에 숨은 돌쥐",
	"무인": "숲길 트는 호랑이",
	"무진": "용잠든 늪바위",
	"무오": "정오를 달린 불마",
	"무신": "절벽의 쇠원숭이",
	"무술": "마른 성채의 개",

	"기자": "물가에 눅은 흙",
	"기인": "숲을 받치는 흙",
	"기진": "물기 도는 논흙",
	"기오": "햇볕에 마른 흙",
	"기신": "다져진 단단한 흙",
	"기술": "거칠게 굳은 흙",

	"경자": "검푸른 칼바람",
	"경인": "숲을 쪼개는 쇠날",
	"경진": "바위를 깨우는 쇠",
	"경오": "햇빛 튄 칼끝",
	"경신": "벼려진 순수한 칼",
	"경술": "쇠칼의 잔열",

	"신축": "흙속에 묻힌 은",
	"신묘": "이슬 맺힌 은빛",
	"신사": "불에 단련된 은",
	"신미": "흙에 눌린 은빛",
	"신유": "가을빛 은날",
	"신해": "깊은 물의 은빛",

	"임자": "깊고 검은 큰 물",
	"임인": "숨찬 물결",
	"임진": "물결 젖은 바람",
	"임오": "태양 품은 물결",
	"임신": "굽이치며 도는 물",
	"임술": "메마른 땅의 물길",

	"계축": "서리밑 샘물",
	"계묘": "이슬처럼 맺힌 물",
	"계사": "불곁에 데운 물",
	"계미": "흙에 배인 잔물",
	"계유": "이슬 맺힌 찬물",
	"계해": "고요한 깊은 물",
}

func GetImageSentenceOfIlju(palja string) string {
	bonwon := string(palja[4:5])
	if _, ok := IMAGE_SENTENCE_OF_ILJU[bonwon]; !ok {
		return "별그림자"
	}
	return IMAGE_SENTENCE_OF_ILJU[bonwon]
}
