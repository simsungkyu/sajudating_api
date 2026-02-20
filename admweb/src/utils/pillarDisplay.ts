import type { UserInfoSummary } from '@/api/itemncard_api';
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';

export const PILLAR_LABELS: Record<string, string> = { y: '년', m: '월', d: '일', h: '시' };
export const PILLAR_ORDER = ['y', 'm', 'd', 'h'] as const;
export const STEM_CHARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCH_CHARS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export type NormalizedPillars = Record<(typeof PILLAR_ORDER)[number], string>;

export function emptyPillars(): NormalizedPillars {
  return { y: '', m: '', d: '', h: '' };
}

export function toPillarString(stem: number, branch: number): string {
  const stemChar = STEM_CHARS[stem];
  const branchChar = BRANCH_CHARS[branch];
  if (!stemChar || !branchChar) return '';
  return `${stemChar}${branchChar}`;
}

export function toPillarsFromUserInfo(
  pillars?: UserInfoSummary['pillars'] | null,
): NormalizedPillars {
  const ret = emptyPillars();
  if (!pillars) return ret;
  for (const key of PILLAR_ORDER) {
    ret[key] = pillars[key] ?? '';
  }
  return ret;
}

export function toPillarsFromExtractDoc(
  doc?: ExtractSajuStep1DocFieldsFragment | null,
): NormalizedPillars {
  const ret = emptyPillars();
  if (!doc) return ret;

  for (const p of doc.pillars) {
    const value = toPillarString(p.stem, p.branch);
    if (!value) continue;
    if (p.k === 'Y') ret.y = value;
    if (p.k === 'M') ret.m = value;
    if (p.k === 'D') ret.d = value;
    if (p.k === 'H') ret.h = value;
  }
  return ret;
}

/** 명식(pillars)을 "년 xxx · 월 xxx · …" 형태 문자열로 반환. */
export function formatPillarsText(pillars: Record<string, string>): string {
  return PILLAR_ORDER.filter((k) => pillars[k])
    .map((k) => `${PILLAR_LABELS[k]} ${pillars[k]}`)
    .join(' · ');
}

export function formatPillarsTextFromExtractDoc(doc?: ExtractSajuStep1DocFieldsFragment | null): string {
  return formatPillarsText(toPillarsFromExtractDoc(doc));
}

