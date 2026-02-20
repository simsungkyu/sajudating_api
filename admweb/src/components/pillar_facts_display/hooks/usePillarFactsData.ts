// 명식/파생요소 표시용 데이터 계산 훅. userInfo/extractDoc → 섹션별 전달 데이터.
import type { UserInfoSummary } from '@/api/itemncard_api';
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';
import {
  PILLAR_LABELS,
  PILLAR_ORDER,
  toPillarsFromExtractDoc,
  toPillarsFromUserInfo,
} from '@/utils/pillarDisplay';
import type { DetailRow, ExtractDocWithFortunes, FortunePeriodLike, PillarDetailRow } from '../common/pillarFactsTypes';
import type { YinYang } from '../common/pillarFactsTypes';
import {
  HIDDEN_STEM_RATIO_TABLE,
  HIDDEN_STEM_TABLE,
  PILLAR_DISPLAY_ORDER,
  STEM_HANGUL_CHARS,
  STEM_ELEMENTS,
} from '../common/pillarFactsConstants';
import {
  branchIndexFromChar,
  calcBranchTenGod,
  calcStemTenGod,
  calcTwelveFate,
  extractBranchDerivedTokens,
  formatFortuneSummary,
  formatHourContext,
  formatPillarsTextInDisplayOrder,
  formatValue,
  normalizeDayStemIndex,
  normalizeTokensSummary,
  resolveWuxing,
  resolveYinYang,
  splitPillar,
  stemIndexFromChar,
  toElementBalanceParts,
  truncateText,
} from '../common/pillarFactsUtils';

export type PillarFactsDisplayInput = {
  userInfo?: UserInfoSummary | null | undefined;
  extractDoc?: ExtractSajuStep1DocFieldsFragment | null | undefined;
  maxTokensShown?: number;
  maxDetailsShown?: number;
};

export type PillarFactsData = {
  pillarsText: string;
  metaRows: Array<{ label: string; value: string }>;
  pillarDetails: PillarDetailRow[];
  hasAnyBranchDerived: boolean;
  elementBalanceParts: Array<{ element: '목' | '화' | '토' | '금' | '수'; ratio: number }>;
  dayMasterStem: string;
  dayMasterElement: '목' | '화' | '토' | '금' | '수' | null;
  dayMasterYinYang: string;
  hourContextText: string;
  fortuneRows: Array<{ label: string; value: string }>;
  daeun: FortunePeriodLike | null;
  seun: FortunePeriodLike | null;
  wolun: FortunePeriodLike | null;
  ilun: FortunePeriodLike | null;
  daeunList: FortunePeriodLike[];
  seunList: FortunePeriodLike[];
  wolunList: FortunePeriodLike[];
  ilunList: FortunePeriodLike[];
  detailRows: DetailRow[];
  itemsSummary: string;
  tokensShown: string[];
  hiddenTokens: number;
  extractDoc: ExtractSajuStep1DocFieldsFragment | null | undefined;
  userInfo: UserInfoSummary | null | undefined;
  maxDetailsShown: number;
};

/** 표시할 데이터가 없으면 null, 있으면 계산된 데이터 객체 반환. */
export function usePillarFactsData(input: PillarFactsDisplayInput): PillarFactsData | null {
  const {
    userInfo,
    extractDoc,
    maxTokensShown = 8,
    maxDetailsShown = 12,
  } = input;

  if (!userInfo && !extractDoc) return null;

  const pillars = extractDoc
    ? toPillarsFromExtractDoc(extractDoc)
    : toPillarsFromUserInfo(userInfo?.pillars);
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
    typeof extractDoc?.input.leapMonth === 'boolean'
      ? `윤달 ${extractDoc.input.leapMonth ? '예' : '아니오'}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');
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
  const dayMasterYinYang = resolveYinYang(dayMasterStem, true) || '';
  const hourContextText = formatHourContext(extractDoc);
  const fortuneDoc = extractDoc as ExtractDocWithFortunes | null | undefined;
  const fortuneRows = [
    { label: '대운', value: formatFortuneSummary(fortuneDoc?.daeun) },
    { label: '세운', value: formatFortuneSummary(fortuneDoc?.seun) },
    { label: '월운', value: formatFortuneSummary(fortuneDoc?.wolun) },
    { label: '일운', value: formatFortuneSummary(fortuneDoc?.ilun) },
  ];
  const daeun = fortuneDoc?.daeun ?? null;
  const seun = fortuneDoc?.seun ?? null;
  const wolun = fortuneDoc?.wolun ?? null;
  const ilun = fortuneDoc?.ilun ?? null;
  const daeunList = fortuneDoc?.daeunList ?? [];
  const seunList = fortuneDoc?.seunList ?? [];
  const wolunList = fortuneDoc?.wolunList ?? [];
  const ilunList = fortuneDoc?.ilunList ?? [];

  const detailRows: DetailRow[] = (() => {
    const rows: DetailRow[] = [];
    if (extractDoc) {
      for (const fact of extractDoc.facts ?? []) {
        rows.push({
          type: 'fact',
          keyName: fact.k,
          label: fact.n,
          value: formatValue(fact.v),
          score: fact.score?.norm0_100 != null ? `${fact.score.norm0_100}` : '-',
        });
      }
      for (const evalItem of extractDoc.evals ?? []) {
        rows.push({
          type: 'eval',
          keyName: evalItem.k,
          label: evalItem.n,
          value: formatValue(evalItem.v),
          score: `${evalItem.score?.norm0_100 ?? '-'}`,
        });
      }
    }
    return rows;
  })();

  if (
    !hasPillars &&
    metaRows.length === 0 &&
    detailRows.length === 0 &&
    elementBalanceParts.length === 0 &&
    tokensArr.length === 0 &&
    !itemsSummary
  ) {
    return null;
  }

  const pillarDetails: PillarDetailRow[] = PILLAR_DISPLAY_ORDER.map((pillarKey) => {
    const label = PILLAR_LABELS[pillarKey];
    const pillar = pillars[pillarKey] ?? '';
    const isDayPillar = pillarKey === 'd';
    const { stem, branch } = splitPillar(pillar);
    const stemIndex = stemIndexFromChar(stem);
    const branchIndex = branchIndexFromChar(branch);
    const stemTenGod =
      pillarKey === 'd'
        ? '본원'
        : dayMasterIndex != null && stemIndex >= 0
          ? calcStemTenGod(dayMasterIndex, stemIndex)
          : '-';
    const branchTenGod =
      dayMasterIndex != null && branchIndex >= 0
        ? calcBranchTenGod(dayMasterIndex, branchIndex)
        : '-';
    const twelveFate =
      dayMasterIndex != null && branchIndex >= 0
        ? calcTwelveFate(dayMasterIndex, branchIndex)
        : '-';
    const hiddenStemChips =
      branchIndex >= 0
        ? HIDDEN_STEM_TABLE[branchIndex].reduce<
            Array<{
              stemIndex: number;
              hangulChar: string;
              yinYang: YinYang;
              element: (typeof STEM_ELEMENTS)[number];
              tenGod: string;
              ratio: number;
            }>
          >((acc, hiddenStemIndex, hiddenOrder) => {
            const hiddenChar = STEM_HANGUL_CHARS[hiddenStemIndex] ?? '';
            if (!hiddenChar) return acc;
            const yinYang: YinYang = hiddenStemIndex % 2 === 0 ? '양' : '음';
            const element = STEM_ELEMENTS[hiddenStemIndex] ?? '토';
            const tenGod = dayMasterIndex == null ? '' : calcStemTenGod(dayMasterIndex, hiddenStemIndex);
            const ratio = Number(HIDDEN_STEM_RATIO_TABLE[branchIndex]?.[hiddenOrder] ?? 0);
            acc.push({ stemIndex: hiddenStemIndex, hangulChar: hiddenChar, yinYang, element, tenGod, ratio });
            return acc;
          }, [])
        : [];
    const branchDerivedTokens = extractBranchDerivedTokens(tokensArr, pillarKey).slice(0, 2);
    const branchDerivedValue =
      branchDerivedTokens.length > 0 ? truncateText(branchDerivedTokens.join(', '), 46) : '';

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
  const hasAnyBranchDerived = pillarDetails.some((d) => d.branchDerivedValue);

  return {
    pillarsText,
    metaRows,
    pillarDetails,
    hasAnyBranchDerived,
    elementBalanceParts,
    dayMasterStem,
    dayMasterElement,
    dayMasterYinYang,
    hourContextText,
    fortuneRows,
    daeun,
    seun,
    wolun,
    ilun,
    daeunList,
    seunList,
    wolunList,
    ilunList,
    detailRows,
    itemsSummary,
    tokensShown,
    hiddenTokens,
    extractDoc,
    userInfo,
    maxDetailsShown,
  };
}
