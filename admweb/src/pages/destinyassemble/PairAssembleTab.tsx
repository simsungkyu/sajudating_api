// 궁합어셈블(Chemi Assemble) 개요 탭: A/B·P_tokens·pair 카드 선별 개념 안내.
import { Box, Paper, Typography } from '@mui/material';

export function PairAssembleTab() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>궁합어셈블 개요</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          두 사람의 생년월일시 기반 명식와 상호작용 토큰(P_tokens)을 이용해
          궁합 카드(scope=pair)를 선별·재조합하는 흐름입니다.
        </Typography>
        <Typography variant="subtitle2" sx={{ mt: 2 }}>주요 개념</Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
          <li><strong>A_tokens / B_tokens</strong>: 각 개인 명식에서 나온 토큰</li>
          <li><strong>P_tokens</strong>: 궁합 상호작용 토큰(두 명식 간 관계·조합)</li>
          <li><strong>evidence</strong>: 카드가 선택된 근거 토큰 목록</li>
          <li><strong>rule_set / engine_version</strong>: 계산·선택 룰셋 및 엔진 버전</li>
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          아래 탭에서 <strong>궁합 카드</strong> 목록 관리와 <strong>궁합 추출 테스트</strong>를 할 수 있습니다.
        </Typography>
      </Paper>
    </Box>
  );
}
