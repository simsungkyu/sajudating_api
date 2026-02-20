# Seed data for SajuAssemble (itemNcard)

How to load seed JSON from `docs/SajuAssemble/seed/` into the system. 내부 서비스 명칭: **SajuAssemble**(사주어셈블).

**ENV=dev 시 추출 테스트**: ENV=dev일 때 사주·궁합 추출 테스트는 seed 폴더(`docs/SajuAssemble/seed` 또는 환경 변수 `ITEMNCARD_SEED_DIR`)의 JSON 파일을 카드 소스로 사용합니다. DB에 카드를 미리 넣지 않아도 추출 테스트를 실행할 수 있습니다.

## Seed 파일 참조 현황

**시드에서 불러오기 (admweb)**  
admweb 카드 생성 폼의 "시드에서 불러오기" 드롭다운은 `admweb/src/data/seedCards.ts`에 정의된 9개 옵션을 사용합니다.

| 옵션 ID | 라벨 | scope | 대응 seed 파일 |
|---------|------|--------|----------------|
| saju_정재_강함 | saju_정재_강함 | saju | seed/saju_정재_강함.json |
| pair_궁합_충 | pair_궁합_충 | pair | seed/pair_궁합_충.json |
| saju_신살_도화 | saju_신살_도화 | saju | seed/saju_신살_도화.json |
| saju_오행_토 | saju_오행_토 | saju | seed/saju_오행_토.json |
| pair_궁합_합 | pair_궁합_합 | pair | seed/pair_궁합_합.json |
| pair_궁합_천간합 | pair_궁합_천간합 | pair | seed/pair_궁합_천간합.json |
| saju_격국_정재격 | saju_격국_정재격 | saju | seed/saju_격국_정재격.json |
| pair_궁합_형 | pair_궁합_형 | pair | seed/pair_궁합_형.json |
| saju_확신_전체 | saju_확신_전체 | saju | seed/saju_확신_전체.json |

**Seed.md에 언급된 파일**  
아래 Example files 표에 나열된 파일: saju_정재_강함.json, saju_관계_충.json, saju_신살_도화.json, pair_궁합_충.json, pair_궁합_합.json.

**seed/ 폴더 중 UI에서 참조되지 않는 파일**  
`seed/` 디렉터리에는 README.md를 제외한 JSON 시드 파일이 다수 있으며, 위 9개 옵션 외에는 "시드에서 불러오기"에서 직접 선택할 수 없습니다. **일괄 등록**으로 불러오는 방법: admweb 데이터 카드 → 사주 카드 또는 궁합 카드 탭 → **일괄 등록** 버튼 → 카드 객체 배열이 담긴 JSON 파일 선택. 각 객체는 CardDataStructure(saju) 또는 ChemiStructure(pair) 형식이어야 하며, 현재 탭의 scope와 일치하는 항목만 등록됩니다.

**seed/ 폴더 추가 파일**  
seed/에는 위 9개 옵션 및 아래 카테고리 표 외에도 추가 JSON 파일(예: pair_궁합_보완, pair_궁합_신강갈등, pair_궁합_역마, saju_격국_정인격, saju_신살_염성, saju_겁재_강함/약함, saju_확신_격국/신살/십성, saju_정재_월간/지장간, saju_편재_시지/일지 등)이 있을 수 있으며, **일괄 등록**으로 모두 불러올 수 있습니다.

**미참조 파일 카테고리별 정리**

| 카테고리 | 파일 (scope) |
|----------|--------------|
| **십성** | saju_십성_겁재.json, saju_십성_비견.json, saju_십성_상관.json, saju_십성_식신.json, saju_십성_정관.json, saju_십성_정인.json, saju_십성_편관.json, saju_십성_편인.json, saju_십성_편재.json, saju_정재_약함.json, saju_편재_강함.json, saju_편재_약함.json, saju_편관_강함.json, saju_편인_강함.json, saju_편인_약함.json, saju_상관_강함.json, saju_식신_강함.json (saju) |
| **격국** | saju_격국_식신격.json, saju_격국_정관격.json, saju_격국_정재격.json, saju_격국_편관격.json, saju_격국_편인격.json, saju_격국_편재격.json, saju_격국_건록격.json (saju) |
| **용신** | saju_용신_금.json, saju_용신_목.json, saju_용신_수.json, saju_용신_토.json, saju_용신_화.json (saju) |
| **강약** | saju_강약_신강.json, saju_강약_신약.json, saju_강약_중화.json (saju) |
| **관계** | saju_관계_반합.json, saju_관계_방합.json, saju_관계_충.json, saju_관계_파.json, saju_관계_합.json, saju_관계_해.json, saju_관계_형.json, saju_관계_삼합.json, saju_관계_천간합.json (saju) |
| **오행** (일부 미참조) | saju_오행_금.json, saju_오행_목.json, saju_오행_수.json, saju_오행_화.json (saju; 토는 시드 옵션에 포함) |
| **신살** (일부 미참조) | saju_신살_역마.json, saju_신살_천을귀인.json, saju_신살_문창.json (saju; 도화는 시드 옵션에 포함) |
| **육친** | saju_육친_모친.json, saju_육친_배우자.json, saju_육친_부친.json, saju_육친_자녀.json, saju_육친_형제자매.json (saju) |
| **확신** | saju_확신_용신.json (saju; 전체는 시드 옵션 9개에 포함) |
| **궁합** (일부 미참조) | pair_궁합_갈등.json, pair_궁합_반합.json, pair_궁합_방합.json, pair_궁합_삼합.json, pair_궁합_성장.json, pair_궁합_소통.json, pair_궁합_신뢰.json, pair_궁합_오행상보.json, pair_궁합_재정.json, pair_궁합_파.json, pair_궁합_해.json, pair_궁합_안정.json, pair_궁합_애정.json, pair_궁합_확신.json (pair; 충/합/천간합/형은 시드 옵션 9개에 포함) |

---

## Example files

| File | Scope | Description |
|------|--------|-------------|
| `saju_정재_강함.json` | saju | 정재가 강하게 드러남 (십성, money_core) |
| `saju_관계_충.json` | saju | 관계/충 (relation) |
| `saju_신살_도화.json` | saju | 신살 도화 |
| `pair_궁합_충.json` | pair | 궁합 충 (P tokens) |
| `pair_궁합_합.json` | pair | 궁합 합 |

See `seed/README.md` for logical shape (trigger/score/content as objects). When calling the API, use **stringified** JSON for `triggerJson`, `scoreJson`, `contentJson`.

## 시드 파일 검증

seed/ 폴더의 JSON이 CardDataStructure(saju) 또는 ChemiStructure(pair)에 맞는지 수동으로 확인하는 방법입니다.

- **필수 필드**: `card_id`, `scope`, `title`, `trigger`, `content`(또는 API에서 허용하는 최소 필드)가 존재하는지 확인.
- **saju (scope: saju)**: CardDataStructure.md 참고. `trigger`는 `all`/`any`/`not` 배열, 각 요소는 `{ "token": "..." }` 형태. `score`는 `base`, `bonus_if`, `penalty_if` 등. `content`는 `summary`, `points`, `questions`, `guardrails` 등.
- **pair (scope: pair)**: ChemiStructure.md 참고. `trigger`/`score` 내 토큰 조건은 반드시 **src** 필드 포함: `"src": "P"` (궁합 상호작용), `"src": "A"` (A 명식), `"src": "B"` (B 명식). P|A|B 중 하나만 허용.
- **일괄 등록 전**: 시드 파일 1개를 열어 위 항목을 눈으로 확인하거나, admweb에서 "시드에서 불러오기"로 1건 로드 후 생성·저장이 되는지로 간이 검증 가능. 자동 검증 스크립트가 필요하면 api 또는 docs 쪽에 시드 1개를 입력으로 CardDataStructure/ChemiStructure 준수 여부를 검사하는 테스트 또는 스크립트를 추가할 수 있음.
- **자동 검증 (Go 테스트)**: api에서 `go test ./types/itemncard/... -run TestSeedFileStructure`를 실행하면 `api/types/itemncard/testdata/` 내 시드 형식 JSON(seed_saju.json, seed_pair.json)이 CardDataStructure/ChemiStructure(trigger·score, pair 시 src P|A|B)에 맞는지 검사합니다. 시드 파일을 추가할 때 동일 형식으로 testdata에 샘플을 두고 위 테스트를 실행하면 구조 준수 여부를 확인할 수 있습니다.

## Step-by-step: GraphQL (createItemnCard)

1. Obtain an admin auth token (login via GraphQL `login` mutation).
2. Call `createItemnCard(input: ItemNCardInput!)` with the payload below.
3. Map seed file fields to input:
   - `cardId` = seed `card_id`
   - `version`, `status`, `ruleSet`, `scope`, `title`, `category` = from seed
   - `tags`, `domains` = arrays from seed
   - `priority`, `cooldownGroup`, `maxPerUser` = from seed
   - `triggerJson` = `JSON.stringify(seed.trigger)`
   - `scoreJson` = `JSON.stringify(seed.score)` or `"{}"`
   - `contentJson` = `JSON.stringify(seed.content)` or `"{}"`
   - `debugJson` = `JSON.stringify(seed.debug)` or `"{}"`

**Sample payload** (from `saju_정재_강함.json`):

```json
{
  "input": {
    "cardId": "십성_정재_강함_v1",
    "version": 1,
    "status": "published",
    "ruleSet": "korean_standard_v1",
    "scope": "saju",
    "title": "정재가 강하게 드러남",
    "category": "십성",
    "tags": ["money", "planning"],
    "domains": ["personality", "work"],
    "priority": 60,
    "triggerJson": "{\"all\":[{\"token\":\"십성:정재\"},{\"token\":\"십성:정재#H\"}],\"any\":[{\"token\":\"십성:정재@월간\"},{\"token\":\"확신:전체#H\"}],\"not\":[]}",
    "scoreJson": "{\"base\":50,\"bonus_if\":[{\"token\":\"십성:정재@월간#H\",\"add\":20},{\"token\":\"오행:토#H\",\"add\":10}],\"penalty_if\":[{\"token\":\"관계:충#H\",\"sub\":10}]}",
    "contentJson": "{\"summary\":\"현실적인 계획과 자원 관리 성향이 강해질 수 있습니다.\",\"points\":[\"장점: 예산/일정 루틴 강점.\",\"주의: 변화 대응이 늦어질 수 있음.\"],\"questions\":[\"요즘 관리 부담이 큰 영역이 있나요?\"],\"guardrails\":[\"단정 표현 금지\"]}",
    "cooldownGroup": "money_core",
    "maxPerUser": 1,
    "debugJson": "{\"description\":\"정재 HIGH + (월간 또는 확신)에서 선택\"}"
  }
}
```

GraphQL mutation:

```graphql
mutation CreateItemnCard($input: ItemNCardInput!) {
  createItemnCard(input: $input) {
    ok
    uid
    msg
  }
}
```

Use the JSON above as variables: `{ "input": { ... } }`.

## Step-by-step: admweb UI

1. Open **데이터 카드** → **사주 카드** or **궁합 카드** tab.
2. Click **카드 생성**.
3. Fill the form: copy from the seed JSON file. For trigger/score/content, paste the **stringified** value (e.g. copy the object from the file and wrap in `JSON.stringify()` in the browser console, or build the string manually).
4. Save.

## curl (REST)

The admin card API is GraphQL only. Use a GraphQL client or curl against `POST /api/admgql` with a JSON body containing `query` and `variables` (see above).
