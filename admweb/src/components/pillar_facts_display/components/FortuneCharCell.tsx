// 운세 테이블의 천간/지지 글자 한 칸(원형 뱃지).
import type { Wuxing, YinYang } from '../common/pillarFactsTypes';
import { GANJI_GLYPH_THEME } from '../common/pillarFactsConstants';

export type FortuneCharCellProps = {
  char: string;
  yinYang: YinYang;
  element: Wuxing;
};

export function FortuneCharCell({ char, yinYang, element }: FortuneCharCellProps) {
  const theme = GANJI_GLYPH_THEME[element] ?? null;
  return (
    <span
      className={`_FortuneCharCell inline-flex h-6 w-6 items-center justify-center rounded-full border text-[15px] leading-none sm:h-7 sm:w-7 sm:text-lg ${yinYang === '양' ? 'font-extrabold' : 'font-semibold'}`}
      style={{
        backgroundColor: theme?.bg ?? '#F3F4F6',
        borderColor: theme?.border ?? '#D1D5DB',
        color: theme?.fg ?? '#111827',
      }}
    >
      {char || '-'}
    </span>
  );
}
