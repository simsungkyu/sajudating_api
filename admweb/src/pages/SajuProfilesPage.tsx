// Page component for displaying and managing saju profiles list
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
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
import { type SajuProfileSummary } from '../api';
import { authAtom } from '../state/auth';
import SajuProfileDetailModal from '../components/SajuProfileDetailModal';
import SajuProfileEditModal from '../components/SajuProfileEditModal';
import UserSajuProfilePostTestModal from '../components/UserSajuProfilePostTestModal';
import { useSajuProfilesQuery } from '../graphql/generated';

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

const sajuProfileImageUrl = (uid: string) => `/api/admimg/saju_profile/${encodeURIComponent(uid)}`;

const formatSimilarityPercent = (value?: unknown): string => {
  if (value == null) return '-';
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const pct = value * 100;
  return `${Math.round(pct)}%`;
};

type SajuProfileRow = SajuProfileSummary & {
  phy_partner_uid?: string;
  phy_partner_similarity?: number | null;
};

const SajuProfilesPaginationControls = ({
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

const SajuProfilesPage = () => {
  const auth = useAtomValue(authAtom);
  const token = auth?.token;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SajuProfileSummary | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState<number>(0);

  const { data, loading, error, refetch } = useSajuProfilesQuery({
    variables: {
      input: {
        limit: pageSize,
        offset: page * pageSize,
        orderBy: null,
        orderDirection: null,
      },
    },
    skip: !token,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!token) return;
    if (loading) return;
    if (!data?.sajuProfiles?.ok) return;
    setLastUpdated(new Date());
  }, [token, loading, data?.sajuProfiles?.ok]);

  const profiles: SajuProfileRow[] = useMemo(() => {
    const nodes = data?.sajuProfiles?.nodes ?? [];
    return nodes
      .filter((node): node is NonNullable<typeof node> & { __typename: 'SajuProfile' } => {
        return node?.__typename === 'SajuProfile';
      })
      .map((profile) => ({
        uid: profile.uid,
        email: profile.email ?? undefined,
        sex: profile.sex ?? undefined,
        birthdate: profile.birthdate ?? undefined,
        image: undefined,
        image_mime_type: profile.imageMimeType ?? undefined,
        created_at: profile.createdAt != null ? String(profile.createdAt) : undefined,
        updated_at: profile.updatedAt != null ? String(profile.updatedAt) : undefined,
        has_image: true,
        phy_partner_uid: profile.phyPartnerUid?.trim() ? profile.phyPartnerUid.trim() : undefined,
        phy_partner_similarity: profile.phyPartnerSimilarity ?? null,
      }));
  }, [data?.sajuProfiles?.nodes]);

  const isLastPage = profiles.length < pageSize;
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
              <PersonRoundedIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                사주 프로필 목록
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
                <InputLabel id="saju-profiles-page-size-label">조회 수량</InputLabel>
                <Select
                  labelId="saju-profiles-page-size-label"
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
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                onClick={() => {
                  setTestModalOpen(true);
                }}
              >
                사용자 API 테스트
              </Button>
              {/* <Button
                variant="contained"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  setSelectedProfile(null);
                  setModalOpen(true);
                }}
                disabled={!token}
              >
                추가
              </Button> */}
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
          ) : profiles.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              표시할 프로필이 없습니다.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <SajuProfilesPaginationControls
                page={page}
                pageCount={paginationCount}
                retrievedCount={profiles.length}
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
                    <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>매칭</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>성별</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>생년월일시</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>이메일</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>생성 시각</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profiles.map((profile) => {
                      const imageSrc = profile.uid ? sajuProfileImageUrl(profile.uid) : null;
                      return (
                        <TableRow
                          key={profile.uid}
                          hover
                          onClick={() => {
                            setSelectedProfile(profile);
                            setDetailModalOpen(true);
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
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
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  alt={`${profile.uid} profile`}
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
                              ) : null}
                            </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={String(Boolean(profile.has_image))}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              profile.phy_partner_uid
                                ? formatSimilarityPercent(profile.phy_partner_similarity)
                                : 'false'
                            }
                            size="small"
                            color={profile.phy_partner_uid ? 'success' : 'default'}
                            variant={profile.phy_partner_uid ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={profile.sex ?? '성별 미상'}
                            size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {profile.birth_date_time ?? profile.birthdate ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {profile.email ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(profile.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <SajuProfilesPaginationControls
                page={page}
                pageCount={paginationCount}
                retrievedCount={profiles.length}
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
        <SajuProfileDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
          }}
          profile={selectedProfile}
          onEdit={() => {
            setDetailModalOpen(false);
            setModalOpen(true);
          }}
        />
      ) : null}
      {token ? (
        <SajuProfileEditModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProfile(null);
          }}
          token={token}
          profile={selectedProfile}
          onCreated={() => {
            handleRefresh();
          }}
        />
      ) : null}
      <UserSajuProfilePostTestModal
        open={testModalOpen}
        onClose={() => {
          setTestModalOpen(false);
        }}
        onCreated={() => {
          handleRefresh();
        }}
      />
    </Stack>
  );
};

export default SajuProfilesPage;
