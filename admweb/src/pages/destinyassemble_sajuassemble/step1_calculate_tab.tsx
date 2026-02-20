// 1단계: 명식 입력 → 사주 추출 및 파생요소 계산. shadcn/ui + GraphQL extract_saju.
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
import {
  useExtractSajuStep1LazyQuery,
  type ExtractSajuStep1DocFieldsFragment,
  type ExtractTimePrecision,
} from '@/graphql/generated';
import { parseBirthDateTime, validateBirthDateTimeError, normalizeBirthDateTimeInput } from '@/utils/birthDateTime';
import { formatPillarsTextFromExtractDoc } from '@/utils/pillarDisplay';

const FIELD_LABEL_CLASS = 'text-xs font-medium text-muted-foreground';
const DEFAULT_BIRTH = '19900515 1000';
const DEFAULT_TIMEZONE = 'Asia/Seoul';

function toExtractTimePrecision(v: 'minute' | 'hour' | 'unknown'): ExtractTimePrecision {
  if (v === 'minute') return 'MINUTE';
  if (v === 'hour') return 'HOUR';
  return 'UNKNOWN';
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

export function Step1CalculateTab() {
  const [runExtractSaju, { loading: running }] = useExtractSajuStep1LazyQuery({
    fetchPolicy: 'no-cache',
  });
  const [birthDateTime, setBirthDateTime] = useState(DEFAULT_BIRTH);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [validationErr, setValidationErr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractSajuStep1DocFieldsFragment | null>(null);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) return TIMEZONE_OPTIONS.slice(0, 100);
    const q = timezoneSearch.toLowerCase();
    return TIMEZONE_OPTIONS.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 100);
  }, [timezoneSearch]);

  const handleBlur = () => {
    const normalized = normalizeBirthDateTimeInput(birthDateTime);
    if (normalized !== birthDateTime) setBirthDateTime(normalized);
    setValidationErr(validateBirthDateTimeError(birthDateTime));
  };

  const handleExtract = async () => {
    const err = validateBirthDateTimeError(birthDateTime);
    if (err) {
      setValidationErr(err);
      return;
    }
    setValidationErr(null);
    setError(null);
    setResult(null);
    try {
      const parsed = parseBirthDateTime(birthDateTime);
      const dtLocal = parsed.time === 'unknown' ? parsed.date : `${parsed.date} ${parsed.time}`;
      const { data } = await runExtractSaju({
        variables: {
          input: {
            dtLocal,
            tz: timezone || DEFAULT_TIMEZONE,
            calendar: 'SOLAR',
            timePrec: toExtractTimePrecision(parsed.time_precision),
            engine: { name: 'sxtwl', ver: '1' },
          },
        },
      });
      const extractResult = data?.extract_saju;
      if (!extractResult?.ok) {
        throw new Error(extractResult?.msg ?? 'extract_saju 실행에 실패했습니다.');
      }
      if (!extractResult.node || extractResult.node.__typename !== 'ExtractSajuDoc') {
        throw new Error('extract_saju 응답 node 타입이 예상과 다릅니다.');
      }
      setResult(extractResult.node);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const pillarsText = formatPillarsTextFromExtractDoc(result);

  return (
    <div className="min-w-0 space-y-2">
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-1">
            <label className={`block ${FIELD_LABEL_CLASS}`}>생년월일 생시</label>
            <Input
              type="text"
              value={birthDateTime}
              onChange={(e) => setBirthDateTime(e.target.value)}
              onBlur={handleBlur}
              placeholder="yyyyMMdd HHmm"
              className="h-8 text-sm"
            />
            {validationErr && (
              <p className="text-xs text-destructive">{validationErr}</p>
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
            disabled={running || !!validationErr}
          >
            {running ? '처리 중…' : '추출'}
          </Button>
        </div>
      </div>

      <div className={result
        ? 'min-w-0 overflow-x-hidden'
        : 'min-w-0 overflow-x-hidden min-h-[52px] rounded-md border border-dashed bg-background px-3 py-2 text-sm'}
      >
        {error && <p className="text-destructive">{error}</p>}
        {result && <PillarAndFactsDisplay extractDoc={result} />}
        {!result && !error && (
          <p className="text-muted-foreground">추출 실행 후 결과가 표시됩니다.</p>
        )}
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        {result
          ? (
              <>
                <span className="font-medium text-foreground">다음 단계로 전달: </span>
                명식(pillars) 및 파생요소(items)가 2단계 입력으로 적용됩니다.
                {pillarsText && ` 명식: ${pillarsText}`}
              </>
            )
          : '이 단계 결과가 다음 단계 입력으로 적용됩니다.'}
      </div>
    </div>
  );
}
