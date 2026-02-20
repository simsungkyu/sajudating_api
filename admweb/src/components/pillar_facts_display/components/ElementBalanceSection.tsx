// 오행 분포 카드(막대 그래프).
import type { Wuxing } from '../common/pillarFactsTypes';
import { ELEMENT_VISUAL } from '../common/pillarFactsConstants';

export type ElementBalanceSectionProps = {
  elementBalanceParts: Array<{ element: Wuxing; ratio: number }>;
};

export function ElementBalanceSection({ elementBalanceParts }: ElementBalanceSectionProps) {
  return (
    <div className="ElementBalanceSection overflow-hidden rounded-xl border border-border/70 bg-card/80">
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
                <span
                  className={`inline-flex justify-center rounded-md border px-1 py-0.5 text-[11px] font-semibold ${visual.chip}`}
                >
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
          <p className="text-xs text-muted-foreground">
            extract_saju 문서가 없어서 오행 분포를 표시할 수 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
