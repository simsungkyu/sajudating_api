import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { PhyPartnerSummary } from '../api';
import { usePhyIdealPartnerQuery } from '../graphql/generated';

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

export type PhyPartnerDetailModalProps = {
  open: boolean;
  partner?: PhyPartnerSummary | null;
  onClose: () => void;
  onEdit?: () => void;
};

const Field = ({
  label,
  value,
  monospace,
}: {
  label: string;
  value: unknown;
  monospace?: boolean;
}) => {
  const text = value == null || value === '' ? '-' : String(value);
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'flex-start', sm: 'baseline' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: monospace ? 'monospace' : undefined,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </Typography>
    </Stack>
  );
};

const PhyPartnerDetailModal = ({ open, partner, onClose, onEdit }: PhyPartnerDetailModalProps) => {
  const shouldSkip = !open || !partner?.uid;
  const queryResult = usePhyIdealPartnerQuery(
    shouldSkip
      ? { skip: true }
      : {
          variables: { uid: partner.uid },
          fetchPolicy: 'network-only',
        },
  );

  const node =
    queryResult.data?.phyIdealPartner?.node?.__typename === 'PhyIdealPartner'
      ? queryResult.data.phyIdealPartner.node
      : null;

  const full = node
    ? {
        uid: node.uid,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        summary: node.summary,
        featureEyes: node.featureEyes,
        featureNose: node.featureNose,
        featureMouth: node.featureMouth,
        featureFaceShape: node.featureFaceShape,
        personalityMatch: node.personalityMatch,
        sex: node.sex,
        age: node.age,
        embeddingModel: node.embeddingModel,
        embeddingText: node.embeddingText,
      }
    : null;

  const displayPartner: PhyPartnerSummary | null = node
    ? {
        uid: node.uid,
        phy_desc: node.summary ?? '',
        sex: node.sex ?? '',
        age: node.age ?? undefined,
        image: undefined,
        image_mime_type: undefined,
        created_at: node.createdAt != null ? String(node.createdAt) : undefined,
        updated_at: node.updatedAt != null ? String(node.updatedAt) : undefined,
        has_image: false,
      }
    : partner ?? null;

  const imageSrc = displayPartner?.uid ? phyPartnerImageUrl(displayPartner.uid) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>관상 파트너 상세</DialogTitle>
      <DialogContent dividers>
        {queryResult.loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {queryResult.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {queryResult.error.message}
          </Alert>
        ) : null}

        {!displayPartner ? (
          <Typography color="text.secondary">표시할 파트너가 없습니다.</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Stack
                sx={{
                  position: 'relative',
                  width: 300,
                  height: 300,
                  flexShrink: 0,
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.12)',
                  bgcolor: 'background.default',
                  overflow: 'hidden',
                }}
                alignItems="center"
                justifyContent="center"
              >
                <Typography variant="body1" color="text.secondary">
                  No Image
                </Typography>
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={`${displayPartner.uid} partner`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </Stack>

              <Stack spacing={2} flex={1} minWidth={0}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    UID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    {displayPartner.uid}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={displayPartner.sex ?? '성별 미상'} size="small" variant="outlined" />
                  {displayPartner.age !== undefined ? (
                    <Chip label={`${displayPartner.age}세`} size="small" variant="outlined" />
                  ) : null}
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.25}>
              <Typography fontWeight={800}>기본 정보</Typography>
              <Stack spacing={1.25}>
                <Field label="uid" value={full?.uid ?? displayPartner.uid} monospace />
                <Field label="sex" value={full?.sex ?? displayPartner.sex} />
                <Field label="age" value={full?.age ?? displayPartner.age} />
                <Field
                  label="createdAt"
                  value={formatDate(full?.createdAt ?? displayPartner.created_at)}
                  monospace
                />
                <Field
                  label="updatedAt"
                  value={formatDate(full?.updatedAt ?? displayPartner.updated_at)}
                  monospace
                />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.25}>
              <Typography fontWeight={800}>요약</Typography>
              <Stack spacing={1.25}>
                <Field label="summary" value={full?.summary ?? displayPartner.phy_desc} />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.25}>
              <Typography fontWeight={800}>특징</Typography>
              <Stack spacing={1.25}>
                <Field label="featureEyes" value={full?.featureEyes} />
                <Field label="featureNose" value={full?.featureNose} />
                <Field label="featureMouth" value={full?.featureMouth} />
                <Field label="featureFaceShape" value={full?.featureFaceShape} />
                <Field label="personalityMatch" value={full?.personalityMatch} />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.25}>
              <Typography fontWeight={800}>임베딩 정보</Typography>
              <Stack spacing={1.25}>
                <Field label="embeddingModel" value={full?.embeddingModel} monospace />
                <Field label="embeddingText" value={full?.embeddingText} />
              </Stack>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          닫기
        </Button>
        {displayPartner && onEdit ? (
          <Button variant="contained" onClick={onEdit}>
            수정
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default PhyPartnerDetailModal;
