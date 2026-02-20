# SajuAssemble(itemNcard) 운영 가이드

데이터 카드 메뉴 사용법, 카드 CRUD, 사주/궁합 추출 테스트 및 LLM 컨텍스트 미리보기 안내. 내부 서비스 명칭: **SajuAssemble**(사주어셈블).

## 데이터 카드 메뉴 열기

1. 관리자 웹(admweb)에 로그인합니다.
2. 사이드 메뉴에서 **데이터 카드**를 클릭합니다.
3. 상단 탭: **사주 카드**, **궁합 카드**, **사주 추출 테스트**, **궁합 추출 테스트** 중 선택합니다.

## 데이터 카드 메뉴 내 생일·시간 입력 규칙

- **적용 범위**: 데이터 카드 메뉴 이하 화면의 모든 생일·시간 입력. 대상: **사주 추출 테스트** 탭의 생년월일·시간 필드 1개, **궁합 추출 테스트** 탭의 A/B 생년월일·시간 필드 2개. 이 세 필드는 동일 규칙을 사용하는 공용 입력 컴포넌트(`BirthDateTimeField`) 및 유틸(`admweb/src/utils/birthDateTime.ts`)만 사용한다.
- **형식**: 표시·입력 형식은 단일 문자열 `yyyy-MM-dd HH:mm`. 시간을 모르면 `yyyy-MM-dd unknown`. API 전달 값은 UserInfoStructure에 따라 `birth.date` = YYYY-MM-DD, `birth.time` = HH:mm 또는 `"unknown"`.
- **자동 포매팅**: onBlur 시(및 필요 시 onPaste) `parseBirthDateTime` → `formatBirthParseResult`로 정규화하여 표시값과 API 전달 값을 일치시킨다. 잘못된 형식 입력 시 helperText에 검증 메시지를 표시한다.

## 카드 조회·등록·수정·삭제

### 목록 조회

- **사주 카드** / **궁합 카드** 탭에서 카드 목록이 표시됩니다.
- 필터: status, category, tags, rule_set, 정렬(priority/card_id/updated_at), **삭제 포함** 체크 시 소프트 삭제된 카드도 표시됩니다.
- 페이지 크기와 이전/다음으로 페이징합니다.

### 카드 생성

1. **카드 생성** 버튼을 클릭합니다.
2. (선택) **시드에서 불러오기** 드롭다운에서 예시 시드(saju_정재_강함, pair_궁합_충)를 선택하면 폼이 채워집니다. 그 후 필요 시 수정하고 생성합니다.
3. 폼에 card_id, title, scope, status, category, tags, domains, priority, trigger(JSON), score(JSON), content(JSON), cooldown_group, max_per_user 등을 입력합니다.
4. trigger/score JSON은 CardDataStructure(ChemiStructure) 형식에 맞게 작성합니다. (pair 카드는 src P|A|B 사용.)
5. **생성**을 클릭해 저장합니다. 서버에서 trigger/score 형식 검증을 수행하며, 잘못된 payload는 GraphQL 오류로 반환됩니다. (ExtractionAPI.md 참고.)

### 일괄 등록

1. **사주 카드** 또는 **궁합 카드** 탭에서 **일괄 등록** 버튼을 클릭합니다.
2. 카드 객체 배열이 담긴 JSON 파일을 선택합니다. 각 객체는 CardDataStructure(saju) 또는 ChemiStructure(pair) 형식(card_id, scope, trigger, title 등)이어야 하며, 현재 탭의 scope와 일치하는 항목만 등록됩니다.
3. 완료 후 "N건 생성, M건 실패" 요약과 실패한 행 번호·메시지를 확인할 수 있습니다. 성공한 건이 있으면 목록이 자동으로 갱신됩니다.

### 카드 수정

1. 목록에서 해당 행의 **편집** 버튼을 클릭합니다.
2. 폼에서 필드를 수정한 뒤 **저장**을 클릭합니다.

### 카드 삭제 (소프트 삭제)

1. 목록에서 해당 행의 **삭제** 버튼을 클릭합니다.
2. 확인 대화상자에서 **이 카드를 삭제할까요? (소프트 삭제됩니다)** 확인 후 삭제합니다.
3. 삭제된 카드는 목록에 기본적으로 보이지 않습니다. **삭제 포함** 체크를 켜면 삭제된 카드도 조회할 수 있습니다. (문서는 DB에 남고 `deleted_at`만 설정됩니다.)

## 사주 추출 테스트

1. **사주 추출 테스트** 탭으로 이동합니다.
2. 생년월일, 시간, 타임존을 입력하고 모드(**인생** / **연도별** / **월별** / **일간** / **대운**)를 선택합니다. 연도별·월별·일간일 경우 대상 연도·월(·일)을 입력합니다. 대운일 경우 **대운 단계**(0부터)와 **성별**을 입력합니다.
3. **대략적인 출력 글자수**(100–5000)를 입력합니다. 이 값은 GraphQL 사주 생성(runSajuGeneration) 호출 시 각 대상의 **max_chars**로 전달됩니다.
4. **실행**을 클릭하면 REST 추출 테스트가 수행됩니다.
5. **생성 실행**을 클릭하면 GraphQL `runSajuGeneration` 뮤테이션이 호출됩니다. 현재 선택된 모드·기간에 해당하는 한 개 대상으로 사주 문장이 생성되며, **대략적인 출력 글자수**가 해당 대상의 max_chars로 사용됩니다. 생성 결과는 "GraphQL 사주 생성 결과" 카드에 표시됩니다.
6. 결과 패널에서 확인할 내용:
   - **명식 정보**: pillars(기둥), items, tokens 요약.
   - **연계 만세력**: 기준일·적용 시간·모드를 결과 패널에서 확인할 수 있습니다.
   - **선택된 사주 카드**: 어떤 카드가 선택되었는지, 각 카드의 score와 **선택 근거(evidence)** 토큰 목록.
7. 카드가 선택된 상태에서 **LLM 컨텍스트 미리보기** 버튼을 누르면, 해당 카드들로 구성된 LLM용 텍스트를 미리 볼 수 있습니다.

### 연도별·월별·일간·대운 추출 상세

- **언제 사용하는지**: **인생**은 출생 시점의 원국(四柱) 기준. **연도별**은 특정 연도의 歲運(세운)을 보고 싶을 때. **월별**은 특정 연·월의 月運(월운)을 보고 싶을 때. **일간**은 특정 일자의 日運(일운)을 보고 싶을 때. **대운**은 大運(decade pillar)을 보고 싶을 때. 대상 연도·월·일 또는 대운 단계(0부터)와 성별을 입력합니다.
- **필수 입력**: 연도별은 **대상 연도**(예: 2025) 필수. 월별은 **대상 연도** + **대상 월**(예: 2025-03) 필수. 일간은 **대상 연도** + **대상 월** + **대상 일**(예: 2025-03-15) 필수. 대운은 **대운 단계**(0, 1, …) + **성별**(남/여) 필수.
- **결과 pillars·기간**: 연도별이면 해당 연도 1월 1일 + 출생 시간으로 계산한 4주; period는 "2025" 형태. 월별이면 해당 연·월 1일 + 출생 시간; period는 "2025-03" 형태. 일간이면 해당 일자 + 출생 시간; period는 "2025-03-15" 형태. 대운이면 月柱+성별→順/逆으로 계산한 大運 年/月柱 + 원국 日/时柱; period는 "대운 0" 형태. pillar 출처(歲運/月運/日運/大運) 상세는 `docs/SajuAssemble/tasks/연도별_월별_pillar.md` 참고.
- **결과의 연계 만세력**: 기준일·적용 시간·모드를 결과 패널에서 확인할 수 있습니다. 대운 모드에서는 기준일은 출생일, period는 "대운 N"으로 표시됩니다.

## 궁합 추출 테스트

1. **궁합 추출 테스트** 탭으로 이동합니다.
2. A/B 생년월일·시간, 타임존을 입력합니다. **대략적인 출력 글자수**(100–5000)와 **출력관점**(예: overview, communication, conflict, compatibility 또는 자유 문구)을 입력할 수 있으며, 이 값들은 GraphQL 궁합 생성(runChemiGeneration) 호출 시 **targets[].max_chars**, **targets[].perspective**로 전달됩니다.
3. **실행**을 클릭하면 REST 추출 테스트가 수행됩니다. **생성 실행**을 클릭하면 GraphQL `runChemiGeneration` 뮤테이션이 호출되어, 현재 폼의 출력관점·대략적인 출력 글자수로 한 개 target으로 궁합 문장이 생성되고, "GraphQL 궁합 생성 결과" 카드에 **targets[].result**가 표시됩니다.
4. 결과 패널에서 확인할 내용:
   - **A/B 명식 요약**: pillars 등.
   - **P_tokens (궁합 상호작용) 요약**: 궁합 토큰 요약.
   - **선택된 궁합 카드**: 선택된 카드 목록, score, **선택 근거(evidence)**.
5. 카드가 선택된 상태에서 **LLM 컨텍스트 미리보기**를 누르면 궁합 카드 기준 LLM 컨텍스트를 미리 볼 수 있습니다.

## 궁합 추출 기본 메소드

- 서비스 레이어와 GraphQL이 **동일한 입력·출력 형태**로 궁합(chemi) 추출 기본 메소드를 제공합니다.
- **입력**: (1) **pair_input**(birthA, birthB, timezone), (2) **targets** 배열 — 각 대상은 **perspective**(출력관점, 예: overview, communication, conflict, compatibility 또는 자유 문구), **max_chars**(대략적인 출력 글자 수)로 구성됩니다.
- **출력**: 요청한 대상과 같은 순서·길이의 배열이며, 각 항목에 **result**(생성된 궁합 텍스트 또는 오류 메시지)가 채워집니다.
- GraphQL: `runChemiGeneration(input: ChemiGenerationRequest!)` 뮤테이션으로 호출합니다. 계약 상세는 `ExtractionAPI.md` §5 참고.
- 궁합 추출 테스트 화면에서는 **대략적인 출력 글자수**·**출력관점** 폼 필드를 사용해 **생성 실행** 버튼으로 runChemiGeneration을 호출할 수 있으며, 반환된 targets[].result가 "GraphQL 궁합 생성 결과" 카드에 표시됩니다.

## LLM 컨텍스트 미리보기

- 사주 또는 궁합 추출 테스트 실행 후, **선택된 카드**가 있을 때만 **LLM 컨텍스트 미리보기** 버튼이 의미 있습니다.
- 버튼을 누르면 백엔드 `POST /api/adm/llm_context_preview`를 호출해, 선택된 card_id들로 구성된 LLM용 텍스트를 가져와 대화상자에 표시합니다.
- 실제 LLM 호출 시 이 컨텍스트가 어떻게 쓰일지 확인하는 용도입니다.

## 사주 추출 기본 메소드

- 서비스 레이어와 GraphQL이 **동일한 입력·출력 형태**로 사주 추출 기본 메소드를 제공합니다.
- **입력**: (1) 사용자 정보(생년월일·시간, 타임존, rule_set), (2) **출력 대상 배열** — 각 대상은 **kind**(인생 / 대운 / 세운 / 월간 / 일간), **period**(대상 시기 문자열, 예: ""·"2025"·"2025-03"·"2025-03-15"), **max_chars**(대략적인 출력 글자 수)로 구성됩니다.
- **출력**: 요청한 대상과 같은 순서·길이의 배열이며, 각 항목에 **result**(생성된 사주 텍스트 또는 미지원/오류 메시지)가 채워집니다.
- **대운**은 지원됩니다. 대상의 period에 0-based 단계(예: "0", "1")를 넣고, user_input.gender(남/여)를 넣으면 大運 pillars → items → tokens → cards → LLM → result로 생성됩니다.
- GraphQL: `runSajuGeneration(input: SajuGenerationRequest!)` 뮤테이션으로 호출합니다. 계약 상세는 `ExtractionAPI.md` §4 참고.

## MCP 연동 (선택)

- API를 `LOCAL_MCP=true`로 실행하면 y2sl-local MCP 서버가 `/mcp`에서 동작합니다.

### y2sl-local MCP 사용 안내

1. **절차 한 줄**: API 서버를 `LOCAL_MCP=true` 환경 변수로 띄운 뒤, Cursor 등 MCP 클라이언트에서 y2sl-local MCP의 도구를 호출합니다. (예: repo root에서 `LOCAL_MCP=true go run server.go` 실행 후 Cursor에서 해당 MCP 서버 연결.)
2. **도구 호출 요약**:
   - **register_card**: 카드 JSON(문자열) 한 건을 받아 백엔드에 새 카드로 등록합니다. CardDataStructure(saju) 또는 ChemiStructure(pair, src P|A|B) 형식. 필수: card_id, scope, trigger, title. 반환: `{"ok":true,"uid":"..."}` 또는 `{"ok":false,"msg":"..."}`.
   - **update_card**: `uid`와 카드 JSON(부분/전체)을 받아 해당 카드를 갱신합니다. 반환: `{"ok":true}` 또는 `{"ok":false,"msg":"..."}`.
   - **list_cards**: 기존 카드를 조회합니다. 입력(선택): scope(saju|pair), status, category, card_id(부분 문자열), limit(기본 50, 최대 200). 반환: `{"ok":true,"cards":[{card_id, uid, scope, title, status}, ...]}` 또는 `{"ok":false,"msg":"..."}`. 에이전트가 등록/갱신 전에 어떤 카드가 있는지 확인할 때 사용합니다.
3. **카드 JSON 전달 방식**: (A) 시드 파일 경로 참조 — `docs/SajuAssemble/seed/` 내 JSON 파일 내용을 읽어 문자열로 전달. (B) 에이전트가 생성한 JSON — CardDataStructure(saju) 또는 ChemiStructure(pair) 형식의 객체를 문자열로 전달.

- **runLoopForSaju.sh 실행 시**: API를 `LOCAL_MCP=true`로 띄운 뒤, Phase 2(태스크 실행)에서 에이전트가 MCP 도구 `register_card` / `update_card` / `list_cards`를 호출해 시드 파일 내용 또는 생성한 카드 JSON을 API에 반영할 수 있다. 자세한 절차는 runLoopForSaju.sh 상단 주석 또는 본 절 **runLoopForSaju에서 MCP 사용 절차**를 참고.

### runLoopForSaju.sh에서 MCP 사용 절차

1. **API를 LOCAL_MCP=true로 실행**: repo root에서 `api/`로 이동 후 `LOCAL_MCP=true go run server.go` 실행(또는 동일 환경 변수로 서버 기동). MCP 서버가 `/mcp`에서 동작한다.
2. **MCP 클라이언트 연결**: Cursor 등 MCP 클라이언트가 API가 제공하는 y2sl-local MCP 서버에 연결되어 있는지 확인한다.
3. **Phase 2(태스크 실행)에서 카드 등록**: 태스크 플랜에서 카드 생성이 필요할 때, `register_card`를 사용한다. `card_json`에는 `docs/SajuAssemble/seed/` 시드 파일 내용을 읽어 넣거나, CardDataStructure(saju) / ChemiStructure(pair) 형식의 에이전트 생성 JSON을 문자열로 전달한다.
4. **기존 카드 갱신**: `update_card`에 `uid`와 부분 또는 전체 카드 JSON을 넘겨 해당 카드를 갱신한다.
5. **등록/갱신 전 확인**: `list_cards`(scope, status, category, card_id, limit)로 기존 카드를 조회한 뒤, 필요한 경우에만 `register_card` 또는 `update_card`를 호출한다.

- Cursor CLI agent 또는 runLoopForSaju.sh 등에서 MCP 클라이언트로 위 도구를 호출해 시드 파일 또는 에이전트가 생성한 카드 JSON을 API에 반영할 수 있습니다.

## 문제 해결 (Troubleshooting)

| 현상 | 원인·조치 |
|------|-----------|
| **추출 테스트 시 카드가 0건으로 나올 때** | 시드(카드) 데이터가 DB에 존재하는지 확인. trigger 문법과 실제 추출된 tokens가 일치하는지 확인. 카드 status가 `published`인지 확인. |
| **카드 생성/수정 시 validation 오류** | trigger/score JSON 형식 확인 (CardDataStructure, ChemiStructure). pair 카드일 때 trigger/score 항목에 `src`가 P, A, B 중 하나인지 확인. |
| **MCP register_card 실패** | card_json 필수 필드(card_id, scope, trigger, title) 포함 여부 확인. scope는 saju 또는 pair. trigger는 all/any/not 배열과 token 필드 필요. pair일 때 각 항목에 src(P|A|B) 필요. |
| **make test-itemncard 실패** | MongoDB는 service/dao 테스트에서만 필요. mcplocal 테스트는 DB 없이 실행됨 (`go test ./mcplocal/...`). 전체 테스트 시 MongoDB 연결 및 DB_NAME 확인. |

관련 문서: `ExtractionAPI.md`, `Verification.md`, `Seed.md`.

## 참고

- 카드 스키마: `CardDataStructure.md`, `ChemiStructure.md` (pair).
- 토큰 규칙: `TokenRule.md`, `TokenStructure.md`.
- 시드 데이터 로딩: `Seed.md`.
- 추출 테스트 REST 계약: `ExtractionAPI.md`.
