// 명식/파생요소를 표 형태로 표시하는 공통 컴포넌트. 훅(hooks/)·컴포넌트(components/)로 분리.
import type { UserInfoSummary } from '@/api/itemncard_api';
import type { ExtractSajuStep1DocFieldsFragment } from '@/graphql/generated';
import { GANJI_GLYPH_THEME } from './common/pillarFactsConstants';
import { usePillarFactsData } from './hooks/usePillarFactsData';
import { PillarTableSection } from './components/PillarTableSection';
import { ElementBalanceSection } from './components/ElementBalanceSection';
import { KeyIndicatorsSection } from './components/KeyIndicatorsSection';
import { FortuneFlowSection } from './components/FortuneFlowSection';
import { MetaTableSection } from './components/MetaTableSection';
import { DetailTableSection } from './components/DetailTableSection';
import { TokensSummarySection } from './components/TokensSummarySection';

export type PillarAndFactsDisplayProps = {
  /** 기존 user_info 형태(REST 등). */
  userInfo?: UserInfoSummary | null | undefined;
  /** extract_saju 문서 원형(GraphQL). */
  extractDoc?: ExtractSajuStep1DocFieldsFragment | null | undefined;
  /** tokens 목록 최대 표시 개수(초과 시 생략 수 표시). 기본 8. */
  maxTokensShown?: number;
  /** 상세(facts/evals) 최대 표시 개수. 기본 12. */
  maxDetailsShown?: number;
  /** 루트 className */
  className?: string;
};

export function PillarAndFactsDisplay({
  userInfo,
  extractDoc,
  maxTokensShown = 8,
  maxDetailsShown = 12,
  className = '',
}: PillarAndFactsDisplayProps) {
  const data = usePillarFactsData({
    userInfo,
    extractDoc,
    maxTokensShown,
    maxDetailsShown,
  });

  if (!data) return null;

  const {
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
    extractDoc: doc,
    userInfo: info,
    maxDetailsShown: maxDetails,
  } = data;

  return (
    <div
      className={`PillarAndFactsDisplay min-w-0 overflow-x-hidden space-y-3 text-sm text-foreground ${className}`.trim()}
    >
      <div className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-background via-background to-muted/25">
        <div className="border-b border-border/70 bg-gradient-to-r from-muted/60 via-background to-muted/60 px-2 py-2 sm:px-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
                명식 4주 / 팔자
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {pillarsText || '명식 정보 없음'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium">
                {doc ? 'extract_saju' : 'user_info'}
              </span>
              {info?.mode && (
                <span className="max-w-[38vw] truncate rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium sm:max-w-none">
                  {info.mode}
                </span>
              )}
              {info?.period && (
                <span className="max-w-[38vw] truncate rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium sm:max-w-none">
                  {info.period}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-2 py-3 sm:px-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 font-medium">
              표기: 양=
              <span className="font-bold">굵게</span>
              {' / '}
              음=
              <span className="font-normal">보통</span>
            </span>
            {(['목', '화', '토', '금', '수'] as const).map((element) => {
              const theme = GANJI_GLYPH_THEME[element];
              return (
                <span
                  key={element}
                  className="rounded-full border px-2 py-0.5 font-semibold"
                  style={{
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                    color: theme.fg,
                  }}
                >
                  {element}
                </span>
              );
            })}
          </div>

          <PillarTableSection
            pillarDetails={pillarDetails}
            hasAnyBranchDerived={hasAnyBranchDerived}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ElementBalanceSection elementBalanceParts={elementBalanceParts} />
        <KeyIndicatorsSection
          dayMasterStem={dayMasterStem}
          dayMasterElement={dayMasterElement}
          dayMasterYinYang={dayMasterYinYang}
          hourContextText={hourContextText}
          extractDoc={doc}
        />
      </div>

      {doc && (
        <FortuneFlowSection
          fortuneRows={fortuneRows}
          daeun={daeun}
          seun={seun}
          wolun={wolun}
          ilun={ilun}
          daeunList={daeunList}
          seunList={seunList}
          wolunList={wolunList}
          ilunList={ilunList}
        />
      )}

      <MetaTableSection metaRows={metaRows} />
      <DetailTableSection detailRows={detailRows} maxDetailsShown={maxDetails} />
      <TokensSummarySection
        itemsSummary={itemsSummary}
        tokensShown={tokensShown}
        hiddenTokens={hiddenTokens}
      />
    </div>
  );
}
