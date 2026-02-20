# 연도별 / 월별 pillar source (대운·歲運·月運)

## Current implementation (rule_set: korean_standard_v1, sxtwl)

- **인생**: Pillars for birth date/time (원국). `PillarsFromBirth(birthY, birthM, birthD, birthH, birthMin, tz)`.
- **연도별 (歲運)**: Pillars for **(target_year, 1, 1)** + birth time. So 年柱/月柱 come from the first day of the target year via sxtwl; 日柱/时柱 from that calendar day and birth time. Items/tokens are derived from this 4-pillar in `RunSajuExtractTest`.
- **월별 (月運)**: Pillars for **(target_year, target_month, 1)** + birth time. 月柱 from the first day of that month via sxtwl; 年柱/日柱/时柱 from that date. Same wiring into `ItemsFromPillars`.
- **일간 (日運)**: Pillars for **(target_year, target_month, target_day)** + birth time. Same sxtwl/PillarsFromBirth logic; one calendar date + birth time for 日柱/时柱. Response `period` = "YYYY-MM-DD".

## 大運 (대운, decade pillar)

- **Derivation**: 大運 is derived from **月柱** (birth month pillar) and **gender** (rule_set: korean_standard_v1).
  - **陽年** (甲丙戊庚壬 — year stem index even): 男順女逆 (male: forward 順行, female: backward 逆行).
  - **陰年** (乙丁己辛癸 — year stem index odd): 男逆女順 (male: backward, female: forward).
  - **Forward (順)**: next 干支 in cycle (TG index +1, DZ index +1, wrap at 10/12).
  - **Backward (逆)**: previous 干支 (TG index −1, DZ index −1, wrap).
- **Step rule**: One 大運 step = one 干支 = 10 years. Step index 0 = 月柱 as 大運 年柱/月柱 (first decade); step N = 月柱 shifted by N steps in the chosen direction.
- **Implementation**: Computed in Go in `api/service/itemncard/daesoon.go` (no sxtwl 大運 support; we use PillarsFromBirth for 月柱 then shift 干支 by step and gender). 日柱/时柱 for 大운 output are kept from birth (原局) so the 4-pillar set is (大運 年柱, 大運 月柱, 原局 日柱, 原局 时柱).
- **Target period**: API accepts `target_daesoon_index` (0-based step, e.g. 0 = first 大運). Period label for pillar_source: e.g. "대운 0", "대운 1".
- **연계 만세력**: pillar_source for 대운 shows base_date = birth date (基準), period = "대운 N", description = "大運".
