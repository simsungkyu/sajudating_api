# ExtractSajuPair 도메인 로직

사주·궁합 추출의 **메인 도메인 로직**은 `api/domain/extract_saju.go`(개인 사주)와 `api/domain/extract_pair.go`(궁합)에만 존재한다.
다른 사주 관련 로직은 추후 제거 예정이며, 이 두 파일 기반의 ExtractSajuPair 흐름만 사용한다.

운(대운/세운/월운/일운) 노출 정책은 다음으로 고정한다.

- **대운**: 전체 목록(`daeunList`)을 항상 제공/표시한다.
- **세운/월운/일운**: 기본은 기준 포인트(`seun`, `wolun`, `ilun`)만 제공하고, 필요 시 범위 입력으로 리스트(`seunList`, `wolunList`, `ilunList`)를 계산한다.
- 운 항목은 간지 글자(한글/한자), 음양오행, 십성(지지는 십이운성 포함) 메타를 함께 노출한다.

---

## 1. 개요

- **입력**: 생년월일시(및 시간대·성별·양력/음력 등) → **개인 사주 문서(SajuDoc)** 생성
- **궁합**: 두 사람의 SajuDoc → **궁합 문서(PairDoc)** 생성
- **출력**: Pillars(4주), Nodes(천간/지지/지장간), Edges(관계), Facts, Evals, 대운/시주 컨텍스트 등

### 1.1 계산 런타임(현재)

- **Backend(Go)**:
  - `api/ext_dao/SxtwlExtDao.go`는 기존 API 이름을 유지한 **호환 어댑터**이며, 실제 계산은 `api/domain/ttyc/ttyc.go`(Go-native ttyc)로 수행한다.
  - 즉, 호출 표면은 `SxtwlExtDao`를 쓰더라도 런타임 계산 엔진은 ttyc다.
- **Frontend(TypeScript)**:
  - 프런트 계산/검증 라이브러리는 `admweb/src/lib/ttyc.ts`를 사용한다.
  - 절입 경계 테이블/동작도 백엔드 ttyc와 동기화되어 있다.

용어는 [docs/TERMS.md](TERMS.md)를 따른다.

---

## 2. 개인 사주: extract_saju.go

### 2.1 진입점

- **`BuildSajuDoc(input BirthInput, raw RawPillars) (*SajuDoc, error)`**
  - `BirthInput`: `dtLocal`, `tz`, `calendar`, `sex`, `timePrec`, `engine` 등
  - `RawPillars`: 이미 계산된 년/월/일/시(선택)의 천간·지지 쌍
  - 원시 간지 검증 → 정규화 → 노드/엣지/팩트/평가/대운/시주 컨텍스트까지 한 번에 계산
- **`BuildSajuDocAt(input, raw, now)`**: 기준 시점 `now`를 받아 대운/세운/월운/일운 등 시점 기준 값을 계산할 때 사용

### 2.2 검증·정규화

- **`validateRawPillars(raw)`**:
  - 천간(0..9), 지지(0..11) 유효 범위
  - 천간·지지 **음양 일치**(같은 홀짝) — 올바른 간지쌍인지 확인
- **`normalizeBirthInput`**:
  - `tz` 없으면 `Asia/Seoul`, `calendar` 없으면 `SOLAR`
  - `engine.Name` 없으면 `sxtwl`(호환 라벨), `engine.Ver` 없으면 `1`
  - 내부 계산 런타임은 `ttyc`를 사용한다.
  - `timePrec` 없으면: 시주 있으면 `MINUTE`, 없으면 `UNKNOWN`

### 2.3 Pillar(기둥) 구성

- **`buildPillar(k, raw)`**
  - 각 주(Y/M/D/H)마다: 천간·지지, **지장간**(hiddenStemTable), **납음**(naEumByCycle), **공망**(gongMangBranches)
- 시주가 없으면 3주(Y, M, D)만 존재 가능

### 2.4 Node(노드) 구성

- 기둥별로 생성:
  - **STEM**: 천간 1개 — 오행·음양·**십성**(일간 기준 TenGod)·Strength
  - **BRANCH**: 지지 1개 — 오행·음양·**십이운성**(TwelveFate)·Strength
  - **HIDDEN**: 지장간(여기·중기·정기 순) — 오행·음양·십성·Strength(순서에 따라 감쇠)
- **기둥 가중치(base)**: Y 0.90, M 1.30, D 1.10, H 0.80
- **노드별 Strength 계산**:
  - STEM: `base × 1.00`
  - BRANCH: `base × 1.20`
  - HIDDEN: `base × (0.62 − idx × 0.08)` (최솟값 0.38)
    - 여기(idx=0): `base × 0.62`
    - 중기(idx=1): `base × 0.54`
    - 정기(idx=2): `base × 0.46`
    - 정기 이후: `base × 0.38` (하한)

### 2.5 Edge(관계) 구성

- **구조 엣지**
  - `relPillar` (Weight 1.0): 같은 기둥의 천간–지지
  - `relHidden` (Weight 0.7): 지지–지장간
- **관계 엣지**(기둥 간, 모든 Y–M, Y–D, Y–H, M–D, M–H, D–H 쌍에 대해 계산)
  - **천간**: `stemRelationSpec` — 오합(甲己合土 등) → `relHe` (Weight **0.86**), 합화 결과 오행
  - **지지**: `branchRelationSpecs` — 해당되는 관계 모두 추가
    - `relChong` 沖 (Weight **1.00**)
    - `relHe` 合 (Weight **0.84**)
    - `relHyung` 刑 (Weight **0.72**)
    - `relHae` 害 (Weight **0.68**)
    - `relPo` 破 (Weight **0.64**)
    - `relSamhap` 三合 (Weight **0.88**) + 합화 결과 오행

### 2.6 지지 관계 규칙 (branchRelationSpecs)

입력 `(a, b)` 는 항상 `a ≤ b` 로 정규화한 뒤 검사한다.

- **충(沖)**: 子午(0,6), 丑未(1,7), 寅申(2,8), 卯酉(3,9), 辰戌(4,10), 巳亥(5,11) — 6쌍
- **합(合)**: 子丑(0,1), 寅亥(2,11), 卯戌(3,10), 辰酉(4,9), 巳申(5,8), 午未(6,7) — 6쌍
- **형(刑)**:
  - 삼형: 寅巳申(2,5,8), 丑戌未(1,7,10) — 세 지지 중 아무 2개면 성립
  - 상형: 子卯(0,3)
  - 자형: 辰(4)·午(6)·酉(9)·亥(11) — 두 기둥이 같은 지지일 때
- **해(害)**: 子未(0,7), 丑午(1,6), 寅巳(2,5), 卯辰(3,4), 申亥(8,11), 酉戌(9,10) — 6쌍
- **파(破)**: 子酉(0,9), 卯午(3,6), 丑辰(1,4), 未戌(7,10), 寅亥(2,11), 巳申(5,8) — 6쌍
- **삼합(三合)**: 申子辰(8,0,4)→水, 寅午戌(2,6,10)→火, 亥卯未(11,3,7)→木, 巳酉丑(5,9,1)→金
  — 세 지지 중 아무 2개가 포함되면 삼합 성립

### 2.7 Facts(팩트)

| ID | FactKind | 설명 |
|---|---|---|
| `fact.day_master` | DAY_MASTER | 일간(일주 천간), 오행·음양 |
| `fact.element.dominant` | ELEMENT_DOMINANT | 노드 Strength 합산 기준 우세 오행 |
| `fact.element.weak` | ELEMENT_WEAK | 노드 Strength 합산 기준 부족 오행 |
| `fact.month_command` | MONTH_COMMAND | 월령 오행(월지 기준) |
| `fact.relation.count` | RELATION_COUNT | 관계 타입별 개수(합·충·형·해·파·삼합) — 구조 엣지(PILLAR/HIDDEN) 제외 |
| `fact.hour.status` | HOUR_STATUS | 시주 상태(KNOWN / MISSING / ESTIMATED) |

### 2.8 Evals(평가)·점수

- **BALANCE** (`eval.balance`): 오행 분포 균형도
  ```
  diff = Σ |el_ratio − 0.2|   (5개 오행)
  BALANCE = 100 × clamp(0, 1, 1.0 − diff / 1.6)
  ```

- **DAYMASTER_SUPPORT** (`eval.daymaster_support`): 일간 지지도
  ```
  support = 일간오행비율 + 인성오행비율   (비겁+인성 계열)
  drain   = 식상오행비율 + 관성오행비율   (식상+관살 계열)
  DAYMASTER_SUPPORT = 100 × clamp(0, 1, 0.5 + (support − drain) / 2.0)
  ```

- **OVERALL** (`eval.overall`): 종합 지표
  ```
  conflictPenalty = CHONG×6 + HYUNG×5 + HAE×4 + PO×4
  OVERALL = clamp(0, 100, 0.58×BALANCE + 0.42×DAYMASTER_SUPPORT − conflictPenalty)
  ```

- **Confidence**: 시주 있으면 **0.86**, 없으면 **0.68**

### 2.9 오행·기타 보조

- **ElBalance**: `calcElDistribution(nodes)`
  - 각 노드의 Strength를 오행별로 합산 → 전체 합 대비 비율(0~1)로 정규화
  - 전체 합이 0이면 각 오행 0.2 균등 분배

- **EmptyBranches**: 일주(일간·일지) 기준 공망 지지 2개
  ```
  cycle = sexagenaryIndex(일간, 일지)   // 60갑자 순서(0..59)
  xun   = cycle / 10                    // 순(旬) 번호
  start = (10 − 2×xun) mod 12
  공망   = [start, (start+1) mod 12]
  ```

- **대운 리스트**: `buildDaeunList`
  - 순행/역행 결정: 양년간(stem%2==0)이면서 남자, 또는 음년간이면서 여자 → **순행**; 그 반대 → **역행**
  - 성별 미상이면 양년간=순행, 음년간=역행
  - 월주 천간·지지를 기준으로 ±1, ±2, … ±8 만큼 이동하여 **8개 대운**(10년 단위) 생성
  - 각 항목에 표시 메타를 채운다:
    - 간지 글자(한글/한자), 천간/지지 음양오행, 천간·지지 십성, 지지 십이운성

- **기준 포인트 + 범위 리스트 계산 경로** (`daeun`, `seun`, `wolun`, `ilun`, `seunList`, `wolunList`, `ilunList`)
  - 도메인 기본(`BuildSajuDocAt`)으로도 포인트는 채워지지만, **ExtractSaju GraphQL 서비스 경로**에서는 `applyFortuneRuns`가 조건부로 다시 계산해 최종 값을 덮어쓴다.
  - 재계산 트리거(`hasFortuneRunRequest`): 아래 중 하나라도 입력되면 실행
    - `fortuneBaseDt`
    - `seunFromYear`, `seunToYear`
    - `wolunYear`
    - `ilunYear`, `ilunMonth`
  - 트리거가 하나도 없으면:
    - `seunList`, `wolunList`, `ilunList`는 `nil`
    - 포인트는 도메인 기본 계산값 유지

- **기준일시(`baseParts`) 결정 절차**
  - 1) 출생 기준 파트(`birthParts`)를 먼저 파싱
    - 원국 계산 기준 문자열: `adjustedDt`가 있으면 `adjustedDt`, 없으면 `dtLocal`
    - 허용 포맷(`parseLocalDateTime`):
      - 시간 포함: `yyyy-mm-ddTHH:MM:SS`, `yyyy-mm-dd HH:MM:SS`, `yyyy-mm-ddTHH:MM`, `yyyy-mm-dd HH:MM`, `yyyy-mm-ddTHH`, `yyyy-mm-dd HH`, `yyyy-mm-ddTHH:MM:SS±TZ`, `yyyy-mm-ddTHH:MM±TZ`, `yyyymmddHHMM`
      - 날짜만: `yyyymmdd`, `yyyy-mm-dd`
  - 2) `fortuneBaseDt`가 비어있으면 `baseParts = birthParts`
  - 3) `fortuneBaseDt`가 있으면 `baseParts = parseLocalDateTime(fortuneBaseDt)`
  - 4) `fortuneBaseDt`에 시간이 없고(`HasTime=false`) 출생 파트에는 시간이 있으면, **출생 시각(시·분)을 base로 상속**
    - 이유: 운 경계(특히 일/시 경계) 흔들림을 줄이기 위한 정책
  - 5) 파싱 실패 시 즉시 오류 반환
    - `invalid fortuneBaseDt: unsupported format: "..."`

- **공통 pillar 재계산 규칙**
  - 모든 포인트/리스트 항목은 `calcRawPillarsAt(parts, timePrec, tz)`로 해당 시점의 원시 간지를 다시 계산한다.
  - `tz`는 입력값, 비어있으면 `Asia/Seoul`
  - 시·분 전달(`toHourMinute`)
    - `HasTime=false` 또는 `timePrec=UNKNOWN`이면 `hh/mm=nil` 전달(시주 미사용 모드)
    - `timePrec=HOUR`이면 분(`mm`)을 `0`으로 고정
    - 그 외(`MINUTE`)는 파싱된 시·분 그대로 전달
  - 항목 생성 후 `EnrichFortunePeriod(..., dayMaster)`로 표시 메타를 채운다.
    - 채워지는 메타: `stemKo/stemHanja/branchKo/branchHanja/ganjiKo/ganjiHanja/stemEl/stemYy/stemTenGod/branchEl/branchYy/branchTenGod/branchTwelve`

- **기준 포인트 계산 상세**
  - `baseRaw = calcRawPillarsAt(baseParts, ...)`
  - `seun`:
    - `Type="SEUN"`
    - `Stem/Branch = baseRaw.Year`
    - `StartYear=baseParts.Year`, `Year=baseParts.Year`
  - `wolun`:
    - `Type="WOLUN"`
    - `Stem/Branch = baseRaw.Month`
    - `StartYear=baseParts.Year`, `Year=baseParts.Year`, `Month=baseParts.Month`
  - `ilun`:
    - `Type="ILUN"`
    - `Stem/Branch = baseRaw.Day`
    - `StartYear=baseParts.Year`, `Year=baseParts.Year`, `Month=baseParts.Month`, `Day=baseParts.Day`
  - `daeun` 포인트도 `baseParts.Year` 기준으로 재선택
    - `age = baseYear - birthYear + 1`, 최소 1
    - `idx = (age-1)/10`, 범위 밖이면 `[0, len(daeunList)-1]`로 clamp

- **`seunList` 계산 상세**
  - 입력
    - 둘 다 없음: `nil` 반환
    - 둘 다 없지 않으면 `from/to` 기본값은 각각 `baseParts.Year`
    - `seunFromYear` 있으면 `from` 대체, `seunToYear` 있으면 `to` 대체
  - 검증
    - `from<=0` 또는 `to<=0` -> 오류: `seunFromYear/seunToYear must be positive`
    - `from > to`이면 자동 swap
  - 범위 제한
    - 최대 30개년 cap: `to-from+1 > 30`이면 `to = from+29`
  - 루프 (`y = from..to`, 오름차순)
    - `parts := baseParts`
    - `parts.Year = y`
    - `parts.Day = clampDay(y, parts.Month, parts.Day)` (말일 보정)
    - `raw := calcRawPillarsAt(parts, ...)`
    - append:
      - `Type="SEUN"`
      - `Stem/Branch = raw.Year`
      - `StartYear=y`, `Year=y`
  - 결과 길이: `min(정렬된 연도 구간 길이, 30)`

- **`wolunList` 계산 상세**
  - 입력
    - `wolunYear` 없음: `nil` 반환
    - `year = *wolunYear`
  - 검증
    - `year<=0` -> 오류: `wolunYear must be positive`
  - 루프 (`m = 1..12`, 항상 12개)
    - `parts := baseParts`
    - `parts.Year = year`
    - `parts.Month = m`
    - `parts.Day = clampDay(year, m, parts.Day)` (말일 보정)
    - `raw := calcRawPillarsAt(parts, ...)`
    - append:
      - `Type="WOLUN"`
      - `Stem/Branch = raw.Month`
      - `StartYear=year`, `Year=year`, `Month=m`

- **`ilunList` 계산 상세**
  - 입력 조합 규칙
    - 둘 다 없음: `nil` 반환
    - 하나만 있음: 오류 `ilunYear and ilunMonth are required together`
    - 둘 다 있으면 `year/month` 사용
  - 검증
    - `year<=0` -> 오류: `ilunYear must be positive`
    - `month<1 || month>12` -> 오류: `ilunMonth must be in 1..12`
  - 루프 범위
    - `totalDays = daysInMonth(year, month)`
    - `day = 1..totalDays` (윤년 2월은 29일까지 자동 처리)
  - 루프 본문
    - `parts := baseParts`
    - `parts.Year = year`, `parts.Month = month`, `parts.Day = day`
    - `raw := calcRawPillarsAt(parts, ...)`
    - append:
      - `Type="ILUN"`
      - `Stem/Branch = raw.Day`
      - `StartYear=year`, `Year=year`, `Month=month`, `Day=day`

- **말일 보정(`clampDay`) 상세**
  - `daysInMonth(year, month)`:
    - `year<=0` 또는 `month` 범위 오류면 방어적으로 `31` 반환
    - 정상 범위면 `time.Date(year, month+1, 0, ...).Day()`로 실제 말일 계산
  - `clampDay(year, month, day)`:
    - `day<1` -> `1`
    - `day>말일` -> `말일`
    - 그 외 그대로
  - 예: 기준일이 31일일 때 `wolunList` 2월 항목은 자동으로 28/29일로 보정

- **호출량(성능)**
  - 원국 계산 시 `ttyc` 기반 원시 기둥 계산 1회는 항상 필요
  - 운 재계산 트리거가 켜지면 추가 호출:
    - `1`회(`baseRaw`) + `len(seunList)` + `len(wolunList)` + `len(ilunList)`
  - 예: `seun 3년 + wolun 12개월 + ilun 31일` 요청 시 추가 `47`회, 총 `48`회 계산

### 2.10 시주 미상/추정 (HourContext)

- 시주 있음 → `HourKnown` (candidates 없음)
- 시주 없음:
  - `timePrec == HOUR` 이고 시 단위 입력 파싱 가능 → **HourEstimated**, 단일 추정 후보 1개
    - 시주 천간: `(일간×2 + 지지) mod 10`
    - 시주 지지: `((hour+1)/2) mod 12`
    - Weight: 1.0
  - 그 외 → **HourMissing**, 12지지 동일 가중치(1/12) 후보 12개
    - 각 후보의 시주 천간: `(일간×2 + 지지) mod 10`
- 각 후보: Order, Pillar(H주), TimeWindow(예: "23:00-00:59"), Weight
- StableNodes/StableEdges/StableFacts/StableEvals: 시주와 무관하게 유지되는 ID 목록 (=현재 3주 기준 전체)

---

## 3. 궁합: extract_pair.go

### 3.1 진입점

- **`BuildPairDoc(input PairInput, aDoc, bDoc *SajuDoc) (*PairDoc, error)`**
  - A/B 각각의 SajuDoc이 필수. 최소 연·월·일 3주 이상 each
- **`BuildPairDocAt(input, aDoc, bDoc, now)`**: 생성 시점 지정

### 3.2 PairEdge(교차 관계)

- **동일 주차(Y/M/D/H)끼리만** A–B 교차 계산
  - 천간–천간: `stemRelationSpec` (오합만, 동일 규칙)
  - 지지–지지: `branchRelationSpecs` (합/충/형/해/파/삼합)
- 각 PairEdge: Type, A/B NodeId, Weight, Result(합화), Active, Evidence
- Evidence 구조는 개인 사주와 다르게 **`NodesA`/`NodesB`** 로 양측 참조를 분리 (`PairEvidence` / `PairEvidenceInputs`)

### 3.3 PairMetrics(지표)

- **HarmonyIndex**: 합(HE)·삼합(SAMHAP) edge의 가중 합 × 12.0 → clamp(0, 100)
  ```
  harmonyRaw = Σ edge.Weight   (edge.T ∈ {HE, SAMHAP})
  HarmonyIndex = clamp(0, 100, harmonyRaw × 12.0)
  ```

- **ConflictIndex**: 충·형·해·파 edge의 가중 합 × 12.0 → clamp(0, 100)
  ```
  conflictRaw = Σ edge.Weight   (edge.T ∈ {CHONG, HYUNG, HAE, PO})
  ConflictIndex = clamp(0, 100, conflictRaw × 12.0)
  ```

- **NetIndex**: `clamp(−100, 100, HarmonyIndex − ConflictIndex)`

- **ElementComplement**: 양측 ElBalance 5개 오행을 평균 → 균형도 계산
  ```
  avg[i] = (A.el[i] + B.el[i]) / 2.0   (i = 목/화/토/금/수)
  diff   = Σ |avg[i] − 0.2|
  ElementComplement = clamp(0, 100, (1.0 − diff / 1.6) × 100)
  ```

- **UsefulGodSupport**: 일간 기준 용신·희신 방향의 상대 오행 지원도
  ```
  supportA = B의(A일간오행비율 + A인성오행비율)
  supportB = A의(B일간오행비율 + B인성오행비율)
  UsefulGodSupport = clamp(0, 100, (supportA + supportB) / 2.0 × 100)
  ```

- **RoleFit**: 양측 일간끼리 본 십성 역할 점수의 평균
  ```
  RoleFit = (tenGodRoleScore(A→B 십성) + tenGodRoleScore(B→A 십성)) / 2.0
  ```
  십성별 점수:

  | 십성 | 점수 |
  |---|---|
  | 정관·정인·정재 | 88 |
  | 편관·편인·편재 | 76 |
  | 식신 | 72 |
  | 비견 | 58 |
  | 겁재 | 52 |
  | 상관 | 48 |

- **PressureRisk**: `clamp(0, 100, ConflictIndex × 0.85)`

- **Confidence**: 시주 상태에 따라 결정
  - 양쪽 모두 KNOWN → **0.90**
  - 한쪽이라도 ESTIMATED → **0.80**
  - 한쪽이라도 MISSING → **0.72** (MISSING이 ESTIMATED보다 우선)

- **Sensitivity**: `clamp(0, 100, (1.0 − Confidence) × 100 + |NetIndex| × 0.2)`

- **TimingAlignment**: 월주(M) 관계만 보고 기본 50에서 조정
  ```
  base = 50
  합/삼합 → +10 (각각)
  충/형/해/파 → −10 (각각)
  TimingAlignment = clamp(0, 100, base + adjustments)
  ```

### 3.4 Pair Facts

| ID | PairFactKind | 설명 |
|---|---|---|
| `pair.fact.relation_summary` | RELATION_SUMMARY | 관계 타입별 개수 |
| `pair.fact.dominant_relation` | DOMINANT_RELATION | 가장 많은 관계 타입 1개 (동수이면 알파벳순 선택) |
| `pair.fact.element_complement` | ELEMENT_COMPLEMENT | 오행 보완도 값 + PairScore |

### 3.5 Pair Evals

- **HARMONY** (`pair.eval.harmony`): 조화 지수 — HE/SAMHAP 계열 edge 기반
- **CONFLICT** (`pair.eval.conflict`): 충돌 지수 — CHONG/HYUNG/HAE/PO 계열 edge 기반
- **COMPLEMENT** (`pair.eval.complement`): 보완 지수 — ElementComplement와 동일 값
- **ROLE_FIT** (`pair.eval.role_fit`): 십성 역할 정합도 — 양측 일간 노드 참조
- **TIMING** (`pair.eval.timing`): 시기 정렬도 — 월주(M) 기둥 edge 기반
- **OVERALL** (`pair.eval.overall`): 궁합 종합 점수
  ```
  netNorm = (NetIndex + 100) / 2.0    ← NetIndex(−100~100)를 0~100으로 정규화
  OVERALL = clamp(0, 100,
      0.45×netNorm
    + 0.20×ElementComplement
    + 0.15×UsefulGodSupport
    + 0.20×RoleFit
    − 0.20×PressureRisk
  )
  ```
  Score.Parts:
  - `net_norm` (W: 0.45), `element_complement` (W: 0.20), `useful_support` (W: 0.15), `role_fit` (W: 0.20), `pressure_risk` (W: −0.20)

### 3.6 Pair 시주 컨텍스트 (PairHourContext)

- A/B 각각 시주 상태(StatusA, StatusB) 및 MissingReason
- 둘 다 KNOWN이면 후보 없음
- 한쪽이라도 미상/추정이면:
  - 각자 HourCtx.Candidates에서 **앞에서부터 최대 4개** 선택
  - KNOWN인 쪽은 단일 고정 선택(Weight 1.0)
  - 조합 수 상한 **16개**로 PairHourCandidate 리스트 생성
  - 각 조합:
    - A/B 선택(PairHourChoice): Status, CandidateOrder, Pillar, TimeWindow, Weight
    - 조합 Weight = A.Weight × B.Weight
    - OverallScore: `overall × (0.8 + 0.2 × 조합Weight)`, confidence: `confidence × max(0.6, 조합Weight)`
    - Note: `"hour-candidate projection"`

---

## 4. 공통 도메인 요소 (extract_saju.go)

### 4.1 십성(TenGod)

일간 대비 타 천간의 오행 관계 + 음양 동이(同異)로 결정:

| 오행 관계 | 같은 음양 | 다른 음양 |
|---|---|---|
| 같은 오행 (diff=0) | 비견(BIGYEON) | 겁재(GEOBJAE) |
| 내가 생하는 (diff=1) | 식신(SIKSHIN) | 상관(SANGGWAN) |
| 내가 극하는 (diff=2) | 편재(PYEONJAE) | 정재(JEONGJAE) |
| 나를 극하는 (diff=3) | 편관(PYEONGWAN) | 정관(JEONGGWAN) |
| 나를 생하는 (diff=4) | 편인(PYEONIN) | 정인(JEONGIN) |

`diff = (target오행index − dayMaster오행index) mod 5`

### 4.2 십이운성(TwelveFate)

- 일간별 장생 시작 지지(`twelveFateStartBranch`):
  甲→亥(11), 乙→午(6), 丙→寅(2), 丁→酉(9), 戊→寅(2), 己→酉(9), 庚→巳(5), 辛→子(0), 壬→申(8), 癸→卯(3)
- 양간(甲丙戊庚壬): 순방향(+1), 음간(乙丁己辛癸): 역방향(−1)
- `step = (branch − start) × dir mod 12` → `twelveFateOrder[step]`
- 순서: 장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양

### 4.3 납음(納音)

- `sexagenaryIndex(stem, branch)`: 60갑자 순서(0..59) 계산
- `naEum = naEumByCycle[cycle / 2]` → 30종 (海中金, 炉中火, … 大海水)

### 4.4 공망(空亡)

- 일주(일간·일지) 기준 60갑자 index로 순(旬) 번호 산출
- `xun = cycle / 10`, `start = (10 − 2×xun) mod 12`
- 공망 지지 = `[start, (start+1) mod 12]`

### 4.5 지장간(Hidden Stems)

| 지지 | 지장간 (여기→중기→정기) |
|---|---|
| 子(0) | 癸(9) |
| 丑(1) | 己(5), 癸(9), 辛(7) |
| 寅(2) | 甲(0), 丙(2), 戊(4) |
| 卯(3) | 乙(1) |
| 辰(4) | 戊(4), 乙(1), 癸(9) |
| 巳(5) | 丙(2), 戊(4), 庚(6) |
| 午(6) | 丁(3), 己(5) |
| 未(7) | 己(5), 丁(3), 乙(1) |
| 申(8) | 庚(6), 壬(8), 戊(4) |
| 酉(9) | 辛(7) |
| 戌(10) | 戊(4), 辛(7), 丁(3) |
| 亥(11) | 壬(8), 甲(0) |

### 4.6 천간 오합(天干 五合)

| 쌍 | 합화 결과 |
|---|---|
| 甲(0)·己(5) | 土(EARTH) |
| 乙(1)·庚(6) | 金(METAL) |
| 丙(2)·辛(7) | 水(WATER) |
| 丁(3)·壬(8) | 木(WOOD) |
| 戊(4)·癸(9) | 火(FIRE) |

### 4.7 ID 체계

- `NodeId(uint32)`, `EdgeId(uint32)`, `PairEdgeId(uint32)` — 문서 내부 참조용
- Node ID는 1부터 기둥 순서(Y→M→D→H)로 STEM → BRANCH → HIDDEN 순 증가
- Edge ID는 1부터 구조 엣지 → 관계 엣지 순으로 증가
- PairEdge ID는 1부터 Y→M→D→H 기둥 순, 각 기둥 내 천간→지지 관계 순 증가

---

## 5. 스키마·버전

- SajuDoc: `schemaVer: "extract_saju.v1"`
- PairDoc: `schemaVer: "extract_pair.v1"`
- Evidence 규칙: `ruleId` / `ruleVer` / `sys`(엔진 유파)로 근거 추적
- PairDoc는 `Charts` 필드에 A/B 원본 SajuDoc을 포함(선택)

---

이 문서는 `api/domain/extract_saju.go`와 `api/domain/extract_pair.go`의 로직을 요약한 것이다.
사주 추출·궁합 계산의 **실제 메인 구현**은 위 두 파일에만 있으며, 다른 경로의 사주 로직은 제거 예정이다.
