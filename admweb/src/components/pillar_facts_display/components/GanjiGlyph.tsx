// 천간/지지 한 글자 글리프(한글·한자·음양·오행 표시).
import { getGanjiMeta, resolveWuxing, resolveYinYang } from '../common/pillarFactsUtils';
import { GANJI_GLYPH_THEME, HANJA_FONT_FAMILY } from '../common/pillarFactsConstants';

export type GanjiGlyphProps = {
  char: string;
  isStem: boolean;
};

export function GanjiGlyph({ char, isStem }: GanjiGlyphProps) {
  const meta = getGanjiMeta(char, isStem);
  const displayChar = meta?.hangul || char || '-';
  const hanjaChar = meta?.hanja || char || '-';
  const element = meta?.element ?? resolveWuxing(char, isStem) ?? '-';
  const yinYang = meta?.yinYang ?? resolveYinYang(char, isStem) ?? '-';
  const theme = meta ? GANJI_GLYPH_THEME[meta.element] : null;

  return (
    <div
      className="_GanjiGlyph inline-flex w-full flex-col items-center justify-center rounded-md border px-1 py-0.5 text-center sm:px-1.5 sm:py-1"
      style={{
        backgroundColor: theme?.bg ?? '#F3F4F6',
        borderColor: theme?.border ?? '#D1D5DB',
        color: theme?.fg ?? '#111827',
      }}
    >
      <p
        className={`${yinYang === '양' ? 'font-bold' : 'font-normal'} text-xl leading-none sm:text-2xl`}
        style={{ fontFamily: HANJA_FONT_FAMILY }}
      >
        {displayChar}
      </p>
      <p
        className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[9px] leading-3.5 sm:mt-1 sm:text-[10px] sm:leading-4"
        style={{ color: theme?.metaValue ?? '#111827' }}
      >
        {`${hanjaChar}, ${yinYang}, ${element}`}
      </p>
    </div>
  );
}
