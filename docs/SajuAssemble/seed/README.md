# itemNcard seed cards

Sample saju and pair cards for manual and regression testing. Import via admweb **카드 생성** (Data Cards → 사주 카드 / 궁합 카드 → 카드 생성) or GraphQL `createItemnCard`.

## How to import

1. **admweb**: Open Data Cards page → 사주 카드 or 궁합 카드 → 카드 생성. Copy from the seed JSON below:
   - **card_id**, **title**, **trigger (JSON)** → paste into trigger_json (as a single-line or pretty-printed JSON string).
   - **score (JSON)** → score_json, **content (JSON)** → content_json. Set **cooldown_group**, **max_per_user** if present.
2. **GraphQL**: Call `createItemnCard(input: { ... })` with the same fields (triggerJson, scoreJson, contentJson, etc.).

Seed files in this folder use the **logical** shape (trigger/score/content as objects). When pasting into the form, stringify:
- `trigger_json` = `JSON.stringify(seed.trigger)`
- `score_json` = `JSON.stringify(seed.score)` or `"{}"`
- `content_json` = `JSON.stringify(seed.content)` or `"{}"`

Files:
- `saju_*.json`: 사주 카드 (scope: saju). Tokens match current items: 십성, 관계, 신살, 오행, 격국, 용신, 강약, 확신.
- `pair_*.json`: 궁합 카드 (scope: pair). Tokens: 궁합:충/합/형/해/천간합/삼합 (P tokens with A.pos-B.pos).
