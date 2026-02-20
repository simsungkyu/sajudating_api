// 운세 흐름(대운→세운→월운→일운 선택형 테이블).
import { useMemo, useState, type ReactNode } from 'react';
import {
  calculatePillars,
  clampDay,
  daysInMonth,
  toUnixTimestamp,
  type TtycGanjiMeta,
} from '@/lib/ttyc';
import type { FortunePeriodLike } from '../common/pillarFactsTypes';
import {
  formatFortuneListPreview,
  formatFortuneStartAge,
  renderFortuneYearCell,
  resolveFortuneBranchChar,
  resolveFortuneElement,
  resolveFortuneStemChar,
  resolveFortuneYinYang,
  toKoreanTenGod,
} from '../common/pillarFactsUtils';
import { FortuneCharCell } from './FortuneCharCell';

export type FortuneRow = { label: string; value: string };

export type FortuneFlowSectionProps = {
  fortuneRows: FortuneRow[];
  daeun: FortunePeriodLike | null;
  seun: FortunePeriodLike | null;
  wolun: FortunePeriodLike | null;
  ilun: FortunePeriodLike | null;
  daeunList: FortunePeriodLike[];
  seunList: FortunePeriodLike[];
  wolunList: FortunePeriodLike[];
  ilunList: FortunePeriodLike[];
};

type FortuneTableRow = {
  key: string;
  label: string;
  render: (item: FortunePeriodLike) => ReactNode;
};

const FORTUNE_DETAIL_ROWS: FortuneTableRow[] = [
  {
    key: 'stemtg',
    label: '천간십성',
    render: (item) => toKoreanTenGod(item.stemTenGod) || '-',
  },
  {
    key: 'stem',
    label: '천간',
    render: (item) => {
      const stemChar = resolveFortuneStemChar(item);
      if (!stemChar) return '-';
      return (
        <FortuneCharCell
          char={stemChar}
          yinYang={resolveFortuneYinYang('stem', item)}
          element={resolveFortuneElement('stem', item)}
        />
      );
    },
  },
  {
    key: 'branch',
    label: '지지',
    render: (item) => {
      const branchChar = resolveFortuneBranchChar(item);
      if (!branchChar) return '-';
      return (
        <FortuneCharCell
          char={branchChar}
          yinYang={resolveFortuneYinYang('branch', item)}
          element={resolveFortuneElement('branch', item)}
        />
      );
    },
  },
  {
    key: 'branchtg',
    label: '지지십성',
    render: (item) => toKoreanTenGod(item.branchTenGod) || '-',
  },
];

const DAEUN_TABLE_ROWS: FortuneTableRow[] = [
  {
    key: 'year',
    label: '연도',
    render: (item) => renderFortuneYearCell(item),
  },
  {
    key: 'age',
    label: '나이',
    render: (item) => formatFortuneStartAge(item),
  },
  ...FORTUNE_DETAIL_ROWS,
];

const SEUN_TABLE_ROWS: FortuneTableRow[] = [
  {
    key: 'year',
    label: '연도',
    render: (item) => renderFortuneYearCell(item),
  },
  {
    key: 'age',
    label: '나이',
    render: (item) => formatFortuneStartAge(item),
  },
  ...FORTUNE_DETAIL_ROWS,
];

const WOLUN_TABLE_ROWS: FortuneTableRow[] = [
  {
    key: 'month',
    label: '월',
    render: (item) => (typeof item.month === 'number' && item.month >= 1 && item.month <= 12 ? `${item.month}월` : '-'),
  },
  ...FORTUNE_DETAIL_ROWS,
];

const ILUN_TABLE_ROWS: FortuneTableRow[] = [
  {
    key: 'day',
    label: '일',
    render: (item) => (typeof item.day === 'number' && item.day >= 1 && item.day <= 31 ? `${item.day}` : '-'),
  },
  ...FORTUNE_DETAIL_ROWS,
];

type FortuneGridTableProps = {
  title: string;
  items: FortunePeriodLike[];
  rows: FortuneTableRow[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  description?: string;
};

function FortuneGridTable({
  title,
  items,
  rows,
  selectedIndex,
  onSelect,
  description,
}: FortuneGridTableProps) {
  const selectedPreview =
    selectedIndex != null && items[selectedIndex]
      ? formatFortuneListPreview(items[selectedIndex])
      : '';

  const cells: ReactNode[] = [];
  const lastRowIndex = rows.length - 1;
  const lastColIndex = items.length - 1;

  rows.forEach((row, rowIndex) => {
    const hasBottomBorder = rowIndex < lastRowIndex;
    const labelCellClass = [
      'bg-muted/15 px-2 py-2 font-medium',
      'border-r border-border/60',
      hasBottomBorder ? 'border-b border-border/60' : '',
    ]
      .filter(Boolean)
      .join(' ');

    cells.push(
      <div key={`fortune-table:${title}:label:${row.key}`} className={labelCellClass}>
        {row.label}
      </div>,
    );

    items.forEach((item, colIndex) => {
      const isSelected = selectedIndex === colIndex;
      const valueCellClass = [
        'px-2 py-2 whitespace-nowrap text-left',
        colIndex < lastColIndex ? 'border-r border-border/60' : '',
        hasBottomBorder ? 'border-b border-border/60' : '',
        'cursor-pointer hover:bg-muted/20',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40',
        isSelected ? 'bg-primary/10 font-semibold text-foreground' : '',
      ]
        .filter(Boolean)
        .join(' ');

      cells.push(
        <button
          type="button"
          key={`fortune-table:${title}:${row.key}:${colIndex}:${item.order ?? 0}`}
          className={valueCellClass}
          onClick={() => onSelect(colIndex)}
          aria-pressed={isSelected}
          aria-label={`${title} ${colIndex + 1}번째 항목 선택`}
        >
          {row.render(item)}
        </button>,
      );
    });
  });

  return (
    <div className="w-full rounded-lg border border-border/70 bg-background/80">
      <div className="border-b border-border/70 px-2 py-1.5">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {selectedPreview || description || '표에서 항목을 선택하세요.'}
        </p>
      </div>
      <div className="w-full overflow-x-auto text-xs">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `8rem repeat(${Math.max(1, items.length)}, minmax(5.5rem, 1fr))` }}
        >
          {cells}
        </div>
      </div>
    </div>
  );
}

function isPositiveNumber(value?: number | null): value is number {
  return typeof value === 'number' && value > 0;
}

function isValidMonth(value?: number | null): value is number {
  return isPositiveNumber(value) && value >= 1 && value <= 12;
}

function isValidDay(value?: number | null): value is number {
  return isPositiveNumber(value) && value >= 1 && value <= 31;
}

function firstPositiveNumber(...values: Array<number | null | undefined>): number | null {
  for (const value of values) {
    if (isPositiveNumber(value)) return value;
  }
  return null;
}

function resolveDefaultMonth(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    if (isValidMonth(value)) return value;
  }
  return 1;
}

function resolveDefaultDay(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    if (isValidDay(value)) return value;
  }
  return 1;
}

const TEN_GOD_CODE_BY_KO: Record<string, string> = {
  비견: 'BIGYEON',
  겁재: 'GEOBJAE',
  식신: 'SIKSHIN',
  상관: 'SANGGWAN',
  편재: 'PYEONJAE',
  정재: 'JEONGJAE',
  편관: 'PYEONGWAN',
  정관: 'JEONGGWAN',
  편인: 'PYEONIN',
  정인: 'JEONGIN',
};

const ELEMENT_CODE_BY_KO: Record<string, string> = {
  목: 'WOOD',
  화: 'FIRE',
  토: 'EARTH',
  금: 'METAL',
  수: 'WATER',
};

const YIN_YANG_CODE_BY_KO: Record<string, string> = {
  양: 'YANG',
  음: 'YIN',
};

type CalculatedFortuneType = 'SEUN' | 'WOLUN' | 'ILUN';

type CalculatedFortuneItemArgs = {
  type: CalculatedFortuneType;
  ganji: TtycGanjiMeta;
  startYear: number;
  year: number;
  month?: number;
  day?: number;
  order?: number;
  ageFrom?: number;
  ageTo?: number;
};

type LocalDateSeed = {
  year: number;
  month: number;
  day: number;
};

function toCalculatedFortuneItem({
  type,
  ganji,
  startYear,
  year,
  month,
  day,
  order,
  ageFrom,
  ageTo,
}: CalculatedFortuneItemArgs): FortunePeriodLike {
  return {
    type,
    order,
    stem: ganji.stem,
    branch: ganji.branch,
    stemKo: ganji.stemKo,
    stemHanja: ganji.stemHanja,
    branchKo: ganji.branchKo,
    branchHanja: ganji.branchHanja,
    ganjiKo: ganji.ganjiKo,
    ganjiHanja: ganji.ganjiHanja,
    stemEl: ELEMENT_CODE_BY_KO[ganji.stemEl] ?? null,
    stemYy: YIN_YANG_CODE_BY_KO[ganji.stemYinYang] ?? null,
    stemTenGod: TEN_GOD_CODE_BY_KO[ganji.stemTenGod] ?? null,
    branchEl: ELEMENT_CODE_BY_KO[ganji.branchEl] ?? null,
    branchYy: YIN_YANG_CODE_BY_KO[ganji.branchYinYang] ?? null,
    branchTenGod: TEN_GOD_CODE_BY_KO[ganji.branchTenGod] ?? null,
    branchTwelve: ganji.branchTwelve,
    ageFrom,
    ageTo,
    startYear,
    year,
    month,
    day,
  };
}

function calculatePillarsBySeed(seed: LocalDateSeed) {
  try {
    const safeDay = clampDay(seed.year, seed.month, seed.day);
    const ts = toUnixTimestamp({
      year: seed.year,
      month: seed.month,
      day: safeDay,
      hour: 12,
      minute: 0,
    });
    return calculatePillars({ ts });
  } catch {
    return null;
  }
}

function buildSeunListByDaeun(
  daeun: FortunePeriodLike | null,
  seun: FortunePeriodLike | null,
  wolun: FortunePeriodLike | null,
  ilun: FortunePeriodLike | null,
): FortunePeriodLike[] {
  const startYear = firstPositiveNumber(daeun?.startYear, daeun?.year, seun?.year);
  if (!startYear) return [];

  const defaultMonth = resolveDefaultMonth(wolun?.month, ilun?.month, seun?.month, 1);
  const defaultDay = resolveDefaultDay(ilun?.day, 1);
  const daeunAgeFrom = firstPositiveNumber(daeun?.ageFrom);

  const out: FortunePeriodLike[] = [];
  for (let offset = 0; offset < 10; offset += 1) {
    const year = startYear + offset;
    const calc = calculatePillarsBySeed({
      year,
      month: defaultMonth,
      day: defaultDay,
    });
    if (!calc) continue;

    const ageFrom = daeunAgeFrom != null ? daeunAgeFrom + offset : undefined;
    out.push(
      toCalculatedFortuneItem({
        type: 'SEUN',
        ganji: calc.pillars.year,
        order: offset + 1,
        ageFrom,
        ageTo: ageFrom,
        startYear: year,
        year,
      }),
    );
  }
  return out;
}

function buildWolunListBySeun(
  seun: FortunePeriodLike | null,
  ilun: FortunePeriodLike | null,
): FortunePeriodLike[] {
  const year = firstPositiveNumber(seun?.year, seun?.startYear);
  if (!year) return [];

  const defaultDay = resolveDefaultDay(ilun?.day, 1);
  const out: FortunePeriodLike[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const calc = calculatePillarsBySeed({
      year,
      month,
      day: defaultDay,
    });
    if (!calc) continue;

    out.push(
      toCalculatedFortuneItem({
        type: 'WOLUN',
        ganji: calc.pillars.month,
        order: month,
        startYear: year,
        year,
        month,
      }),
    );
  }
  return out;
}

function buildIlunListByWolun(
  wolun: FortunePeriodLike | null,
): FortunePeriodLike[] {
  const year = firstPositiveNumber(wolun?.year, wolun?.startYear);
  const month = resolveDefaultMonth(wolun?.month, 1);
  if (!year || !isValidMonth(month)) return [];

  const totalDays = Math.max(1, Math.min(30, daysInMonth(year, month)));
  const out: FortunePeriodLike[] = [];
  for (let day = 1; day <= totalDays; day += 1) {
    const calc = calculatePillarsBySeed({
      year,
      month,
      day,
    });
    if (!calc) continue;

    out.push(
      toCalculatedFortuneItem({
        type: 'ILUN',
        ganji: calc.pillars.day,
        order: day,
        startYear: year,
        year,
        month,
        day,
      }),
    );
  }
  return out;
}

const EMPTY_FORTUNE_ITEM: FortunePeriodLike = {};

function toDisplayFortuneItems(
  list: FortunePeriodLike[],
  current: FortunePeriodLike | null,
): FortunePeriodLike[] {
  if (list.length > 0) return list;
  if (current) return [current];
  return [EMPTY_FORTUNE_ITEM];
}

function filterSeunByDaeun(seunList: FortunePeriodLike[], daeun: FortunePeriodLike | null): FortunePeriodLike[] {
  if (seunList.length === 0) return [];
  if (!daeun) return seunList;

  if (isPositiveNumber(daeun.startYear)) {
    const startYear = daeun.startYear;
    const endYearByAge =
      isPositiveNumber(daeun.ageFrom) && isPositiveNumber(daeun.ageTo)
        ? startYear + Math.max(0, daeun.ageTo - daeun.ageFrom)
        : startYear + 9;
    const matchedByYear = seunList.filter(
      (item) => isPositiveNumber(item.year) && item.year >= startYear && item.year <= endYearByAge,
    );
    if (matchedByYear.length > 0) return matchedByYear;
  }

  if (isPositiveNumber(daeun.ageFrom) && isPositiveNumber(daeun.ageTo)) {
    const fromAge = daeun.ageFrom;
    const toAge = daeun.ageTo;
    const matchedByAge = seunList.filter(
      (item) => isPositiveNumber(item.ageFrom) && item.ageFrom >= fromAge && item.ageFrom <= toAge,
    );
    if (matchedByAge.length > 0) return matchedByAge;
  }

  return seunList;
}

function filterWolunBySeun(wolunList: FortunePeriodLike[], seun: FortunePeriodLike | null): FortunePeriodLike[] {
  if (wolunList.length === 0) return [];
  if (!seun) return wolunList;
  if (isPositiveNumber(seun.year)) {
    const matchedByYear = wolunList.filter((item) => isPositiveNumber(item.year) && item.year === seun.year);
    if (matchedByYear.length > 0) return matchedByYear;
  }
  return wolunList;
}

function filterIlunByWolun(ilunList: FortunePeriodLike[], wolun: FortunePeriodLike | null): FortunePeriodLike[] {
  if (ilunList.length === 0) return [];
  if (!wolun) return ilunList;
  if (isPositiveNumber(wolun.year) && isPositiveNumber(wolun.month)) {
    const matchedByYearMonth = ilunList.filter(
      (item) => isPositiveNumber(item.year) && isPositiveNumber(item.month) && item.year === wolun.year && item.month === wolun.month,
    );
    if (matchedByYearMonth.length > 0) return matchedByYearMonth;
  }
  if (isPositiveNumber(wolun.year)) {
    const matchedByYear = ilunList.filter((item) => isPositiveNumber(item.year) && item.year === wolun.year);
    if (matchedByYear.length > 0) return matchedByYear;
  }
  if (isPositiveNumber(wolun.month)) {
    const matchedByMonth = ilunList.filter((item) => isPositiveNumber(item.month) && item.month === wolun.month);
    if (matchedByMonth.length > 0) return matchedByMonth;
  }
  return ilunList;
}

export function FortuneFlowSection({
  fortuneRows,
  daeun,
  seun,
  wolun,
  ilun,
  daeunList,
  seunList,
  wolunList,
  ilunList,
}: FortuneFlowSectionProps) {
  const [selectedDaeunIndex, setSelectedDaeunIndex] = useState<number | null>(null);
  const [selectedSeunIndex, setSelectedSeunIndex] = useState<number | null>(null);
  const [selectedWolunIndex, setSelectedWolunIndex] = useState<number | null>(null);
  const [selectedIlunIndex, setSelectedIlunIndex] = useState<number | null>(null);

  const daeunItems = useMemo(
    () => toDisplayFortuneItems(daeunList, daeun),
    [daeunList, daeun],
  );
  const resolvedDaeunIndex =
    daeunItems.length === 0
      ? null
      : selectedDaeunIndex != null && selectedDaeunIndex < daeunItems.length
        ? selectedDaeunIndex
        : 0;
  const selectedDaeun = resolvedDaeunIndex == null ? null : (daeunItems[resolvedDaeunIndex] ?? null);

  const generatedSeunList = useMemo(
    () => (seunList.length > 0 ? [] : buildSeunListByDaeun(selectedDaeun, seun, wolun, ilun)),
    [seunList, selectedDaeun, seun, wolun, ilun],
  );
  const baseSeunItems = useMemo(
    () => toDisplayFortuneItems(seunList.length > 0 ? seunList : generatedSeunList, seun),
    [seunList, generatedSeunList, seun],
  );
  const filteredSeunList = useMemo(
    () => filterSeunByDaeun(baseSeunItems, selectedDaeun),
    [baseSeunItems, selectedDaeun],
  );

  const resolvedSeunIndex =
    filteredSeunList.length === 0
      ? null
      : selectedSeunIndex != null && selectedSeunIndex < filteredSeunList.length
        ? selectedSeunIndex
        : 0;
  const selectedSeun = resolvedSeunIndex == null ? null : (filteredSeunList[resolvedSeunIndex] ?? null);
  const generatedWolunList = useMemo(
    () => (wolunList.length > 0 ? [] : buildWolunListBySeun(selectedSeun ?? seun, ilun)),
    [wolunList, selectedSeun, seun, ilun],
  );
  const baseWolunItems = useMemo(
    () => toDisplayFortuneItems(wolunList.length > 0 ? wolunList : generatedWolunList, wolun),
    [wolunList, generatedWolunList, wolun],
  );
  const filteredWolunList = useMemo(
    () => filterWolunBySeun(baseWolunItems, selectedSeun),
    [baseWolunItems, selectedSeun],
  );

  const resolvedWolunIndex =
    filteredWolunList.length === 0
      ? null
      : selectedWolunIndex != null && selectedWolunIndex < filteredWolunList.length
        ? selectedWolunIndex
        : 0;
  const selectedWolun = resolvedWolunIndex == null ? null : (filteredWolunList[resolvedWolunIndex] ?? null);
  const generatedIlunList = useMemo(
    () => (ilunList.length > 0 ? [] : buildIlunListByWolun(selectedWolun ?? wolun)),
    [ilunList, selectedWolun, wolun],
  );
  const baseIlunItems = useMemo(
    () => toDisplayFortuneItems(ilunList.length > 0 ? ilunList : generatedIlunList, ilun),
    [ilunList, generatedIlunList, ilun],
  );
  const filteredIlunList = useMemo(
    () => filterIlunByWolun(baseIlunItems, selectedWolun),
    [baseIlunItems, selectedWolun],
  );

  const resolvedIlunIndex =
    filteredIlunList.length === 0
      ? null
      : selectedIlunIndex != null && selectedIlunIndex < filteredIlunList.length
        ? selectedIlunIndex
        : 0;

  const handleSelectDaeun = (index: number) => {
    setSelectedDaeunIndex(index);
    setSelectedSeunIndex(0);
    setSelectedWolunIndex(0);
    setSelectedIlunIndex(0);
  };

  const handleSelectSeun = (index: number) => {
    setSelectedSeunIndex(index);
    setSelectedWolunIndex(0);
    setSelectedIlunIndex(0);
  };

  const handleSelectWolun = (index: number) => {
    setSelectedWolunIndex(index);
    setSelectedIlunIndex(0);
  };

  const hasDaeunData = daeunList.length > 0 || daeun != null;
  const hasSeunData = seunList.length > 0 || generatedSeunList.length > 0 || seun != null;
  const hasWolunData = wolunList.length > 0 || generatedWolunList.length > 0 || wolun != null;
  const hasIlunData = ilunList.length > 0 || generatedIlunList.length > 0 || ilun != null;

  return (
    <div className="FortuneFlowSection overflow-hidden rounded-xl border border-border/70 bg-card/80">
      <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
        <p className="text-xs font-semibold text-foreground">운세흐름</p>
      </div>
      <div className="space-y-3 px-2 py-3 sm:px-3">
        <FortuneGridTable
          title="1. 대운 선택"
          items={daeunItems}
          rows={DAEUN_TABLE_ROWS}
          selectedIndex={resolvedDaeunIndex}
          onSelect={handleSelectDaeun}
          description={hasDaeunData ? '초기에는 첫 대운이 기본 선택됩니다.' : '대운 데이터가 없어 빈 표로 표시됩니다.'}
        />

        <FortuneGridTable
          title="2. 세운 선택"
          items={filteredSeunList}
          rows={SEUN_TABLE_ROWS}
          selectedIndex={resolvedSeunIndex}
          onSelect={handleSelectSeun}
          description={hasSeunData ? '선택한 대운 기준 세운 10년 목록(첫 항목 자동 선택).' : '세운 데이터가 없어 빈 표로 표시됩니다.'}
        />

        <FortuneGridTable
          title="3. 월운 선택"
          items={filteredWolunList}
          rows={WOLUN_TABLE_ROWS}
          selectedIndex={resolvedWolunIndex}
          onSelect={handleSelectWolun}
          description={hasWolunData ? '선택한 세운 기준 월운 12개월 목록(첫 항목 자동 선택).' : '월운 데이터가 없어 빈 표로 표시됩니다.'}
        />

        <FortuneGridTable
          title="4. 일운 선택"
          items={filteredIlunList}
          rows={ILUN_TABLE_ROWS}
          selectedIndex={resolvedIlunIndex}
          onSelect={setSelectedIlunIndex}
          description={hasIlunData ? '선택한 월운 기준 일운 약 30일 목록(첫 항목 자동 선택).' : '일운 데이터가 없어 빈 표로 표시됩니다.'}
        />

        {daeunList.length === 0 && fortuneRows.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
