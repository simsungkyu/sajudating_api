# PRD: 사주·궁합 데이터 카드 서비스 (itemNcard / SajuAssemble)

이 문서는 admweb의 사주/궁합 데이터 카드 관리 및 추출 테스트 기능을 구현/검증하기 위한 기준 문서다.

- 문서 버전: `v1.1`
- 기준일: `2026-02-13`
- 내부 서비스 명칭: `SajuAssemble`(사주어셈블)

---

## 0) 목적, 범위, 비범위

### 목적

사주/궁합 카드의 생성-관리-추출 테스트를 운영자가 일관된 규약으로 수행하도록 한다.

### 범위(In Scope)

- `scope="saju"` 카드 CRUD 및 목록 관리
- `scope="pair"` 카드 CRUD 및 목록 관리
- 사주 추출 테스트(모드별)
- 궁합 추출 테스트(A/B + P_tokens)
- 선택 카드의 근거(evidence) 가시화
- LLM 컨텍스트 미리보기

### 비범위(Out of Scope)

- 일반 사용자 서비스 화면/노출 UX
- 사주 계산 엔진 자체의 이론 변경
- 프로덕션 자동 운영 파이프라인 고도화(MCP는 선택)

---

## 1) 용어

| 용어 | 설명 |
|------|------|
| 사주 명식(원국) | 생년월일시 기반의 4주(년/월/일/시) 간지 구조 |
| 사주 파생요소(items) | 십성/관계/오행/신살/격국/용신/강약 등 |
| tokens | items를 트리거 조회용 문자열로 컴파일한 파생 값 |
| A_tokens / B_tokens | 궁합에서 각 개인 명식 토큰 |
| P_tokens | 궁합 상호작용 토큰 |
| evidence | 카드가 선택된 근거 토큰 목록 |
| rule_set | 계산/선택 룰셋 식별자 |
| engine_version | 계산 엔진 버전 식별자 |

---

## 2) 기능 요구사항

### 2-1) 메뉴/탭 구조

admweb 데이터 카드 메뉴에 아래 탭이 존재해야 한다.

- 사주 카드
- 궁합 카드
- 사주 추출 테스트
- 궁합 추출 테스트

### 2-2) 카드 관리 기능

- 목록: 필터/정렬/페이징 지원
- 생성: 스키마 기반 입력(폼 또는 JSON)
- 수정: 기존 카드 갱신
- 삭제: 소프트 삭제(`deleted_at` 기반)
- 보조 기능: 복제/JSON 내보내기/일괄 등록

### 2-3) 추출 테스트 기능

- 사주 추출 테스트: 입력값으로 명식/토큰 계산 후 카드 선택 결과 표시
- 궁합 추출 테스트: A/B 명식 및 P_tokens 계산 후 pair 카드 선택 결과 표시
- 결과에는 반드시 선택 카드와 evidence를 함께 표기

---

## 3) 입력·출력 계약

### 3-1) 사주 모드 표준(enum)

사주 추출 모드는 아래 5개를 표준으로 사용한다.

- `인생`
- `연도별`
- `월별`
- `일간`
- `대운`

호환 alias:

- `세운`은 `연도별`과 동일 의미
- `일별`은 `일간`과 동일 의미

### 3-2) 입력 포맷

공통 birth 입력:

- `birth.date`: `YYYY-MM-DD`
- `birth.time`: `HH:mm` 또는 `"unknown"`
- `birth.time_precision`: `minute | hour | unknown`
- `timezone`: IANA timezone(예: `Asia/Seoul`)

사주 모드별 필수 입력:

| mode | 필수 필드 |
|------|-----------|
| 인생 | birth, timezone |
| 연도별 | birth, timezone, target_year |
| 월별 | birth, timezone, target_year, target_month |
| 일간 | birth, timezone, target_year, target_month, target_day |
| 대운 | birth, timezone, target_daesoon_index, gender |

궁합 추출 필수 입력:

- `birthA`, `birthB`, `timezone`

### 3-3) 출력 필수 항목

사주 추출 결과:

- `user_info`(pillars, items_summary, tokens_summary, rule_set, engine_version, mode, period)
- `selected_cards[]`(card_id, title, evidence[], score)
- `pillar_source`(모드별 기준일/기간)
- `llm_context`(선택 카드가 있을 때)

궁합 추출 결과:

- `summary_a`, `summary_b`
- `p_tokens_summary`
- `selected_cards[]`(card_id, title, evidence[], score)
- `llm_context`(선택 카드가 있을 때)

### 3-4) 카드 payload 계약

- saju 카드: `CardDataStructure.md` 준수
- pair 카드: `ChemiStructure.md` 준수
- pair 카드의 trigger/score 조건은 `src`가 반드시 `P|A|B` 중 하나여야 한다
- GraphQL 입력에서 `triggerJson`, `scoreJson`, `contentJson`, `debugJson`은 문자열(JSON stringified)로 전달한다

---

## 4) API 채널 전략

현재 단계의 운영 기준:

- 카드 CRUD: GraphQL(`itemnCards`, `createItemnCard`, `updateItemnCard`, `deleteItemnCard`)
- 추출 테스트/LLM preview: REST(`/api/adm/saju_extract_test`, `/api/adm/pair_extract_test`, `/api/adm/llm_context_preview`)
- 단계별 디버깅/분리 실행: GraphQL(`sajuChart`, `sajuPairChart`, `itemnCardsByTokens`, `pairCardsByTokens`, `sendLLMRequest`)

채널 혼용은 허용하되, admweb 운영 동선은 위 기준을 우선 적용한다.

---

## 5) 카드 선택 로직 요구사항

사주/궁합 공통 파이프라인:

1. 입력 검증
2. pillars 계산
3. items 생성
4. tokens 생성
5. trigger 평가(`not` -> `all` -> `any`)
6. score/priority 정렬
7. 제한 적용(domain cap, cooldown_group, max_per_user)
8. 선택 카드 + evidence 반환

로직 세부 규약은 아래 문서를 정본으로 사용한다.

- `CardDataStructure.md`
- `ChemiStructure.md`
- `TokenRule.md`
- `TokenStructure.md`

---

## 6) UI 표현 요구사항

### 6-1) 사주 추출 결과 표현

- 원국(년/월/일/시)을 표 형태로 표시
- 양(陽)은 볼드로 표시
- 오행 컬러를 적용해 시각 구분

권장 색상(기준안):

- 목: `#2E7D32`
- 화: `#C62828`
- 토: `#8D6E63`
- 금: `#757575`
- 수: `#1565C0`

### 6-2) 궁합 추출 결과 표현

A/B 명식 요약 블록을 분리해 동시에 표시해야 하며, 최소 아래 필드를 포함한다.

- pillars
- rule_set
- engine_version
- items_summary
- tokens_summary

### 6-3) 선택 근거 가시성

- 카드마다 evidence 토큰 리스트를 표시
- evidence가 없는 카드는 선택 결과 목록에 노출하지 않는다

---

## 7) 테스트 및 릴리스 게이트

### 7-1) 자동 검증(필수)

- `cd api && make test-itemncard`
- `cd api && go build .`

### 7-2) 수동 검증(필수)

- 사주 추출 테스트: 인생/연도별/월별/일간/대운 각 1회 실행
- 궁합 추출 테스트: 1회 실행
- 결과 패널에서 evidence, 명식 요약, LLM textarea 확인
- 데이터 카드 CRUD(생성/수정/삭제/조회) 확인

상세 절차와 기록은 아래 문서를 따른다.

- `Verification.md`
- `TestScope.md`
- `OperatorGuide.md`

---

## 8) 성공 기준(AC: Acceptance Criteria)

| ID | 항목 | 판정 기준 |
|----|------|-----------|
| AC-01 | 메뉴 구조 | 데이터 카드 메뉴 내 4개 탭(사주 카드/궁합 카드/사주 추출 테스트/궁합 추출 테스트) 확인 |
| AC-02 | 카드 CRUD | saju/pair 각각 생성, 수정, 소프트 삭제, 목록 조회 성공 |
| AC-03 | 사주 모드 | 인생/연도별/월별/일간/대운 입력 검증 및 실행 성공 |
| AC-04 | 궁합 추출 | A/B 입력으로 p_tokens 및 선택 카드 반환 성공 |
| AC-05 | 근거 표시 | 선택 카드마다 evidence 토큰이 UI에 표시됨 |
| AC-06 | 사주 표현 | 양 볼드 + 오행 컬러 + 원국 표가 결과 화면에 표시됨 |
| AC-07 | 궁합 요약 | A/B 각각의 요약 필드(pillars, rule_set, engine_version, items/tokens summary) 표시됨 |
| AC-08 | 릴리스 게이트 | `make test-itemncard`, `go build .` 통과 기록 존재 |

---

## 9) 선택 기능: y2sl-local MCP 연동

MCP 연동은 선택 사항이며 미적용 시 핵심 기능(AC-01~AC-08)에 영향이 없어야 한다.

적용 시 요구사항:

- `register_card`, `update_card`, `list_cards` 동작
- run loop(`runLoopForSaju.sh`)에서 MCP 호출 가능
- 최소 1건 등록 후 admweb 목록에서 조회 가능

---

## 10) 참조 문서

| 문서 | 용도 |
|------|------|
| `CardDataStructure.md` | saju 카드 스키마/trigger/score/content |
| `ChemiStructure.md` | pair 카드 스키마/P_tokens/src 규칙 |
| `TokenRule.md` | items -> tokens 생성 규칙 |
| `TokenStructure.md` | 토큰 문법/카테고리/위치 표준 |
| `UserInfoStructure.md` | birth/pillars/items/tokens 표준 |
| `ExtractionAPI.md` | REST 계약 |
| `GraphQL_Extract_Design.md` | 단계별 GraphQL 설계 |
| `TestScope.md` | 자동 테스트 범위 |
| `Verification.md` | 수동/릴리스 검증 체크리스트 |
