// Map SajuExtractTestTab mode and period fields to GraphQL SajuGenerationTargetInput kind/period.

export type SajuExtractMode = '인생' | '연도별' | '월별' | '일간' | '대운';

export interface SajuGenerationTargetMapping {
  kind: string;
  period: string;
}

/**
 * Maps form mode and target fields to a single runSajuGeneration target (kind, period).
 * 인생 → kind "인생", period ""; 연도별 → "세운", period targetYear;
 * 월별 → "월간", period "YYYY-MM"; 일간 → "일간", period "YYYY-MM-DD";
 * 대운 → "대운", period 0-based step (e.g. "0", "1").
 */
export function modePeriodToSajuTarget(
  mode: SajuExtractMode,
  targetYear: string,
  targetMonth: string,
  targetDay: string,
  targetDaesoonIndex: string
): SajuGenerationTargetMapping {
  switch (mode) {
    case '인생':
      return { kind: '인생', period: '' };
    case '연도별':
      return { kind: '세운', period: targetYear || '' };
    case '월별':
      return { kind: '월간', period: [targetYear, targetMonth].filter(Boolean).join('-') || '' };
    case '일간':
      return { kind: '일간', period: [targetYear, targetMonth, targetDay].filter(Boolean).join('-') || '' };
    case '대운':
      return { kind: '대운', period: targetDaesoonIndex ?? '0' };
    default:
      return { kind: '인생', period: '' };
  }
}
