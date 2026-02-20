# 설계 제안: SajuAssemble V2 (정확도·의도 정합성 중심)

이 문서는 기존 SajuAssemble(itemNcard) 구조를 유지하면서, 더 정확하고 의도에 맞는 풀이를 만들기 위한 차세대 설계 방향을 제안한다.

- 문서 성격: 방향성 설계(Architecture Proposal)
- 대상 범위: 명식 계산 결과 모델, 카드 선택 로직, 궁합 상호작용 모델, LLM 생성 입력 구조
- 비목표: UI 스타일/색상/레이아웃 상세

---

## 0) 문제 정의

현재 구조는 기능적으로는 충분히 동작하지만, 아래 문제로 인해 고정밀 해석 품질이 제한된다.

1. 모드/기간 용어가 API별로 분산되어 있다. (연도별/세운, 월별/월간 혼용)
2. `rule_set`이 카드 선택 단계에서 강하게 분리되지 않아 룰셋 혼합 리스크가 있다.
3. 궁합 점수 계산에서 `src(P|A|B)` 의미가 충분히 반영되지 않는다.
4. 대운/세운/월간/일간 간의 계산 출처와 설명가능성(provenance)이 약하다.
5. LLM 입력이 카드 텍스트 중심이라, 명식 근거(facts)가 충분히 전달되지 않는다.

---

## 1) V2 목표

V2는 다음 5가지를 동시에 달성하는 것을 목표로 한다.

1. 정확도: 같은 입력이면 같은 근거와 결과를 재현
2. 정합성: 모드/룰셋/관점이 출력에 명시적으로 반영
3. 설명가능성: 카드 선택 및 문장 생성 근거를 추적 가능
4. 확장성: 새 유파(rule_set), 새 카드군, 새 관점 추가 용이
5. 검증가능성: 자동 테스트/오프라인 평가로 품질 회귀 감지

---

## 2) 핵심 설계 원칙

1. Canonical Fact First  
   - 모든 해석은 공통 `facts` 정본을 먼저 만들고, tokens/cards/LLM은 파생으로 처리한다.

2. Horizon Explicit  
   - `인생`, `대운`, `세운(연도별)`, `월간`, `일간`을 내부적으로 명확한 enum으로 관리한다.

3. RuleSet Isolation  
   - 계산, 토큰, 카드 선택은 동일 `rule_set` 경계 안에서만 동작한다.

4. Source-Aware Pair Logic  
   - 궁합은 `A`, `B`, `P`를 독립 집합으로 유지하며 trigger/score 모두 src-aware로 평가한다.

5. Retrieval/Generation Separation  
   - 카드 선택 결과(구조화 데이터)와 LLM 문장화(자연어 생성)를 분리한다.

---

## 3) 도메인 모델 (V2)

### 3-1) AnalysisContext

```json
{
  "analysis_id": "uuid",
  "scope": "saju|pair",
  "horizon": "LIFE|DAESOON|YEAR|MONTH|DAY",
  "period": "YYYY | YYYY-MM | YYYY-MM-DD | 대운 N | ''",
  "rule_set": "korean_standard_v2",
  "engine_version": "saju-calc@X.Y.Z",
  "input_quality": "HIGH|MEDIUM|LOW"
}
```

### 3-2) Canonical Fact

```json
{
  "id": "fact_001",
  "k": "십성|관계|오행|신살|격국|용신|강약|궁합",
  "n": "정재|충|토|도화|...",
  "where": ["월간", "A.일지-B.월지"],
  "w": 78,
  "grade": "H",
  "src": "SELF|A|B|P",
  "sys": "rule_variant_id",
  "horizon": "LIFE|YEAR|MONTH|DAY|DAESOON",
  "period": "2026-03",
  "provenance": {
    "calculator": "sxtwl",
    "formula": "tg_pair_he_v2",
    "inputs": ["pillarA.day", "pillarB.month"]
  }
}
```

### 3-3) Card Candidate / Match

```json
{
  "card_id": "pair_conflict_001",
  "scope": "pair",
  "rule_set": "korean_standard_v2",
  "horizon": ["LIFE", "YEAR", "MONTH", "DAY"],
  "perspectives": ["communication", "conflict"],
  "trigger": { "all": [], "any": [], "not": [] },
  "score": { "base": 50, "bonus_if": [], "penalty_if": [] },
  "match": {
    "passed": true,
    "evidence": ["궁합:충@A.일지-B.일지#H"],
    "score_total": 68
  }
}
```

---

## 4) 파이프라인 (V2)

1. Input Normalize  
   - 생년월일시, timezone, calendar를 표준 구조로 정규화
   - 모드 별 필수 필드 검증

2. Horizon Resolver  
   - `인생/연도별/월별/일간/대운`을 내부 enum으로 매핑
   - period 포맷을 canonical string으로 고정

3. Chart Compute  
   - horizon별 계산 기준일/기준기둥 산출
   - pillar_source와 provenance 생성

4. Fact Build  
   - 명식/궁합 facts 생성 (src, horizon, period 포함)

5. Token Compile  
   - facts -> tokens 변환
   - token에 src/horizon/rule_set 반영 가능 구조 유지

6. Card Candidate Filter  
   - `scope`, `rule_set`, `horizon`, `status`, `perspective`로 1차 필터

7. Trigger + Score Evaluate  
   - trigger: src-aware 평가
   - score: src-aware + perspective 가중치 적용

8. Selection Policy  
   - top-N, domain cap, cooldown, diversity 제약 적용

9. Generation Context Build  
   - 카드 텍스트 + 핵심 facts + evidence를 구조화하여 조립

10. LLM Generation + Post Validation  
   - 관점별 템플릿 적용
   - 출력 길이/금칙어/근거누락 검사

---

## 5) 모드 체계 통합 제안

외부 표시 용어와 내부 enum을 분리한다.

| 외부 용어 | 내부 enum | period 형식 |
|-----------|-----------|-------------|
| 인생 | LIFE | `""` |
| 대운 | DAESOON | `"0"`, `"1"` |
| 연도별/세운 | YEAR | `"YYYY"` |
| 월별/월간 | MONTH | `"YYYY-MM"` |
| 일간/일별 | DAY | `"YYYY-MM-DD"` |

핵심 규칙:

- API별 용어는 alias 허용
- 내부 저장/평가는 enum으로만 처리
- 로그/디버그/응답에는 외부 용어 + enum 모두 노출 가능

---

## 6) 궁합 설계 고도화 제안

### 6-1) P_items 범위 확장

현재 동일 위치 비교 중심에서 교차 위치 비교를 확장한다.

- 동일 위치: `A.일지-B.일지`
- 교차 위치: `A.일간-B.월간`, `A.월지-B.일지`
- 테마 이벤트: 갈등/소통/재정/성장 등

### 6-2) src-aware scoring 강제

pair 카드 점수 규칙에 `src`를 기본 필드로 요구한다.

- `bonus_if`: src + token + add
- `penalty_if`: src + token + sub
- 누락 시 기본 src=`P`로 강제하거나 validation 에러 처리

### 6-3) perspective 라우팅

궁합 결과를 단일 문장으로 만들지 않고, 관점별로 라우팅한다.

- overview
- communication
- conflict
- trust
- finance
- growth

각 perspective에 카드 풀과 score weight를 다르게 부여한다.

---

## 7) 카드 스키마 V2 제안

기존 스키마에 아래 메타를 추가한다.

```json
{
  "applicability": {
    "horizons": ["LIFE", "YEAR", "MONTH"],
    "perspectives": ["overview", "career"],
    "rule_sets": ["korean_standard_v2"]
  },
  "quality_gate": {
    "min_confidence": "M",
    "requires_time_precision": false
  },
  "generation_hints": {
    "tone": "balanced",
    "must_include_evidence": true
  }
}
```

효과:

- 모드별 카드 오용 감소
- 저신뢰 입력에서 과도한 단정 방지
- 생성 단계의 일관된 문체 제어

---

## 8) API 구조 제안

### 8-1) 분석 API

- `analyzeSaju(input) -> AnalysisResult`
- `analyzePair(input) -> AnalysisResult`

AnalysisResult는 facts/tokens/pillar_source를 포함한다.

### 8-2) 카드 선택 API

- `selectCards(analysisId, scope, perspective, limit) -> SelectedCards`

### 8-3) 생성 API

- `generateReading(analysisId, perspectives[], maxChars, style) -> ReadingResult[]`

핵심은 “분석 결과를 먼저 고정한 뒤” 선택/생성을 분리하는 것이다.

---

## 9) 품질/평가 체계

### 9-1) 자동 테스트

- 모드별 입력 검증
- facts -> tokens 결정성
- trigger/score src-aware 검증
- horizon/rule_set mismatch 차단

### 9-2) 오프라인 평가셋

모드 x 관점 매트릭스로 골든셋을 만든다.

- 사주: LIFE/DAESOON/YEAR/MONTH/DAY x career/love/health/finance
- 궁합: overview/communication/conflict/trust/finance

### 9-3) 운영 지표

- 카드 선택 precision@K
- evidence coverage(%)
- perspective consistency score
- 금칙어/단정어 위반율

---

## 10) 마이그레이션 전략

### Phase 0: 명세 확정

- enum, period, rule_set 경계 문서화
- 카드 스키마 V2 확정

### Phase 1: 병행 저장

- 기존 구조 유지
- facts/provenance 필드를 신규로 병행 생성

### Phase 2: 선택 엔진 교체

- src-aware score + horizon/perspective filter 적용
- 기존 엔진과 A/B 비교 로깅

### Phase 3: 생성 엔진 교체

- 카드+facts+evidence 기반 프롬프트 도입
- 품질 게이트 적용

### Phase 4: 기본 전환

- V2를 기본 경로로 승격
- V1 fallback은 기간 한정 유지 후 제거

---

## 11) 즉시 실행 가능한 개선 TODO (현재 리포 기준)

1. 모드 canonical enum 매핑 테이블 추가 (REST/GraphQL/admweb 공통)
2. pair score에 `src` 적용 로직 구현
3. 카드 조회 시 `rule_set` 필터를 선택 엔진 기본값으로 강제
4. `selected_cards`에 `match_detail`(어느 rule가 매칭됐는지) 확장
5. LLM 입력에 `facts_summary` 블록 추가
6. seed 경로/문서 경로 정합성 재정리

---

## 12) 의사결정 포인트

최종적으로 아래 두 축을 선택해야 한다.

1. 정확도 우선  
   - 계산/선택/생성 모두 구조화 + 검증 강화
   - 개발 비용 증가, 품질 안정성 상승

2. 출시 속도 우선  
   - 현재 구조 유지 + 카드 확장 중심
   - 단기 속도는 빠르나 품질 편차 관리 비용 증가

권장안은 “정확도 우선”이며, 최소한 Phase 0~2는 선반영하는 것을 권장한다.
