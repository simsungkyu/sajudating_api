// 사주어셈블(SajuAssemble) 페이지: /destiny_assemble/saju_assemble, 5단계 프로세스.
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Step1CalculateTab } from './destinyassemble_sajuassemble/step1_calculate_tab';

const STEPS = [
  {
    step: 1,
    title: '명식(Pillar) 산출',
    description: '생년월일시로 년·월·일·시 4주 간지 확정.',
    extractLabel: '명식 산출',
  },
  {
    step: 2,
    title: '파생요소(items) 계산',
    description: '십성, 관계, 오행, 신살, 격국, 용신, 강약 등 도출.',
    extractLabel: '파생요소 계산',
  },
  {
    step: 3,
    title: '토큰(tokens) 컴파일',
    description: 'items를 트리거 조회용 문자열로 컴파일.',
    extractLabel: '토큰 컴파일',
  },
  {
    step: 4,
    title: '트리거 매칭·카드 선별',
    description: 'rule_set·engine_version으로 사주 카드 선별·재조합.',
    extractLabel: '카드 선별',
  },
  {
    step: 5,
    title: '카드 활용',
    description: '사주 카드 목록 관리·추출 테스트.',
    extractLabel: '적용',
  },
] as const;

/** 단계 본문: 모바일은 제목 줄에만 단계 표시(세로선 영역 없음), sm 이상은 좌측 단계·세로선 열 유지. */
function StepBlock({
  stepNum,
  title,
  description,
  extractLabel,
  isLast,
  stepContent,
}: {
  stepNum: number;
  title: string;
  description: string;
  extractLabel: string;
  isLast: boolean;
  stepContent?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col sm:pb-4 sm:flex-row sm:gap-3 [&:not(:last-child)]:mb-7"
      aria-label={`${stepNum}단계`}
    >
      <div className="hidden shrink-0 flex-col items-center pt-0.5 sm:flex">
        <Badge
          variant="secondary"
          className="h-6 w-6 rounded-full p-0 text-xs font-semibold"
          aria-hidden
        >
          {stepNum}
        </Badge>
        {!isLast && <div className="mt-1 h-4 w-px shrink-0 bg-border" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <span className="flex items-center gap-1.5 sm:contents">
            <Badge
              variant="secondary"
              className="h-6 w-6 shrink-0 rounded-full p-0 text-xs font-semibold sm:hidden"
              aria-hidden
            >
              {stepNum}
            </Badge>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:hidden">
              {stepNum}단계
            </span>
          </span>
          <span className="font-medium text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <div className="space-y-2">
          {stepContent ?? (
            <>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                입력 필드 배치
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary">{extractLabel}</Button>
              </div>
              <div className="min-h-[52px] rounded-md border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
                추출 후 결과 표시
              </div>
              {!isLast && (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                  다음 단계로 전달 내용
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DestinyAssemble_SajuAssemblePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">명리어셈블 - 사주어셈블</h1>

      <div className="mx-auto max-w-2xl pb-6">
        <p className="mb-4 text-sm text-muted-foreground">
          사주어셈블(SajuAssemble): 설정 → 추출 → 결과 → 다음 단계 전달 순으로 진행합니다.
        </p>

        <div className="flex flex-col">
          {STEPS.map((s) => (
            <StepBlock
              key={s.step}
              stepNum={s.step}
              title={s.title}
              description={s.description}
              extractLabel={s.extractLabel}
              isLast={s.step === 5}
              stepContent={s.step === 1 ? <Step1CalculateTab /> : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
