// 명식/파생요소 표시용 공통 타입 정의.
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';
import { PILLAR_ORDER } from '@/utils/pillarDisplay';

export type Wuxing = '목' | '화' | '토' | '금' | '수';
export type YinYang = '양' | '음';
export type PillarSlot = (typeof PILLAR_ORDER)[number];

export type FortunePeriodLike = {
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

export type ExtractDocWithFortunes = ExtractSajuStep1DocFieldsFragment & {
  daeun?: FortunePeriodLike | null;
  seun?: FortunePeriodLike | null;
  wolun?: FortunePeriodLike | null;
  ilun?: FortunePeriodLike | null;
  daeunList?: FortunePeriodLike[] | null;
  seunList?: FortunePeriodLike[] | null;
  wolunList?: FortunePeriodLike[] | null;
  ilunList?: FortunePeriodLike[] | null;
};

export type GanjiMeta = {
  index: number;
  hangul: string;
  hanja: string;
  element: Wuxing;
  yinYang: YinYang;
};

export type HiddenStemChip = {
  stemIndex: number;
  hangulChar: string;
  yinYang: YinYang;
  element: Wuxing;
  tenGod: string;
  ratio: number;
};

export type PillarDetailRow = {
  key: PillarSlot;
  label: string;
  isDayPillar: boolean;
  stem: string;
  branch: string;
  stemTenGod: string;
  branchTenGod: string;
  twelveFate: string;
  hiddenStemChips: HiddenStemChip[];
  branchDerivedValue: string;
};

export type DetailRow = {
  type: 'fact' | 'eval';
  keyName: string;
  label: string;
  value: string;
  score: string;
};
