// 파생요소 요약( items_summary, tokens 칩).
import { Fragment } from 'react';
import { truncateText } from '../common/pillarFactsUtils';

export type TokensSummarySectionProps = {
  itemsSummary: string;
  tokensShown: string[];
  hiddenTokens: number;
};

export function TokensSummarySection({
  itemsSummary,
  tokensShown,
  hiddenTokens,
}: TokensSummarySectionProps) {
  return (
    <div className="TokensSummarySection overflow-hidden rounded-xl border border-border/70 bg-card/80">
      <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
        <p className="text-xs font-semibold text-foreground">파생요소 요약</p>
      </div>
      <div className="space-y-2 px-2 py-3 sm:px-3">
        {itemsSummary ? (
          <p className="whitespace-normal break-words text-sm">{truncateText(itemsSummary, 260)}</p>
        ) : (
          <p className="text-xs text-muted-foreground">items_summary 데이터가 없습니다.</p>
        )}
        {tokensShown.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tokensShown.map((token, index) => (
              <Fragment key={`${token}:${index}`}>
                <span className="max-w-full whitespace-normal break-all rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                  {token}
                </span>
              </Fragment>
            ))}
            {hiddenTokens > 0 && (
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                +{hiddenTokens}
              </span>
            )}
          </div>
        )}
        {tokensShown.length === 0 && hiddenTokens === 0 && (
          <p className="text-xs text-muted-foreground">tokens 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
