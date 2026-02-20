# SajuAssemble(itemNcard) 테스트 범위

SajuAssemble(사주어셈블) 관련 Go 테스트 위치, 커버 범위, 수동 검증이 필요한 부분을 정리합니다.

## Go 테스트 위치

| 경로 | 설명 |
|------|------|
| `api/service/itemncard/` | 사주/궁합 파이프라인: items→tokens, trigger 평가, 카드 선택(사주/궁합), cooldown_group·domain cap |
| `api/service/AdminExtractService_test.go` | 추출 테스트 REST 핸들러: saju/pair/llm_context_preview 메서드·바디·생일 검증 |
| `api/mcplocal/cardtools_test.go` | MCP 카드 도구: cardJSONToInput 검증(saju/pair, card_id/scope/title/trigger 형식) |
| `api/types/itemncard/validation_test.go` | trigger/score JSON 검증(saju/pair, src P\|A\|B, token 필수) |

**실제 테스트 파일**: `service/itemncard/saju_test.go`, `pair_test.go`, `context_test.go`; `service/AdminExtractService_test.go`; `mcplocal/cardtools_test.go`; `types/itemncard/validation_test.go`.

## 커버 범위 요약

- **items → tokens**: `ItemsFromPillars`, `ItemsToTokens`, 관계 where 정규화(년지-일지), `PItemsFromPillars`, `ItemsToTokens`(P). 연도별/월별 파이프라인: `TestItemsFromPillars_YearMonthStyle`.
- **trigger 평가**: 사주 `EvaluateSajuTrigger`(empty, all, not 실패), 궁합 `EvaluatePairTrigger`(empty, any P, not 실패).
- **사주 카드 선택**: `SelectSajuCardsFromCards`(구조, cooldown_group, domain cap, 빈 tokenSet 시 0건). 동점·동점수 정렬 안정성: `TestSelectSajuCardsFromCards_SamePriorityAndScore_StableOrder`.
- **궁합 카드 선택**: `SelectPairCardsFromCards`(구조, P token 매칭).
- **MCP 도구**: `register_card`/`update_card`/`list_cards` 입력 검증(cardJSONToInput); DB 연동은 수동 또는 통합 테스트.
- **추출 테스트 REST**: GET 불가, invalid body, invalid birth date, LLM preview missing params.

## 흐름·테스트 범위 대조 (PRD §7 (6))

입력→pillars→items→tokens→카드 선택→결과 반환 흐름(SajuAssemble)은 `api/service/itemncard/`(saju.go, pair.go, context.go)와 `api/service/AdminExtractService.go`에서 구현되어 있으며, AdminExtractService는 itemncard 패키지(PillarsFromBirth, ItemsFromPillars, ItemsToTokens, SelectSajuCards/SelectPairCards)를 호출합니다. 위 Go 테스트 위치(itemncard, AdminExtractService_test, mcplocal, types/itemncard/validation)가 해당 로직과 수동 검증 항목(Verification.md §7·전체 흐름)을 커버합니다. 흐름 이상 여부·테스트 범위 적정성은 위 문서와 코드 대조로 확인합니다.

## 수동 검증이 필요한 부분

수동 검증은 Verification.md §6·§7 및 전체 흐름 점검 참고.

- **admweb 추출 테스트 UI**: 사주(인생/연도별/월별)·궁합 실행 후 결과 패널 표시, PillarDisplay(양=볼드, 오행=컬러), A/B 명식 요약, 선택 카드·evidence(선택 근거), LLM textarea·복사.
- **용어 일치**: "선택 근거" = evidence(매칭된 trigger 토큰). PRD §2-4, Verification.md, OperatorGuide.md, ExtractionAPI.md와 동일.
- **LLM 컨텍스트 미리보기**: `POST /api/adm/llm_context_preview` 호출 후 대화상자에 표시되는지. (API 단위 테스트는 AdminExtractService_test.go에서 수행.)

## 테스트 로직·범위 확인 (PRD §7)

SajuAssemble(itemNcard) 관련 Go 테스트는 `service/itemncard`, `service`, `mcplocal`, `types/itemncard` 패키지에서 수행되며, 추출 REST·MCP 입력 검증·trigger/score 검증을 커버한다. DB·sxtwl 의존 테스트는 제외되어 `make test-itemncard` 및 `go test ./...`가 MongoDB 없이 통과한다.

**테스트 범위 점검 완료 (2026-02-01, task_2026-02-01T063938)**: CardDataStructure(trigger all/any/not, score), TokenRule(items→tokens, where 정규화, 연도별/월별 pillar→items), ChemiStructure(P_tokens, pair trigger src P|A|B)가 `service/itemncard/`, `AdminExtractService_test.go`, `types/itemncard/validation_test.go`, `mcplocal/cardtools_test.go`에서 적당한 로직·범위로 커버됨. pair trigger src A/B 검증은 `ValidateCardPayload`(pair, src P 유효·src X/누락 오류) 및 `EvaluatePairTrigger`(any P, not 실패)로 간접 커버. 별도 권장 추가 테스트 없음.

**PRD §7 (6) 흐름·테스트 범위 재확인 (2026-02-01, task_2026-02-01T071119)**: 입력→pillars→items→tokens→카드 선택→결과 반환 흐름 및 AdminExtractService→itemncard 호출 구조를 코드 대조로 재확인. TestScope.md 흐름·테스트 범위 대조와 일치. 적정 범위 유지.

**테스트 로직·범위 확인 (2026-02-01, task_2026-02-01T075142)**: types/itemncard, service/itemncard, service, mcplocal 패키지 및 make test-itemncard 범위 재확인. TestScope.md 커버 범위·흐름 대조와 일치. 갭 없음.

**테스트 로직·범위 확인 (2026-02-01, task_2026-02-01T081229)**: make test-itemncard 실행. types/itemncard, service/itemncard, service, mcplocal 통과. TestScope.md 대조 갭 없음. PRD §7 (6) 적정 범위 유지.

## 실행 방법

- SajuAssemble(itemNcard) + 서비스 + MCP 테스트 및 빌드: repo root에서 `cd api && make test-itemncard`.
- itemncard 패키지만: `cd api && go test ./service/itemncard/...`.
- MCP만(DB 불필요): `cd api && go test ./mcplocal/...`.
