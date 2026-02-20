// Parse, validate, and format birth date/time. UI: yyyyMMdd HHmm; API: yyyy-MM-dd, HH:mm.
export type BirthParseResult = {
  date: string;
  time: string;
  time_precision: 'minute' | 'hour' | 'unknown';
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_COMPACT = /^\d{8}$/;
const TIME_24 = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_COMPACT = /^([01]?\d|2[0-3])([0-5]\d)$/;

function toIsoDate(datePart: string): string | null {
  if (ISO_DATE.test(datePart)) return datePart;
  if (DATE_COMPACT.test(datePart))
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
  return null;
}

function toTime24(timePart: string): string | null {
  const t = timePart.trim();
  if (TIME_24.test(t)) return t;
  const m = t.match(TIME_COMPACT);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return null;
}

/**
 * Parse "yyyyMMdd HHmm", "yyyy-MM-dd HH:mm", or date-only into API shape (date: yyyy-MM-dd, time: HH:mm).
 */
export function parseBirthDateTime(input: string): BirthParseResult {
  const s = (input ?? '').trim();
  const space = s.indexOf(' ');
  const datePart = space >= 0 ? s.slice(0, space) : s;
  const timePart = space >= 0 ? s.slice(space + 1).trim().toLowerCase() : '';

  const date = toIsoDate(datePart) || '';
  let time = 'unknown';
  if (timePart && timePart !== 'unknown') {
    const t = toTime24(timePart);
    if (t) time = t;
  }

  let time_precision: BirthParseResult['time_precision'] = 'unknown';
  if (time !== 'unknown') {
    const m = time.match(TIME_24);
    if (m) {
      const mm = m[2];
      time_precision = mm === '00' ? 'hour' : 'minute';
    }
  }

  return { date, time, time_precision };
}

/**
 * Validate: date is yyyyMMdd or YYYY-MM-DD, time (if present) is HHmm or HH:mm.
 */
export function validateBirthDateTime(input: string): boolean {
  const { date, time } = parseBirthDateTime(input);
  if (!date || !ISO_DATE.test(date)) return false;
  if (time === 'unknown' || time === '') return true;
  return TIME_24.test(time);
}

/**
 * Return validation error message or null if valid.
 */
export function validateBirthDateTimeError(input: string): string | null {
  if (!(input ?? '').trim()) return '생일·시간을 입력해 주세요.';
  const { date, time } = parseBirthDateTime(input);
  if (!date) return '생일·시간은 yyyyMMdd HHmm 형식으로 입력해 주세요.';
  if (!ISO_DATE.test(date)) return '생일·시간은 yyyyMMdd HHmm 형식으로 입력해 주세요.';
  if (time !== 'unknown' && time !== '') {
    if (!TIME_24.test(time)) return '생일·시간은 yyyyMMdd HHmm 형식으로 입력해 주세요.';
  }
  return null;
}

/**
 * Format date + time (or unknown) to display string "yyyy-MM-dd HH:mm" or "yyyy-MM-dd unknown".
 */
export function formatBirthDateTime(date: string, time: string): string {
  const d = (date ?? '').trim();
  const t = (time ?? '').trim().toLowerCase();
  if (!d) return '';
  if (t === 'unknown' || t === '') return `${d} unknown`;
  return `${d} ${t}`;
}

/**
 * From parse result, build display string (single field value).
 */
export function formatBirthParseResult(r: BirthParseResult): string {
  return formatBirthDateTime(r.date, r.time);
}

/**
 * Format date (yyyy-MM-dd) + time to compact UI string "yyyyMMdd HHmm" or "yyyyMMdd unknown".
 */
export function formatBirthDateTimeCompact(date: string, time: string): string {
  const d = (date ?? '').trim();
  const t = (time ?? '').trim().toLowerCase();
  if (!d) return '';
  const compactDate = d.replace(/-/g, '');
  if (t === 'unknown' || t === '') return `${compactDate} unknown`;
  const [h, m] = t.split(':');
  const compactTime = `${(h ?? '').padStart(2, '0')}${(m ?? '00').padStart(2, '0')}`;
  return `${compactDate} ${compactTime}`;
}

/**
 * Normalize raw input to "yyyyMMdd HHmm" or "yyyyMMdd unknown" for UI.
 * Accepts yyyyMMdd HHmm, yyyy-MM-dd HH:mm, and variants. Use on blur or paste.
 */
export function normalizeBirthDateTimeInput(raw: string): string {
  const s = (raw ?? '').trim();
  if (!s) return raw;
  const parsed = parseBirthDateTime(s);
  if (!parsed.date) return raw;
  if (parsed.time !== 'unknown' && !TIME_24.test(parsed.time)) return raw;
  return formatBirthDateTimeCompact(parsed.date, parsed.time);
}
