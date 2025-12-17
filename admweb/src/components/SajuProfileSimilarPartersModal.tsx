import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { PhyPartnerSummary } from '../api';
import { useSajuProfileSimilarPartnersQuery } from '../graphql/generated';
import PhyPartnerDetailModal from './PhyPartnerDetailModal';

type SimilarPartnerRow = PhyPartnerSummary & { similarityScore?: number | null };

export interface SajuProfileSimilarPartersModalProps {
  open: boolean;
  sajuProfileUid: string;
  onClose: () => void;
}

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

const formatSimilarityPercent = (value?: unknown): string => {
  if (value == null) return '-';
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const pct = value * 100;
  return `${pct.toFixed(1).replace(/\\.0$/, '')}%`;
};

const SajuProfileSimilarPartersModal: React.FC<SajuProfileSimilarPartersModalProps> = ({
  open,
  sajuProfileUid,
  onClose,
}) => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!open) return;
    setOffset(0);
  }, [open, sajuProfileUid]);

  const queryResult = useSajuProfileSimilarPartnersQuery(
    !open || !sajuProfileUid
      ? { skip: true }
      : {
          variables: { uid: sajuProfileUid, limit, offset },
          fetchPolicy: 'network-only',
        },
  );

  const partners: SimilarPartnerRow[] = useMemo(() => {
    const nodes = queryResult.data?.sajuProfileSimilarPartners?.nodes ?? [];
    return nodes
      .filter((node): node is NonNullable<typeof node> & { __typename: 'PhyIdealPartner' } => {
        return node?.__typename === 'PhyIdealPartner';
      })
      .map((partner) => ({
        uid: partner.uid,
        phy_desc: partner.summary ?? '',
        sex: partner.sex ?? '',
        age: partner.age ?? undefined,
        image: undefined,
        image_mime_type: undefined,
        has_image: false,
        created_at: partner.createdAt != null ? String(partner.createdAt) : undefined,
        updated_at: partner.updatedAt != null ? String(partner.updatedAt) : undefined,
        similarityScore: partner.similarityScore ?? null,
      }));
  }, [queryResult.data?.sajuProfileSimilarPartners?.nodes]);

  const [selectedPartner, setSelectedPartner] = useState<PhyPartnerSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleClose = () => {
    if (queryResult.loading) return;
    onClose();
  };

  const handleRefresh = async () => {
    if (!open) return;
    try {
      await queryResult.refetch({ uid: sajuProfileUid, limit, offset });
    } catch {
      // rely on Apollo error
    }
  };

  const canPrev = offset > 0;
  const canNext = partners.length === limit;

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>이상형 조회목록</DialogTitle>
        <DialogContent dividers>
          {queryResult.loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
          {queryResult.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {queryResult.error.message}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary" fontFamily="monospace">
              sajuProfileUid: {sajuProfileUid || '-'}
            </Typography>

            {partners.length === 0 && !queryResult.loading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  조회 결과가 없습니다.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 72 }}>사진</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>성별</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>나이</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>설명</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>생성 시각</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>UID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {partners.map((partner) => {
                      const imageSrc = partner.uid ? phyPartnerImageUrl(partner.uid) : null;
                      const similarityPercent = formatSimilarityPercent(partner.similarityScore);
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
                            <Stack direction="row" spacing={1} alignItems="center">
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
                                ) : null}
                              </Box>
                              <Typography variant="caption" fontWeight={800}>
                                {similarityPercent}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{partner.sex || '-'}</TableCell>
                          <TableCell>{partner.age ?? '-'}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                maxWidth: 360,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {partner.phy_desc || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(partner.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                              {partner.uid}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={handleRefresh}
              disabled={queryResult.loading}
            >
              새로고침
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              disabled={queryResult.loading || !canPrev}
            >
              이전
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={queryResult.loading || !canNext}
            >
              다음
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              offset: {offset}
            </Typography>
          </Stack>
          <Button onClick={handleClose} color="inherit" disabled={queryResult.loading}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      <PhyPartnerDetailModal
        open={detailOpen}
        partner={selectedPartner}
        onClose={() => {
          setDetailOpen(false);
          setSelectedPartner(null);
        }}
      />
    </>
  );
};

export default SajuProfileSimilarPartersModal;
