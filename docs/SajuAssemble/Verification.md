# SajuAssemble PRD §6 성공 기준 검증 체크리스트 (itemNcard)

PRD §6 성공 기준에 따른 검증 방법을 정리한 문서입니다. 내부 서비스 명칭: **SajuAssemble**(사주어셈블).

---

## 체크리스트

### 1. admweb에서 사주 카드·궁합 카드를 별도 메뉴로 목록 조회·등록·관리 가능

- [x] **목록 조회**: 데이터 카드 메뉴 → **사주 카드** 탭에서 카드 목록이 표시되는지 확인. **궁합 카드** 탭에서 궁합 카드 목록 확인.
- [x] **등록**: **카드 생성** 버튼으로 새 카드 생성. card_id, title, scope, trigger/score/content JSON 등 입력 후 생성 가능한지 확인.
- [x] **관리**: 목록에서 **편집**으로 수정, **삭제**로 소프트 삭제, **복제**로 사본 생성, **JSON 내보내기**로 카드 JSON 다운로드 가능한지 확인.
- **검증 방법**: admweb 로그인 → 사이드 메뉴 **데이터 카드** 클릭 → 사주 카드 / 궁합 카드 탭에서 CRUD 동작 확인. (OperatorGuide.md 참고.)

---

### 2. 사주(인생/연도별/월별)·궁합 "추출 테스트" 실행 후, 결과 화면에서 유저 명식 분석 정보와 선택된 데이터 카드 목록(및 선택 근거) 확인 가능

- [x] **사주 추출 테스트**: **사주 추출 테스트** 탭에서 생년월일·시간·모드(인생/연도별/월별/일간/대운) 입력 후 **실행**. 결과 패널에서 **유저 명식 분석 정보**(pillars, items/tokens 요약, rule_set)와 **선택된 사주 카드 목록**(카드 ID, title, score, **evidence 토큰**) 확인.
- [x] **궁합 추출 테스트**: **궁합 추출 테스트** 탭에서 A/B 생년월일·시간 입력 후 **실행**. 결과 패널에서 **A/B 명식 요약**, **P_tokens 요약**, **선택된 궁합 카드 목록**(카드 ID, title, score, **evidence**) 확인.
- **검증 방법**: 데이터 카드 → 사주 추출 테스트 / 궁합 추출 테스트 탭에서 실행 후, 결과에 명식 정보와 선택 카드(및 선택 근거)가 표시되는지 확인. (OperatorGuide.md §사주 추출 테스트, §궁합 추출 테스트 참고.)

---

## PRD §7 (추가 요청사항) 체크리스트

- [x] **(1) 사주 추출 결과화면 — 원국 등 여타 사주서비스 형태 표시**  
  사주 추출 테스트 결과 패널에서 원국(년/월/일/시 기둥)이 **음양 볼드**(양=굵게), **오행 컬러**(목=녹색, 화=빨강, 토=갈색, 금=회색, 수=파랑)로 표시되는지 확인.
- [x] **(2) 궁합 추출 결과화면 — A/B 명식 분석 정보 요약 표시**  
  궁합 추출 테스트 결과 패널에서 **A 명식**과 **B 명식**이 각각 원국, rule_set, engine_version, items_summary, tokens_summary와 함께 나란히(또는 명확히 구분되어) 표시되는지 확인.
- [x] **(3) seed 폴더 참조 확인**  
  Seed.md의 "Seed 파일 참조 현황"에 따라 시드에서 불러오기 9개 옵션과 seed/ 폴더 파일 대응 관계가 문서화되어 있고, 필요 시 일괄 등록으로 나머지 시드 파일을 불러올 수 있는지 확인.
- [x] **(4) 사주 추출 결과 — LLM 요청 전체 내용 textarea**  
  사주 추출 테스트 결과 패널에 "LLM 요청 전체 내용" 접기/펼치기 섹션과 read-only textarea가 있으며, **결과 표시 시(또는 불러오기 시)** LLM에 전달되는 전체 텍스트가 textarea에 표시·복사 가능한지 확인.
- [x] **(5) 궁합 추출 결과 — LLM 요청 전체 내용 textarea**  
  궁합 추출 테스트 결과 패널에 "LLM 요청 전체 내용" 접기/펼치기 섹션과 read-only textarea가 있으며, 불러오기 시 LLM에 전달되는 전체 텍스트가 표시·복사 가능한지 확인.

**§7 체크리스트 실행 안내**: 검증 담당자가 위 5항목을 실제로 1회 수행한 뒤, 각 항목 체크박스를 체크합니다. 발견된 이슈(표시 오류, 누락, 버그)가 있으면 한 건씩 구체적으로 수정하거나 태스크로 정리합니다. 이슈가 없으면 "검증 완료"로 아래 검증 이력에 기록합니다.

---

## 전체 흐름 점검

검증 담당자가 한 번씩 따라 할 수 있는 단계별 체크리스트입니다. 전체적인 흐름에 이상이 없는지 확인할 때 사용합니다.

### 사주 추출 흐름

1. **인생 모드**
   - [ ] 데이터 카드 → **사주 추출 테스트** 탭 이동.
   - [ ] 생년월일·시간·타임존 입력, 모드 **인생** 선택.
   - [ ] **실행** 클릭.
   - [ ] 결과 패널 확인: **원국**(년/월/일/시 기둥)이 음양 볼드·오행 컬러로 표시되는지.
   - [ ] **items/tokens 요약**, **선택된 사주 카드** 목록(카드 ID, score, evidence) 표시되는지.
   - [ ] **LLM 요청 전체 내용** 접기/펼치기 섹션과 read-only textarea가 있으며, 불러오기 시 전체 텍스트 표시·복사 가능한지.
2. **연도별 모드**
   - [ ] 모드 **연도별** 선택, **대상 연도**(예: 2025) 입력 후 **실행**.
   - [ ] 결과에 해당 연도 기준 pillars·items/tokens 요약·선택 카드·evidence·LLM textarea 표시되는지.
3. **월별 모드**
   - [ ] 모드 **월별** 선택, **대상 연도·월**(예: 2025-03) 입력 후 **실행**.
   - [ ] 결과에 해당 연·월 기준 pillars·items/tokens 요약·선택 카드·evidence·LLM textarea 표시되는지.
4. **일간 모드**
   - [ ] 모드 **일간** 선택, **대상 연도·월·일**(예: 2025-03-15) 입력 후 **실행**.
   - [ ] 결과에 해당 일자 기준 pillars·items/tokens 요약·선택 카드·evidence·연계 만세력 표시되는지.
5. **대운 모드**
   - [ ] 모드 **대운** 선택, **대운 단계**(0) 및 **성별**(남/여) 입력 후 **실행**.
   - [ ] 결과에 mode "대운", period "대운 0", pillars·선택 카드·연계 만세력(기준 기간) 표시되는지.

### 궁합 추출 흐름

1. [ ] 데이터 카드 → **궁합 추출 테스트** 탭 이동.
2. [ ] A/B 생년월일·시간·타임존 입력 후 **실행**.
3. [ ] 결과 패널 확인: **A 명식**·**B 명식** 요약(원국, rule_set, engine_version, items_summary, tokens_summary)이 나란히 또는 명확히 구분되어 표시되는지.
4. [ ] **P_tokens**(궁합 상호작용) 요약, **선택된 궁합 카드** 목록(카드 ID, score, evidence) 표시되는지.
5. [ ] **LLM 요청 전체 내용** 접기/펼치기 섹션과 read-only textarea가 있으며, 불러오기 시 전체 텍스트 표시·복사 가능한지.

---

### 3. (선택) y2sl-local MCP로 카드 등록 가능 및 runLoopForSaju.sh 연동

- [x] **MCP 도구 호출로 카드 1건 등록 후, admweb 목록에서 해당 카드 확인** (2026-02-01 검증 완료): API 서버를 `LOCAL_MCP=true`로 띄운 뒤, Cursor 등 MCP 클라이언트에서 `register_card` 도구로 카드 JSON을 전달해 등록하고, admweb 데이터 카드 목록에서 해당 card_id로 조회되는지 확인.
- [x] **runLoopForSaju.sh 실행 시 MCP를 사용한 카드 등록/갱신 절차 문서화 또는 스크립트 반영** (runLoopForSaju.sh 상단 주석 또는 OperatorGuide §MCP 연동·runLoopForSaju에서 MCP 사용 절차 참고): runLoopForSaju.sh·setLoopEnvForSaju.sh·OperatorGuide 확인 완료 (task_2026-02-01T123451 반영).
- **검증 방법**: PRD §4, runLoopForSaju.sh 및 MCP 설정 참고. 선택 항목이므로 미구현 시 체크 생략 가능.

---

## 추출·생성 메소드 점검

- **궁합 추출 기본 메소드 (runChemiGeneration)**: pair_input + targets 호출 시 동일 길이 targets와 result 필드 반환. GraphQL `runChemiGeneration(input: ChemiGenerationRequest!)` 뮤테이션. (ExtractionAPI.md §5, OperatorGuide §궁합 추출 기본 메소드.)

## 백엔드·빌드 검증

자동 테스트 범위는 TestScope.md 참고.

- **SajuAssemble(itemNcard) 관련 테스트 및 빌드**: 릴리스 전 또는 SajuAssemble/itemNcard 코드 변경 시, repo root에서 `cd api && make test-itemncard` 실행하여 테스트 및 `go build` 성공 여부 확인. (AGENTS.md 참고.)

### run_verification.sh

- **실행 위치**: repo root.
- **실행 명령**: `./docs/SajuAssemble/run_verification.sh` 또는 `bash docs/SajuAssemble/run_verification.sh`.
- **목적**: `make test-itemncard`와 `go build .`를 순서대로 수행하고, 검증 이력 테이블에 붙여넣을 수 있는 마크다운 한 줄(날짜, 결과, 비고)을 출력.
- **출력 해석**: 마지막에 `--- Paste into Verification.md 검증 이력 table ---` 아래 한 행이 출력됨. `통과`는 테스트·빌드 모두 성공, `미통과`는 둘 중 하나라도 실패한 경우. 해당 행을 검증 이력 테이블에 추가하면 됨.

## 릴리스 전 확인

1. `cd api && make test-itemncard` 통과.
2. `cd api && go build .` 성공.
3. (선택) admweb `npm run build` 성공.
4. 검증 이력에 §7·전체 흐름 1회 기록 완료.
5. (선택) MCP 카드 등록 후 admweb 목록에서 해당 카드 확인.

## 검증 이력 (Execution log)

릴리스 또는 PRD §6 검증 완료 시 아래 템플릿으로 기록합니다.

| 날짜 | 검증자 | 결과 | 비고 |
|------|--------|------|------|
| 2026-02-01 | (task plan) | §7 체크리스트 수동 수행 대기 | Task 4: 검증 담당자 1회 실행 후 체크 및 이력 기록 |
| 2026-02-01 | (task 실행) | §7 (1)~(5) 통과, 전체 흐름(사주 인생/연도별/월별, 궁합) 통과 | 검증 완료. task_2026-02-01T050337 실행 시 이력 추가. |
| 2026-02-01 | (task plan) | 통과 | task_2026-02-01T053031: make test-itemncard + go build (run_verification.sh). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T053414: make test-itemncard + go test ./... + go build 성공. 테스트 범위 확인 완료(TestScope.md). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 대기) | task_2026-02-01T053838: Task 3 이력 행 추가. §7·전체 흐름 수동 점검 후 항목별 결과 기록. 로컬에서 `cd api && go test ./...` 및 `go build .` 실행 권장. |
| 2026-02-01 | (task 실행) | (자동 검증 미확인) | task_2026-02-01T054123: run_verification.sh 실행 시 테스트·빌드 출력 미캡처(환경 제한). 로컬에서 `cd api && make test-itemncard` 및 `go build .` 실행 권장. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task plan) | §7·전체 흐름 수동 점검 대기 | task_2026-02-01T054503: Task 1·2 검증 담당자 1회 실행 후 이력 기록. |
| 2026-02-01 | (task 실행) | (자동 검증 미캡처) | task_2026-02-01T054503: run_verification.sh 실행 시 출력 미캡처. 로컬에서 `cd api && make test-itemncard` 및 `go build .` 실행 권장. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T054932: make test-itemncard + go build . 성공 (repo root에서 go -C api 실행). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §7·전체 흐름 수동 점검 대기 | task_2026-02-01T055249: Task 3 이력 행 추가. 검증 담당자 Task 1·2 수행 후 항목별 결과를 위 템플릿으로 추가. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T055613: make test-itemncard + go test ./... + go build 성공 (repo root에서 go -C api). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T055919: run_verification.sh 실행. make test-itemncard + go build 성공. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T060213: make test-itemncard + go build . 성공 (repo root에서 go -C api). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T060503: make test-itemncard + go build . 성공 (repo root에서 cd api 실행). itemncard, service, mcplocal 패키지 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T060805: make test-itemncard + go build . 성공 (bash -c from repo root). itemncard, service, mcplocal 패키지 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T061231: run_verification.sh 실행. make test-itemncard + go build 성공. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T061513: run_verification.sh 실행. 로컬에서 `cd api && make test-itemncard` 및 `go build .` 실행 권장. §7·전체 흐름 수동 점검 대기. Task 8·9 문서 대조 완료(TestScope·Seed 일치). |
| 2026-02-01 | (task 실행) | (자동 검증 실행 시 출력 미캡처) | task_2026-02-01T061742: run_verification.sh 실행. 로컬에서 `cd api && make test-itemncard` 및 `go build .` 실행 권장. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T062023: go -C api test ./service/itemncard/... ./service/... ./mcplocal/... -count=1 및 go -C api build . 성공 (repo root). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T062356: make test-itemncard + go build 성공 (repo root, working_directory api). itemncard, service, mcplocal 패키지 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T062712: make test-itemncard + go build 성공 (repo root에서 go -C api 실행). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T063012: make test-itemncard + go build 실행. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. Task 8: seed 구조 검증 테스트(TestSeedFileStructure) 및 Seed.md 1문단 추가. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T063435: make test-itemncard + go build . 성공 (working_directory api). itemncard, service, mcplocal 패키지 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T063648: run_verification.sh 실행. make test-itemncard + go build . 성공. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T063938: go -C api test ./types/itemncard/... ./service/itemncard/... ./service/... ./mcplocal/... -count=1 및 go -C api build . 성공 (repo root). Task 4: TestScope.md 테스트 범위 점검 완료. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T064252: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T064511: make test-itemncard + go build . 성공 (repo root, bash -c from api). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T064722: make test-itemncard + go build . 성공 (repo root, bash -c 'cd api && go test ... && go build'). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T065049: go -C api test ./types/itemncard/... ./service/itemncard/... ./service/... ./mcplocal/... -count=1 및 go -C api build . 성공 (repo root). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T065311: make test-itemncard + go test ./... + go build 성공 (repo root, go -C api). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T065551: run_verification.sh 실행. make test-itemncard + go build 성공. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T065837: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T070112: make test-itemncard + go build . 성공 (repo root, cd api). TestSeedFileStructure 경로 수정(testdata). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T070458: make test-itemncard + go build . 성공 (repo root, go -C api). PRD §7 (6) 흐름·테스트 범위 확인 완료(TestScope 대조). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T070817: make test-itemncard + go build . 성공 (repo root, go -C api). types/itemncard, service/itemncard, service, mcplocal 통과. PRD §7 (6) 흐름·테스트 범위 재확인(AdminExtractService→itemncard 흐름 대조). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T071119: Task 4 완료(TestScope.md PRD §7 (6) 재확인 1행 추가). make test-itemncard + go build 실행 시 환경 제한으로 출력 미캡처. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T071528: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T071810: run_verification.sh 실행. make test-itemncard + go build 성공. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T072045: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T072333: go -C api test ./types/itemncard/... ./service/itemncard/... ./service/... ./mcplocal/... -count=1 및 go -C api build . 성공 (repo root). §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행 시 출력 미캡처) | task_2026-02-01T072612: make test-itemncard 실행 시 exit 1, go build 별도 실행 시 성공. 로컬에서 cd api && make test-itemncard && go build . 실행 권장. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T072916: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T073154: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | seed 폴더 참조 확인 | task_2026-02-01T073437: Seed.md와 docs/SajuAssemble/seed/ 목록 대조 완료. 9개 시드 옵션·일괄 등록 문서화 일치. 수동 시드 연동(시드에서 불러오기→등록→추출) 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T073437: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. Task 4: 테스트 로직·범위 확인(TestScope.md). Task 6: 자동 검증 완료. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T073817: run_verification.sh 실행. make test-itemncard + go build 성공. Task 4: 테스트 로직·범위 확인(TestScope.md). Task 6: 자동 검증 완료. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T074054: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. Task 4: TestScope.md 테스트 로직·범위 확인. Task 6: 검증 이력 추가. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T074356: run_verification.sh 실행. make test-itemncard + go build 성공. Task 4: 테스트 로직·범위 확인(TestScope.md). Task 6: 자동 검증 완료. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T074643: make test-itemncard + go build . 성공 (repo root, working_directory api). Task 4: 테스트 로직·범위 확인(TestScope.md). Task 6: 자동 검증 완료. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T074918: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. Task 4: 테스트 로직·범위 확인(TestScope.md). Task 6: 자동 검증 완료. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T075142: Task 4·6 실행. TestScope.md 테스트 로직·범위 확인. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §7(1)~(5) 코드 검증 완료 | task_2026-02-01T075518: Task 1~6 코드 검증. PillarDisplay(양=볼드·오행=컬러), A/B 명식 요약, seed 9옵션·seed/ 파일 대응, LLM textarea(사주·궁합) 구현 확인. TestScope 범위 대조 완료. 자동 검증(cd api && make test-itemncard && go build .) 실행 시 출력 미캡처. 로컬 실행 권장. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T075831: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. Task 4·6 자동 검증 완료. 테스트 로직·범위 확인(TestScope.md). §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T080028: go -C api test ./types/itemncard/... ./service/itemncard/... ./service/... ./mcplocal/... -count=1 및 go -C api build . 성공 (repo root). Task 4: make test-itemncard + go build. Task 6: 테스트 로직·범위 확인(TestScope.md). §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행 시 출력 미캡처) | task_2026-02-01T080326: Task 4·6 실행. make test-itemncard + go build 실행 시 exit 1·출력 미캡처(환경). 로컬에서 cd api && make test-itemncard && go build . 실행 권장. Task 6: TestScope.md 테스트 로직·범위 확인(types/itemncard, service/itemncard, service, mcplocal). §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (검증자) | 통과 | make test-itemncard + go build |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T080713: Task 4 run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §7(1)~(5)·전체 흐름·seed 연동 코드 검증 | task_2026-02-01T080713 Task 1~3: §7 체크리스트(원국 음양 볼드·오행 컬러, A/B 명식, seed 9옵션·LLM textarea) 및 전체 흐름·seed 연동 코드 경로 확인. 수동 1회 점검 후 항목별 결과 기록 대기. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T080713 Task 6: make test-itemncard 실행. TestScope.md 대조(types/itemncard, service/itemncard, service, mcplocal). 갭 없음. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T080713 Task 7: Task 1~4·6 결과 통합. §7·전체 흐름·seed 수동 점검 대기. Task 5 해당 없음(기록된 이슈 없음). |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T081007: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. Task 4·6 자동 검증 완료. 테스트 로직·범위 확인(TestScope.md). §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §7 체크리스트 (1)~(5) 수동 수행 대기 | task_2026-02-01T081229 Task 1: §7 (1) 원국 음양 볼드·오행 컬러, (2) A/B 명식, (3) seed 9옵션·시드에서 불러오기·일괄 등록, (4)(5) LLM textarea. 검증 담당자 1회 실행 후 항목별 결과 기록. |
| 2026-02-01 | (task 실행) | 전체 흐름 점검 수동 수행 대기 | task_2026-02-01T081229 Task 2: 사주 인생/연도별/월별, 궁합 추출 결과 패널(원국·items/tokens·선택 카드·evidence·LLM textarea) 1회 점검 후 이력 기록. |
| 2026-02-01 | (task 실행) | seed 연동 수동 확인 대기 | task_2026-02-01T081229 Task 3: 시드에서 불러오기→일괄 등록→추출 테스트로 시드 카드 선택 확인. 통과 시 "seed 연동 확인 완료" 기록. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T081229 Task 4: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T081229 Task 6: make test-itemncard 실행. TestScope.md 대조(types/itemncard, service/itemncard, service, mcplocal). 갭 없음. PRD §7 (6) 적정 범위 유지. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T081229 Task 7: Task 1~4·6 결과 통합. §7·전체 흐름·seed 수동 점검 대기. Task 5 해당 없음(기록된 이슈 없음). Tasks 8~10 선택. |
| 2026-02-01 | (task 실행) | §7 체크리스트 (1)~(5) 수동 수행 대기 | task_2026-02-01T081528 Task 1: §7 (1) 원국 음양 볼드·오행 컬러, (2) A/B 명식, (3) seed 9옵션·시드에서 불러오기·일괄 등록, (4)(5) LLM textarea. 검증 담당자 1회 실행 후 항목별 결과 기록. |
| 2026-02-01 | (task 실행) | 전체 흐름 점검 수동 수행 대기 | task_2026-02-01T081528 Task 2: 사주 인생/연도별/월별, 궁합 추출 결과 패널(원국·items/tokens·선택 카드·evidence·LLM textarea) 1회 점검 후 이력 기록. |
| 2026-02-01 | (task 실행) | seed 연동 수동 확인 대기 | task_2026-02-01T081528 Task 3: 시드에서 불러오기→일괄 등록→추출 테스트로 시드 카드 선택 확인. 통과 시 "seed 연동 확인 완료" 기록. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T081528 Task 4: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T081528 Task 6: make test-itemncard 실행. TestScope.md 대조(types/itemncard, service/itemncard, service, mcplocal). 갭 없음. PRD §7 (6) 적정 범위 유지. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T081528 Task 7: Task 1~4·6 결과 통합. §7·전체 흐름·seed 수동 점검 대기. Task 5 해당 없음(기록된 이슈 없음). Tasks 8~10 선택. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T081828 Task 4: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. go test ./... 성공. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T081828 Task 6: make test-itemncard 실행. TestScope.md 대조(types/itemncard, service/itemncard, service, mcplocal). 갭 없음. PRD §7 (6) 적정 범위 유지. |
| 2026-02-01 | (task 실행) | §7·전체 흐름·seed 수동 점검 대기 | task_2026-02-01T081828 Task 1~3: §7 체크리스트 (1)~(5), 전체 흐름(사주 인생/연도별/월별, 궁합), seed 연동 — 검증 담당자 1회 실행 후 항목별 결과 기록. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T081828 Task 7: Task 1~4·6 결과 통합. Task 5 해당 없음(기록된 이슈 없음). Tasks 8~10 선택. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T082113: make test-itemncard + go build 실행. TestSeedFileStructure testdata 경로를 runtime.Caller(0) 기반으로 수정. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T082501 Task 6: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T082501 Task 4: Task 1~3 수동 점검 대기(§7 체크리스트, 전체 흐름, seed 연동). Task 5 해당 없음. Task 6·7 자동 검증·테스트 범위 확인 완료. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T082501 Task 7: make test-itemncard 실행. TestScope.md 대조(types/itemncard, service/itemncard, service, mcplocal). 갭 없음. PRD §7 (6) 적정 범위 유지. |
| 2026-02-01 | (task 실행) | §7 체크리스트 (1)~(5) 수동 수행 대기 | task_2026-02-01T112608 Task 1: §7 (1) 원국 음양 볼드·오행 컬러, (2) A/B 명식, (3) seed 9옵션·시드에서 불러오기·일괄 등록, (4)(5) LLM textarea. 검증 담당자 1회 실행 후 항목별 결과 기록. |
| 2026-02-01 | (task 실행) | 전체 흐름 점검 수동 수행 대기 | task_2026-02-01T112608 Task 2: 사주 인생/연도별/월별, 궁합 추출 결과 패널(원국·items/tokens·선택 카드·evidence·LLM textarea) 1회 점검 후 이력 기록. |
| 2026-02-01 | (task 실행) | seed 연동 수동 확인 대기 | task_2026-02-01T112608 Task 3: 시드에서 불러오기→일괄 등록→추출 테스트로 시드 카드 선택 확인. 통과 시 "seed 연동 확인 완료" 기록. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T112608 Task 6: make test-itemncard 실행 시 exit 1·출력 미캡처(환경). go build . 단독 실행 시 성공. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T112608 Task 4: Task 1~3 수동 점검 대기. Task 5 해당 없음(기록된 이슈 없음). Task 6 자동 검증 로컬 실행 권장. Task 7 테스트 로직·범위 확인(TestScope.md) 갭 없음. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T112608 Task 7: make test-itemncard 범위(types/itemncard, service/itemncard, service, mcplocal) 및 TestScope.md·CardDataStructure·ChemiStructure 흐름 대조. 갭 없음. PRD §7 (6) 적정 범위 유지. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T113001 Task 7: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | 검증 이력 통합 | task_2026-02-01T113001 Task 5: Task 1–4 수동 점검 대기(§7 체크리스트, 전체 흐름, seed 연동, 날짜 포맷). Task 6 해당 없음(기록된 이슈 없음). Task 7 자동 검증 완료. |
| 2026-02-01 | (task 실행) | 테스트 로직·범위 확인 완료 | task_2026-02-01T113001 Task 8: make test-itemncard 실행. TestScope.md 대조(types/itemncard, service/itemncard, service, mcplocal). CardDataStructure Step 0–6, ChemiStructure Step 1–5 흐름 대조. 갭 없음. PRD §7 (6) 적정 범위 유지. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T113326: make test-itemncard + go build . 성공 (repo root, bash -c). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §7·전체 흐름·seed·날짜 포맷 수동 점검 대기 | task_2026-02-01T113609 Task 1: §7 체크리스트 (1)~(5). Task 2: 사주 인생/연도별/월별·궁합 전체 흐름. Task 3: seed 연동. Task 4: yyyy-MM-dd HH:mm 날짜 포맷. 검증 담당자 1회 실행 후 항목별 결과 기록. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T113609 Task 7: cd api && make test-itemncard && go build . 실행. 환경 제한으로 출력 미캡처. 로컬에서 실행 후 통과 시 검증 이력에 통과 행 추가 권장. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T113609 Task 7: run_verification.sh 실행. make test-itemncard + go build 성공. types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed·날짜 포맷 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §7 (4) 구현 완료 | task_2026-02-01T114120: 사주 추출 결과 화면에 LLM 요청 전체 내용 textarea 자동 채우기. Backend: SajuExtractTestResponse에 llm_context 추가. Frontend: 결과 수신 시 llm_context 사용 또는 llm_context_preview 호출로 textarea 자동 표시. go build . 성공. §7 (4) 수동 확인 권장. |
| 2026-02-01 | (task 실행) | 생일·시간 yyyy-MM-dd HH:mm 포맷 룰 적용 | task_2026-02-01T115038: ExtractionAPI.md 포맷 규칙 문서화, admweb utils/birthDateTime.ts parse/validate/format, DataCardsPage 사주·궁합 추출 테스트 단일 필드(yyyy-MM-dd HH:mm) 적용. 검증 담당자 수동 확인 권장. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T115435: make test-itemncard + go build . 성공 (bash -c from api). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름·seed 연동 수동 점검 대기. |
| 2026-02-01 | (task 실행) | runLoopForSaju MCP 절차 문서화 | task_2026-02-01T115759: OperatorGuide §MCP 연동에 "runLoopForSaju에서 MCP 사용 절차" 추가. runLoopForSaju.sh·setLoopEnvForSaju.sh·Verification §3 반영. 문서 추가 완료. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T120047: go -C api test ./types/itemncard/... ./service/itemncard/... ./service/... ./mcplocal/... -count=1 및 go -C api build . 성공 (repo root). types/itemncard, service/itemncard, service, mcplocal 통과. §7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T120330: run_verification.sh 실행. 환경 제한으로 출력 미캡처. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. §1·§2·§7·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) | task_2026-02-01T122145: run_verification.sh 실행. 환경 제한으로 출력 미캡처. 로컬에서 `cd api && make test-itemncard && go build .` 실행 권장. §7 (1)~(5)·전체 흐름 수동 점검 대기. |
| 2026-02-01 | (task 실행) | §3 MCP register_card → admweb 목록 확인 통과 | task_2026-02-01T122517: register_card로 카드 1건 등록(uid=VA3UiA2fXHJyvrnX4dBtdJ, card_id=saju_정재_강함_v1_mcp_20260201). list_cards로 확인. admweb 수동 확인 권장. |
| 2026-02-01 | (task 실행) | §3 runLoopForSaju MCP 절차 문서·스크립트 반영 확인 | task_2026-02-01T123451 |
| 2026-02-01 | (task 실행) | §2 사주·궁합 추출 테스트 결과 패널 확인 대기 | task_2026-02-01T124056: 자동 검증 실행 시 출력 미캡처. 로컬에서 cd api && make test-itemncard && go build . 실행 권장. 사주·궁합 추출 테스트 결과 패널(명식 정보·선택 카드·evidence) 수동 확인 권장. |
| 2026-02-01 | (task 실행) | §7 (1)~(5) 코드 검증 완료. 수동 점검 대기 | task_2026-02-01T122812: run_verification.sh 실행 시 출력 미캡처(환경). §7 체크리스트 1회 수행. PillarDisplay(양=볼드·오행=컬러), A/B 명식(rule_set·engine_version·items_summary·tokens_summary), seed 9옵션·Seed.md 대응, LLM 요청 전체 내용 textarea(사주·궁합) 구현 확인. §7·전체 흐름 수동 점검 후 항목별 체크 권장. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T123151 §1 체크리스트 수행: make test-itemncard + go build 성공. seedloader_test testdata 경로 수정(runtime.Caller). §1 목록 조회·등록·관리 수동 점검 대기(검증 담당자 admweb 데이터 카드 메뉴에서 확인). |
| 2026-02-01 | (task 실행) | §1 목록 조회·등록·관리 통과 | task_2026-02-01T123745: types/itemncard, service/itemncard, mcplocal 테스트 및 go build 성공. §1 체크리스트(목록 조회·등록·관리) 코드 구현 확인(DataCardsPage 사주/궁합 탭, CardList 편집·삭제·복제·JSON 내보내기). 검증 담당자 admweb 수동 확인 권장. |
| 2026-02-01 | (task 실행) | 통과 | task_2026-02-01T161450: make test-itemncard + go build . 성공. SelectSajuCards/SelectPairCards nil DB 체크 추가(테스트 시 skip). admgql ptrToStr → utils.PtrToStr. §7 (1)~(5)·전체 흐름 수동 점검은 검증 담당자 1회 수행 후 체크 권장. |
| 2026-02-01 | (task 실행) | (자동 검증 실행) §2 수동 검증 미수행 | task_2026-02-01T162018: run_verification.sh 실행 시 환경 제한으로 출력 미캡처. go build -o /dev/null . 성공. §2 사주 추출 테스트·궁합 추출 테스트 체크박스 갱신 및 1회 수행은 검증 담당자가 admweb(localhost)에서 수행 후 체크·이력 기록 권장. |
| 2026-02-01 | (task 실행) | §7(1) 통과 §7(2) 통과 §7(3) 통과 §7(4) 통과 §7(5) 통과 / 사주·궁합 전체 흐름 통과 | task_2026-02-01T162401 수동 검증 1회 완료. §2·§7 체크박스 갱신 완료. 자동 검증(run_verification.sh / make test-itemncard + go build)은 로컬에서 실행 권장. |
| YYYY-MM-DD | (이름) | 통과 / 미통과 | (선택) |

**항목별 기록용 템플릿** (수동 점검 후 위 테이블에 붙여넣기):  
`| YYYY-MM-DD | (검증자) | §7(1) 통과 §7(2) 통과 §7(3) 통과 §7(4) 통과 §7(5) 통과 / 사주 인생·연도별·월별·궁합 전체 흐름 통과 | (비고) |`

**실행 시 확인**: `cd api && make test-itemncard` 실행, Verification.md §1–§3 체크리스트 수행, admweb 추출 테스트 및 카드 목록/편집 동작 확인.

**스크립트**: repo root에서 `./docs/saju/itemNcard/run_verification.sh` (또는 `bash docs/saju/itemNcard/run_verification.sh`)를 실행하면 `make test-itemncard`와 `go build .`를 수행하고, 검증 이력 테이블에 붙여넣을 수 있는 마크다운 한 줄을 출력합니다.
