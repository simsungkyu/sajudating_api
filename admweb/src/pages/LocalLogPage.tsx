// Page component for displaying local logs with pagination and filtering
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
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
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { authAtom } from '../state/auth';
import { useLocalLogsQuery } from '../graphql/generated';

const toMillis = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const asInt = Number.parseInt(trimmed, 10);
      return Number.isFinite(asInt) ? asInt : null;
    }
    const parsedDate = new Date(trimmed);
    const ms = parsedDate.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
};

const formatDate = (value?: unknown) => {
  if (value == null) return '-';
  const ms = toMillis(value);
  if (ms == null) return String(value);
  return new Date(ms).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

type LocalLogRow = {
  uid: string;
  createdAt: string | undefined;
  expiresAt: string | undefined;
  status: string;
  text: string;
};

const LocalLogsPaginationControls = ({
  page,
  pageCount,
  retrievedCount,
  loading,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  retrievedCount: number;
  loading: boolean;
  onPageChange: (nextPage: number) => void;
}) => {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
      spacing={1.5}
    >
      <Chip label={`조회 ${retrievedCount}개`} size="small" variant="outlined" />
      <Stack direction="row" justifyContent="flex-end">
        <Pagination
          color="primary"
          shape="rounded"
          page={page + 1}
          count={pageCount}
          onChange={(_, selectedPage) => {
            onPageChange(Math.max(0, selectedPage - 1));
          }}
          disabled={loading}
        />
      </Stack>
    </Stack>
  );
};

const LocalLogPage: React.FC = () => {
  const auth = useAtomValue(authAtom);
  const token = auth?.token;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState<number>(0);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const { data, loading, error, refetch } = useLocalLogsQuery({
    variables: {
      input: {
        limit: pageSize,
        offset: page * pageSize,
        status: statusFilter === 'all' ? null : statusFilter,
      },
    },
    skip: !token,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!token) return;
    if (loading) return;
    if (!data?.localLogs?.ok) return;
    setLastUpdated(new Date());
  }, [token, loading, data?.localLogs?.ok]);

  const logs: LocalLogRow[] = useMemo(() => {
    const nodes = data?.localLogs?.nodes ?? [];
    return nodes
      .filter((node): node is NonNullable<typeof node> & { __typename: 'LocalLog' } => {
        return node?.__typename === 'LocalLog';
      })
      .map((log) => ({
        uid: log.uid,
        createdAt: log.createdAt != null ? String(log.createdAt) : undefined,
        expiresAt: log.expiresAt != null ? String(log.expiresAt) : undefined,
        status: log.status ?? '',
        text: log.text ?? '',
      }));
  }, [data?.localLogs?.nodes]);

  const isLastPage = logs.length < pageSize;
  const paginationCount = isLastPage ? page + 1 : page + 2;

  const handleRefresh = async () => {
    if (!token) return;
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch {
      // rely on Apollo `error`
    }
  };

  return (
    <Stack spacing={2}>
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <DescriptionRoundedIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                로컬 로그 목록
              </Typography>
              {lastUpdated ? (
                <Chip
                  label={formatDate(lastUpdated.toISOString())}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              ) : null}
            </Stack>
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="local-logs-status-label">상태</InputLabel>
                <Select
                  labelId="local-logs-status-label"
                  label="상태"
                  value={statusFilter}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setStatusFilter(nextValue);
                    setPage(0);
                  }}
                  disabled={loading}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="info">info</MenuItem>
                  <MenuItem value="warn">warn</MenuItem>
                  <MenuItem value="error">error</MenuItem>
                  <MenuItem value="debug">debug</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="local-logs-page-size-label">조회 수량</InputLabel>
                <Select
                  labelId="local-logs-page-size-label"
                  label="조회 수량"
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    setPage(0);
                  }}
                  disabled={loading}
                >
                  <MenuItem value={20}>20개</MenuItem>
                  <MenuItem value={50}>50개</MenuItem>
                  <MenuItem value={100}>100개</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                새로고침
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 2 }}>
        {loading ? <LinearProgress /> : null}
        <CardContent sx={{ py: 2 }}>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert> : null}
          {loading ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              불러오는 중입니다...
            </Typography>
          ) : logs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              표시할 로그가 없습니다.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <LocalLogsPaginationControls
                page={page}
                pageCount={paginationCount}
                retrievedCount={logs.length}
                loading={loading}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
              />
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>내용</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>생성 시각</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>만료 시각</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => {
                      const statusColor =
                        log.status === 'error'
                          ? 'error'
                          : log.status === 'warn'
                            ? 'warning'
                            : log.status === 'info'
                              ? 'info'
                              : 'default';
                      const isExpanded = expandedUid === log.uid;
                      return (
                        <>
                          <TableRow
                            key={log.uid}
                            hover
                            onClick={() => {
                              setExpandedUid(isExpanded ? null : log.uid);
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Chip
                                label={log.status || '-'}
                                size="small"
                                color={statusColor}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 600,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={log.text}
                              >
                                {log.text || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                {formatDate(log.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                {formatDate(log.expiresAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell
                              style={{ paddingBottom: 0, paddingTop: 0 }}
                              colSpan={4}
                            >
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Typography
                                    variant="body2"
                                    component="pre"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      fontFamily: 'monospace',
                                      fontSize: '0.875rem',
                                      bgcolor: 'background.default',
                                      p: 2,
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      maxHeight: 400,
                                      overflow: 'auto',
                                    }}
                                  >
                                    {log.text || '-'}
                                  </Typography>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <LocalLogsPaginationControls
                page={page}
                pageCount={paginationCount}
                retrievedCount={logs.length}
                loading={loading}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default LocalLogPage;
