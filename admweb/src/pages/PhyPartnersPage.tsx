import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { type PhyPartnerSummary } from '../api';
import { authAtom } from '../state/auth';
import PhyPartnerDetailModal from '../components/PhyPartnerDetailModal';
import PhyPartnerEditModal from '../components/PhyPartnerEditModal';
import { usePhyIdealPartnersQuery } from '../graphql/generated';

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
  });
};

const phyPartnerImageUrl = (uid: string) => `/api/admimg/phy_partner/${encodeURIComponent(uid)}`;

const PhyPartnersPaginationControls = ({
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

const PhyPartnersPage = () => {
  const auth = useAtomValue(authAtom);
  const token = auth?.token;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PhyPartnerSummary | null>(null);
  const [sex, setSex] = useState<'all' | 'male' | 'female'>('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const { data, loading, error, refetch } = usePhyIdealPartnersQuery({
    variables: {
      input: {
        limit: pageSize,
        offset: page * pageSize,
        sex: sex === 'all' ? null : sex,
      },
    },
    skip: !token,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!token) return;
    if (loading) return;
    if (!data?.phyIdealPartners?.ok) return;
    setLastUpdated(new Date());
  }, [token, loading, data?.phyIdealPartners?.ok]);

  const partners: PhyPartnerSummary[] = useMemo(() => {
    const nodes = data?.phyIdealPartners?.nodes ?? [];
    return nodes
      .filter((node): node is NonNullable<typeof node> & { __typename: 'PhyIdealPartner' } => {
        return node?.__typename === 'PhyIdealPartner';
      })
      .map((partner) => ({
        uid: partner.uid,
        phy_desc: partner.summary,
        sex: partner.sex,
        age: partner.age,
        image: undefined,
        image_mime_type: undefined,
        has_image: false,
        created_at: partner.createdAt != null ? String(partner.createdAt) : undefined,
        updated_at: partner.updatedAt != null ? String(partner.updatedAt) : undefined,
      }));
  }, [data?.phyIdealPartners?.nodes]);

  const isLastPage = partners.length < pageSize;
  const paginationCount = isLastPage ? page + 1 : page + 2;

  const errorMessage = error ? error.message : null;

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
              <PeopleRoundedIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                관상 파트너 목록
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
                <InputLabel id="phy-partners-sex-label">성별</InputLabel>
                <Select
                  labelId="phy-partners-sex-label"
                  label="성별"
                  value={sex}
                  onChange={(event) => {
                    const nextValue = event.target.value as 'all' | 'male' | 'female';
                    setSex(nextValue);
                    setPage(0);
                  }}
                  disabled={loading}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="male">남자</MenuItem>
                  <MenuItem value="female">여자</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="phy-partners-page-size-label">조회 수량</InputLabel>
                <Select
                  labelId="phy-partners-page-size-label"
                  label="조회 수량"
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    setPage(0);
                  }}
                  disabled={loading}
                >
                  <MenuItem value={10}>10개</MenuItem>
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
              <Button
                variant="contained"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setModalOpen(true)}
                disabled={!token}
              >
                추가
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 2 }}>
        {loading ? <LinearProgress /> : null}
        <CardContent sx={{ py: 2 }}>
          {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}
          {loading ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              불러오는 중입니다...
            </Typography>
          ) : partners.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              표시할 파트너가 없습니다.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <PhyPartnersPaginationControls
                page={page}
                pageCount={paginationCount}
                retrievedCount={partners.length}
                loading={loading}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
              />
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 72 }}>사진</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>성별</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>나이</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>관상 설명</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>생성 시각</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {partners.map((partner) => {
                      const imageSrc = partner.uid ? phyPartnerImageUrl(partner.uid) : null;
                      return (
                        <TableRow
                          key={partner.uid}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedPartner(partner);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell>
                            {imageSrc ? (
                              <Box
                                sx={{
                                  position: 'relative',
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                  border: '1px solid rgba(0,0,0,0.12)',
                                  overflow: 'hidden',
                                  bgcolor: 'background.default',
                                }}
                              >
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'text.secondary',
                                    fontSize: 12,
                                  }}
                                >
                                  -
                                </Box>
                                <img
                                  src={imageSrc}
                                  alt={`${partner.uid} partner`}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={partner.sex ?? '성별 미상'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {partner.age !== undefined ? `${partner.age}세` : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 400 }}>
                              {partner.phy_desc ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(partner.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <PhyPartnersPaginationControls
                page={page}
                pageCount={paginationCount}
                retrievedCount={partners.length}
                loading={loading}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                }}
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      {token ? (
        <PhyPartnerEditModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          token={token}
          onCreated={() => {
            handleRefresh();
          }}
        />
      ) : null}

      <PhyPartnerDetailModal
        open={detailOpen}
        partner={selectedPartner}
        onClose={() => setDetailOpen(false)}
      />
    </Stack>
  );
};

export default PhyPartnersPage;
