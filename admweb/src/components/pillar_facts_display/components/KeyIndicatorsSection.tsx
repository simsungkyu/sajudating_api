// 핵심 지표 카드(일간·시주컨텍스트·facts/evals 개수).
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';
import type { Wuxing } from '../common/pillarFactsTypes';
import { ELEMENT_VISUAL, HANJA_FONT_FAMILY } from '../common/pillarFactsConstants';

export type KeyIndicatorsSectionProps = {
  dayMasterStem: string;
  dayMasterElement: Wuxing | null;
  dayMasterYinYang: string;
  hourContextText: string;
  extractDoc?: ExtractSajuStep1DocFieldsFragment | null;
};

export function KeyIndicatorsSection({
  dayMasterStem,
  dayMasterElement,
  dayMasterYinYang,
  hourContextText,
  extractDoc,
}: KeyIndicatorsSectionProps) {
  return (
    <div className="KeyIndicatorsSection space-y-3">
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
              <span className="text-xs font-semibold tabular-nums">
                {extractDoc.facts.length} / {extractDoc.evals.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
