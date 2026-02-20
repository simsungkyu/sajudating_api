// 1단계: A/B 생년월일 입력 → 궁합 추출 (extract_pair). shadcn/ui + GraphQL hooks.
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PillarAndFactsDisplay } from '@/components/pillar_facts_display/PillarAndFactsDisplay';
import type { UserInfoSummary } from '@/api/itemncard_api';
import {
  useExtractPairStep1LazyQuery,
  type ExtractPairStep1Query,
  type ExtractSajuStep1DocFieldsFragment,
  type ExtractTimePrecision,
} from '@/graphql/generated';
import { parseBirthDateTime, validateBirthDateTimeError, normalizeBirthDateTimeInput } from '@/utils/birthDateTime';
import { formatPillarsText } from '@/utils/pillarDisplay';

const FIELD_LABEL_CLASS = 'text-xs font-medium text-muted-foreground';
const DEFAULT_BIRTH_A = '19900515 1000';
const DEFAULT_BIRTH_B = '19920820 1400';
const DEFAULT_TIMEZONE = 'Asia/Seoul';
const STEM_CHARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCH_CHARS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

type Step1PairResult = {
  summary_a: UserInfoSummary;
  summary_b: UserInfoSummary;
  p_tokens_summary: string[];
  extract_a: ExtractSajuStep1DocFieldsFragment;
  extract_b: ExtractSajuStep1DocFieldsFragment;
};

type ExtractPairDocNode = Extract<
  NonNullable<ExtractPairStep1Query['extract_pair']['node']>,
  { __typename: 'ExtractPairDoc' }
>;

function toExtractTimePrecision(v: 'minute' | 'hour' | 'unknown'): ExtractTimePrecision {
  if (v === 'minute') return 'MINUTE';
  if (v === 'hour') return 'HOUR';
  return 'UNKNOWN';
}

function toPillarString(stem: number, branch: number): string {
  const stemChar = STEM_CHARS[stem];
  const branchChar = BRANCH_CHARS[branch];
  if (!stemChar || !branchChar) return '';
  return `${stemChar}${branchChar}`;
}

function formatFactValue(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

function toSummary(doc: ExtractSajuStep1DocFieldsFragment): UserInfoSummary {
  const pillars: Record<string, string> = {};
  for (const p of doc.pillars) {
    const asText = toPillarString(p.stem, p.branch);
    if (!asText) continue;
    if (p.k === 'Y') pillars.y = asText;
    if (p.k === 'M') pillars.m = asText;
    if (p.k === 'D') pillars.d = asText;
    if (p.k === 'H') pillars.h = asText;
  }

  const factSummary = doc.facts
    .slice(0, 4)
    .map((fact) => {
      const value = formatFactValue(fact.v);
      return value ? `${fact.n}: ${value}` : fact.n;
    });

  const evalSummary = doc.evals
    .slice(0, 2)
    .map((e) => `${e.n}: ${e.score.norm0_100}점`);

  return {
    pillars,
    items_summary: [...factSummary, ...evalSummary].join(' · '),
    tokens_summary: [],
    rule_set: doc.schemaVer ?? 'extract_saju.v1',
    engine_version: `${doc.input.engine.name}@${doc.input.engine.ver}`,
    mode: '인생',
  };
}

function toPairTokens(node: ExtractPairDocNode): string[] {
  const tokens = new Set<string>();
  for (const edge of node.edges ?? []) {
    tokens.add(`관계:${edge.t}`);
  }
  for (const evalItem of node.evals) {
    tokens.add(`평가:${evalItem.k}`);
  }
  for (const fact of node.facts ?? []) {
    tokens.add(`팩트:${fact.k}`);
  }
  return Array.from(tokens);
}

function toPairResult(node: ExtractPairDocNode): Step1PairResult {
  const chartA = node.charts?.a;
  const chartB = node.charts?.b;
  if (!chartA || !chartB) {
    throw new Error('extract_pair 응답에 A/B 차트가 없습니다.');
  }
  return {
    summary_a: toSummary(chartA),
    summary_b: toSummary(chartB),
    p_tokens_summary: toPairTokens(node),
    extract_a: chartA,
    extract_b: chartB,
  };
}

const FALLBACK_TIMEZONES = [
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
];

function getTimezoneOptions(): string[] {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      return (Intl as unknown as { supportedValuesOf(key: 'timeZone'): string[] }).supportedValuesOf('timeZone');
    } catch {
      return FALLBACK_TIMEZONES;
    }
  }
  return FALLBACK_TIMEZONES;
}

const TIMEZONE_OPTIONS = getTimezoneOptions();

export function Step1CalculatePairTab() {
  const [runExtractPair, { loading: running }] = useExtractPairStep1LazyQuery({
    fetchPolicy: 'no-cache',
  });
  const [birthDateTimeA, setBirthDateTimeA] = useState(DEFAULT_BIRTH_A);
  const [birthDateTimeB, setBirthDateTimeB] = useState(DEFAULT_BIRTH_B);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [validationErrA, setValidationErrA] = useState<string | null>(null);
  const [validationErrB, setValidationErrB] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Step1PairResult | null>(null);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) return TIMEZONE_OPTIONS.slice(0, 100);
    const q = timezoneSearch.toLowerCase();
    return TIMEZONE_OPTIONS.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 100);
  }, [timezoneSearch]);

  const handleBlurA = () => {
    const normalized = normalizeBirthDateTimeInput(birthDateTimeA);
    if (normalized !== birthDateTimeA) setBirthDateTimeA(normalized);
    setValidationErrA(validateBirthDateTimeError(birthDateTimeA));
  };

  const handleBlurB = () => {
    const normalized = normalizeBirthDateTimeInput(birthDateTimeB);
    if (normalized !== birthDateTimeB) setBirthDateTimeB(normalized);
    setValidationErrB(validateBirthDateTimeError(birthDateTimeB));
  };

  const handleExtract = async () => {
    const errA = validateBirthDateTimeError(birthDateTimeA);
    const errB = validateBirthDateTimeError(birthDateTimeB);
    if (errA) {
      setValidationErrA(errA);
      setValidationErrB(null);
      return;
    }
    if (errB) {
      setValidationErrA(null);
      setValidationErrB(errB);
      return;
    }
    setValidationErrA(null);
    setValidationErrB(null);
    setError(null);
    setResult(null);
    try {
      const parsedA = parseBirthDateTime(birthDateTimeA);
      const parsedB = parseBirthDateTime(birthDateTimeB);
      const dtLocalA = parsedA.time === 'unknown' ? parsedA.date : `${parsedA.date} ${parsedA.time}`;
      const dtLocalB = parsedB.time === 'unknown' ? parsedB.date : `${parsedB.date} ${parsedB.time}`;
      const { data } = await runExtractPair({
        variables: {
          input: {
            a: {
              dtLocal: dtLocalA,
              tz: timezone || DEFAULT_TIMEZONE,
              calendar: 'SOLAR',
              timePrec: toExtractTimePrecision(parsedA.time_precision),
              engine: { name: 'sxtwl', ver: '1' },
            },
            b: {
              dtLocal: dtLocalB,
              tz: timezone || DEFAULT_TIMEZONE,
              calendar: 'SOLAR',
              timePrec: toExtractTimePrecision(parsedB.time_precision),
              engine: { name: 'sxtwl', ver: '1' },
            },
            engine: { name: 'sxtwl', ver: '1' },
          },
        },
      });
      const extractResult = data?.extract_pair;
      if (!extractResult?.ok) {
        throw new Error(extractResult?.msg ?? 'extract_pair 실행에 실패했습니다.');
      }
      if (!extractResult.node || extractResult.node.__typename !== 'ExtractPairDoc') {
        throw new Error('extract_pair 응답 node 타입이 예상과 다릅니다.');
      }
      setResult(toPairResult(extractResult.node));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const pillarsTextA = result?.summary_a?.pillars ? formatPillarsText(result.summary_a.pillars) : '';
  const pillarsTextB = result?.summary_b?.pillars ? formatPillarsText(result.summary_b.pillars) : '';
  const hasValidationErr = !!validationErrA || !!validationErrB;

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div className="min-w-0 space-y-1">
            <label className={`block ${FIELD_LABEL_CLASS}`}>A 생년월일 생시</label>
            <Input
              type="text"
              value={birthDateTimeA}
              onChange={(e) => setBirthDateTimeA(e.target.value)}
              onBlur={handleBlurA}
              placeholder="yyyyMMdd HHmm"
              className="h-8 text-sm"
            />
            {validationErrA && (
              <p className="text-xs text-destructive">{validationErrA}</p>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <label className={`block ${FIELD_LABEL_CLASS}`}>B 생년월일 생시</label>
            <Input
              type="text"
              value={birthDateTimeB}
              onChange={(e) => setBirthDateTimeB(e.target.value)}
              onBlur={handleBlurB}
              placeholder="yyyyMMdd HHmm"
              className="h-8 text-sm"
            />
            {validationErrB && (
              <p className="text-xs text-destructive">{validationErrB}</p>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <label className={`block ${FIELD_LABEL_CLASS}`}>타임존</label>
            <Popover
              open={timezoneOpen}
              onOpenChange={(open) => {
                setTimezoneOpen(open);
                if (!open) setTimezoneSearch('');
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={timezoneOpen}
                  className="h-8 w-full justify-between font-normal text-sm sm:w-44"
                >
                  <span className="truncate">{timezone || '선택…'}</span>
                  <span className="ml-1 shrink-0 opacity-50">▼</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="타임존 검색…"
                    value={timezoneSearch}
                    onValueChange={setTimezoneSearch}
                  />
                  <CommandList>
                    <CommandEmpty>검색 결과 없음.</CommandEmpty>
                    <CommandGroup>
                      {filteredTimezones.map((tz) => (
                        <CommandItem
                          key={tz}
                          value={tz}
                          onSelect={() => {
                            setTimezone(tz);
                            setTimezoneOpen(false);
                          }}
                        >
                          {tz}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="pt-1">
          <Button
            size="sm"
            variant="default"
            className="w-full"
            onClick={handleExtract}
            disabled={running || hasValidationErr}
          >
            {running ? '처리 중…' : '궁합 추출'}
          </Button>
        </div>
      </div>

      <div className="min-h-[52px] rounded-md border border-dashed bg-background px-3 py-2 text-sm">
        {error && <p className="text-destructive">{error}</p>}
        {result && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">A</p>
              <PillarAndFactsDisplay userInfo={result.summary_a} extractDoc={result.extract_a} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">B</p>
              <PillarAndFactsDisplay userInfo={result.summary_b} extractDoc={result.extract_b} />
            </div>
            {result.p_tokens_summary && result.p_tokens_summary.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">P_tokens (궁합 상호작용)</p>
                <p className="text-muted-foreground">
                  {result.p_tokens_summary.slice(0, 10).join(', ')}
                  {result.p_tokens_summary.length > 10 ? ` 외 ${result.p_tokens_summary.length - 10}개` : ''}
                </p>
              </div>
            )}
          </div>
        )}
        {!result && !error && (
          <p className="text-muted-foreground">A/B 생년월일 입력 후 궁합 추출을 실행하면 결과가 표시됩니다.</p>
        )}
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        {result
          ? (
              <>
                <span className="font-medium text-foreground">다음 단계로 전달: </span>
                A/B 명식(pillars)·파생요소(items) 및 P_tokens가 2단계 입력으로 적용됩니다.
                {pillarsTextA && pillarsTextB && ` A: ${pillarsTextA} / B: ${pillarsTextB}`}
              </>
            )
          : '이 단계 결과(summary_a, summary_b, p_tokens_summary)가 다음 단계 입력으로 적용됩니다.'}
      </div>
    </div>
  );
}
