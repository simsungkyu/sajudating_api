// 명식/파생요소를 표 형태로 표시하는 공통 컴포넌트.
import type { ReactElement } from 'react';
import type { UserInfoSummary } from '@/api/itemncard_api';
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BRANCH_CHARS,
  PILLAR_LABELS,
  PILLAR_ORDER,
  STEM_CHARS,
  toPillarsFromExtractDoc,
  toPillarsFromUserInfo,
} from '@/utils/pillarDisplay';

type Wuxing = '목' | '화' | '토' | '금' | '수';
type YinYang = '양' | '음';
type PillarSlot = (typeof PILLAR_ORDER)[number];
type FortunePeriodLike = {
  type?: string | null;
  order?: number | null;
  stem?: number | null;
  branch?: number | null;
  stemKo?: string | null;
  stemHanja?: string | null;
  branchKo?: string | null;
  branchHanja?: string | null;
  ganjiKo?: string | null;
  ganjiHanja?: string | null;
  stemEl?: string | null;
  stemYy?: string | null;
  stemTenGod?: string | null;
  branchEl?: string | null;
  branchYy?: string | null;
  branchTenGod?: string | null;
  branchTwelve?: string | null;
  ageFrom?: number | null;
  ageTo?: number | null;
  startYear?: number | null;
  year?: number | null;
  month?: number | null;
  day?: number | null;
};
type ExtractDocWithFortunes = ExtractSajuStep1DocFieldsFragment & {
  daeun?: FortunePeriodLike | null;
  seun?: FortunePeriodLike | null;
  wolun?: FortunePeriodLike | null;
  ilun?: FortunePeriodLike | null;
  daeunList?: FortunePeriodLike[] | null;
  seunList?: FortunePeriodLike[] | null;
  wolunList?: FortunePeriodLike[] | null;
  ilunList?: FortunePeriodLike[] | null;
};

const HANJA_FONT_FAMILY = "'Noto Serif KR', 'Nanum Myeongjo', 'Batang', serif";
const PILLAR_DISPLAY_ORDER: PillarSlot[] = ['h', 'd', 'm', 'y'];
const BRANCH_WHERE_LABELS: Record<PillarSlot, string> = {
  y: '년지',
  m: '월지',
  d: '일지',
  h: '시지',
};
const STEM_ELEMENT_INDEXES = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] as const;
const BRANCH_ELEMENT_INDEXES = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] as const;
const HIDDEN_STEM_TABLE = [
  [9],
  [5, 9, 7],
  [0, 2, 4],
  [1],
  [4, 1, 9],
  [2, 4, 6],
  [3, 5],
  [5, 3, 1],
  [6, 8, 4],
  [7],
  [4, 7, 3],
  [8, 0],
] as const;
const HIDDEN_STEM_RATIO_TABLE = [
  [100],
  [60, 30, 10],
  [60, 30, 10],
  [100],
  [60, 30, 10],
  [60, 30, 10],
  [70, 30],
  [60, 30, 10],
  [60, 30, 10],
  [100],
  [60, 30, 10],
  [70, 30],
] as const;
const TWELVE_FATE_ORDER_KO = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'] as const;
const TWELVE_FATE_START_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] as const;
const TEN_GOD_PAIRS = [
  ['비견', '겁재'],
  ['식신', '상관'],
  ['편재', '정재'],
  ['편관', '정관'],
  ['편인', '정인'],
] as const;
const STEM_HANGUL_CHARS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
const BRANCH_HANGUL_CHARS = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
const STEM_ELEMENTS = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'] as const;
const BRANCH_ELEMENTS = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'] as const;
const FORTUNE_TYPE_LABELS = {
  DAEUN: '대운',
  SEUN: '세운',
  WOLUN: '월운',
  ILUN: '일운',
} as const;
const FIVE_EL_TEXT: Record<string, Wuxing> = {
  WOOD: '목',
  FIRE: '화',
  EARTH: '토',
  METAL: '금',
  WATER: '수',
} as const;
const YIN_YANG_TEXT: Record<string, YinYang> = {
  YANG: '양',
  YIN: '음',
} as const;

const GANJI_GLYPH_THEME: Record<
Wuxing,
{ bg: string; fg: string; border: string; metaLabel: string; metaValue: string }
> = {
  목: {
    bg: '#2E7D32',
    fg: '#FFFFFF',
    border: '#1B5E20',
    metaLabel: 'rgba(255,255,255,0.78)',
    metaValue: '#FFFFFF',
  },
  화: {
    bg: '#C62828',
    fg: '#FFFFFF',
    border: '#8E0000',
    metaLabel: 'rgba(255,255,255,0.78)',
    metaValue: '#FFFFFF',
  },
  토: {
    bg: '#B07D3C',
    fg: '#FFFFFF',
    border: '#865B2B',
    metaLabel: 'rgba(255,255,255,0.78)',
    metaValue: '#FFFFFF',
  },
  금: {
    bg: '#FFFFFF',
    fg: '#111827',
    border: '#D1D5DB',
    metaLabel: '#6B7280',
    metaValue: '#111827',
  },
  수: {
    bg: '#111111',
    fg: '#FFFFFF',
    border: '#000000',
    metaLabel: 'rgba(255,255,255,0.8)',
    metaValue: '#FFFFFF',
  },
};

const ELEMENT_VISUAL: Record<
Wuxing,
{ text: string; softBg: string; border: string; chip: string; bar: string }
> = {
  목: {
    text: 'text-emerald-700 dark:text-emerald-300',
    softBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-300/70 dark:border-emerald-700/70',
    chip: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/70 dark:text-emerald-200',
    bar: 'bg-emerald-500',
  },
  화: {
    text: 'text-rose-700 dark:text-rose-300',
    softBg: 'bg-rose-50/90 dark:bg-rose-950/40',
    border: 'border-rose-300/70 dark:border-rose-700/70',
    chip: 'border-rose-300/70 bg-rose-100 text-rose-800 dark:border-rose-700/70 dark:bg-rose-950/70 dark:text-rose-200',
    bar: 'bg-rose-500',
  },
  토: {
    text: 'text-amber-700 dark:text-amber-300',
    softBg: 'bg-amber-50/90 dark:bg-amber-950/40',
    border: 'border-amber-300/70 dark:border-amber-700/70',
    chip: 'border-amber-300/70 bg-amber-100 text-amber-800 dark:border-amber-700/70 dark:bg-amber-950/70 dark:text-amber-200',
    bar: 'bg-amber-500',
  },
  금: {
    text: 'text-slate-700 dark:text-slate-200',
    softBg: 'bg-slate-100/95 dark:bg-slate-800/60',
    border: 'border-slate-300/70 dark:border-slate-600/70',
    chip: 'border-slate-300/70 bg-slate-100 text-slate-800 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-100',
    bar: 'bg-slate-500',
  },
  수: {
    text: 'text-sky-700 dark:text-sky-300',
    softBg: 'bg-sky-50/90 dark:bg-sky-950/40',
    border: 'border-sky-300/70 dark:border-sky-700/70',
    chip: 'border-sky-300/70 bg-sky-100 text-sky-800 dark:border-sky-700/70 dark:bg-sky-950/70 dark:text-sky-200',
    bar: 'bg-sky-500',
  },
};

function splitPillar(pillar: string): { stem: string; branch: string } {
  const chars = Array.from(pillar ?? '');
  return { stem: chars[0] ?? '', branch: chars[1] ?? '' };
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function stemIndexFromChar(char: string): number {
  const hanjaIdx = STEM_CHARS.indexOf(char as (typeof STEM_CHARS)[number]);
  if (hanjaIdx >= 0) return hanjaIdx;
  return STEM_HANGUL_CHARS.indexOf(char as (typeof STEM_HANGUL_CHARS)[number]);
}

function branchIndexFromChar(char: string): number {
  const hanjaIdx = BRANCH_CHARS.indexOf(char as (typeof BRANCH_CHARS)[number]);
  if (hanjaIdx >= 0) return hanjaIdx;
  return BRANCH_HANGUL_CHARS.indexOf(char as (typeof BRANCH_HANGUL_CHARS)[number]);
}

type GanjiMeta = {
  index: number;
  hangul: string;
  hanja: string;
  element: Wuxing;
  yinYang: YinYang;
};

function getGanjiMeta(char: string, isStem: boolean): GanjiMeta | null {
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

function normalizeDayStemIndex(
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

function calcTenGodByTarget(
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

function calcStemTenGod(dayStemIndex: number, stemIndex: number): string {
  return calcTenGodByTarget(dayStemIndex, STEM_ELEMENT_INDEXES[stemIndex], stemIndex % 2 === 0);
}

function calcBranchTenGod(dayStemIndex: number, branchIndex: number): string {
  return calcTenGodByTarget(dayStemIndex, BRANCH_ELEMENT_INDEXES[branchIndex], branchIndex % 2 === 0);
}

function calcTwelveFate(dayStemIndex: number, branchIndex: number): string {
  const start = TWELVE_FATE_START_BRANCH[dayStemIndex];
  const dir = dayStemIndex % 2 === 1 ? -1 : 1;
  const step = mod((branchIndex - start) * dir, 12);
  return TWELVE_FATE_ORDER_KO[step];
}

function toPillarHangul(pillar: string): string {
  const { stem, branch } = splitPillar(pillar);
  const hangulStem = getGanjiMeta(stem, true)?.hangul ?? stem;
  const hangulBranch = getGanjiMeta(branch, false)?.hangul ?? branch;
  return `${hangulStem}${hangulBranch}`;
}

function formatPillarsTextInDisplayOrder(pillars: Record<string, string>): string {
  return PILLAR_DISPLAY_ORDER.filter((k) => pillars[k])
    .map((k) => `${PILLAR_LABELS[k]} ${toPillarHangul(pillars[k])}`)
    .join(' · ');
}

function extractBranchDerivedTokens(tokens: string[], pillarKey: PillarSlot): string[] {
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

function resolveWuxing(char: string, isStem: boolean): Wuxing | null {
  return getGanjiMeta(char, isStem)?.element ?? null;
}

function normalizeWuxingCode(value?: string | null): Wuxing | null {
  if (!value) return null;
  return FIVE_EL_TEXT[value] ?? null;
}

function normalizeYinYangCode(value?: string | null): YinYang | null {
  if (!value) return null;
  return YIN_YANG_TEXT[value] ?? null;
}

function resolveYinYang(char: string, isStem: boolean): '양' | '음' | '' {
  return getGanjiMeta(char, isStem)?.yinYang ?? '';
}

function normalizeTokensSummary(tokensSummary: string[] | string): string[] {
  if (Array.isArray(tokensSummary)) return tokensSummary;
  if (typeof tokensSummary === 'string') return tokensSummary ? [tokensSummary] : [];
  return [];
}

function truncateText(input: string, maxLen = 160): string {
  if (input.length <= maxLen) return input;
  return `${input.slice(0, maxLen - 1)}…`;
}

function formatValue(v: unknown): string {
  if (v == null) return '-';
  if (typeof v === 'string') return truncateText(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return truncateText(JSON.stringify(v));
  } catch {
    return '-';
  }
}

function toElementBalanceParts(
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

function formatHourContext(doc?: ExtractSajuStep1DocFieldsFragment | null): string {
  const h = doc?.hourCtx;
  if (!h) return '';
  const parts = [`상태 ${h.status}`];
  if (h.missingReason) parts.push(`사유 ${h.missingReason}`);
  if (h.candidates && h.candidates.length > 0) parts.push(`후보 ${h.candidates.length}개`);
  return parts.join(' · ');
}

function toKoreanTenGod(code?: string | null): string {
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

function resolveFortuneType(type?: string | null): keyof typeof FORTUNE_TYPE_LABELS | 'UNKNOWN' {
  const normalized = (type ?? '').toUpperCase();
  if (normalized === 'DAEUN') return 'DAEUN';
  if (normalized === 'SEUN') return 'SEUN';
  if (normalized === 'WOLUN') return 'WOLUN';
  if (normalized === 'ILUN') return 'ILUN';
  return 'UNKNOWN';
}

function fortuneTypeLabel(type?: string | null): string {
  const key = resolveFortuneType(type);
  return key === 'UNKNOWN' ? '운' : FORTUNE_TYPE_LABELS[key];
}

function fortuneTypeOrderLabel(type?: string | null, order?: number | null): string {
  if (typeof order !== 'number' || order <= 0) return '';
  switch (resolveFortuneType(type)) {
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

function formatFortuneGanji(fortune?: FortunePeriodLike | null): string {
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

function formatFortuneDate(fortune?: FortunePeriodLike | null): string {
  if (!fortune || typeof fortune.year !== 'number' || fortune.year <= 0) return '';
  const y = `${fortune.year}`;
  if (typeof fortune.month !== 'number' || fortune.month <= 0) return `${y}년`;
  const m = `${fortune.month}월`;
  if (typeof fortune.day !== 'number' || fortune.day <= 0) return `${y}년 ${m}`;
  return `${y}년 ${m} ${fortune.day}일`;
}

function formatFortuneSummary(fortune?: FortunePeriodLike | null): string {
  if (!fortune) return '없음';
  const parts: string[] = [];
  const ganji = formatFortuneGanji(fortune);
  if (ganji) parts.push(ganji);
  const fortuneType = resolveFortuneType(fortune.type);
  const fortuneTypeName = fortuneTypeLabel(fortune.type);
  const orderText = fortuneTypeOrderLabel(fortune.type, fortune.order);
  if (orderText) {
    parts.push(orderText);
  }
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

function formatFortuneListPreview(fortune?: FortunePeriodLike | null): string {
  if (!fortune) return '';
  const parts: string[] = [];
  const orderText = fortuneTypeOrderLabel(fortune.type, fortune.order);
  if (orderText) {
    parts.push(orderText);
  }
  const dateText = formatFortuneDate(fortune);
  if (dateText) parts.push(dateText);
  const ganji = formatFortuneGanji(fortune);
  if (ganji) parts.push(ganji);
  return parts.join(' · ');
}

function formatFortuneStartAge(fortune?: FortunePeriodLike | null): string {
  if (!fortune || typeof fortune.ageFrom !== 'number' || fortune.ageFrom <= 0) {
    return '-';
  }
  return `${fortune.ageFrom}`;
}

function resolveFortuneStemChar(fortune?: FortunePeriodLike | null): string {
  if (fortune?.stemKo) return fortune.stemKo;
  const idx = typeof fortune?.stem === 'number' ? fortune.stem : -1;
  return idx >= 0 && idx < STEM_HANGUL_CHARS.length ? STEM_HANGUL_CHARS[idx] : '';
}

function resolveFortuneBranchChar(fortune?: FortunePeriodLike | null): string {
  if (fortune?.branchKo) return fortune.branchKo;
  const idx = typeof fortune?.branch === 'number' ? fortune.branch : -1;
  return idx >= 0 && idx < BRANCH_HANGUL_CHARS.length ? BRANCH_HANGUL_CHARS[idx] : '';
}

function resolveFortuneYinYang(type: 'stem' | 'branch', fortune?: FortunePeriodLike | null): YinYang {
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

function resolveFortuneElement(type: 'stem' | 'branch', fortune?: FortunePeriodLike | null): Wuxing {
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

function renderFortuneCharCell(
  char: string,
  yinYang: YinYang,
  element: Wuxing,
): ReactElement {
  const theme = GANJI_GLYPH_THEME[element] ?? null;
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[15px] leading-none sm:h-7 sm:w-7 sm:text-lg ${yinYang === '양' ? 'font-extrabold' : 'font-semibold'}`}
      style={{
        backgroundColor: theme?.bg ?? '#F3F4F6',
        borderColor: theme?.border ?? '#D1D5DB',
        color: theme?.fg ?? '#111827',
      }}
    >
      {char || '-'}
    </span>
  );
}

function renderFortuneYearCell(fortune?: FortunePeriodLike | null): string {
  if (typeof fortune?.startYear === 'number' && fortune.startYear > 0) return `${fortune.startYear}`;
  if (typeof fortune?.year === 'number' && fortune.year > 0) return `${fortune.year}`;
  return '-';
}

function scoreToneClass(score: string): string {
  const n = Number(score);
  if (!Number.isFinite(n)) return 'text-muted-foreground';
  if (n >= 80) return 'font-semibold text-emerald-700 dark:text-emerald-300';
  if (n >= 60) return 'font-semibold text-sky-700 dark:text-sky-300';
  if (n >= 40) return 'font-semibold text-amber-700 dark:text-amber-300';
  return 'font-semibold text-rose-700 dark:text-rose-300';
}

type GanjiGlyphProps = {
  char: string;
  isStem: boolean;
};

type HiddenStemChip = {
  stemIndex: number;
  hangulChar: string;
  yinYang: YinYang;
  element: Wuxing;
  tenGod: string;
  ratio: number;
};

function GanjiGlyph({
  char,
  isStem,
}: GanjiGlyphProps) {
  const meta = getGanjiMeta(char, isStem);
  const displayChar = meta?.hangul || char || '-';
  const hanjaChar = meta?.hanja || char || '-';
  const element = meta?.element ?? resolveWuxing(char, isStem) ?? '-';
  const yinYang = meta?.yinYang ?? resolveYinYang(char, isStem) ?? '-';
  const theme = meta ? GANJI_GLYPH_THEME[meta.element] : null;

  return (
    <div
      className="inline-flex w-full flex-col items-center justify-center rounded-md border px-1 py-0.5 text-center sm:px-1.5 sm:py-1"
      style={{
        backgroundColor: theme?.bg ?? '#F3F4F6',
        borderColor: theme?.border ?? '#D1D5DB',
        color: theme?.fg ?? '#111827',
      }}
    >
      <p
        className={`${yinYang === '양' ? 'font-bold' : 'font-normal'} text-xl leading-none sm:text-2xl`}
        style={{ fontFamily: HANJA_FONT_FAMILY }}
      >
        {displayChar}
      </p>
      <p
        className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[9px] leading-3.5 sm:mt-1 sm:text-[10px] sm:leading-4"
        style={{ color: theme?.metaValue ?? '#111827' }}
      >
        {`${hanjaChar}, ${yinYang}, ${element}`}
      </p>
    </div>
  );
}

export type PillarAndFactsDisplayProps = {
  /** 기존 user_info 형태(REST 등). */
  userInfo?: UserInfoSummary | null | undefined;
  /** extract_saju 문서 원형(GraphQL). */
  extractDoc?: ExtractSajuStep1DocFieldsFragment | null | undefined;
  /** tokens 목록 최대 표시 개수(초과 시 생략 수 표시). 기본 8. */
  maxTokensShown?: number;
  /** 상세(facts/evals) 최대 표시 개수. 기본 12. */
  maxDetailsShown?: number;
  /** 루트 className */
  className?: string;
};

export function PillarAndFactsDisplay({
  userInfo,
  extractDoc,
  maxTokensShown = 8,
  maxDetailsShown = 12,
  className = '',
}: PillarAndFactsDisplayProps) {
  if (!userInfo && !extractDoc) return null;

  const pillars = extractDoc ? toPillarsFromExtractDoc(extractDoc) : toPillarsFromUserInfo(userInfo?.pillars);
  const pillarsText = formatPillarsTextInDisplayOrder(pillars);
  const hasPillars = PILLAR_ORDER.some((k) => Boolean(pillars[k]));

  const tokensArr = normalizeTokensSummary(userInfo?.tokens_summary ?? []);
  const tokensShown = tokensArr.slice(0, maxTokensShown);
  const hiddenTokens = Math.max(0, tokensArr.length - maxTokensShown);
  const itemsSummary = userInfo?.items_summary ?? '';
  const elementBalanceParts = toElementBalanceParts(extractDoc);

  const metaRows: Array<{ label: string; value: string }> = [];
  const pushMetaRow = (label: string, value?: string | null) => {
    if (!value) return;
    metaRows.push({ label, value });
  };

  pushMetaRow('데이터', extractDoc ? 'extract_saju' : 'user_info');
  pushMetaRow('schemaVer', extractDoc?.schemaVer ?? '');
  pushMetaRow('rule_set', userInfo?.rule_set ?? extractDoc?.schemaVer ?? '');

  const engineFromDoc = extractDoc
    ? `${extractDoc.input.engine.name}@${extractDoc.input.engine.ver}${extractDoc.input.engine.sys ? ` (${extractDoc.input.engine.sys})` : ''}`
    : '';
  pushMetaRow('engine', userInfo?.engine_version ?? engineFromDoc);

  pushMetaRow('mode', userInfo?.mode ?? '');
  pushMetaRow('period', userInfo?.period ?? '');

  pushMetaRow('dtLocal', extractDoc?.input.dtLocal ?? '');
  pushMetaRow('timezone', extractDoc?.input.tz ?? '');

  const inputOptions = [
    extractDoc?.input.calendar ? `역법 ${extractDoc.input.calendar}` : '',
    extractDoc?.input.timePrec ? `시간정밀도 ${extractDoc.input.timePrec}` : '',
    extractDoc?.input.sex ? `성별 ${extractDoc.input.sex}` : '',
    typeof extractDoc?.input.leapMonth === 'boolean' ? `윤달 ${extractDoc.input.leapMonth ? '예' : '아니오'}` : '',
  ].filter(Boolean).join(' · ');
  pushMetaRow('입력옵션', inputOptions);

  if (extractDoc?.input.loc) {
    pushMetaRow('위치', `${extractDoc.input.loc.lat}, ${extractDoc.input.loc.lon}`);
  }
  pushMetaRow('solarDt', extractDoc?.input.solarDt ?? '');
  pushMetaRow('adjustedDt', extractDoc?.input.adjustedDt ?? '');

  const dayStemFromPillar = splitPillar(pillars.d).stem;
  const dayMasterIndex = normalizeDayStemIndex(
    typeof extractDoc?.dayMaster === 'number' ? extractDoc.dayMaster : null,
    dayStemFromPillar,
  );
  const dayMasterStem = dayMasterIndex != null ? STEM_HANGUL_CHARS[dayMasterIndex] ?? '' : '';
  const dayMasterElement = resolveWuxing(dayMasterStem, true);
  const dayMasterYinYang = resolveYinYang(dayMasterStem, true);
  const hourContextText = formatHourContext(extractDoc);
  const fortuneDoc = extractDoc as ExtractDocWithFortunes | null | undefined;
  const fortuneRows = [
    { label: '대운', value: formatFortuneSummary(fortuneDoc?.daeun) },
    { label: '세운', value: formatFortuneSummary(fortuneDoc?.seun) },
    { label: '월운', value: formatFortuneSummary(fortuneDoc?.wolun) },
    { label: '일운', value: formatFortuneSummary(fortuneDoc?.ilun) },
  ];
  const daeunList = fortuneDoc?.daeunList ?? [];
  const seunList = fortuneDoc?.seunList ?? [];
  const wolunList = fortuneDoc?.wolunList ?? [];
  const ilunList = fortuneDoc?.ilunList ?? [];

  const detailRows: Array<{
    type: 'fact' | 'eval';
    keyName: string;
    label: string;
    value: string;
    score: string;
  }> = extractDoc
    ? [
        ...(extractDoc.facts ?? []).map((fact) => ({
          type: 'fact' as const,
          keyName: fact.k,
          label: fact.n,
          value: formatValue(fact.v),
          score: fact.score?.norm0_100 != null ? `${fact.score.norm0_100}` : '-',
        })),
        ...(extractDoc.evals ?? []).map((evalItem) => ({
          type: 'eval' as const,
          keyName: evalItem.k,
          label: evalItem.n,
          value: formatValue(evalItem.v),
          score: `${evalItem.score?.norm0_100 ?? '-'}`,
        })),
      ]
    : [];

  if (!hasPillars && metaRows.length === 0 && detailRows.length === 0 && elementBalanceParts.length === 0 && tokensArr.length === 0 && !itemsSummary) {
    return null;
  }

  const pillarDetails = PILLAR_DISPLAY_ORDER.map((pillarKey) => {
    const label = PILLAR_LABELS[pillarKey];
    const pillar = pillars[pillarKey] ?? '';
    const isDayPillar = pillarKey === 'd';
    const { stem, branch } = splitPillar(pillar);
    const stemIndex = stemIndexFromChar(stem);
    const branchIndex = branchIndexFromChar(branch);
    const stemTenGod = pillarKey === 'd'
      ? '본원'
      : (dayMasterIndex != null && stemIndex >= 0 ? calcStemTenGod(dayMasterIndex, stemIndex) : '-');
    const branchTenGod = dayMasterIndex != null && branchIndex >= 0
      ? calcBranchTenGod(dayMasterIndex, branchIndex)
      : '-';
    const twelveFate = dayMasterIndex != null && branchIndex >= 0
      ? calcTwelveFate(dayMasterIndex, branchIndex)
      : '-';
    const hiddenStemChips: HiddenStemChip[] = branchIndex >= 0
      ? HIDDEN_STEM_TABLE[branchIndex].reduce<HiddenStemChip[]>((acc, hiddenStemIndex, hiddenOrder) => {
        const hiddenChar = STEM_HANGUL_CHARS[hiddenStemIndex] ?? '';
        if (!hiddenChar) return acc;
        const yinYang: YinYang = hiddenStemIndex % 2 === 0 ? '양' : '음';
        const element = STEM_ELEMENTS[hiddenStemIndex] ?? '토';
        const tenGod = dayMasterIndex == null ? '' : calcStemTenGod(dayMasterIndex, hiddenStemIndex);
        const ratio = Number(HIDDEN_STEM_RATIO_TABLE[branchIndex]?.[hiddenOrder] ?? 0);
        acc.push({
          stemIndex: hiddenStemIndex,
          hangulChar: hiddenChar,
          yinYang,
          element,
          tenGod,
          ratio,
        });
        return acc;
      }, [])
      : [];
    const branchDerivedTokens = extractBranchDerivedTokens(tokensArr, pillarKey).slice(0, 2);
    const branchDerivedValue = branchDerivedTokens.length > 0
      ? truncateText(branchDerivedTokens.join(', '), 46)
      : '';

    return {
      key: pillarKey,
      label,
      isDayPillar,
      stem,
      branch,
      stemTenGod: stemTenGod || '-',
      branchTenGod: branchTenGod || '-',
      twelveFate: twelveFate || '-',
      hiddenStemChips,
      branchDerivedValue,
    };
  });
  const hasAnyBranchDerived = pillarDetails.some((detail) => detail.branchDerivedValue);

  const hiddenDetails = Math.max(0, detailRows.length - maxDetailsShown);
  return (
    <div className={`min-w-0 overflow-x-hidden space-y-3 text-sm text-foreground ${className}`.trim()}>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-background via-background to-muted/25">
        <div className="border-b border-border/70 bg-gradient-to-r from-muted/60 via-background to-muted/60 px-2 py-2 sm:px-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">명식 4주 / 팔자</p>
              <p className="truncate text-sm font-semibold text-foreground">{pillarsText || '명식 정보 없음'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium">
                {extractDoc ? 'extract_saju' : 'user_info'}
              </span>
              {userInfo?.mode && (
                <span className="max-w-[38vw] truncate rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium sm:max-w-none">
                  {userInfo.mode}
                </span>
              )}
              {userInfo?.period && (
                <span className="max-w-[38vw] truncate rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium sm:max-w-none">
                  {userInfo.period}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-2 py-3 sm:px-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-medium">
              표기: 양=
              <span className="font-bold">굵게</span>
              {' / '}
              음=
              <span className="font-normal">보통</span>
            </span>
            {(['목', '화', '토', '금', '수'] as const).map((element) => {
              const theme = GANJI_GLYPH_THEME[element];
              return (
                <span
                  key={element}
                  className="rounded-full border px-2 py-0.5 font-semibold"
                  style={{
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.fg,
                  }}
                >
                  {element}
                </span>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70 bg-card/90">
            <div>
              <table className="w-full table-fixed border-collapse text-[9px] sm:text-[10px]">
                <thead>
                  <tr className="bg-muted/35">
                    <th className="w-8 border-b border-border/60 px-0.5 py-1 text-center text-[9px] leading-tight font-semibold whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:py-1.5 sm:text-[10px]">항목</th>
                    {pillarDetails.map((detail) => (
                      <th
                        key={`${detail.key}:head`}
                        className={`border-b border-border/60 px-0.5 py-1 text-center text-[9px] font-semibold align-top sm:px-1 sm:py-1.5 sm:text-[10px] ${detail.isDayPillar ? 'bg-amber-50/80 dark:bg-amber-950/30' : ''}`}
                      >
                        <span className="inline-flex flex-col items-center gap-1">
                          {detail.isDayPillar ? (
                            <span className="rounded-full border border-amber-300/80 bg-amber-100/80 px-1 py-0.5 text-[9px] font-semibold text-amber-800 sm:px-1.5 sm:text-[10px] dark:border-amber-700/70 dark:bg-amber-950/70 dark:text-amber-200">
                              일주
                            </span>
                          ) : (
                            <span>{detail.label}주</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:py-1.5 sm:text-[10px]">천간</th>
                    {pillarDetails.map((detail) => (
                      <td key={`${detail.key}:stem`} className={`border-b border-border/60 px-0.5 py-1 text-center sm:px-1 sm:py-1.5 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                        <GanjiGlyph char={detail.stem} isStem />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:py-1.5 sm:text-[10px]">지지</th>
                    {pillarDetails.map((detail) => (
                      <td key={`${detail.key}:branch`} className={`border-b border-border/60 px-0.5 py-1 text-center sm:px-1 sm:py-1.5 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                        <GanjiGlyph char={detail.branch} isStem={false} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]">
                      <span className="inline-flex flex-col items-center leading-tight">
                        <span className="whitespace-nowrap">천간</span>
                        <span className="whitespace-nowrap">십성</span>
                      </span>
                    </th>
                    {pillarDetails.map((detail) => (
                      <td key={`${detail.key}:stem-tengod`} className={`border-b border-border/60 px-0.5 py-1 text-center whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                        {detail.stemTenGod}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]">
                      <span className="inline-flex flex-col items-center leading-tight">
                        <span className="whitespace-nowrap">지지</span>
                        <span className="whitespace-nowrap">십성</span>
                      </span>
                    </th>
                    {pillarDetails.map((detail) => (
                      <td key={`${detail.key}:branch-tengod`} className={`border-b border-border/60 px-0.5 py-1 text-center whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                        {detail.branchTenGod}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]">
                      <span className="inline-flex flex-col items-center leading-tight">
                        <span className="whitespace-nowrap">십이</span>
                        <span className="whitespace-nowrap">운성</span>
                      </span>
                    </th>
                    {pillarDetails.map((detail) => (
                      <td key={`${detail.key}:twelve`} className={`border-b border-border/60 px-0.5 py-1 text-center whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                        {detail.twelveFate}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]">
                      <span className="inline-flex flex-col items-center leading-tight">
                        <span className="whitespace-nowrap">지장</span>
                        <span className="whitespace-nowrap">간</span>
                      </span>
                    </th>
                    {pillarDetails.map((detail) => (
                      <td key={`${detail.key}:hidden`} className={`border-b border-border/60 px-0 py-1 text-center leading-4 whitespace-normal break-all ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                        {detail.hiddenStemChips.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {detail.hiddenStemChips.map((chip) => {
                              const theme = GANJI_GLYPH_THEME[chip.element];
                              return (
                                <div
                                  key={`${detail.key}:hidden:${chip.stemIndex}`}
                                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-0"
                                >
                                  <span
                                    className="inline-flex min-w-0 items-center justify-center gap-0 rounded-full border px-0 py-0.5"
                                    style={{
                                      backgroundColor: theme.bg,
                                      borderColor: theme.border,
                                      color: theme.fg,
                                    }}
                                  >
                                    <span className={chip.yinYang === '양' ? 'font-bold' : 'font-normal'}>
                                      {chip.hangulChar}
                                    </span>
                                    {chip.tenGod && (
                                      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[8px] opacity-90 sm:text-[9px]">
                                        ({chip.tenGod})
                                      </span>
                                    )}
                                  </span>
                                  <span className="pl-0 text-right text-[8px] font-semibold tabular-nums text-muted-foreground sm:text-[9px]">
                                    {chip.ratio}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    ))}
                  </tr>
                  {hasAnyBranchDerived && (
                    <tr>
                      <th scope="row" className="w-8 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]">파생요소</th>
                      {pillarDetails.map((detail) => (
                        <td key={`${detail.key}:derived`} className={`px-0.5 py-1 text-center leading-4 whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}>
                          {detail.branchDerivedValue || '-'}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80">
          <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
            <p className="text-xs font-semibold text-foreground">오행 분포</p>
          </div>
          <div className="space-y-2 px-2 py-3 sm:px-3">
            {elementBalanceParts.length > 0 ? (
              elementBalanceParts.map(({ element, ratio }) => {
                const pct = Math.max(0, Math.min(100, ratio * 100));
                const visual = ELEMENT_VISUAL[element];
                return (
                  <div key={element} className="grid grid-cols-[2rem_1fr_3.2rem] items-center gap-2">
                    <span className={`inline-flex justify-center rounded-md border px-1 py-0.5 text-[11px] font-semibold ${visual.chip}`}>
                      {element}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${visual.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-right text-xs font-semibold tabular-nums">{pct.toFixed(1)}%</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground">extract_saju 문서가 없어서 오행 분포를 표시할 수 없습니다.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80">
            <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
              <p className="text-xs font-semibold text-foreground">핵심 지표</p>
            </div>
            <div className="grid gap-2 px-2 py-3 sm:px-3">
              <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">일간</span>
                {dayMasterStem ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`text-2xl leading-none ${dayMasterElement ? ELEMENT_VISUAL[dayMasterElement].text : 'text-foreground'} ${dayMasterYinYang === '양' ? 'font-extrabold' : 'font-semibold'}`}
                      style={{ fontFamily: HANJA_FONT_FAMILY }}
                    >
                      {dayMasterStem}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dayMasterYinYang || '-'} · {dayMasterElement ?? '-'}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">없음</span>
                )}
              </div>
              <div className="grid grid-cols-[5.5rem_1fr] items-start gap-2">
                <span className="pt-0.5 text-xs font-medium text-muted-foreground">시주컨텍스트</span>
                <span className="text-xs leading-relaxed">{hourContextText || '없음'}</span>
              </div>
              {extractDoc && (
                <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">facts / evals</span>
                  <span className="text-xs font-semibold tabular-nums">{extractDoc.facts.length} / {extractDoc.evals.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {extractDoc && (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80">
          <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
            <p className="text-xs font-semibold text-foreground">운세흐름</p>
          </div>
          <div className="px-2 py-3 sm:px-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fortuneRows.map((row) => (
                <div
                  key={`fortune:list:${row.label}`}
                  className="min-w-0 rounded-lg border border-border/70 bg-background/80 px-2 py-2 sm:px-3"
                >
                  <p className="text-xs font-semibold text-muted-foreground">{row.label}</p>
                  <p className="mt-1 text-xs leading-relaxed break-words text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
            {daeunList.length > 0 && (
              <div className="mt-3 w-full rounded-lg border border-border/70 bg-background/80">
                <p className="border-b border-border/70 px-2 py-1.5 text-xs font-semibold text-foreground">전체 대운 목록</p>
                <div className="w-full overflow-hidden text-xs">
                  <div
                    className="grid border-b border-border/60"
                    style={{ gridTemplateColumns: `repeat(${Math.max(1, daeunList.length) + 1}, minmax(0, 1fr))` }}
                  >
                    <div className="border-r border-b border-border/60 bg-muted/15 px-2 py-2 font-medium">연도</div>
                    {daeunList.map((item, index) => (
                      <div key={`daeun-list:year:${index}:${item.order ?? 0}`} className="border-r border-b border-border/60 px-2 py-2 whitespace-nowrap tabular-nums">
                        {renderFortuneYearCell(item)}
                      </div>
                    ))}

                    <div className="border-r border-b border-border/60 bg-muted/15 px-2 py-2 font-medium">나이</div>
                    {daeunList.map((item, index) => (
                      <div key={`daeun-list:age:${index}:${item.order ?? 0}`} className="border-r border-b border-border/60 px-2 py-2 whitespace-nowrap tabular-nums">
                        {formatFortuneStartAge(item)}
                      </div>
                    ))}

                    <div className="border-r border-b border-border/60 bg-muted/15 px-2 py-2 font-medium">천간십성</div>
                    {daeunList.map((item, index) => (
                      <div key={`daeun-list:stemtg:${index}:${item.order ?? 0}`} className="border-r border-b border-border/60 px-2 py-2 whitespace-nowrap">
                        {toKoreanTenGod(item.stemTenGod) || '-'}
                      </div>
                    ))}

                    <div className="border-r border-b border-border/60 bg-muted/15 px-2 py-2 font-medium">천간</div>
                    {daeunList.map((item, index) => (
                      <div key={`daeun-list:stem:${index}:${item.order ?? 0}`} className="border-r border-b border-border/60 px-2 py-2 whitespace-nowrap">
                        {renderFortuneCharCell(
                          resolveFortuneStemChar(item),
                          resolveFortuneYinYang('stem', item),
                          resolveFortuneElement('stem', item),
                        )}
                      </div>
                    ))}

                    <div className="border-r border-b border-border/60 bg-muted/15 px-2 py-2 font-medium">지지</div>
                    {daeunList.map((item, index) => (
                      <div key={`daeun-list:branch:${index}:${item.order ?? 0}`} className="border-r border-b border-border/60 px-2 py-2 whitespace-nowrap">
                        {renderFortuneCharCell(
                          resolveFortuneBranchChar(item),
                          resolveFortuneYinYang('branch', item),
                          resolveFortuneElement('branch', item),
                        )}
                      </div>
                    ))}

                    <div className="px-2 py-2 bg-muted/15 font-medium">지지십성</div>
                    {daeunList.map((item, index) => (
                      <div key={`daeun-list:branchtg:${index}:${item.order ?? 0}`} className="px-2 py-2 whitespace-nowrap">
                        {toKoreanTenGod(item.branchTenGod) || '-'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {(seunList.length > 0 || wolunList.length > 0 || ilunList.length > 0) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: '세운 범위', items: seunList },
                  { label: '월운 범위', items: wolunList },
                  { label: '일운 범위', items: ilunList },
                ]
                  .filter((group) => group.items.length > 0)
                  .map((group) => (
                    <div key={`fortune-range:${group.label}`} className="min-w-0 rounded-lg border border-border/70 bg-background/80 px-2 py-2 sm:px-3">
                      <p className="text-xs font-semibold text-muted-foreground">{group.label}</p>
                      <p className="mt-1 text-xs text-foreground">{group.items.length}개</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {group.items.slice(0, 3).map((item) => formatFortuneListPreview(item)).filter(Boolean).join(' / ') || '-'}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {metaRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
            <p className="text-xs font-semibold text-foreground">입력/엔진 정보</p>
          </div>
          <Table className="w-full table-fixed text-xs sm:text-sm">
            <TableBody>
              {metaRows.map((row) => (
                <TableRow key={`${row.label}:${row.value}`}>
                  <TableCell className="w-[32%] bg-muted/30 font-medium whitespace-normal break-words text-muted-foreground sm:w-36">
                    {row.label}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {detailRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
            <p className="text-xs font-semibold text-foreground">파생요소 상세 (facts / evals)</p>
          </div>
          <Table className="w-full table-fixed text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[12%] whitespace-normal break-words sm:w-16">구분</TableHead>
                <TableHead className="w-[20%] whitespace-normal break-words sm:w-28">키</TableHead>
                <TableHead className="w-[22%] whitespace-normal break-words sm:w-40">항목</TableHead>
                <TableHead className="w-[36%] whitespace-normal break-words">값</TableHead>
                <TableHead className="w-[10%] whitespace-normal break-words sm:w-20">점수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailRows.slice(0, maxDetailsShown).map((row, index) => (
                <TableRow key={`${row.type}:${row.keyName}:${index}`} className={index % 2 === 1 ? 'bg-muted/15' : ''}>
                  <TableCell className="font-medium uppercase whitespace-normal break-words text-muted-foreground">{row.type}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-normal break-all">{row.keyName}</TableCell>
                  <TableCell className="whitespace-normal break-words">{row.label}</TableCell>
                  <TableCell className="whitespace-normal break-words">{row.value}</TableCell>
                  <TableCell className={scoreToneClass(row.score)}>{row.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hiddenDetails > 0 && (
            <p className="border-t border-border/70 px-2 py-1.5 text-xs text-muted-foreground">
              상세 항목 {hiddenDetails}개는 생략되었습니다.
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80">
        <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
          <p className="text-xs font-semibold text-foreground">파생요소 요약</p>
        </div>
        <div className="space-y-2 px-2 py-3 sm:px-3">
          {itemsSummary ? (
            <p className="whitespace-normal break-words text-sm">{truncateText(itemsSummary, 260)}</p>
          ) : (
            <p className="text-xs text-muted-foreground">items_summary 데이터가 없습니다.</p>
          )}
          {tokensArr.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tokensShown.map((token, index) => (
                <span
                  key={`${token}:${index}`}
                  className="max-w-full whitespace-normal break-all rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary"
                >
                  {token}
                </span>
              ))}
              {hiddenTokens > 0 && (
                <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  +{hiddenTokens}
                </span>
              )}
            </div>
          )}
          {tokensArr.length === 0 && (
            <p className="text-xs text-muted-foreground">tokens 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
