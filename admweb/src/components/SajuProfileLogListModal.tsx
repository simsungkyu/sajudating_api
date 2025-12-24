// Modal component for viewing SajuProfile log history with pagination
import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSajuProfileLogsQuery } from '../graphql/generated';
import DialogWrap from './mui/DialogWrap';

export interface SajuProfileLogListModalProps {
  open: boolean;
  sajuProfileUid: string;
  onClose: () => void;
}

const toMillis = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDate = (ms: unknown) => {
  const millis = toMillis(ms);
  if (millis == null) return '-';
  const date = new Date(millis);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getStatusChip = (status: string) => {
  switch (status) {
    case 'success':
      return <Chip label="성공" color="success" size="small" />;
    case 'error':
      return <Chip label="오류" color="error" size="small" />;
    case 'pending':
      return <Chip label="대기중" color="warning" size="small" />;
    default:
      return <Chip label={status || '-'} size="small" />;
  }
};

const SajuProfileLogListModal: React.FC<SajuProfileLogListModalProps> = ({
  open,
  sajuProfileUid,
  onClose,
}) => {
  const [limit, setLimit] = useState(30);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<string>('all');

  useEffect(() => {
    if (!open) return;
    setOffset(0);
  }, [open, sajuProfileUid]);

  const { data, loading, error } = useSajuProfileLogsQuery({
    variables: {
      input: {
        limit,
        offset,
        sajuUid: sajuProfileUid,
        status: status === 'all' ? null : status,
      },
    },
    skip: !open || !sajuProfileUid,
    fetchPolicy: 'network-only',
  });

  const result = data?.sajuProfileLogs;
  const logs = (result?.nodes ?? []).filter((node): node is NonNullable<typeof node> & { __typename: 'SajuProfileLog' } => {
    return node.__typename === 'SajuProfileLog';
  });

  const canPrev = offset > 0;
  const canNext = logs.length === limit;

  return (
    <DialogWrap
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>사주 프로필 로그 목록</DialogTitle>
      <DialogContent dividers>
        {/* 상단 필터 및 페이지네이션 영역 */}
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {/* 좌측: 필터 컨트롤 */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Status 필터 */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={status}
                label="상태"
                onChange={(e) => {
                  setStatus(e.target.value);
                  setOffset(0);
                }}
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="success">성공</MenuItem>
                <MenuItem value="error">오류</MenuItem>
                <MenuItem value="pending">대기중</MenuItem>
              </Select>
            </FormControl>

            {/* 페이지당 노출 갯수 */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>페이지당</InputLabel>
              <Select
                value={limit}
                label="페이지당"
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
              >
                <MenuItem value={10}>10개</MenuItem>
                <MenuItem value={20}>20개</MenuItem>
                <MenuItem value={30}>30개</MenuItem>
                <MenuItem value={50}>50개</MenuItem>
                <MenuItem value={100}>100개</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* 우측: 페이지 정보 */}
          {!loading && !error && result?.ok && logs.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              offset: {offset}
            </Typography>
          )}
        </Stack>

        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography>로딩 중...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error">{error.message}</Typography>
          </Box>
        ) : result && !result.ok ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error">{result.msg || '로그 목록을 불러오지 못했습니다.'}</Typography>
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">로그 기록이 없습니다.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>생성 시간</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>내용</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.uid} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusChip(log.status)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: 600,
                        }}
                      >
                        {log.text || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            disabled={loading || !canPrev}
          >
            이전
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={loading || !canNext}
          >
            다음
          </Button>
        </Stack>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </DialogWrap>
  );
};

export default SajuProfileLogListModal;
