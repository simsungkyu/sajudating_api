// Renders saju pillars (원국) with 陽=bold and 五行 colors for typical saju UI (PRD §7).
import { Box, Typography } from '@mui/material';

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);
const YANG_BRANCHES = new Set(['子', '寅', '辰', '午', '申', '戌']);
const STEM_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
const BRANCH_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  寅: '木', 卯: '木', 巳: '火', 午: '火', 辰: '土', 戌: '土', 丑: '土', 未: '土', 申: '金', 酉: '金', 亥: '水', 子: '水',
};

const WUXING_COLOR: Record<string, string> = {
  木: '#2e7d32',   // green (목)
  火: '#c62828',   // red (화)
  土: '#8d6e63',   // brown (토)
  金: '#616161',   // gray (금)
  水: '#1565c0',   // blue (수)
};

const PILLAR_LABELS: Record<string, string> = {
  y: '년',
  m: '월',
  d: '일',
  h: '시',
};

function isYang(char: string, isStem: boolean): boolean {
  return isStem ? YANG_STEMS.has(char) : YANG_BRANCHES.has(char);
}

function wuxingColor(char: string, isStem: boolean): string {
  const w = isStem ? STEM_WUXING[char] : BRANCH_WUXING[char];
  return w ? WUXING_COLOR[w] : 'inherit';
}

function renderPillarString(pillar: string): React.ReactNode {
  if (!pillar || pillar.length < 2) return pillar;
  const stem = pillar[0];
  const branch = pillar[1];
  return (
    <>
      <Typography
        component="span"
        sx={{
          fontWeight: isYang(stem, true) ? 700 : 400,
          color: wuxingColor(stem, true),
        }}
      >
        {stem}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontWeight: isYang(branch, false) ? 700 : 400,
          color: wuxingColor(branch, false),
        }}
      >
        {branch}
      </Typography>
    </>
  );
}

export type PillarsDisplayProps = {
  pillars: Record<string, string>;
  labels?: Record<string, string>;
};

export function PillarsDisplay({ pillars, labels = PILLAR_LABELS }: PillarsDisplayProps) {
  const order = ['y', 'm', 'd', 'h'];
  return (
    <Box component="span" sx={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 0.5 }}>
      {order.map((key) => {
        const value = pillars[key];
        if (value == null) return null;
        const label = labels[key] ?? key;
        return (
          <Box key={key} component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.25 }}>
            <Typography component="span" variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography component="span" sx={{ fontFamily: 'serif', fontSize: '1rem' }}>
              {renderPillarString(value)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
