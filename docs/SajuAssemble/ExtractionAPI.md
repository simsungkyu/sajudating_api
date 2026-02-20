# Extraction test REST API contract

REST endpoints used by admweb for 사주/궁합 추출 테스트 and LLM 컨텍스트 미리보기. Base path: `/api/adm`. All require admin auth (session/cookie or header as configured).  
이 추출·카드 선택 로직의 내부 서비스 명칭은 **SajuAssemble**(사주어셈블)이다.

---

## Birth date/time formatting rule

Data card screens (사주 추출 테스트, 궁합 추출 테스트) use a single display/edit rule for birth date and time:

- **Display and edit format**: One string `yyyy-MM-dd HH:mm` (space-separated date and time). Example: `1990-05-15 10:00`.
- **Time optional**: Time may be omitted or sent as `"unknown"` per UserInfoStructure; then `time_precision` is `"unknown"`.
- **Valid date part**: YYYY-MM-DD (ISO date).
- **Valid time part**: HH:mm (24h) or empty/unknown.

**Parse result** (used by admweb helper and API payload):

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | YYYY-MM-DD. |
| `time` | string | HH:mm or `"unknown"`. |
| `time_precision` | string | `minute` \| `hour` \| `unknown`. |

See UserInfoStructure.md (birth.date, birth.time, birth.time_precision) and §1–§2 request body below.

---

## 1. Saju extraction test

**URL**: `POST /api/adm/saju_extract_test`  
**Method**: POST  
**Content-Type**: application/json

### Request body

| Field | Type | Description |
|-------|------|-------------|
| `birth` | object | Birth date/time. |
| `birth.date` | string | YYYY-MM-DD. |
| `birth.time` | string | HH:mm or "unknown". |
| `birth.time_precision` | string | minute \| hour \| unknown. |
| `timezone` | string | e.g. Asia/Seoul. |
| `calendar` | string | solar \| lunar (optional). |
| `mode` | string | 인생 \| 연도별 \| 월별 \| 일간 \| 대운. Default: 인생. |
| `target_year` | string | Optional; for 연도별/월별/일간. e.g. "2025". |
| `target_month` | string | Optional; for 월별/일간. e.g. "03". |
| `target_day` | string | Optional; for 일간 only. e.g. "15". Required when mode=일간. |
| `target_daesoon_index` | string | Optional; for 대운 only. 0-based 大運 step (e.g. "0", "1"). Required when mode=대운. |
| `gender` | string | Optional; for 대운 required (male/female or 男/女) to determine 順/逆. |

**일간 mode**: For mode `일간` (日運), the user runs saju extraction for a **specific day**. Pillar source: `(target_year, target_month, target_day)` + birth time (same sxtwl/PillarsFromBirth logic as 연도별/월별). Request must include `target_year`, `target_month`, `target_day` (all required for 일간). Response `user_info.period` is `"YYYY-MM-DD"` (e.g. `"2025-03-15"`).

**대운 mode**: For mode `대운` (大運), the user runs saju extraction for a **decade pillar**. Pillar source: 月柱 (from birth) + gender → 順/逆; step = `target_daesoon_index`. Request must include `target_daesoon_index` (0-based) and `gender`. Response `user_info.mode` = `"대운"`, `user_info.period` = e.g. `"대운 0"`; `pillar_source` has base_date = birth date, period = "대운 N", description = "大運".

See `api/dto/itemncard_dto.go`: `SajuExtractTestRequest`, `BirthInput`.

### Response body

| Field | Type | Description |
|-------|------|-------------|
| `user_info` | object | User info per UserInfoStructure (pillars, items/tokens summary, rule_set, engine_version, mode, period). |
| `user_info.pillars` | object | y, m, d, h (간지 strings). |
| `user_info.items_summary` | string | Brief items description. |
| `user_info.tokens_summary` | string[] | Token list. |
| `user_info.rule_set` | string | e.g. korean_standard_v1. |
| `user_info.engine_version` | string | e.g. itemncard@0.1. |
| `user_info.mode` | string | 인생 \| 연도별 \| 월별 \| 일간 \| 대운. |
| `user_info.period` | string | e.g. "2025", "2025-03", "2025-03-15" (일간), "대운 0" (대운) for display. |
| `pillar_source` | object | Optional. 연계 만세력: which date/period produced the pillars (see below). |
| `selected_cards` | array | Selected saju cards with evidence. |
| `selected_cards[].card_id` | string | Card identifier. |
| `selected_cards[].title` | string | Card title. |
| `selected_cards[].evidence` | string[] | Trigger tokens that caused selection. |
| `selected_cards[].score` | number | Score. |
| `llm_context` | string | Optional. Assembled LLM context from selected cards (same as §3 LLM context preview). Present when `selected_cards.length > 0`. |

**LLM 요청 전체 내용**: 사주 추출 시 LLM에 전달할 전체 내용은 **카드 컨텍스트**(선택된 카드의 content 조립)이며, 명식 요약은 별도 `user_info`로 전달된다. 결과 화면의 textarea에는 `llm_context`(카드 컨텍스트)를 표시하며, 필요 시 운영자가 명식 요약과 이어붙여 사용할 수 있다.

See `api/dto/itemncard_dto.go`: `SajuExtractTestResponse`, `UserInfoSummary`, `PillarSource`, `SelectedCard`.

#### 연계 만세력 (pillar source)

For each extraction mode, the response may include `pillar_source` so the user can see **which date/period produced the pillars** (기준일·기간 표시).

| Field | Type | Description |
|-------|------|-------------|
| `base_date` | string | YYYY-MM-DD. Calendar date used for pillar computation. |
| `base_time_used` | string | HH:mm or "unknown". Time used (birth time for 時柱). |
| `mode` | string | 인생 \| 연도별 \| 월별 \| 일간 \| 대운. |
| `period` | string | Display period, e.g. "2025", "2025-03", "2025-03-15", "대운 0". |
| `description` | string | Optional. Short label, e.g. "원국", "歲運", "月運", "日運", "大運". |

**Pillar source by mode**:

- **인생**: Birth date + birth time (원국). `base_date` = birth date, `base_time_used` = birth time.
- **연도별 (歲運)**: Target year 1/1 + birth time. `base_date` = YYYY-01-01, `period` = "YYYY".
- **월별 (月運)**: Target year-month 1st + birth time. `base_date` = YYYY-MM-01, `period` = "YYYY-MM".
- **일간 (日運)**: Target full date + birth time. `base_date` = YYYY-MM-DD, `period` = "YYYY-MM-DD".
- **대운 (大運)**: 月柱 + gender → 順/逆; step = target_daesoon_index. `base_date` = birth date (基準), `period` = "대운 N", `description` = "大運". See 연도별_월별_pillar.md.

---

## 2. Pair extraction test

**URL**: `POST /api/adm/pair_extract_test`  
**Method**: POST  
**Content-Type**: application/json

### Request body

| Field | Type | Description |
|-------|------|-------------|
| `birthA` | object | Person A birth (date, time, time_precision). |
| `birthB` | object | Person B birth (date, time, time_precision). |
| `timezone` | string | e.g. Asia/Seoul. |

See `api/dto/itemncard_dto.go`: `PairExtractTestRequest`.

### Response body

| Field | Type | Description |
|-------|------|-------------|
| `summary_a` | object | UserInfoSummary for A (pillars, items_summary, tokens_summary, rule_set, engine_version). |
| `summary_b` | object | UserInfoSummary for B. |
| `p_tokens_summary` | string[] | P_tokens (궁합 상호작용) summary. |
| `selected_cards` | array | Selected pair cards with evidence (card_id, title, evidence[], score). |
| `llm_context` | string | Optional. Assembled LLM context from selected pair cards (same as §3 LLM context preview). Present when `selected_cards.length > 0`. |

궁합 추출 시 LLM에 전달할 전체 내용(카드 컨텍스트)은 사주와 동일하게 선택된 카드의 content 조립이며, 결과 화면의 textarea에는 이 값을 표시한다.

See `api/dto/itemncard_dto.go`: `PairExtractTestResponse`.

---

## 3. LLM context preview

**URL**: `POST /api/adm/llm_context_preview`  
**Method**: POST  
**Content-Type**: application/json

### Request body

| Field | Type | Description |
|-------|------|-------------|
| `card_uids` | string[] | Optional; card UIDs. |
| `card_ids` | string[] | Optional; card IDs (use with scope). |
| `scope` | string | "saju" \| "pair" when using card_ids. |

See `api/dto/itemncard_dto.go`: `LLMContextPreviewRequest`.

### Response body

| Field | Type | Description |
|-------|------|-------------|
| `context` | string | Assembled LLM context text. |
| `length` | number | Character length. |

See `api/dto/itemncard_dto.go`: `LLMContextPreviewResponse`.

---

## 4. 사주 추출 기본 메소드 (Saju generation)

A single service-layer method (and GraphQL mutation) that takes **extracted saju user info** and an **array of output targets**, and returns the same array with a **result** field (generated text) per target. Used internally and exposed via GraphQL with the same request/response shape.

### Input

| Field | Type | Description |
|-------|------|-------------|
| **user_input** | object | Birth and timezone (minimal user-info block so the service can compute pillars per target). |
| `user_input.birth` | object | Birth date/time: `date` (YYYY-MM-DD), `time` (HH:mm or "unknown"), `time_precision` (minute \| hour \| unknown). |
| `user_input.timezone` | string | e.g. Asia/Seoul. Default: Asia/Seoul. |
| `user_input.rule_set` | string | Optional. Default: korean_standard_v1. |
| `user_input.gender` | string | Optional; required for 대운 (male/female or 男/女 for 順/逆). |
| **targets** | array | One or more output targets. |
| `targets[].kind` | string | **인생** \| **대운** \| **세운** \| **월간** \| **일간**. |
| `targets[].period` | string | Target period: "" for 인생; "0", "1", … for 대운 (0-based step); "2025" for 세운; "2025-03" for 월간; "2025-03-15" for 일간. |
| `targets[].max_chars` | int | Approximate output character limit per target. |

See `api/dto/itemncard_dto.go`: `SajuGenerationRequest`, `SajuGenerationUserInput`, `SajuGenerationTargetInput`.

### Output

Same-length array of targets with a **result** field:

| Field | Type | Description |
|-------|------|-------------|
| **targets** | array | Same order and length as request targets. |
| `targets[].kind` | string | Echo of request kind. |
| `targets[].period` | string | Echo of request period. |
| `targets[].max_chars` | int | Echo of request max_chars. |
| `targets[].result` | string | Generated saju text for that target, or empty/error message for unsupported target or failure. |

See `api/dto/itemncard_dto.go`: `SajuGenerationResponse`, `SajuGenerationTargetOutput`.

### Semantics

For each target the service:

1. **대운**: Resolves 大運 pillars from user_input (birth, timezone, gender) and target.period (0-based step index, e.g. "0", "1"). Then pillars → ItemsFromPillars → ItemsToTokens → SelectSajuCards → BuildLLMContextFromCards → OpenAI with max_chars → target.result = response text (or error message on failure). See 연도별_월별_pillar.md. user_input.gender is required for 대운 (順/逆).
2. **Other kinds**: Resolves **(runY, runM, runD)** from kind + period + birth:
   - **인생**: Birth date (runY, runM, runD = birth; run date = birth).
   - **세운** (연도별): period as year → (year, 1, 1).
   - **월간** (월별): period YYYY-MM → (year, month, 1).
   - **일간**: period YYYY-MM-DD → full date.
3. Calls **PillarsFromBirth(runY, runM, runD, hh, mm, timezone)** (or **DaesoonPillars** for 대운); on error sets result to error message and continues.
4. **ItemsFromPillars** → **ItemsToTokens** → **SelectSajuCards**; **BuildLLMContextFromCards(selected, max_chars)**.
5. Calls OpenAI (ChatCompletion) with context + instruction to generate saju text within max_chars; sets target result to response text (or error message on failure).

“Extracted saju user info” is the minimal user-info block (birth, timezone) so the service can compute pillars per target; precomputed pillars are not passed unless a simplified single-mode path is added later.

---

## 5. 궁합 추출 기본 메소드 (Chemi/Pair generation)

A single service-layer method (and GraphQL mutation) that takes **pair user input** (birthA, birthB, timezone) and an **array of output targets** (출력관점, 대략 글자수), and returns the same array with a **result** field (generated chemi text or error message) per target. Used internally and exposed via GraphQL with the same request/response shape. No REST endpoint for this method (REST pair_extract_test remains as-is).

### Input

| Field | Type | Description |
|-------|------|-------------|
| **pair_input** | object | Birth and timezone for person A and B. |
| `pair_input.birthA` | object | Person A birth: `date` (YYYY-MM-DD), `time` (HH:mm or "unknown"), `time_precision` (minute \| hour \| unknown). |
| `pair_input.birthB` | object | Person B birth (same shape as birthA). |
| `pair_input.timezone` | string | e.g. Asia/Seoul. Default: Asia/Seoul. |
| **targets** | array | One or more output targets. |
| `targets[].perspective` | string | **출력관점**: e.g. "overview", "communication", "conflict", "compatibility" or free text for LLM instruction. |
| `targets[].max_chars` | int | Approximate output character limit per target. |

See `api/dto/itemncard_dto.go`: `ChemiGenerationRequest`, `ChemiGenerationPairInput`, `ChemiGenerationTargetInput`.

### Output

Same-length array of targets with a **result** field:

| Field | Type | Description |
|-------|------|-------------|
| **targets** | array | Same order and length as request targets. |
| `targets[].perspective` | string | Echo of request perspective. |
| `targets[].max_chars` | int | Echo of request max_chars. |
| `targets[].result` | string | Generated chemi text for that target, or error message on failure (e.g. "OpenAI API key not configured", "LLM: ..."). |

See `api/dto/itemncard_dto.go`: `ChemiGenerationResponse`, `ChemiGenerationTargetOutput`.

### Semantics

1. **Validate** birthA and birthB (reject if either date invalid, e.g. y==0 from BirthInput parse).
2. **Compute pillars** A/B from pair_input (PillarsFromBirth for A and B).
3. **Items/tokens**: A/B items from pillars → A/B tokens; P_items from A/B pillars (PItemsFromPillars) → P_tokens.
4. **SelectPairCards**(aSet, bSet, pSet) → one selected card set (same for all targets; no period variation for pair).
5. For **each target**: BuildLLMContextFromCards(selected, target.max_chars); system message includes target.perspective and max_chars; call OpenAI ChatCompletion; set target.result to response text or "OpenAI API key not configured" / "LLM: "+err.

Aligned with ChemiStructure.md (P_tokens, pair cards) and §2 Pair extraction test (same pillar/items/tokens pipeline).

---

## Reference

- User info structure: `UserInfoStructure.md`.
- Card/evidence semantics: `CardDataStructure.md` (§Step 6), `ChemiStructure.md` (pair).
- DTOs: `api/dto/itemncard_dto.go`.
