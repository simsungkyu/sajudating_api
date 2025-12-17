import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import TextSnippetRoundedIcon from '@mui/icons-material/TextSnippetRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, ApiError, sajuApi, type SajuProfileDetail } from '../api';
import { authAtom } from '../state/auth';

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProfileDetailPage = () => {
  const { uid } = useParams<{ uid: string }>();
  const auth = useAtomValue(authAtom);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SajuProfileDetail | null>(null);
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myImageUrl, setMyImageUrl] = useState<string | null>(null);
  const [partnerImageUrl, setPartnerImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<{ my?: boolean; partner?: boolean }>({});

  useEffect(() => {
    let cancelled = false;

    if (!uid || !auth?.token) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const detail = await adminApi.getProfile(uid, auth.token);
        if (!cancelled) {
          setProfile(detail);
        }

        try {
          const result = await sajuApi.fetchResult(uid, auth.token);
          if (!cancelled && result?.result) {
            setResultText(result.result);
          }
        } catch {
          if (!cancelled) {
            setResultText('');
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('프로필을 불러오지 못했습니다.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, uid]);

  useEffect(() => {
    return () => {
      if (myImageUrl) URL.revokeObjectURL(myImageUrl);
      if (partnerImageUrl) URL.revokeObjectURL(partnerImageUrl);
    };
  }, [myImageUrl, partnerImageUrl]);

  const fetchImage = async (kind: 'my' | 'partner') => {
    if (!uid) return;
    setImageLoading((prev) => ({ ...prev, [kind]: true }));

    try {
      const blob =
        kind === 'my'
          ? await sajuApi.fetchMyImage(uid, auth?.token)
          : await sajuApi.fetchPartnerImage(uid, auth?.token);
      const url = URL.createObjectURL(blob);
      if (kind === 'my') {
        setMyImageUrl(url);
      } else {
        setPartnerImageUrl(url);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('이미지를 불러오지 못했습니다.');
      }
    } finally {
      setImageLoading((prev) => ({ ...prev, [kind]: false }));
    }
  };

  const copyUid = async () => {
    if (!uid || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(uid);
  };

  if (!uid) {
    return <Alert severity="error">UID가 없습니다.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Button
        variant="text"
        startIcon={<ArrowBackIosNewRoundedIcon />}
        onClick={() => navigate('/')}
      >
        목록으로 돌아가기
      </Button>

      <Card elevation={1} sx={{ borderRadius: 3 }}>
        {loading ? <LinearProgress /> : null}
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                사주 프로필
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {uid}
              </Typography>
              <Typography color="text.secondary">
                관리자 API로 조회된 프로필의 전체 정보를 확인합니다.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ContentCopyRoundedIcon />}
                onClick={copyUid}
              >
                UID 복사
              </Button>
              <Button variant="contained" onClick={() => navigate('/')}>
                대시보드로
              </Button>
            </Stack>
          </Stack>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          {loading ? (
            <Typography color="text.secondary">프로필을 불러오는 중입니다...</Typography>
          ) : profile ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <ImageRoundedIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        기본 정보
                      </Typography>
                    </Stack>
                    <Grid container spacing={1}>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          이메일
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {profile.email ?? '-'}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          성별
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {profile.sex ?? '-'}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          생년월일
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {profile.birthdate ?? profile.birth_date_time ?? '-'}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          생성 시각
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {formatDateTime(profile.created_at)}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          업데이트
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {formatDateTime(profile.updated_at)}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          이미지
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {profile.has_image ? '등록됨' : '없음'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextSnippetRoundedIcon color="primary" />
                        <div>
                          <Typography variant="subtitle1" fontWeight={700}>
                            사주 풀이 결과
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            /api/saju_profile/{uid}/result
                          </Typography>
                        </div>
                      </Stack>
                      <Button variant="outlined" size="small" onClick={() => fetchImage('my')}>
                        내 이미지 보기
                      </Button>
                    </Stack>
                    <Divider sx={{ mb: 1 }} />
                    {resultText ? (
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Roboto Mono, monospace',
                          bgcolor: 'grey.50',
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          minHeight: 160,
                        }}
                      >
                        {resultText}
                      </Box>
                    ) : (
                      <Typography color="text.secondary">
                        결과가 아직 생성되지 않았습니다.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">프로필 정보를 찾을 수 없습니다.</Typography>
          )}
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            mb={2}
          >
            <div>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                이미지
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                내 이미지 / 파트너 예시
              </Typography>
            </div>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                disabled={imageLoading.my}
                onClick={() => fetchImage('my')}
              >
                {imageLoading.my ? '불러오는 중...' : '내 이미지 보기'}
              </Button>
              <Button
                variant="outlined"
                disabled={imageLoading.partner}
                onClick={() => fetchImage('partner')}
              >
                {imageLoading.partner ? '불러오는 중...' : '파트너 이미지 보기'}
              </Button>
            </Stack>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    /api/saju_profile/{uid}/my_image
                  </Typography>
                  {myImageUrl ? (
                    <CardMedia
                      component="img"
                      sx={{ borderRadius: 2, mt: 1, maxHeight: 360, objectFit: 'cover' }}
                      image={myImageUrl}
                      alt="내 이미지"
                    />
                  ) : (
                    <Box
                      sx={{
                        mt: 1,
                        height: 220,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        border: '1px dashed',
                        borderColor: 'divider',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      아직 불러오지 않았습니다.
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    /api/saju_profile/{uid}/partner_image
                  </Typography>
                  {partnerImageUrl ? (
                    <CardMedia
                      component="img"
                      sx={{ borderRadius: 2, mt: 1, maxHeight: 360, objectFit: 'cover' }}
                      image={partnerImageUrl}
                      alt="파트너 예시 이미지"
                    />
                  ) : (
                    <Box
                      sx={{
                        mt: 1,
                        height: 220,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        border: '1px dashed',
                        borderColor: 'divider',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      아직 불러오지 않았습니다.
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ProfileDetailPage;
