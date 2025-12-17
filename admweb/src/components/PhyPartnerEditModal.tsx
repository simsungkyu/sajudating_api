// Dialog component for creating phy partner
import React, { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
import { createPhyPartner } from '../api/phy_partner_api';
import type { ApiError } from '../api';

type SexValue = 'male' | 'female';

export type PhyPartnerCreateValues = {
  phy_desc: string;
  sex: SexValue;
  age: number;
  image?: File | null;
};

export interface PhyPartnerEditModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  onCreated?: (uid: string) => void;
}

const PhyPartnerEditModal: React.FC<PhyPartnerEditModalProps> = ({
  open,
  onClose,
  token,
  onCreated,
}) => {
  const [phyDesc, setPhyDesc] = useState('');
  const [sex, setSex] = useState<SexValue | ''>('');
  const [age, setAge] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ageNum = age.trim() === '' ? null : parseInt(age.trim(), 10);
  const ageError = age.trim() !== '' && (isNaN(ageNum!) || ageNum! < 0 || ageNum! > 150);
  const canSubmit = Boolean(phyDesc.trim()) && Boolean(sex) && ageNum !== null && !ageError;

  useEffect(() => {
    if (!open) {
      setPhyDesc('');
      setSex('');
      setAge('');
      setImage(null);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

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
    if (!canSubmit || !sex || ageNum === null) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createPhyPartner(
        {
          phy_desc: phyDesc.trim(),
          sex,
          age: ageNum,
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
      <DialogTitle sx={{ fontWeight: 800 }}>관상 파트너 등록</DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="phy-partner-create-form"
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

          <TextField
            label="관상 설명"
            value={phyDesc}
            onChange={(e) => setPhyDesc(e.target.value)}
            placeholder="관상 파트너에 대한 설명을 입력하세요"
            required
            fullWidth
            multiline
            rows={4}
          />

          <TextField
            label="나이"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="나이를 입력하세요"
            required
            fullWidth
            inputProps={{ min: 0, max: 150, inputMode: 'numeric' }}
            error={ageError}
            helperText={ageError ? '0 이상 150 이하의 숫자를 입력하세요' : ''}
          />

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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          취소
        </Button>
        <Button
          variant="contained"
          type="submit"
          form="phy-partner-create-form"
          disabled={!canSubmit || submitting}
        >
          {submitting ? '등록 중...' : '등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhyPartnerEditModal;
