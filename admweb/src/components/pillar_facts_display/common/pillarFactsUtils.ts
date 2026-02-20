// 명식/파생요소 표시용 순수 함수(계산·포맷·십성·운 포맷 등).
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';
import { BRANCH_CHARS, PILLAR_LABELS, STEM_CHARS } from '@/utils/pillarDisplay';
import {
  BRANCH_ELEMENT_INDEXES,
  BRANCH_HANGUL_CHARS,
  BRANCH_WHERE_LABELS,
  FIVE_EL_TEXT,
  FORTUNE_TYPE_LABELS,
  PILLAR_DISPLAY_ORDER,
  STEM_ELEMENT_INDEXES,
  STEM_ELEMENTS,
  STEM_HANGUL_CHARS,
  TEN_GOD_PAIRS,
  TWELVE_FATE_ORDER_KO,
  TWELVE_FATE_START_BRANCH,
  BRANCH_ELEMENTS,
  YIN_YANG_TEXT,
} from './pillarFactsConstants';
import type { FortunePeriodLike, GanjiMeta, PillarSlot, Wuxing, YinYang } from './pillarFactsTypes';

export function splitPillar(pillar: string): { stem: string; branch: string } {
  const chars = Array.from(pillar ?? '');
  return { stem: chars[0] ?? '', branch: chars[1] ?? '' };
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function stemIndexFromChar(char: string): number {
  const hanjaIdx = STEM_CHARS.indexOf(char as (typeof STEM_CHARS)[number]);
  if (hanjaIdx >= 0) return hanjaIdx;
  return STEM_HANGUL_CHARS.indexOf(char as (typeof STEM_HANGUL_CHARS)[number]);
}

export function branchIndexFromChar(char: string): number {
  const hanjaIdx = BRANCH_CHARS.indexOf(char as (typeof BRANCH_CHARS)[number]);
  if (hanjaIdx >= 0) return hanjaIdx;
  return BRANCH_HANGUL_CHARS.indexOf(char as (typeof BRANCH_HANGUL_CHARS)[number]);
}

export function getGanjiMeta(char: string, isStem: boolean): GanjiMeta | null {
  if (!char) return null;
  if (isStem) {
    const idx = stemIndexFromChar(char);
    if (idx < 0) return null;
    return {
      index: idx,
      hangul: STEM_HANGUL_CHARS[idx] ?? '',
      hanja: STEM_CHARS[idx] ?? '',
      element: STEM_ELEMENTS[idx] ?? '토',
      yinYang: idx % 2 === 0 ? '양' : '음',
    };
  }
  const idx = branchIndexFromChar(char);
  if (idx < 0) return null;
  return {
    index: idx,
    hangul: BRANCH_HANGUL_CHARS[idx] ?? '',
    hanja: BRANCH_CHARS[idx] ?? '',
    element: BRANCH_ELEMENTS[idx] ?? '토',
    yinYang: idx % 2 === 0 ? '양' : '음',
  };
}

export function normalizeDayStemIndex(
  dayMasterFromExtract: number | null,
  dayStemChar: string,
): number | null {
  if (
    typeof dayMasterFromExtract === 'number'
    && Number.isInteger(dayMasterFromExtract)
    && dayMasterFromExtract >= 0
    && dayMasterFromExtract < STEM_CHARS.length
  ) {
    return dayMasterFromExtract;
  }
  const fromChar = stemIndexFromChar(dayStemChar);
  return fromChar >= 0 ? fromChar : null;
}

export function calcTenGodByTarget(
  dayStemIndex: number,
  targetElementIndex: number,
  targetIsYang: boolean,
): string {
  const dayElementIndex = STEM_ELEMENT_INDEXES[dayStemIndex];
  const dayIsYang = dayStemIndex % 2 === 0;
  const sameYinYang = dayIsYang === targetIsYang;
  const diff = mod(targetElementIndex - dayElementIndex, 5);
  const pair = TEN_GOD_PAIRS[diff];
  return sameYinYang ? pair[0] : pair[1];
}

export function calcStemTenGod(dayStemIndex: number, stemIndex: number): string {
  return calcTenGodByTarget(dayStemIndex, STEM_ELEMENT_INDEXES[stemIndex], stemIndex % 2 === 0);
}

export function calcBranchTenGod(dayStemIndex: number, branchIndex: number): string {
  return calcTenGodByTarget(dayStemIndex, BRANCH_ELEMENT_INDEXES[branchIndex], branchIndex % 2 === 0);
}

export function calcTwelveFate(dayStemIndex: number, branchIndex: number): string {
  const start = TWELVE_FATE_START_BRANCH[dayStemIndex];
  const dir = dayStemIndex % 2 === 1 ? -1 : 1;
  const step = mod((branchIndex - start) * dir, 12);
  return TWELVE_FATE_ORDER_KO[step];
}

export function toPillarHangul(pillar: string): string {
  const { stem, branch } = splitPillar(pillar);
  const hangulStem = getGanjiMeta(stem, true)?.hangul ?? stem;
  const hangulBranch = getGanjiMeta(branch, false)?.hangul ?? branch;
  return `${hangulStem}${hangulBranch}`;
}

export function formatPillarsTextInDisplayOrder(pillars: Record<string, string>): string {
  return PILLAR_DISPLAY_ORDER.filter((k) => pillars[k])
    .map((k) => `${PILLAR_LABELS[k]} ${toPillarHangul(pillars[k])}`)
    .join(' · ');
}

export function extractBranchDerivedTokens(tokens: string[], pillarKey: PillarSlot): string[] {
  const whereBase = BRANCH_WHERE_LABELS[pillarKey];
  const seen = new Set<string>();
  const ret: string[] = [];
  for (const token of tokens) {
    const atIndex = token.indexOf('@');
    if (atIndex < 0) continue;
    const categoryAndName = token.slice(0, atIndex);
    if (categoryAndName.startsWith('십성:')) continue;
    const whereAndGrade = token.slice(atIndex + 1);
    const wherePart = whereAndGrade.split('#')[0] ?? '';
    if (!wherePart.startsWith(whereBase)) continue;
    const suffix = wherePart.slice(whereBase.length);
    const normalized = suffix ? `${categoryAndName}${suffix}` : categoryAndName;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      ret.push(normalized);
    }
  }
  return ret;
}

export function resolveWuxing(char: string, isStem: boolean): Wuxing | null {
  return getGanjiMeta(char, isStem)?.element ?? null;
}

export function normalizeWuxingCode(value?: string | null): Wuxing | null {
  if (!value) return null;
  return FIVE_EL_TEXT[value] ?? null;
}

export function normalizeYinYangCode(value?: string | null): YinYang | null {
  if (!value) return null;
  return YIN_YANG_TEXT[value] ?? null;
}

export function resolveYinYang(char: string, isStem: boolean): '양' | '음' | '' {
  return getGanjiMeta(char, isStem)?.yinYang ?? '';
}

export function normalizeTokensSummary(tokensSummary: string[] | string): string[] {
  if (Array.isArray(tokensSummary)) return tokensSummary;
  if (typeof tokensSummary === 'string') return tokensSummary ? [tokensSummary] : [];
  return [];
}

export function truncateText(input: string, maxLen = 160): string {
  if (input.length <= maxLen) return input;
  return `${input.slice(0, maxLen - 1)}…`;
}

export function formatValue(v: unknown): string {
  if (v == null) return '-';
  if (typeof v === 'string') return truncateText(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return truncateText(JSON.stringify(v));
  } catch {
    return '-';
  }
}

export function toElementBalanceParts(
  doc?: ExtractSajuStep1DocFieldsFragment | null,
): Array<{ element: Wuxing; ratio: number }> {
  const b = doc?.elBalance;
  if (!b) return [];
  return [
    { element: '목', ratio: b.wood },
    { element: '화', ratio: b.fire },
    { element: '토', ratio: b.earth },
    { element: '금', ratio: b.metal },
    { element: '수', ratio: b.water },
  ];
}

export function formatHourContext(doc?: ExtractSajuStep1DocFieldsFragment | null): string {
  const h = doc?.hourCtx;
  if (!h) return '';
  const parts = [`상태 ${h.status}`];
  if (h.missingReason) parts.push(`사유 ${h.missingReason}`);
  if (h.candidates && h.candidates.length > 0) parts.push(`후보 ${h.candidates.length}개`);
  return parts.join(' · ');
}

export function toKoreanTenGod(code?: string | null): string {
  const normalized = (code ?? '').trim().toUpperCase();
  if (normalized === 'BIGYEON') return '비견';
  if (normalized === 'GEOBJAE') return '겁재';
  if (normalized === 'SIKSHIN') return '식신';
  if (normalized === 'SANGGWAN') return '상관';
  if (normalized === 'PYEONJAE') return '편재';
  if (normalized === 'JEONGJAE') return '정재';
  if (normalized === 'PYEONGWAN') return '편관';
  if (normalized === 'JEONGGWAN') return '정관';
  if (normalized === 'PYEONIN') return '편인';
  if (normalized === 'JEONGIN') return '정인';
  return '';
}

function resolveFortuneTypeInternal(type?: string | null): keyof typeof FORTUNE_TYPE_LABELS | 'UNKNOWN' {
  const normalized = (type ?? '').toUpperCase();
  if (normalized === 'DAEUN') return 'DAEUN';
  if (normalized === 'SEUN') return 'SEUN';
  if (normalized === 'WOLUN') return 'WOLUN';
  if (normalized === 'ILUN') return 'ILUN';
  return 'UNKNOWN';
}

export function resolveFortuneType(type?: string | null): keyof typeof FORTUNE_TYPE_LABELS | 'UNKNOWN' {
  return resolveFortuneTypeInternal(type);
}

export function fortuneTypeLabel(type?: string | null): string {
  const key = resolveFortuneTypeInternal(type);
  return key === 'UNKNOWN' ? '운' : FORTUNE_TYPE_LABELS[key];
}

export function fortuneTypeOrderLabel(type?: string | null, order?: number | null): string {
  if (typeof order !== 'number' || order <= 0) return '';
  switch (resolveFortuneTypeInternal(type)) {
    case 'DAEUN':
      return `${order}대운`;
    case 'SEUN':
      return `${order}세운`;
    case 'WOLUN':
      return `${order}월운`;
    case 'ILUN':
      return `${order}일운`;
    default:
      return `${order}운`;
  }
}

export function formatFortuneGanji(fortune?: FortunePeriodLike | null): string {
  if (!fortune) return '';
  if (fortune.ganjiKo && fortune.ganjiHanja) {
    return `${fortune.ganjiKo}(${fortune.ganjiHanja})`;
  }
  if (fortune.ganjiKo) return fortune.ganjiKo;
  const stemIdx = typeof fortune.stem === 'number' ? fortune.stem : -1;
  const branchIdx = typeof fortune.branch === 'number' ? fortune.branch : -1;
  if (stemIdx < 0 || stemIdx >= STEM_CHARS.length || branchIdx < 0 || branchIdx >= BRANCH_CHARS.length) {
    return '';
  }
  const ko = `${STEM_HANGUL_CHARS[stemIdx]}${BRANCH_HANGUL_CHARS[branchIdx]}`;
  const hanja = `${STEM_CHARS[stemIdx]}${BRANCH_CHARS[branchIdx]}`;
  return `${ko}(${hanja})`;
}

export function formatFortuneDate(fortune?: FortunePeriodLike | null): string {
  if (!fortune || typeof fortune.year !== 'number' || fortune.year <= 0) return '';
  const y = `${fortune.year}`;
  if (typeof fortune.month !== 'number' || fortune.month <= 0) return `${y}년`;
  const m = `${fortune.month}월`;
  if (typeof fortune.day !== 'number' || fortune.day <= 0) return `${y}년 ${m}`;
  return `${y}년 ${m} ${fortune.day}일`;
}

export function formatFortuneSummary(fortune?: FortunePeriodLike | null): string {
  if (!fortune) return '없음';
  const parts: string[] = [];
  const ganji = formatFortuneGanji(fortune);
  if (ganji) parts.push(ganji);
  const fortuneType = resolveFortuneTypeInternal(fortune.type);
  const fortuneTypeName = fortuneTypeLabel(fortune.type);
  const orderText = fortuneTypeOrderLabel(fortune.type, fortune.order);
  if (orderText) parts.push(orderText);
  if (
    typeof fortune.ageFrom === 'number'
    && fortune.ageFrom > 0
    && typeof fortune.ageTo === 'number'
    && fortune.ageTo > 0
  ) {
    parts.push(`${fortune.ageFrom}~${fortune.ageTo}세`);
  }
  const dateText = formatFortuneDate(fortune);
  if (dateText) {
    parts.push(fortuneType === 'DAEUN' ? `기준 ${dateText}` : `${fortuneTypeName} 기준 ${dateText}`);
  } else if (typeof fortune.startYear === 'number' && fortune.startYear > 0) {
    parts.push(`시작 ${fortune.startYear}년`);
  }
  return parts.length > 0 ? parts.join(' · ') : '없음';
}

export function formatFortuneListPreview(fortune?: FortunePeriodLike | null): string {
  if (!fortune) return '';
  const parts: string[] = [];
  const orderText = fortuneTypeOrderLabel(fortune.type, fortune.order);
  if (orderText) parts.push(orderText);
  const dateText = formatFortuneDate(fortune);
  if (dateText) parts.push(dateText);
  const ganji = formatFortuneGanji(fortune);
  if (ganji) parts.push(ganji);
  return parts.join(' · ');
}

export function formatFortuneStartAge(fortune?: FortunePeriodLike | null): string {
  if (!fortune || typeof fortune.ageFrom !== 'number' || fortune.ageFrom <= 0) {
    return '-';
  }
  return `${fortune.ageFrom}`;
}

export function resolveFortuneStemChar(fortune?: FortunePeriodLike | null): string {
  if (fortune?.stemKo) return fortune.stemKo;
  const idx = typeof fortune?.stem === 'number' ? fortune.stem : -1;
  return idx >= 0 && idx < STEM_HANGUL_CHARS.length ? STEM_HANGUL_CHARS[idx] : '';
}

export function resolveFortuneBranchChar(fortune?: FortunePeriodLike | null): string {
  if (fortune?.branchKo) return fortune.branchKo;
  const idx = typeof fortune?.branch === 'number' ? fortune.branch : -1;
  return idx >= 0 && idx < BRANCH_HANGUL_CHARS.length ? BRANCH_HANGUL_CHARS[idx] : '';
}

export function resolveFortuneYinYang(type: 'stem' | 'branch', fortune?: FortunePeriodLike | null): YinYang {
  if (type === 'stem') {
    const stemYy = normalizeYinYangCode(fortune?.stemYy);
    if (stemYy) return stemYy;
    const stemIdx = typeof fortune?.stem === 'number' ? fortune.stem : -1;
    return stemIdx >= 0 ? (stemIdx % 2 === 0 ? '양' : '음') : '음';
  }
  const branchYy = normalizeYinYangCode(fortune?.branchYy);
  if (branchYy) return branchYy;
  const branchIdx = typeof fortune?.branch === 'number' ? fortune.branch : -1;
  return branchIdx >= 0 ? (branchIdx % 2 === 0 ? '양' : '음') : '음';
}

export function resolveFortuneElement(type: 'stem' | 'branch', fortune?: FortunePeriodLike | null): Wuxing {
  if (type === 'stem') {
    const fromCode = normalizeWuxingCode(fortune?.stemEl);
    if (fromCode) return fromCode;
    const stemIdx = typeof fortune?.stem === 'number' ? fortune.stem : -1;
    return stemIdx >= 0 ? STEM_ELEMENTS[stemIdx] ?? '토' : '토';
  }
  const fromCode = normalizeWuxingCode(fortune?.branchEl);
  if (fromCode) return fromCode;
  const branchIdx = typeof fortune?.branch === 'number' ? fortune.branch : -1;
  return branchIdx >= 0 ? BRANCH_ELEMENTS[branchIdx] ?? '토' : '토';
}

export function renderFortuneYearCell(fortune?: FortunePeriodLike | null): string {
  if (typeof fortune?.startYear === 'number' && fortune.startYear > 0) return `${fortune.startYear}`;
  if (typeof fortune?.year === 'number' && fortune.year > 0) return `${fortune.year}`;
  return '-';
}

export function scoreToneClass(score: string): string {
  const n = Number(score);
  if (!Number.isFinite(n)) return 'text-muted-foreground';
  if (n >= 80) return 'font-semibold text-emerald-700 dark:text-emerald-300';
  if (n >= 60) return 'font-semibold text-sky-700 dark:text-sky-300';
  if (n >= 40) return 'font-semibold text-amber-700 dark:text-amber-300';
  return 'font-semibold text-rose-700 dark:text-rose-300';
}
