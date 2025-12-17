// Dialog component for testing POST /api/saju_profile endpoint
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import {
  Alert,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  createUserSajuProfile,
  getSajuProfile,
  getSajuProfileSajuResult,
  getSajuProfileKwansangResult,
  getSajuProfilePartnerImageResult,
  updateSajuProfileEmail,
} from '../api/saju_profile_api';
import type { ApiError } from '../api';

type SexValue = 'male' | 'female';
type TestType = 'full' | 'saju' | 'kwansang' | 'partnerImage';

export interface UserSajuProfilePostTestModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (uid: string) => void;
}

const normalizeBirthDateTime = (value: string) => value.replace(/\D/g, '');

const toPartnerImageSrc = (base64?: unknown): string | null => {
  if (typeof base64 !== 'string') return null;
  const trimmed = base64.trim();
  if (!trimmed) return null;
  if (/^data:/i.test(trimmed)) return trimmed;
  return `data:image/png;base64,${trimmed}`;
};

const UserSajuProfilePostTestModal = ({
  open,
  onClose,
  onCreated,
}: UserSajuProfilePostTestModalProps) => {
  const [sex, setSex] = useState<SexValue | ''>('');
  const [birthDateTime, setBirthDateTime] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUid, setCreatedUid] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [emailUpdateError, setEmailUpdateError] = useState<string | null>(null);
  const [emailUpdateResult, setEmailUpdateResult] = useState<any | null>(null);

  // Test results state
  const [testLoading, setTestLoading] = useState<TestType | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);

  const normalizedBirthDateTime = useMemo(
    () => normalizeBirthDateTime(birthDateTime),
    [birthDateTime],
  );

  const birthDateTimeError = useMemo(() => {
    if (!normalizedBirthDateTime) return null;
    if (normalizedBirthDateTime.length !== 8 && normalizedBirthDateTime.length !== 12) {
      return 'YYYYMMDD 형식(8자리) 또는 YYYYMMDDHHmm 형식(12자리)으로 입력하세요.';
    }
    return null;
  }, [normalizedBirthDateTime]);

  const canSubmit =
    Boolean(sex) && Boolean(normalizedBirthDateTime) && !birthDateTimeError;

  useEffect(() => {
    if (!open) return;

    setSex('');
    setBirthDateTime('');
    setImage(null);
    setSubmitting(false);
    setError(null);
    setCreatedUid(null);
    setEmail('');
    setUpdatingEmail(false);
    setEmailUpdateError(null);
    setEmailUpdateResult(null);
    setTestLoading(null);
    setTestError(null);
    setTestResult(null);
    setActiveTest(null);
  }, [open]);

  const handleClose = () => {
    if (submitting || testLoading) return;
    onClose();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setImage(next);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !sex) return;

    setSubmitting(true);
    setError(null);
    setCreatedUid(null);
    setUpdatingEmail(false);
    setEmailUpdateError(null);
    setEmailUpdateResult(null);
    setTestResult(null);
    setTestError(null);
    setActiveTest(null);

    try {
      const response = await createUserSajuProfile({
        sex,
        birthdate: normalizedBirthDateTime,
        image,
      });

      if (response.uid) {
        setCreatedUid(response.uid);
        setEmail(`${response.uid}@example.com`);
        onCreated?.(response.uid);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as ApiError;
        setError(apiErr.message);
      } else {
        setError('등록 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!createdUid || updatingEmail) return;
    if (!email.trim()) {
      setEmailUpdateError('이메일을 입력하세요.');
      return;
    }

    setUpdatingEmail(true);
    setEmailUpdateError(null);
    setEmailUpdateResult(null);

    try {
      const result = await updateSajuProfileEmail(createdUid, email.trim());
      setEmailUpdateResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setEmailUpdateError(err.message);
      } else if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as ApiError;
        setEmailUpdateError(apiErr.message);
      } else {
        setEmailUpdateError('이메일 업데이트 중 오류가 발생했습니다.');
      }
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleTestClick = async (testType: TestType) => {
    if (!createdUid || testLoading) return;

    setTestLoading(testType);
    setTestError(null);
    setTestResult(null);
    setActiveTest(testType);

    try {
      let result;
      switch (testType) {
        case 'full':
          result = await getSajuProfile(createdUid);
          break;
        case 'saju':
          result = await getSajuProfileSajuResult(createdUid);
          break;
        case 'kwansang':
          result = await getSajuProfileKwansangResult(createdUid);
          break;
        case 'partnerImage':
          result = await getSajuProfilePartnerImageResult(createdUid);
          break;
      }
      setTestResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setTestError(err.message);
      } else if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as ApiError;
        setTestError(apiErr.message);
      } else {
        setTestError('조회 중 오류가 발생했습니다.');
      }
    } finally {
      setTestLoading(null);
    }
  };

  const getTestButtonLabel = (testType: TestType) => {
    const labels = {
      full: '전체 조회',
      saju: '사주 조회',
      kwansang: '관상 조회',
      partnerImage: '파트너 이미지 조회',
    };
    return testLoading === testType ? '로딩 중...' : labels[testType];
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        사용자 사주 프로필 생성 테스트 (POST /api/saju_profile)
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {/* Create Profile Form */}
          <Stack
            component="form"
            id="user-saju-profile-test-form"
            spacing={2.5}
            onSubmit={handleSubmit}
          >
            {error ? <Alert severity="error">{error}</Alert> : null}
            {createdUid ? (
              <Alert severity="success">
                프로필이 생성되었습니다. UID: <strong>{createdUid}</strong>
              </Alert>
            ) : null}

            <Stack spacing={1}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadRoundedIcon />}
                disabled={submitting}
              >
                이미지 선택 (선택)
                <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </Button>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {image ? image.name : '선택된 이미지가 없습니다.'}
                </Typography>
                {image ? (
                  <Button
                    variant="text"
                    color="inherit"
                    size="small"
                    onClick={() => setImage(null)}
                    disabled={submitting}
                  >
                    제거
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            <FormControl required>
              <FormLabel>성별</FormLabel>
              <RadioGroup
                row
                value={sex}
                onChange={(e) => setSex(e.target.value as SexValue)}
              >
                <FormControlLabel value="male" control={<Radio />} label="남성 (male)" />
                <FormControlLabel value="female" control={<Radio />} label="여성 (female)" />
              </RadioGroup>
            </FormControl>

            <TextField
              label="생년월일시"
              value={birthDateTime}
              onChange={(e) => setBirthDateTime(e.target.value)}
              placeholder="YYYYMMDD 또는 YYYYMMDDHHmm (예: 19900101 또는 199001011230)"
              helperText={birthDateTimeError ?? '숫자만 8자리(YYYYMMDD) 또는 12자리(YYYYMMDDHHmm)로 입력합니다.'}
              error={Boolean(birthDateTimeError)}
              required
              fullWidth
              inputProps={{ inputMode: 'numeric' }}
            />

            <Button
              variant="contained"
              type="submit"
              disabled={!canSubmit || submitting}
              fullWidth
            >
              {submitting ? '생성 중...' : '프로필 생성'}
            </Button>
          </Stack>

          {/* Test Buttons Section */}
          {createdUid ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  PUT 엔드포인트 테스트 (이메일 업데이트)
                </Typography>
                {emailUpdateError ? <Alert severity="error">{emailUpdateError}</Alert> : null}
                {emailUpdateResult ? (
                  <Alert severity="success">
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {JSON.stringify(emailUpdateResult, null, 2)}
                    </Typography>
                  </Alert>
                ) : null}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
                  <TextField
                    label="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@example.com"
                    fullWidth
                    disabled={updatingEmail}
                  />
                  <Button
                    variant="contained"
                    onClick={handleEmailUpdate}
                    disabled={updatingEmail || !email.trim()}
                    sx={{ minWidth: 160 }}
                  >
                    {updatingEmail ? '업데이트 중...' : '이메일 업데이트'}
                  </Button>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  GET 엔드포인트 테스트
                </Typography>
                <ButtonGroup variant="outlined" fullWidth>
                  <Button
                    onClick={() => handleTestClick('full')}
                    disabled={Boolean(testLoading)}
                    color={activeTest === 'full' ? 'primary' : 'inherit'}
                  >
                    {getTestButtonLabel('full')}
                  </Button>
                  <Button
                    onClick={() => handleTestClick('saju')}
                    disabled={Boolean(testLoading)}
                    color={activeTest === 'saju' ? 'primary' : 'inherit'}
                  >
                    {getTestButtonLabel('saju')}
                  </Button>
                  <Button
                    onClick={() => handleTestClick('kwansang')}
                    disabled={Boolean(testLoading)}
                    color={activeTest === 'kwansang' ? 'primary' : 'inherit'}
                  >
                    {getTestButtonLabel('kwansang')}
                  </Button>
                  <Button
                    onClick={() => handleTestClick('partnerImage')}
                    disabled={Boolean(testLoading)}
                    color={activeTest === 'partnerImage' ? 'primary' : 'inherit'}
                  >
                    {getTestButtonLabel('partnerImage')}
                  </Button>
                </ButtonGroup>

                {testError ? <Alert severity="error">{testError}</Alert> : null}
                {testResult ? (
                  <Alert severity="success">
                    {activeTest === 'partnerImage' ? (
                      (() => {
                        const imageSrc = toPartnerImageSrc(testResult?.partner_image);
                        if (!imageSrc) return null;
                        return (
                          <Stack spacing={1} sx={{ mb: 1.5 }}>
                            <Typography variant="body2" fontWeight={700}>
                              파트너 이미지 미리보기
                            </Typography>
                            <img
                              src={imageSrc}
                              alt="partner"
                              style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 12 }}
                            />
                          </Stack>
                        );
                      })()
                    ) : null}
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {JSON.stringify(
                        activeTest === 'partnerImage' && typeof testResult?.partner_image === 'string'
                          ? { ...testResult, partner_image: `<base64:${testResult.partner_image.length} chars>` }
                          : testResult,
                        null,
                        2,
                      )}
                    </Typography>
                  </Alert>
                ) : null}
              </Stack>
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting || Boolean(testLoading)}>
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSajuProfilePostTestModal;
