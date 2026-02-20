/**
 * TTYC(만세력) 계산 라이브러리
 *
 * - 입력/출력은 Unix timestamp(ms, number) 중심으로 다룬다.
 * - 내부 계산은 시간대 오프셋(분 단위) 기반으로 로컬 시각을 복원해 진행한다.
 * - 정밀 천문(실시간 절기 시각) 대신 "절입 기준일(고정)" 기반의 실무형 계산을 제공한다.
 *
 * 주요 메소드 요약:
 * - toLocalDateTimeParts: timestamp -> 로컬 시각 파트 변환
 * - toUnixTimestamp: 로컬 시각 파트 -> timestamp 변환
 * - calculatePillars: 단일 시점의 연/월/일/시주 및 메타 계산
 * - calculateFortuneFlow: 기준 시점의 대운/세운/월운/일운 + 범위 리스트 계산
 * - calculateTtyc: 출생 시점 기준 전체 계산(명식 + 운세) 통합 진입점
 * - TtycCalculator: 옵션(시간대/정밀도/성별) 고정형 래퍼 클래스
 */
import {
  TTYC_SOLAR_TERM_END_YEAR,
  TTYC_SOLAR_TERM_START_DAY_TABLE,
  TTYC_SOLAR_TERM_START_YEAR,
} from './ttyc_solar_term_table.ts';

// ---------------------------------------------------------------------------
// 공개 상수/타입
// ---------------------------------------------------------------------------

/** 1분(ms) */
const MINUTE_MS = 60_000;
/** 1일(ms) */
const DAY_MS = 86_400_000;

/** 한국 표준시(KST) 오프셋 */
export const KST_OFFSET_MINUTES = 9 * 60;

/**
 * Date 표현을 코드에서 쉽게 인식할 수 있도록 남겨둔 예시 값.
 * 실제 로직은 모두 숫자 timestamp(ms)로 동작한다.
 * (주의: JS Date month는 0=1월, 1=2월)
 */
export const TTYC_EXAMPLE_TS_2022_02_01 = (new Date(2022, 1, 1, 0, 0, 0, 0)).getTime();

/**
 * 일주(일간/일지) 계산 anchor 예시(갑자일 기준).
 * 계산식에서 직접 쓰는 값도 동일한 기준을 사용한다.
 */
export const TTYC_DAY_ANCHOR_GAPJA_TS = (new Date(1984, 1, 2, 0, 0, 0, 0)).getTime();

export type TtycTimePrecision = 'MINUTE' | 'HOUR' | 'UNKNOWN';
export type TtycSex = 'M' | 'F' | 'UNKNOWN';
export type TtycFortuneType = '대운' | '세운' | '월운' | '일운';

export type TtycFiveElement = '목' | '화' | '토' | '금' | '수';
export type TtycYinYang = '양' | '음';
export type TtycTenGod =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인';
export type TtycTwelveFate =
  | '장생'
  | '목욕'
  | '관대'
  | '건록'
  | '제왕'
  | '쇠'
  | '병'
  | '사'
  | '묘'
  | '절'
  | '태'
  | '양';

/**
 * 로컬 시각 파트. month는 1..12.
 */
export interface TtycLocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface TtycGanjiMeta {
  stem: number; // 0..9
  branch: number; // 0..11
  stemKo: string;
  stemHanja: string;
  branchKo: string;
  branchHanja: string;
  ganjiKo: string;
  ganjiHanja: string;
  stemEl: TtycFiveElement;
  stemYinYang: TtycYinYang;
  stemTenGod: TtycTenGod;
  branchEl: TtycFiveElement;
  branchYinYang: TtycYinYang;
  branchTenGod: TtycTenGod;
  branchTwelve: TtycTwelveFate;
}

export interface TtycPillars {
  year: TtycGanjiMeta;
  month: TtycGanjiMeta;
  day: TtycGanjiMeta;
  hour?: TtycGanjiMeta;
}

export interface TtycPillarCalcInput {
  /** Unix timestamp(ms) */
  ts: number;
  /** 예: 한국은 540 */
  tzOffsetMinutes?: number;
  /** 시주 계산 정밀도 */
  timePrecision?: TtycTimePrecision;
}

export interface TtycPillarCalcResult {
  ts: number;
  tzOffsetMinutes: number;
  timePrecision: TtycTimePrecision;
  local: TtycLocalDateTimeParts;
  dayMasterStem: number;
  pillars: TtycPillars;
  boundaries: {
    lichunStartTs: number;
    monthTermStartTs: number;
    dayStartTs: number;
  };
}

export interface TtycFortuneRequest {
  /** 운세 기준 시각(없으면 birthTs) */
  baseTs?: number;
  /** 세운 범위 시작 연도 */
  seunFromYear?: number;
  /** 세운 범위 종료 연도 */
  seunToYear?: number;
  /** 월운 대상 연도 */
  wolunYear?: number;
  /** 일운 대상 연도 */
  ilunYear?: number;
  /** 일운 대상 월(1..12) */
  ilunMonth?: number;
}

export interface TtycFortunePeriod extends TtycGanjiMeta {
  type: TtycFortuneType;
  order?: number;
  ageFrom?: number;
  ageTo?: number;
  startYear: number;
  year: number;
  month?: number;
  day?: number;
  /** 이 운 항목을 계산한 기준 timestamp(ms) */
  sourceTs: number;
}

export interface TtycFortuneFlow {
  baseTs: number;
  baseLocal: TtycLocalDateTimeParts;
  daeun?: TtycFortunePeriod;
  seun: TtycFortunePeriod;
  wolun: TtycFortunePeriod;
  ilun: TtycFortunePeriod;
  daeunList: TtycFortunePeriod[];
  seunList?: TtycFortunePeriod[];
  wolunList?: TtycFortunePeriod[];
  ilunList?: TtycFortunePeriod[];
}

export interface TtycCalculateInput {
  /** 출생 기준 timestamp(ms) */
  birthTs: number;
  /** 시간대 오프셋(분) */
  tzOffsetMinutes?: number;
  /** 성별(대운 순/역행 판단용) */
  sex?: TtycSex;
  /** 시주 계산 정밀도 */
  timePrecision?: TtycTimePrecision;
  /** 운세 계산 옵션 */
  fortune?: TtycFortuneRequest;
}

export interface TtycCalculateResult {
  birth: TtycPillarCalcResult;
  fortune: TtycFortuneFlow;
}

// ---------------------------------------------------------------------------
// 간지/오행/십성 기준 테이블
// ---------------------------------------------------------------------------

const STEM_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
const STEM_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCH_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
const BRANCH_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const STEM_ELEMENT: TtycFiveElement[] = [
  '목', // 甲
  '목', // 乙
  '화', // 丙
  '화', // 丁
  '토', // 戊
  '토', // 己
  '금', // 庚
  '금', // 辛
  '수', // 壬
  '수', // 癸
];

const BRANCH_ELEMENT: TtycFiveElement[] = [
  '수', // 子
  '토', // 丑
  '목', // 寅
  '목', // 卯
  '토', // 辰
  '화', // 巳
  '화', // 午
  '토', // 未
  '금', // 申
  '금', // 酉
  '토', // 戌
  '수', // 亥
];

const MONTH_STEM_SEED_BY_YEAR_STEM = [
  2, // 甲 -> 寅월 시작 丙
  4, // 乙 -> 寅월 시작 戊
  6, // 丙 -> 寅월 시작 庚
  8, // 丁 -> 寅월 시작 壬
  0, // 戊 -> 寅월 시작 甲
  2, // 己 -> 寅월 시작 丙
  4, // 庚 -> 寅월 시작 戊
  6, // 辛 -> 寅월 시작 庚
  8, // 壬 -> 寅월 시작 壬
  0, // 癸 -> 寅월 시작 甲
] as const;

const TWELVE_FATE_ORDER: TtycTwelveFate[] = [
  '장생',
  '목욕',
  '관대',
  '건록',
  '제왕',
  '쇠',
  '병',
  '사',
  '묘',
  '절',
  '태',
  '양',
];

const TWELVE_FATE_START_BRANCH_BY_DAY_STEM = [
  11, // 甲
  6, // 乙
  2, // 丙
  9, // 丁
  2, // 戊
  9, // 己
  5, // 庚
  0, // 辛
  8, // 壬
  3, // 癸
] as const;

type SolarMonthStartTemplate = {
  month: number;
  day: number;
  branch: number;
  name: string;
};

const SXTWL_DAY_CYCLE_OFFSET = 2;

/**
 * 절입 기준일(간편 테이블).
 * 실제 천문치와 분 단위 오차가 있을 수 있으나, 프런트 실무 계산에서 일관성 유지가 목적.
 */
const SOLAR_MONTH_STARTS: readonly SolarMonthStartTemplate[] = [
  { month: 1, day: 6, branch: 1, name: '소한(丑월)' },
  { month: 2, day: 4, branch: 2, name: '입춘(寅월)' },
  { month: 3, day: 6, branch: 3, name: '경칩(卯월)' },
  { month: 4, day: 5, branch: 4, name: '청명(辰월)' },
  { month: 5, day: 6, branch: 5, name: '입하(巳월)' },
  { month: 6, day: 6, branch: 6, name: '망종(午월)' },
  { month: 7, day: 7, branch: 7, name: '소서(未월)' },
  { month: 8, day: 8, branch: 8, name: '입추(申월)' },
  { month: 9, day: 8, branch: 9, name: '백로(酉월)' },
  { month: 10, day: 8, branch: 10, name: '한로(戌월)' },
  { month: 11, day: 7, branch: 11, name: '입동(亥월)' },
  { month: 12, day: 7, branch: 0, name: '대설(子월)' },
] as const;

// ---------------------------------------------------------------------------
// 공용 유틸
// ---------------------------------------------------------------------------

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function normalizeUnixTs(ts: number): number {
  if (!isFiniteNumber(ts)) {
    throw new Error(`invalid timestamp: ${String(ts)}`);
  }
  return Math.trunc(ts);
}

function normalizeTzOffsetMinutes(v: number | undefined): number {
  if (v === undefined) return KST_OFFSET_MINUTES;
  if (!isFiniteNumber(v)) {
    throw new Error(`invalid tzOffsetMinutes: ${String(v)}`);
  }
  // ±18시간 범위를 넘어가면 잘못된 입력으로 판단
  if (v < -1_080 || v > 1_080) {
    throw new Error(`tzOffsetMinutes out of range: ${v}`);
  }
  return Math.trunc(v);
}

function normalizeTimePrecision(v: TtycTimePrecision | undefined): TtycTimePrecision {
  return v ?? 'MINUTE';
}

function lookupSolarTermStartDay(year: number, month: number): number | undefined {
  if (month < 1 || month > 12) return undefined;
  if (year < TTYC_SOLAR_TERM_START_YEAR || year > TTYC_SOLAR_TERM_END_YEAR) return undefined;
  const row = TTYC_SOLAR_TERM_START_DAY_TABLE[year - TTYC_SOLAR_TERM_START_YEAR];
  if (!row) return undefined;
  const day = row[month - 1];
  if (!isFiniteNumber(day) || day <= 0) return undefined;
  return Math.trunc(day);
}

/**
 * 절대 timestamp(ms)를 "지정 오프셋의 로컬 시각 파트"로 변환한다.
 * 브라우저 로컬 타임존 영향을 피하기 위해 UTC getter를 사용한다.
 */
export function toLocalDateTimeParts(ts: number, tzOffsetMinutes = KST_OFFSET_MINUTES): TtycLocalDateTimeParts {
  const unixTs = normalizeUnixTs(ts);
  const tzOffset = normalizeTzOffsetMinutes(tzOffsetMinutes);
  const localTs = unixTs + tzOffset * MINUTE_MS;
  const d = new Date(localTs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds(),
  };
}

/**
 * 오프셋 기반 "로컬 시각 파트"를 절대 timestamp(ms)로 변환한다.
 */
export function toUnixTimestamp(
  parts: Pick<TtycLocalDateTimeParts, 'year' | 'month' | 'day' | 'hour' | 'minute'> &
    Partial<Pick<TtycLocalDateTimeParts, 'second' | 'millisecond'>>,
  tzOffsetMinutes = KST_OFFSET_MINUTES,
): number {
  const second = parts.second ?? 0;
  const millisecond = parts.millisecond ?? 0;
  const tzOffset = normalizeTzOffsetMinutes(tzOffsetMinutes);
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, second, millisecond);
  return utcMs - tzOffset * MINUTE_MS;
}

/**
 * Date 스타일 입력을 숫자 timestamp로 통일하기 위한 헬퍼.
 * (코드상 인지 목적: new Date(...).getTime() 패턴과 동일 결과)
 */
export function toUnixTimestampByDateCtor(
  year: number,
  monthOneBased: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  return (new Date(year, monthOneBased - 1, day, hour, minute, second, 0)).getTime();
}

export function daysInMonth(year: number, month: number): number {
  if (year <= 0 || month < 1 || month > 12) {
    return 31;
  }
  return new Date(Date.UTC(year, month, 0, 0, 0, 0, 0)).getUTCDate();
}

export function clampDay(year: number, month: number, day: number): number {
  if (day < 1) return 1;
  const maxDay = daysInMonth(year, month);
  if (day > maxDay) return maxDay;
  return day;
}

function validateStem(stem: number): void {
  if (stem < 0 || stem > 9) {
    throw new Error(`invalid stem index: ${stem}`);
  }
}

function validateBranch(branch: number): void {
  if (branch < 0 || branch > 11) {
    throw new Error(`invalid branch index: ${branch}`);
  }
}

function yinYangByIndex(index: number): TtycYinYang {
  return index % 2 === 0 ? '양' : '음';
}

function fiveElementIndex(el: TtycFiveElement): number {
  switch (el) {
    case '목':
      return 0;
    case '화':
      return 1;
    case '토':
      return 2;
    case '금':
      return 3;
    case '수':
      return 4;
    default:
      return 0;
  }
}

function tenGodByDiffAndParity(diff: number, sameYinYang: boolean): TtycTenGod {
  switch (diff) {
    case 0:
      return sameYinYang ? '비견' : '겁재';
    case 1:
      return sameYinYang ? '식신' : '상관';
    case 2:
      return sameYinYang ? '편재' : '정재';
    case 3:
      return sameYinYang ? '편관' : '정관';
    case 4:
      return sameYinYang ? '편인' : '정인';
    default:
      return '비견';
  }
}

function tenGodByStem(dayMasterStem: number, targetStem: number): TtycTenGod {
  validateStem(dayMasterStem);
  validateStem(targetStem);
  const dmEl = fiveElementIndex(STEM_ELEMENT[dayMasterStem]);
  const tgEl = fiveElementIndex(STEM_ELEMENT[targetStem]);
  const diff = mod(tgEl - dmEl, 5);
  const same = yinYangByIndex(dayMasterStem) === yinYangByIndex(targetStem);
  return tenGodByDiffAndParity(diff, same);
}

function tenGodByBranch(dayMasterStem: number, branch: number): TtycTenGod {
  validateStem(dayMasterStem);
  validateBranch(branch);
  const dmEl = fiveElementIndex(STEM_ELEMENT[dayMasterStem]);
  const brEl = fiveElementIndex(BRANCH_ELEMENT[branch]);
  const diff = mod(brEl - dmEl, 5);
  const same = yinYangByIndex(dayMasterStem) === yinYangByIndex(branch);
  return tenGodByDiffAndParity(diff, same);
}

function twelveFateByBranch(dayMasterStem: number, branch: number): TtycTwelveFate {
  validateStem(dayMasterStem);
  validateBranch(branch);
  const startBranch = TWELVE_FATE_START_BRANCH_BY_DAY_STEM[dayMasterStem];
  // 양간은 순행(+), 음간은 역행(-)
  const dir = dayMasterStem % 2 === 0 ? 1 : -1;
  const step = mod((branch - startBranch) * dir, 12);
  return TWELVE_FATE_ORDER[step];
}

function buildGanjiMeta(stem: number, branch: number, dayMasterStem: number): TtycGanjiMeta {
  validateStem(stem);
  validateBranch(branch);
  validateStem(dayMasterStem);

  const stemKo = STEM_KO[stem];
  const stemHanja = STEM_HANJA[stem];
  const branchKo = BRANCH_KO[branch];
  const branchHanja = BRANCH_HANJA[branch];

  return {
    stem,
    branch,
    stemKo,
    stemHanja,
    branchKo,
    branchHanja,
    ganjiKo: `${stemKo}${branchKo}`,
    ganjiHanja: `${stemHanja}${branchHanja}`,
    stemEl: STEM_ELEMENT[stem],
    stemYinYang: yinYangByIndex(stem),
    stemTenGod: tenGodByStem(dayMasterStem, stem),
    branchEl: BRANCH_ELEMENT[branch],
    branchYinYang: yinYangByIndex(branch),
    branchTenGod: tenGodByBranch(dayMasterStem, branch),
    branchTwelve: twelveFateByBranch(dayMasterStem, branch),
  };
}

// ---------------------------------------------------------------------------
// 사주 4주 계산
// ---------------------------------------------------------------------------

/**
 * 연주 계산:
 * - 입춘(2/4 00:00) 이전이면 전년도 간지 사용
 * - 입춘 이후면 해당 연도 간지 사용
 */
function calcYearPillar(ts: number, local: TtycLocalDateTimeParts, tzOffsetMinutes: number): {
  stem: number;
  branch: number;
  cycleYear: number;
  lichunStartTs: number;
} {
  const lichunDay = lookupSolarTermStartDay(local.year, 2) ?? 4;
  const lichunStartTs = toUnixTimestamp(
    { year: local.year, month: 2, day: lichunDay, hour: 0, minute: 0 },
    tzOffsetMinutes,
  );
  const cycleYear = ts >= lichunStartTs ? local.year : local.year - 1;
  const stem = mod(cycleYear - 4, 10);
  const branch = mod(cycleYear - 4, 12);
  return { stem, branch, cycleYear, lichunStartTs };
}

type MonthBranchBoundary = {
  startTs: number;
  branch: number;
  name: string;
};

function buildMonthBranchBoundaries(year: number, tzOffsetMinutes: number): MonthBranchBoundary[] {
  const ret: MonthBranchBoundary[] = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const item of SOLAR_MONTH_STARTS) {
      const termDay = lookupSolarTermStartDay(y, item.month) ?? item.day;
      ret.push({
        startTs: toUnixTimestamp(
          { year: y, month: item.month, day: termDay, hour: 0, minute: 0 },
          tzOffsetMinutes,
        ),
        branch: item.branch,
        name: item.name,
      });
    }
  }
  ret.sort((a, b) => a.startTs - b.startTs);
  return ret;
}

/**
 * 월지 계산:
 * - 12절입 시작일 테이블에서 "현재 시각 이하의 가장 최근 경계"를 선택
 * - 선택된 경계에 연결된 월지를 사용
 */
function calcMonthBranch(ts: number, localYear: number, tzOffsetMinutes: number): {
  branch: number;
  startTs: number;
  termName: string;
} {
  const boundaries = buildMonthBranchBoundaries(localYear, tzOffsetMinutes);
  let current = boundaries[0];
  for (const b of boundaries) {
    if (b.startTs <= ts) {
      current = b;
    } else {
      break;
    }
  }
  return {
    branch: current.branch,
    startTs: current.startTs,
    termName: current.name,
  };
}

/**
 * 월간 계산:
 * - 연간에 따라 寅월 시작 천간을 고정
 * - 현재 월지가 寅월에서 몇 번째인지 계산해 오프셋 적용
 */
function calcMonthStem(yearStem: number, monthBranch: number): number {
  validateStem(yearStem);
  validateBranch(monthBranch);
  const seed = MONTH_STEM_SEED_BY_YEAR_STEM[yearStem];
  // 寅(2)=1번째 ... 丑(1)=12번째
  const monthOrder = mod(monthBranch - 2, 12) + 1;
  return mod(seed + (monthOrder - 1), 10);
}

/**
 * 일주 계산:
 * - 1984-02-02(갑자일) anchor 대비 로컬 "날짜 시작시각" 차이(일수)를 이용
 * - 시/분/초는 제외하고 날짜 단위로 계산
 */
function calcDayPillar(local: TtycLocalDateTimeParts, tzOffsetMinutes: number): {
  stem: number;
  branch: number;
  dayStartTs: number;
} {
  const dayStartTs = toUnixTimestamp(
    { year: local.year, month: local.month, day: local.day, hour: 0, minute: 0 },
    tzOffsetMinutes,
  );
  const anchorStartTs = toUnixTimestamp(
    { year: 1984, month: 2, day: 2, hour: 0, minute: 0 },
    tzOffsetMinutes,
  );
  const diffDays = Math.floor((dayStartTs - anchorStartTs) / DAY_MS) + SXTWL_DAY_CYCLE_OFFSET;
  return {
    stem: mod(diffDays, 10),
    branch: mod(diffDays, 12),
    dayStartTs,
  };
}

/**
 * 시주 계산:
 * - 시지: floor((hour+1)/2) % 12
 * - 시간: (일간*2 + 시지) % 10
 */
function calcHourPillar(dayStem: number, hour: number): { stem: number; branch: number } {
  validateStem(dayStem);
  const branch = mod(Math.floor((hour + 1) / 2), 12);
  const stem = mod(dayStem * 2 + branch, 10);
  return { stem, branch };
}

/**
 * 단일 timestamp 기준 사주 4주 계산.
 */
export function calculatePillars(input: TtycPillarCalcInput): TtycPillarCalcResult {
  const ts = normalizeUnixTs(input.ts);
  const tzOffsetMinutes = normalizeTzOffsetMinutes(input.tzOffsetMinutes);
  const timePrecision = normalizeTimePrecision(input.timePrecision);

  const local = toLocalDateTimeParts(ts, tzOffsetMinutes);
  const yearPillar = calcYearPillar(ts, local, tzOffsetMinutes);
  const monthBranch = calcMonthBranch(ts, local.year, tzOffsetMinutes);
  const monthStem = calcMonthStem(yearPillar.stem, monthBranch.branch);
  const dayPillar = calcDayPillar(local, tzOffsetMinutes);
  const dayMasterStem = dayPillar.stem;

  const pillars: TtycPillars = {
    year: buildGanjiMeta(yearPillar.stem, yearPillar.branch, dayMasterStem),
    month: buildGanjiMeta(monthStem, monthBranch.branch, dayMasterStem),
    day: buildGanjiMeta(dayPillar.stem, dayPillar.branch, dayMasterStem),
  };

  if (timePrecision !== 'UNKNOWN') {
    const hourForCalc = local.hour;
    const hourPillar = calcHourPillar(dayMasterStem, hourForCalc);
    pillars.hour = buildGanjiMeta(hourPillar.stem, hourPillar.branch, dayMasterStem);
  }

  return {
    ts,
    tzOffsetMinutes,
    timePrecision,
    local,
    dayMasterStem,
    pillars,
    boundaries: {
      lichunStartTs: yearPillar.lichunStartTs,
      monthTermStartTs: monthBranch.startTs,
      dayStartTs: dayPillar.dayStartTs,
    },
  };
}

// ---------------------------------------------------------------------------
// 운세(대운/세운/월운/일운) 계산
// ---------------------------------------------------------------------------

function normalizeSex(v: TtycSex | undefined): TtycSex {
  return v ?? 'UNKNOWN';
}

/**
 * 대운 순/역행:
 * - 양년간 + 남성, 음년간 + 여성 => 순행
 * - 그 외 => 역행
 * - 성별 미상은 양년간 순행/음년간 역행
 */
function isForwardDaeun(yearStem: number, sex: TtycSex): boolean {
  const yangYear = yearStem % 2 === 0;
  if (sex === 'M') return yangYear;
  if (sex === 'F') return !yangYear;
  return yangYear;
}

function toFortunePeriod(
  type: TtycFortuneType,
  stem: number,
  branch: number,
  dayMasterStem: number,
  sourceTs: number,
  extra: Omit<TtycFortunePeriod, keyof TtycGanjiMeta | 'type' | 'sourceTs'>,
): TtycFortunePeriod {
  return {
    type,
    sourceTs,
    ...buildGanjiMeta(stem, branch, dayMasterStem),
    ...extra,
  };
}

function buildDaeunList(
  birth: TtycPillarCalcResult,
  sex: TtycSex,
): TtycFortunePeriod[] {
  const forward = isForwardDaeun(birth.pillars.year.stem, sex);
  const list: TtycFortunePeriod[] = [];
  const baseMonthStem = birth.pillars.month.stem;
  const baseMonthBranch = birth.pillars.month.branch;

  for (let order = 1; order <= 8; order += 1) {
    const shift = forward ? order : -order;
    const stem = mod(baseMonthStem + shift, 10);
    const branch = mod(baseMonthBranch + shift, 12);
    const ageFrom = 1 + (order - 1) * 10;
    const ageTo = ageFrom + 9;
    const startYear = birth.local.year + ageFrom;
    list.push(
      toFortunePeriod('대운', stem, branch, birth.dayMasterStem, birth.ts, {
        order,
        ageFrom,
        ageTo,
        startYear,
        year: startYear,
      }),
    );
  }

  return list;
}

function pickCurrentDaeun(
  daeunList: TtycFortunePeriod[],
  birthYear: number,
  baseYear: number,
): TtycFortunePeriod | undefined {
  if (daeunList.length === 0) return undefined;
  let age = baseYear - birthYear + 1;
  if (age < 1) age = 1;
  let idx = Math.floor((age - 1) / 10);
  if (idx < 0) idx = 0;
  if (idx >= daeunList.length) idx = daeunList.length - 1;
  return { ...daeunList[idx], type: '대운' };
}

function calcPillarsAtLocalParts(
  base: TtycLocalDateTimeParts,
  patch: Partial<Pick<TtycLocalDateTimeParts, 'year' | 'month' | 'day' | 'hour' | 'minute'>>,
  tzOffsetMinutes: number,
  timePrecision: TtycTimePrecision,
): TtycPillarCalcResult {
  const year = patch.year ?? base.year;
  const month = patch.month ?? base.month;
  const dayRaw = patch.day ?? base.day;
  const day = clampDay(year, month, dayRaw);
  const hour = patch.hour ?? base.hour;
  const minute = patch.minute ?? base.minute;

  const ts = toUnixTimestamp({ year, month, day, hour, minute }, tzOffsetMinutes);
  return calculatePillars({ ts, tzOffsetMinutes, timePrecision });
}

function buildSeunList(
  req: TtycFortuneRequest,
  base: TtycPillarCalcResult,
): TtycFortunePeriod[] | undefined {
  const hasFrom = req.seunFromYear !== undefined;
  const hasTo = req.seunToYear !== undefined;
  if (!hasFrom && !hasTo) return undefined;

  let from = hasFrom ? req.seunFromYear! : base.local.year;
  let to = hasTo ? req.seunToYear! : base.local.year;
  if (from <= 0 || to <= 0) {
    throw new Error('seunFromYear/seunToYear must be positive');
  }
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  if (to - from + 1 > 30) {
    to = from + 29;
  }

  const out: TtycFortunePeriod[] = [];
  for (let y = from; y <= to; y += 1) {
    const calc = calcPillarsAtLocalParts(
      base.local,
      { year: y },
      base.tzOffsetMinutes,
      base.timePrecision,
    );
    out.push(
      toFortunePeriod('세운', calc.pillars.year.stem, calc.pillars.year.branch, base.dayMasterStem, calc.ts, {
        startYear: y,
        year: y,
      }),
    );
  }
  return out;
}

function buildWolunList(
  req: TtycFortuneRequest,
  base: TtycPillarCalcResult,
): TtycFortunePeriod[] | undefined {
  if (req.wolunYear === undefined) return undefined;
  const year = req.wolunYear;
  if (year <= 0) {
    throw new Error('wolunYear must be positive');
  }

  const out: TtycFortunePeriod[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const calc = calcPillarsAtLocalParts(
      base.local,
      { year, month },
      base.tzOffsetMinutes,
      base.timePrecision,
    );
    out.push(
      toFortunePeriod('월운', calc.pillars.month.stem, calc.pillars.month.branch, base.dayMasterStem, calc.ts, {
        startYear: year,
        year,
        month,
      }),
    );
  }
  return out;
}

function buildIlunList(
  req: TtycFortuneRequest,
  base: TtycPillarCalcResult,
): TtycFortunePeriod[] | undefined {
  const hasYear = req.ilunYear !== undefined;
  const hasMonth = req.ilunMonth !== undefined;
  if (!hasYear && !hasMonth) return undefined;
  if (!hasYear || !hasMonth) {
    throw new Error('ilunYear and ilunMonth are required together');
  }

  const year = req.ilunYear!;
  const month = req.ilunMonth!;
  if (year <= 0) {
    throw new Error('ilunYear must be positive');
  }
  if (month < 1 || month > 12) {
    throw new Error('ilunMonth must be in 1..12');
  }

  const totalDays = daysInMonth(year, month);
  const out: TtycFortunePeriod[] = [];
  for (let day = 1; day <= totalDays; day += 1) {
    const calc = calcPillarsAtLocalParts(
      base.local,
      { year, month, day },
      base.tzOffsetMinutes,
      base.timePrecision,
    );
    out.push(
      toFortunePeriod('일운', calc.pillars.day.stem, calc.pillars.day.branch, base.dayMasterStem, calc.ts, {
        startYear: year,
        year,
        month,
        day,
      }),
    );
  }
  return out;
}

/**
 * 운세 흐름 계산:
 * - baseTs(없으면 birth.ts) 기준으로 대운 포인트/세운/월운/일운 포인트를 계산한다.
 * - 요청 옵션이 있을 때 seunList/wolunList/ilunList 범위를 추가 계산한다.
 */
export function calculateFortuneFlow(
  birth: TtycPillarCalcResult,
  sex: TtycSex | undefined,
  request: TtycFortuneRequest | undefined,
): TtycFortuneFlow {
  const req = request ?? {};
  const baseTs = req.baseTs !== undefined ? normalizeUnixTs(req.baseTs) : birth.ts;
  const baseCalc = calculatePillars({
    ts: baseTs,
    tzOffsetMinutes: birth.tzOffsetMinutes,
    timePrecision: birth.timePrecision,
  });

  const daeunList = buildDaeunList(birth, normalizeSex(sex));
  const daeun = pickCurrentDaeun(daeunList, birth.local.year, baseCalc.local.year);

  const seun = toFortunePeriod(
    '세운',
    baseCalc.pillars.year.stem,
    baseCalc.pillars.year.branch,
    birth.dayMasterStem,
    baseCalc.ts,
    {
      startYear: baseCalc.local.year,
      year: baseCalc.local.year,
    },
  );
  const wolun = toFortunePeriod(
    '월운',
    baseCalc.pillars.month.stem,
    baseCalc.pillars.month.branch,
    birth.dayMasterStem,
    baseCalc.ts,
    {
      startYear: baseCalc.local.year,
      year: baseCalc.local.year,
      month: baseCalc.local.month,
    },
  );
  const ilun = toFortunePeriod(
    '일운',
    baseCalc.pillars.day.stem,
    baseCalc.pillars.day.branch,
    birth.dayMasterStem,
    baseCalc.ts,
    {
      startYear: baseCalc.local.year,
      year: baseCalc.local.year,
      month: baseCalc.local.month,
      day: baseCalc.local.day,
    },
  );

  const seunList = buildSeunList(req, baseCalc);
  const wolunList = buildWolunList(req, baseCalc);
  const ilunList = buildIlunList(req, baseCalc);

  return {
    baseTs,
    baseLocal: baseCalc.local,
    daeun,
    seun,
    wolun,
    ilun,
    daeunList,
    seunList,
    wolunList,
    ilunList,
  };
}

/**
 * 최종 진입점:
 * - birthTs를 기준으로 4주 계산
 * - 같은 기준에서 운세 포인트/리스트를 함께 계산
 */
export function calculateTtyc(input: TtycCalculateInput): TtycCalculateResult {
  const birth = calculatePillars({
    ts: input.birthTs,
    tzOffsetMinutes: input.tzOffsetMinutes,
    timePrecision: input.timePrecision,
  });
  const fortune = calculateFortuneFlow(birth, input.sex, input.fortune);
  return { birth, fortune };
}

/**
 * 클래스 형태 API가 필요한 경우를 위한 래퍼.
 * 상태 없는 순수 함수 계산기이므로 내부 캐시는 두지 않는다.
 */
export class TtycCalculator {
  private readonly tzOffsetMinutes: number;
  private readonly timePrecision: TtycTimePrecision;
  private readonly sex: TtycSex;

  constructor(opts?: { tzOffsetMinutes?: number; timePrecision?: TtycTimePrecision; sex?: TtycSex }) {
    this.tzOffsetMinutes = normalizeTzOffsetMinutes(opts?.tzOffsetMinutes);
    this.timePrecision = normalizeTimePrecision(opts?.timePrecision);
    this.sex = normalizeSex(opts?.sex);
  }

  /**
   * 인스턴스 기본 옵션(시간대/정밀도)으로 단일 시점 명식을 계산한다.
   */
  calculatePillars(ts: number): TtycPillarCalcResult {
    return calculatePillars({
      ts,
      tzOffsetMinutes: this.tzOffsetMinutes,
      timePrecision: this.timePrecision,
    });
  }

  /**
   * 인스턴스 기본 옵션으로 명식 + 운세 흐름을 한 번에 계산한다.
   */
  calculate(ts: number, fortune?: TtycFortuneRequest): TtycCalculateResult {
    return calculateTtyc({
      birthTs: ts,
      tzOffsetMinutes: this.tzOffsetMinutes,
      timePrecision: this.timePrecision,
      sex: this.sex,
      fortune,
    });
  }
}
