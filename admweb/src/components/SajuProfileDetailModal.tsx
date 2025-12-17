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
import type { SajuProfileSummary } from '../api';
import { useEffect, useState } from 'react';
import { usePhyIdealPartnerQuery, useSajuProfileQuery } from '../graphql/generated';
import SajuProfileSimilarPartersModal from './SajuProfileSimilarPartersModal';

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
const phyPartnerImageUrl = (uid: string) => `/api/admimg/phy_partner/${encodeURIComponent(uid)}`;

export type SajuProfileDetailModalProps = {
  open: boolean;
  profile?: SajuProfileSummary | null;
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
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
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

const SajuProfileDetailModal = ({ open, profile, onClose, onEdit }: SajuProfileDetailModalProps) => {
  const [similarPartnersOpen, setSimilarPartnersOpen] = useState(false);
  useEffect(() => {
    if (!open) setSimilarPartnersOpen(false);
  }, [open]);

  const shouldSkip = !open || !profile?.uid;
  const queryResult = useSajuProfileQuery(
    shouldSkip
      ? { skip: true }
      : {
          variables: { uid: profile.uid },
          fetchPolicy: 'network-only',
        },
  );

  const node =
    queryResult.data?.sajuProfile?.node?.__typename === 'SajuProfile'
      ? queryResult.data.sajuProfile.node
      : null;

  const full = node
    ? {
        uid: node.uid,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        sex: node.sex,
        birthdate: node.birthdate,
        palja: node.palja,
        email: node.email,
        imageMimeType: node.imageMimeType,
        sajuSummary: node.sajuSummary,
        sajuContent: node.sajuContent,
        nickname: node.nickname,
        phySummary: node.phySummary,
        phyContent: node.phyContent,
        myFeatureEyes: node.myFeatureEyes,
        myFeatureNose: node.myFeatureNose,
        myFeatureMouth: node.myFeatureMouth,
        myFeatureFaceShape: node.myFeatureFaceShape,
        myFeatureNotes: node.myFeatureNotes,
        partnerMatchTips: node.partnerMatchTips,
        partnerSummary: node.partnerSummary,
        partnerFeatureEyes: node.partnerFeatureEyes,
        partnerFeatureNose: node.partnerFeatureNose,
        partnerFeatureMouth: node.partnerFeatureMouth,
        partnerFeatureFaceShape: node.partnerFeatureFaceShape,
        partnerPersonalityMatch: node.partnerPersonalityMatch,
        partnerSex: node.partnerSex,
        partnerAge: node.partnerAge,
        phyPartnerUid: node.phyPartnerUid,
        phyPartnerSimilarity: node.phyPartnerSimilarity,
      }
    : null;

  const phyPartnerUid = node?.phyPartnerUid?.trim() || '';
  const partnerQueryResult = usePhyIdealPartnerQuery(
    !open || !phyPartnerUid
      ? { skip: true }
      : {
          variables: { uid: phyPartnerUid },
          fetchPolicy: 'network-only',
        },
  );

  const partnerNode =
    partnerQueryResult.data?.phyIdealPartner?.node?.__typename === 'PhyIdealPartner'
      ? partnerQueryResult.data.phyIdealPartner.node
      : null;

  const matchedPartner = partnerNode
    ? {
        uid: partnerNode.uid,
        createdAt: partnerNode.createdAt,
        updatedAt: partnerNode.updatedAt,
        summary: partnerNode.summary,
        featureEyes: partnerNode.featureEyes,
        featureNose: partnerNode.featureNose,
        featureMouth: partnerNode.featureMouth,
        featureFaceShape: partnerNode.featureFaceShape,
        personalityMatch: partnerNode.personalityMatch,
        sex: partnerNode.sex,
        age: partnerNode.age,
        similarityScore: partnerNode.similarityScore,
      }
    : null;

  const displayProfile: SajuProfileSummary | null = node
    ? {
        uid: node.uid,
        email: node.email ?? undefined,
        sex: node.sex ?? undefined,
        birthdate: node.birthdate ?? undefined,
        image: undefined,
        image_mime_type: node.imageMimeType ?? undefined,
        created_at: node.createdAt != null ? String(node.createdAt) : undefined,
        updated_at: node.updatedAt != null ? String(node.updatedAt) : undefined,
        has_image: true,
      }
    : profile ?? null;

  const imageSrc = displayProfile?.uid ? sajuProfileImageUrl(displayProfile.uid) : null;
  const matchedImageSrc = phyPartnerUid ? phyPartnerImageUrl(phyPartnerUid) : null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>사주 프로필 상세</DialogTitle>
        <DialogContent dividers>
          {queryResult.loading ? <LinearProgress sx={{ mb: 2 }} /> : null}
          {queryResult.error ? <Alert severity="error" sx={{ mb: 2 }}>{queryResult.error.message}</Alert> : null}
          {partnerQueryResult.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {partnerQueryResult.error.message}
            </Alert>
          ) : null}
          {!displayProfile ? (
            <Typography color="text.secondary">표시할 프로필이 없습니다.</Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Stack
                  sx={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.12)',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                  }}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    No Image
                  </Typography>
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={`${displayProfile.uid} profile`}
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
                </Stack>

              <Stack spacing={1} flex={1} minWidth={0}>
                <Typography variant="body2" color="text.secondary">
                  UID
                </Typography>
                <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {displayProfile.uid}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={displayProfile.sex ?? '성별 미상'} size="small" variant="outlined" />
                  {full?.phyPartnerUid ? (
                    <Chip label={`phyPartnerUid: ${full.phyPartnerUid}`} size="small" variant="outlined" />
                  ) : null}
                  {full?.phyPartnerUid && full?.phyPartnerSimilarity != null ? (
                    <Chip
                      label={`phyPartnerSimilarity: ${full.phyPartnerSimilarity}`}
                      size="small"
                      variant="outlined"
                    />
                  ) : null}
                </Stack>
              </Stack>

              {phyPartnerUid ? (
                <Stack
                  sx={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.12)',
                    bgcolor: 'background.default',
                    overflow: 'hidden',
                  }}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {partnerQueryResult.loading ? 'Loading…' : 'No Match Image'}
                  </Typography>
                  {matchedImageSrc ? (
                    <img
                      src={matchedImageSrc}
                      alt={`${phyPartnerUid} matched partner`}
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
                </Stack>
              ) : null}
            </Stack>

            <Divider />

              <Typography fontWeight={800}>기본 정보</Typography>
              <Stack spacing={1.25}>
                <Field label="uid" value={full?.uid ?? displayProfile.uid} monospace />
                <Field label="email" value={full?.email ?? displayProfile.email} />
                <Field label="sex" value={full?.sex ?? displayProfile.sex} />
                <Field label="birthdate" value={full?.birthdate ?? displayProfile.birthdate} monospace />
                <Field label="palja" value={full?.palja} monospace />
                <Field label="phyPartnerUid" value={full?.phyPartnerUid} monospace />
                <Field label="imageMimeType" value={full?.imageMimeType ?? displayProfile.image_mime_type} />
                <Field label="createdAt" value={formatDate(full?.createdAt ?? displayProfile.created_at)} monospace />
                <Field label="updatedAt" value={formatDate(full?.updatedAt ?? displayProfile.updated_at)} monospace />
              </Stack>

              <Divider />

              <Typography fontWeight={800}>사주</Typography>
              <Stack spacing={1.25}>
                <Field label="sajuSummary" value={full?.sajuSummary} />
                <Field label="sajuContent" value={full?.sajuContent} />
              </Stack>

              <Divider />

              <Typography fontWeight={800}>관상 (본인)</Typography>
              <Stack spacing={1.25}>
                <Field label="nickname" value={full?.nickname} />
                <Field label="phySummary" value={full?.phySummary} />
                <Field label="phyContent" value={full?.phyContent} />
                <Divider />
                <Field label="myFeatureEyes" value={full?.myFeatureEyes} />
                <Field label="myFeatureNose" value={full?.myFeatureNose} />
                <Field label="myFeatureMouth" value={full?.myFeatureMouth} />
                <Field label="myFeatureFaceShape" value={full?.myFeatureFaceShape} />
                <Field label="myFeatureNotes" value={full?.myFeatureNotes} />
              </Stack>

              <Divider />

              <Typography fontWeight={800}>이상형</Typography>
              <Stack spacing={1.25}>
                <Field label="partnerMatchTips" value={full?.partnerMatchTips} />
                <Field label="partnerSummary" value={full?.partnerSummary} />
                <Field label="partnerFeatureEyes" value={full?.partnerFeatureEyes} />
                <Field label="partnerFeatureNose" value={full?.partnerFeatureNose} />
                <Field label="partnerFeatureMouth" value={full?.partnerFeatureMouth} />
                <Field label="partnerFeatureFaceShape" value={full?.partnerFeatureFaceShape} />
                <Field label="partnerPersonalityMatch" value={full?.partnerPersonalityMatch} />
                <Field label="partnerSex" value={full?.partnerSex} />
                <Field label="partnerAge" value={full?.partnerAge} />
              </Stack>

              {phyPartnerUid ? (
                <>
                  <Divider />
                  <Typography fontWeight={800}>매칭된 이상형</Typography>
                  {partnerQueryResult.loading ? <LinearProgress sx={{ mt: 1 }} /> : null}
                  <Stack spacing={1.25}>
                    <Field label="uid" value={matchedPartner?.uid ?? phyPartnerUid} monospace />
                    <Field label="sex" value={matchedPartner?.sex} />
                    <Field label="age" value={matchedPartner?.age} />
                    <Field label="phyPartnerSimilarity" value={full?.phyPartnerSimilarity} />
                    <Field label="similarityScore" value={matchedPartner?.similarityScore} />
                    <Field label="createdAt" value={formatDate(matchedPartner?.createdAt)} monospace />
                    <Field label="updatedAt" value={formatDate(matchedPartner?.updatedAt)} monospace />
                    <Divider />
                    <Field label="summary" value={matchedPartner?.summary} />
                    <Field label="featureEyes" value={matchedPartner?.featureEyes} />
                    <Field label="featureNose" value={matchedPartner?.featureNose} />
                    <Field label="featureMouth" value={matchedPartner?.featureMouth} />
                    <Field label="featureFaceShape" value={matchedPartner?.featureFaceShape} />
                    <Field label="personalityMatch" value={matchedPartner?.personalityMatch} />
                  </Stack>
                </>
              ) : null}

          </Stack>
        )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setSimilarPartnersOpen(true)}
            disabled={!displayProfile?.uid}
          >
            이상형 조회목록
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} color="inherit">
              닫기
            </Button>
            {displayProfile && onEdit ? (
              <Button variant="contained" onClick={onEdit}>
                수정
              </Button>
            ) : null}
          </Stack>
        </DialogActions>
      </Dialog>

      {displayProfile?.uid ? (
        <SajuProfileSimilarPartersModal
          open={similarPartnersOpen}
          sajuProfileUid={displayProfile.uid}
          onClose={() => setSimilarPartnersOpen(false)}
        />
      ) : null}
    </>
  );
};

export default SajuProfileDetailModal;
