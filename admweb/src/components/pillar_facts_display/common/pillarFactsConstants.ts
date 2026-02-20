// 명식/파생요소 표시용 상수(테이블, 테마, 라벨).
import type { PillarSlot, Wuxing, YinYang } from './pillarFactsTypes';

export const HANJA_FONT_FAMILY = "'Noto Serif KR', 'Nanum Myeongjo', 'Batang', serif";
export const PILLAR_DISPLAY_ORDER: PillarSlot[] = ['h', 'd', 'm', 'y'];
export const BRANCH_WHERE_LABELS: Record<PillarSlot, string> = {
  y: '년지',
  m: '월지',
  d: '일지',
  h: '시지',
};
export const STEM_ELEMENT_INDEXES = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] as const;
export const BRANCH_ELEMENT_INDEXES = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] as const;
export const HIDDEN_STEM_TABLE = [
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
export const HIDDEN_STEM_RATIO_TABLE = [
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
export const TWELVE_FATE_ORDER_KO = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'] as const;
export const TWELVE_FATE_START_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] as const;
export const TEN_GOD_PAIRS = [
  ['비견', '겁재'],
  ['식신', '상관'],
  ['편재', '정재'],
  ['편관', '정관'],
  ['편인', '정인'],
] as const;
export const STEM_HANGUL_CHARS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
export const BRANCH_HANGUL_CHARS = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
export const STEM_ELEMENTS = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'] as const;
export const BRANCH_ELEMENTS = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'] as const;
export const FORTUNE_TYPE_LABELS = {
  DAEUN: '대운',
  SEUN: '세운',
  WOLUN: '월운',
  ILUN: '일운',
} as const;
export const FIVE_EL_TEXT: Record<string, Wuxing> = {
  WOOD: '목',
  FIRE: '화',
  EARTH: '토',
  METAL: '금',
  WATER: '수',
} as const;
export const YIN_YANG_TEXT: Record<string, YinYang> = {
  YANG: '양',
  YIN: '음',
} as const;

export const GANJI_GLYPH_THEME: Record<
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

export const ELEMENT_VISUAL: Record<
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
