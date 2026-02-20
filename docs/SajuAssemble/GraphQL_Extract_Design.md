# 설계: 사주 추출 테스트 API 목적별 GraphQL 쿼리 분리

<!-- 설계항목만 정리. 실제 admgql.graphql 반영은 별도 작업에서 수행. -->

`POST /api/adm/saju_extract_test` 의 목적을 세 가지로 나누어, 각각에 대응하는 GraphQL 쿼리/뮤테이션 설계항목을 정의한다.  
내부 서비스 명칭: **SajuAssemble**(사주어셈블).

**출력 형식(공통)**  
응답은 **SimpleResult** + `nodes`/`kvs`로 감싸서 반환하는 것을 기본으로 한다.  
실제 데이터 타입은 **SimpleResult** 내부의 `node`/`nodes`에 넣을 **Node를 implement하는 구체 타입**으로 정의한다.

**SajuChart 타입(공통)**  
사주 명식(원국) 및 파생요소를 담는 **공통 Node 타입**. `sajuChart` 쿼리뿐 아니라 `runSajuGeneration`·기타 메소드에서도 재사용한다.

| 구분 | 필드 | 설명 |
|------|------|------|
| **필수** | `pillars` | 四柱. y, m, d, h (간지 문자열). 사주 명식의 뼈대(항상 있음). |
| **옵션** | `dm` | 일간(예: 甲). pillars.d에서 도출 가능하나 편의상 포함. |
| **옵션** | `itemsSummary` | 사주 파생요소 요약 문자열. |
| **옵션** | `items` | 사주 파생요소 구조화 배열(십성, 지장간, 신살 등). |
| **옵션** | `ruleSet` | 계산 룰셋(예: korean_standard_v1). |
| **옵션** | `engineVersion` | 계산 엔진 버전. |
| **옵션** | `mode` | 인생/연도별/월별/일간/대운 등. |
| **옵션** | `period` | 대상 기간 표시(예: "2025", "2025-03-15"). |
| **옵션** | `pillarSource` | 연계 만세력(기준일·기간 등). |
| **옵션** | `tokens` | 조회/트리거용 토큰 배열. |

GraphQL에서는 `type SajuChart implements Node { id, pillars!, dm, itemsSummary, items, ... }` 형태로 정의. 필수는 pillars뿐, 나머지는 optional로 두어 다른 API에서 필요한 필드만 채워 재사용.

**SajuPairChart 타입(공통)**  
궁합(2인)용 차트·토큰을 담는 **공통 Node 타입**. `sajuPairChart` 쿼리 및 `runChemiGeneration`·기타 궁합 메소드에서 재사용한다. A/B 각각은 **SajuChart**로, 궁합 상호작용은 **P_tokens**로 표현.

| 구분 | 필드 | 설명 |
|------|------|------|
| **필수** | `chartA` | A의 사주 차트. **SajuChart** 타입. |
| **필수** | `chartB` | B의 사주 차트. **SajuChart** 타입. |
| **필수** | `pTokens` | 궁합 상호작용 토큰 배열(P_tokens). 카드 트리거 매칭에 사용. |
| **옵션** | `pItemsSummary` | 궁합 파생요소(상호작용 items) 요약 문자열. |
| **옵션** | `pItems` | 궁합 파생요소 구조화 배열. |
| **옵션** | `ruleSet` | 계산 룰셋(궁합 공통). |
| **옵션** | `engineVersion` | 계산 엔진 버전. |

GraphQL에서는 `type SajuPairChart implements Node { id, chartA!: SajuChart!, chartB!: SajuChart!, pTokens!: [String!]!, ... }` 형태로 정의. 필수는 chartA, chartB, pTokens뿐, 나머지는 optional.

---

## 1) 사주 명식(원국) + 파생요소 추출 쿼리 (User info → 명식·파생요소)

용어는 PRD 용어 정리 준거: **사주 명식(원국)** = 만세력 계산으로 나온 팔자의 구조(四柱); **사주 파생요소** = 십성, 지장간, 신살 등 명식으로부터 도출되는 요소.

**목적**: 생년월일시·시간대 등 기본 유저 정보를 받아, **사주 명식(원국)**(팔자 구조)과 **사주 파생요소**(십성, 지장간, 신살 등)를 추출해 반환한다.  
옵션으로 **조회 토큰**(tokens)도 함께 반환할 수 있다.

| 항목 | 내용 |
|------|------|
| **타입** | Query (읽기 전용; 계산만 수행, 저장하지 않음) |
| **이름** | `sajuChart` |
| **입력** | 생년월일시 블록(`birth`: date, time, time_precision), timezone, (선택) calendar, mode(인생/연도별/월별/일간/대운), target_year/month/day/daesoon_index, gender(대운 시) — 기존 `SajuExtractTestRequest`와 동일한 정보. |
| **출력** | **SimpleResult**로 감싸서 반환. `node`에는 위 **SajuChart**(공통 타입) 사용. sajuChart 쿼리는 필요한 필드를 모두 채워 반환(필수 pillars + 옵션 dm, itemsSummary/items, ruleSet, engineVersion, mode, period, pillarSource, includeTokens 시 tokens). 필요 시 `kvs` 활용. |
| **비고** | 카드 선택/LLM 호출은 하지 않음. REST `saju_extract_test`의 user_info + pillar_source에 해당(명식·파생요소만). |

**설계 선택지**

- **사주 파생요소**(items): itemsSummary만 할지, 구조화된 items 배열(카테고리·이름·위치·가중치 등)까지 노출할지.

---

## 1') 궁합용 차트·토큰 추출 쿼리 (sajuPairChart)

**목적**: A/B 두 사람의 생년월일시·시간대를 받아, **A 명식(원국)·파생요소**, **B 명식(원국)·파생요소**, **P_tokens**(궁합 상호작용)를 한 번에 추출해 반환한다. `sajuChart`의 궁합 대응이며, **pairCardsByTokens**(§2')에 넣을 tokensA/tokensB/pTokens를 이 쿼리 결과로 채울 수 있다.

| 항목 | 내용 |
|------|------|
| **타입** | Query (읽기 전용; 계산만 수행, 저장하지 않음) |
| **이름** | `sajuPairChart` |
| **입력** | `birthA`, `birthB` (각각 date, time, time_precision), `timezone`. (선택) calendar. **옵션** `includeTokens: Boolean` — true이면 chartA/chartB에 tokens 포함. pTokens는 항상 포함. |
| **출력** | **SimpleResult**로 감싸서 반환. `node`에는 위 **SajuPairChart**(공통 타입) 사용. chartA, chartB(SajuChart), pTokens 필수 채움. 필요 시 pItemsSummary/pItems, ruleSet, engineVersion. 필요 시 `kvs` 활용. |
| **비고** | 카드 선택/LLM 호출은 하지 않음. REST `pair_extract_test`의 summary_a, summary_b, p_tokens_summary에 해당. |

**설계 선택지**

- **궁합 파생요소**(pItems): pItemsSummary만 할지, 구조화된 pItems 배열까지 노출할지.

---

## 2) 조회 토큰 기준 데이터 카드 조회 쿼리 (사주 전용) — itemnCardsByTokens

**목적**: **조회 토큰**(lookup token set)을 기준으로, 트리거가 매칭된 **사주 데이터 카드** 목록을 조회한다.  
사주 명식(원국)·파생요소 추출(§1)과 분리되어, “이미 알고 있는 토큰 집합으로 어떤 카드가 선택되는지”만 보고 싶을 때 사용. 궁합은 별도 쿼리 **pairCardsByTokens**(§2') 사용.

| 항목 | 내용 |
|------|------|
| **타입** | Query |
| **이름** | `itemnCardsByTokens` |
| **입력** | `tokens: [String!]!` (조회 토큰 배열). (선택) limit, rule_set. 사주(saju) 전용. |
| **출력** | **SimpleResult**로 감싸서 반환. `nodes`에는 **Node를 implement하는 구체 타입** 목록(선택된 카드: card_id, title, evidence, score, content 요약 등)을 넣음. 기존 ItemNCard 확장 또는 SelectedCard 대응 Node 타입으로 정의. 필요 시 `kvs` 활용. |
| **비고** | SajuAssemble 로직 중 “tokenSet → SelectSajuCards” 부분만 수행. 궁합 카드 조회는 **pairCardsByTokens**(§2') 사용. |

**설계 선택지**

- **Node 구현체**: 선택 카드 한 건을 담을 type을 `implements Node`로 정의. 기존 ItemNCard + evidence/score 확장 또는 SelectedCard 대응 타입(예: SelectedItemnCard) 사용.

---

## 2') 조회 토큰 기준 궁합 데이터 카드 조회 쿼리 — pairCardsByTokens

**목적**: **궁합**용 세 토큰 집합(tokensA, tokensB, pTokens)을 기준으로, 트리거가 매칭된 **궁합 데이터 카드** 목록을 조회한다.  
궁합 차트·토큰 추출(§1')과 분리되어, "이미 알고 있는 A/B/P 토큰으로 어떤 궁합 카드가 선택되는지"만 보고 싶을 때 사용. **sajuPairChart** 결과의 chartA.tokens, chartB.tokens, pTokens를 넣어 호출(궁합 대체 흐름 시 `includeTokens: true`로 sajuPairChart 호출 권장).

| 항목 | 내용 |
|------|------|
| **타입** | Query |
| **이름** | `pairCardsByTokens` |
| **입력** | `tokensA: [String!]!` (A 명식 토큰 배열), `tokensB: [String!]!` (B 명식 토큰 배열), `pTokens: [String!]!` (궁합 상호작용 토큰 배열). (선택) limit, rule_set. |
| **출력** | **SimpleResult**로 감싸서 반환. `nodes`에는 **Node를 implement하는 구체 타입** 목록(선택된 궁합 카드: card_id, title, evidence, score, content 요약 등)을 넣음. itemnCardsByTokens와 동일한 Node 구현체(SelectedItemnCard 등) 재사용 가능. 필요 시 `kvs` 활용. |
| **비고** | SajuAssemble 로직 중 "aSet, bSet, pSet → SelectPairCards"만 수행. 세 집합을 **한 번에** 넘겨야 하며, 토큰을 나눠 여러 번 호출하면 올바른 궁합 카드 선택 결과를 얻을 수 없음. |

**설계 선택지**

- **Node 구현체**: itemnCardsByTokens와 동일한 선택 카드 타입(SelectedItemnCard 등) 재사용. evidence에 A/B/P 중 어떤 토큰이 매칭됐는지 구분해 넣을지 여부는 선택.

---

## 3) 프롬프트만으로 LLM 요청 (공통) — sendLLMRequest

**목적**: **프롬프트만** 넣어서 LLM에 요청을 보낸다. 카드 UID/컨텍스트는 사용하지 않는다.  
사주 전용이 아니라 **공통 기능**으로, 단순 “프롬프트 → LLM 호출”만 수행한다.

| 항목 | 내용 |
|------|------|
| **타입** | Mutation (부수효과: LLM API 호출) |
| **이름** | `sendLLMRequest` |
| **입력** | **프롬프트만**: (필수) prompt, max_tokens, model, temperature 등 LLM 파라미터. **카드 UID 없음.** |
| **출력** | **SimpleResult**로 감싸서 반환. LLM 응답 텍스트·토큰 수·에러는 `node` 또는 `value`/`kvs` 등 SimpleResult 필드로 전달. 필요 시 Node 구현체(예: LLMRequestResult)에 담아 `node`에 넣음. |
| **비고** | 카드 지정(card_uids 등)은 받지 않음. “카드 컨텍스트 + 지시”가 필요하면 admweb에서 (2) 사주 / (2') 궁합 카드 조회 후 컨텍스트 문자열을 만들어 프롬프트에 포함해 이 뮤테이션을 호출하면 됨. |
- ai_metas 연동: 이 뮤테이션은 프롬프트만 받으므로 AiMeta 참조는 별도 기능으로 둔다.


---

## 4) 기존 API와의 관계

| 현재 REST / GraphQL | 분리 후 GraphQL와의 관계 |
|--------------------|--------------------------|
| `POST /api/adm/saju_extract_test` | (1) `sajuChart` + (2) `itemnCardsByTokens` 를 admweb에서 순차 호출. LLM 호출이 필요하면 (2) 결과로 만든 컨텍스트를 프롬프트에 넣어 (3) `sendLLMRequest` 호출. 또는 기존 REST는 유지하고 GraphQL는 단계별 호출용으로만 사용. |
| `POST /api/adm/pair_extract_test` | (1') `sajuPairChart` + (2') `pairCardsByTokens(tokensA, tokensB, pTokens)` 순차 호출. LLM 필요 시 (2) 결과로 컨텍스트 조립 후 (3) `sendLLMRequest`. |
| `runSajuGeneration` / `runChemiGeneration` | 기존처럼 “사주 명식(원국)·파생요소/궁합 파이프라인 전체”를 유지. (1)(1')(2)(2')(3)은 테스트/디버깅/단계별 제어용. 아래 "대체 가능 여부" 참고. |


---

## 5) admgql.graphql 반영 시 체크리스트

- [ ] (1) **sajuChart**: input type, 출력 = SimpleResult + node. **SajuChart**(공통 타입, 필수 pillars / 옵션 나머지) 사용.  
- [ ] (1') **sajuPairChart**: input type (birthA, birthB, timezone). 출력 = SimpleResult + node. **SajuPairChart**(공통 타입, 필수 chartA, chartB, pTokens / 옵션 나머지) 사용.  
- [ ] (2) **itemnCardsByTokens**: tokens input(사주 전용). 출력 = SimpleResult + nodes. Node 구현체(선택 카드 타입) 정의.  
- [ ] (2') **pairCardsByTokens**: tokensA, tokensB, pTokens input. 출력 = SimpleResult + nodes. Node 구현체는 itemnCardsByTokens와 동일 타입 재사용 가능.  
- [ ] (3) **sendLLMRequest**: 프롬프트만 입력(카드 UID 없음), LLM 파라미터 input. 출력 = SimpleResult + node/value/kvs.  
- [ ] 공통: 모든 응답은 SimpleResult 래핑. node/nodes에는 Node를 implement하는 구체 타입 사용. 에러는 SimpleResult.err 등으로 전달.

이 문서는 설계항목만 정의하며, 실제 `api/admgql/admgql.graphql` 수정은 위 체크리스트를 바탕으로 별도 작업에서 수행한다.
