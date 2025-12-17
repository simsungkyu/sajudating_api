// Dialog component for creating and editing saju profile
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { createSajuProfile } from '../api/saju_profile_api';
import type { ApiError, SajuProfileSummary } from '../api';

type SexValue = 'male' | 'female';

export interface SajuProfileEditModalProps {
  open: boolean;
  token?: string;
  onClose: () => void;
  onCreated?: (uid: string) => void;
  profile?: SajuProfileSummary | null;
}

const normalizeBirthDateTime = (value: string) => value.replace(/\D/g, '');

const SajuProfileEditModal = ({ open, token, onClose, onCreated, profile }: SajuProfileEditModalProps) => {
  const isEditMode = Boolean(profile);
  const [email, setEmail] = useState('');
  const [sex, setSex] = useState<SexValue | ''>('');
  const [birthDateTime, setBirthDateTime] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    Boolean(email.trim()) && Boolean(sex) && Boolean(normalizedBirthDateTime) && !birthDateTimeError;

  useEffect(() => {
    if (!open) return;
    
    if (isEditMode && profile) {
      setEmail(profile.email ?? '');
      setSex((profile.sex as SexValue) ?? '');
      setBirthDateTime(profile.birth_date_time ?? profile.birthdate ?? '');
    } else {
      setEmail('');
      setSex('');
      setBirthDateTime('');
    }
    
    setImage(null);
    setSubmitting(false);
    setError(null);
  }, [open, isEditMode, profile]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setImage(next);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !sex || !token) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createSajuProfile(
        {
          email: email.trim(),
          sex,
          birthdate: normalizedBirthDateTime,
          image,
        },
        token,
      );

      if (result.uid) {
        onCreated?.(result.uid);
      }
      onClose();
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEditMode ? '사주 프로필 수정' : '사주 프로필 등록'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="saju-profile-create-form"
          spacing={2.5}
          onSubmit={handleSubmit}
          sx={{ pt: 1 }}
        >
          {error ? <Alert severity="error">{error}</Alert> : null}

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

          <TextField
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          취소
        </Button>
        {isEditMode ? (
          <>
            <Button variant="outlined" color="secondary" disabled={submitting}>
              임시 버튼 1
            </Button>
            <Button variant="outlined" color="secondary" disabled={submitting}>
              임시 버튼 2
            </Button>
            <Button
              variant="contained"
              type="submit"
              form="saju-profile-create-form"
              disabled={!canSubmit || submitting}
            >
              {submitting ? '저장 중...' : '저장'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            type="submit"
            form="saju-profile-create-form"
            disabled={!canSubmit || submitting}
          >
            {submitting ? '등록 중...' : '등록'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SajuProfileEditModal;
