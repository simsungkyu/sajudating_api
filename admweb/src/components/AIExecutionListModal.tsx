// Dialog component for viewing AI execution history
import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useAiExecutionsQuery } from '../graphql/generated';
import AIExecutionViewModal from './AIExecutionViewModal';
import DialogWrap from './mui/DialogWrap';

export interface AIExecutionListModalProps {
  open: boolean;
  metaUid?: string;
  metaType?: string;
  runSajuProfileUid?: string;
  onClose: () => void;
}

const AIExecutionListModal: React.FC<AIExecutionListModalProps> = ({
  open,
  metaUid,
  metaType,
  runSajuProfileUid,
  onClose,
}) => {
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [runBy, setRunBy] = useState<'all' | 'system' | 'admin'>('all');
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOffset(0);
  }, [open, metaUid, metaType]);

  useEffect(() => {
    if (!open) {
      setViewOpen(false);
      setSelectedUid(null);
    }
  }, [open]);

  const { data, loading, error } = useAiExecutionsQuery({
    variables: {
      input: {
        limit,
        offset,
        metaUid: metaUid ?? null,
        metaType: metaType ?? null,
        runBy: runBy === 'all' ? null : runBy,
        runSajuProfileUid: runSajuProfileUid ?? null,
      },
    },
    skip: !open,
    fetchPolicy: 'network-only',
  });

  const result = data?.aiExecutions;
  const executions = (result?.nodes ?? []).filter((node): node is NonNullable<typeof node> & { __typename: 'AiExecution' } => {
    return node.__typename === 'AiExecution';
  });

  const toMillis = (value: unknown): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'done':
        return <Chip label="완료" color="success" size="small" />;
      case 'running':
        return <Chip label="처리중" color="info" size="small" />;
      case 'failed':
        return <Chip label="실패" color="error" size="small" />;
      default:
        return <Chip label={status || '-'} size="small" />;
    }
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

  const renderOutput = (execution: { outputText?: string | null; outputImage?: string | null }) => {
    if (execution.outputText) return execution.outputText;
    if (execution.outputImage) return '[이미지 생성됨]';
    return '-';
  };

  return (
    <>
      <DialogWrap
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>AI 실행 목록</DialogTitle>
        <DialogContent dividers>
        {/* 상단 필터 및 페이지네이션 영역 */}
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {/* 좌측: 필터 컨트롤 */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* RunBy 필터 */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                실행자:
              </Typography>
              <ToggleButtonGroup
                value={runBy}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setRunBy(newValue);
                    setOffset(0);
                  }
                }}
                size="small"
              >
                <ToggleButton value="all">전체</ToggleButton>
                <ToggleButton value="system">System</ToggleButton>
                <ToggleButton value="admin">Admin</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

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
                <MenuItem value={50}>50개</MenuItem>
                <MenuItem value={100}>100개</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* 우측: 페이지네이션 */}
          {!loading && !error && result?.ok && executions.length > 0 && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                총 {result?.total ?? 0}개
              </Typography>
              <Pagination
                count={Math.ceil((result?.total ?? 0) / limit)}
                page={Math.floor(offset / limit) + 1}
                onChange={(_, page) => setOffset((page - 1) * limit)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Stack>
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
            <Typography color="error">{result.msg || '실행 목록을 불러오지 못했습니다.'}</Typography>
          </Box>
        ) : executions.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">실행 기록이 없습니다.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>실행 시간</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>실행자</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>메타 타입</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tokens (I/O/T)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>입력(프롬프트)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>결과</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow
                    key={execution.uid}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedUid(execution.uid);
                      setViewOpen(true);
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(execution.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusChip(execution.status)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        label={execution.runBy || '-'}
                        size="small"
                        color={execution.runBy === 'admin' ? 'secondary' : execution.runBy === 'system' ? 'default' : undefined}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{execution.metaType}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {execution.inputTokens || 0}/{execution.outputTokens || 0}/{execution.totalTokens || 0}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {execution.prompt || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={execution.status === 'failed' ? 'error' : undefined}
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {renderOutput(execution)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* 페이지네이션 (하단) */}
        {!loading && !error && result?.ok && executions.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil((result?.total ?? 0) / limit)}
              page={Math.floor(offset / limit) + 1}
              onChange={(_, page) => setOffset((page - 1) * limit)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </DialogWrap>
      <AIExecutionViewModal
        open={viewOpen}
        executionUid={selectedUid}
        onClose={() => setViewOpen(false)}
      />
    </>
  );
};

export default AIExecutionListModal;
