// Dialog component for viewing AI execution history
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { apiBase } from '../api';
import { useAiExecutionsQuery } from '../graphql/generated';

export interface AIExecutionListModalProps {
  open: boolean;
  token?: string;
  metaUid?: string;
  metaType?: string;
  onClose: () => void;
}

const AIExecutionListModal: React.FC<AIExecutionListModalProps> = ({
  open,
  token,
  metaUid,
  metaType,
  onClose,
}) => {
  const apolloClient = useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri: `${apiBase}/admgql`,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      cache: new InMemoryCache(),
    });
  }, [token]);

  return (
    <ApolloProvider client={apolloClient}>
      <AIExecutionListModalInner open={open} token={token} metaUid={metaUid} metaType={metaType} onClose={onClose} />
    </ApolloProvider>
  );
};

const AIExecutionListModalInner: React.FC<AIExecutionListModalProps> = ({
  open,
  token,
  metaUid,
  metaType,
  onClose,
}) => {
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!open) return;
    setOffset(0);
  }, [open, metaUid, metaType]);

  const { data, loading, error } = useAiExecutionsQuery({
    variables: {
      input: {
        limit,
        offset,
        metaUid: metaUid ?? null,
        metaType: metaType ?? null,
      },
    },
    skip: !open || !token,
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>AI 실행 목록</DialogTitle>
      <DialogContent dividers>
        {!token ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">토큰이 없어 실행 목록을 불러올 수 없습니다.</Typography>
          </Box>
        ) : loading ? (
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
                  <TableCell sx={{ fontWeight: 700 }}>메타 타입</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>입력(프롬프트)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>결과</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.uid} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(execution.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusChip(execution.status)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{execution.metaType}</TableCell>
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
            <TablePagination
              component="div"
              count={result?.total ?? 0}
              page={Math.floor(offset / limit)}
              rowsPerPage={limit}
              onPageChange={(_, page) => setOffset(page * limit)}
              onRowsPerPageChange={(e) => {
                const nextLimit = Number.parseInt(e.target.value, 10);
                setLimit(Number.isFinite(nextLimit) ? nextLimit : 20);
                setOffset(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIExecutionListModal;
