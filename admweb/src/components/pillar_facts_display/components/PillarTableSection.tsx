// 명식 4주 표(천간·지지·십성·지장간·파생요소 행).
import type { PillarDetailRow } from '../common/pillarFactsTypes';
import { GANJI_GLYPH_THEME } from '../common/pillarFactsConstants';
import { GanjiGlyph } from './GanjiGlyph';

export type PillarTableSectionProps = {
  pillarDetails: PillarDetailRow[];
  hasAnyBranchDerived: boolean;
};

export function PillarTableSection({ pillarDetails, hasAnyBranchDerived }: PillarTableSectionProps) {
  return (
    <div className="PillarTableSection overflow-hidden rounded-lg border border-border/70 bg-card/90">
      <div>
        <table className="w-full table-fixed border-collapse text-[9px] sm:text-[10px]">
          <thead>
            <tr className="bg-muted/35">
              <th className="w-8 border-b border-border/60 px-0.5 py-1 text-center text-[9px] leading-tight font-semibold whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:py-1.5 sm:text-[10px]">
                항목
              </th>
              {pillarDetails.map((detail) => (
                <th
                  key={`${detail.key}:head`}
                  className={`border-b border-border/60 px-0.5 py-1 text-center text-[9px] font-semibold align-top sm:px-1 sm:py-1.5 sm:text-[10px] ${detail.isDayPillar ? 'bg-amber-50/80 dark:bg-amber-950/30' : ''}`}
                >
                  <span className="inline-flex flex-col items-center gap-1">
                    {detail.isDayPillar ? (
                      <span className="rounded-full border border-amber-300/80 bg-amber-100/80 px-1 py-0.5 text-[9px] font-semibold text-amber-800 sm:px-1.5 sm:text-[10px] dark:border-amber-700/70 dark:bg-amber-950/70 dark:text-amber-200">
                        일주
                      </span>
                    ) : (
                      <span>{detail.label}주</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                scope="row"
                className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:py-1.5 sm:text-[10px]"
              >
                천간
              </th>
              {pillarDetails.map((detail) => (
                <td
                  key={`${detail.key}:stem`}
                  className={`border-b border-border/60 px-0.5 py-1 text-center sm:px-1 sm:py-1.5 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                >
                  <GanjiGlyph char={detail.stem} isStem />
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:py-1.5 sm:text-[10px]"
              >
                지지
              </th>
              {pillarDetails.map((detail) => (
                <td
                  key={`${detail.key}:branch`}
                  className={`border-b border-border/60 px-0.5 py-1 text-center sm:px-1 sm:py-1.5 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                >
                  <GanjiGlyph char={detail.branch} isStem={false} />
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]"
              >
                <span className="inline-flex flex-col items-center leading-tight">
                  <span className="whitespace-nowrap">천간</span>
                  <span className="whitespace-nowrap">십성</span>
                </span>
              </th>
              {pillarDetails.map((detail) => (
                <td
                  key={`${detail.key}:stem-tengod`}
                  className={`border-b border-border/60 px-0.5 py-1 text-center whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                >
                  {detail.stemTenGod}
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]"
              >
                <span className="inline-flex flex-col items-center leading-tight">
                  <span className="whitespace-nowrap">지지</span>
                  <span className="whitespace-nowrap">십성</span>
                </span>
              </th>
              {pillarDetails.map((detail) => (
                <td
                  key={`${detail.key}:branch-tengod`}
                  className={`border-b border-border/60 px-0.5 py-1 text-center whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                >
                  {detail.branchTenGod}
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]"
              >
                <span className="inline-flex flex-col items-center leading-tight">
                  <span className="whitespace-nowrap">십이</span>
                  <span className="whitespace-nowrap">운성</span>
                </span>
              </th>
              {pillarDetails.map((detail) => (
                <td
                  key={`${detail.key}:twelve`}
                  className={`border-b border-border/60 px-0.5 py-1 text-center whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                >
                  {detail.twelveFate}
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="w-8 border-b border-border/60 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]"
              >
                <span className="inline-flex flex-col items-center leading-tight">
                  <span className="whitespace-nowrap">지장</span>
                  <span className="whitespace-nowrap">간</span>
                </span>
              </th>
              {pillarDetails.map((detail) => (
                <td
                  key={`${detail.key}:hidden`}
                  className={`border-b border-border/60 px-0 py-1 text-center leading-4 whitespace-normal break-all ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                >
                  {detail.hiddenStemChips.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {detail.hiddenStemChips.map((chip) => {
                        const theme = GANJI_GLYPH_THEME[chip.element];
                        return (
                          <div
                            key={`${detail.key}:hidden:${chip.stemIndex}`}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-0"
                          >
                            <span
                              className="inline-flex min-w-0 items-center justify-center gap-0 rounded-full border px-0 py-0.5"
                              style={{
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                                color: theme.fg,
                              }}
                            >
                              <span className={chip.yinYang === '양' ? 'font-bold' : 'font-normal'}>
                                {chip.hangulChar}
                              </span>
                              {chip.tenGod && (
                                <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[8px] opacity-90 sm:text-[9px]">
                                  ({chip.tenGod})
                                </span>
                              )}
                            </span>
                            <span className="pl-0 text-right text-[8px] font-semibold tabular-nums text-muted-foreground sm:text-[9px]">
                              {chip.ratio}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              ))}
            </tr>
            {hasAnyBranchDerived && (
              <tr>
                <th
                  scope="row"
                  className="w-8 bg-muted/30 px-0.5 py-1 text-center text-[9px] leading-tight font-medium whitespace-normal break-all text-muted-foreground sm:w-14 sm:px-1.5 sm:text-[10px]"
                >
                  파생요소
                </th>
                {pillarDetails.map((detail) => (
                  <td
                    key={`${detail.key}:derived`}
                    className={`px-0.5 py-1 text-center leading-4 whitespace-normal break-words sm:px-1 ${detail.isDayPillar ? 'bg-amber-50/35 dark:bg-amber-950/15' : ''}`}
                  >
                    {detail.branchDerivedValue || '-'}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
