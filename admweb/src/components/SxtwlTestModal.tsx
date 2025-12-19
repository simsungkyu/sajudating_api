// Dialog component for testing sxtwl API
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, type FormEvent } from 'react';
import { usePaljaQuery } from '../graphql/generated';

export interface SxtwlTestModalProps {
  open: boolean;
  onClose: () => void;
}

const SxtwlTestModal: React.FC<SxtwlTestModalProps> = ({ open, onClose }) => {
  const [birth, setBirth] = useState('199001011230');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [queryVars, setQueryVars] = useState<{ birthdate: string; timezone: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [paljaKorean, setPaljaKorean] = useState<string | null>(null);

  const queryResult = usePaljaQuery(
    !open || !queryVars
      ? { skip: true }
      : {
          variables: queryVars,
          fetchPolicy: 'network-only',
        },
  );

  const loading = queryResult.loading;
  const errorMessage = queryResult.error?.message ?? localError;

  useEffect(() => {
    if (!queryResult.data?.palja) return;

    // palja.value는 JSON 문자열이므로 파싱해서 보기 좋게 표시
    try {
      const paljaData = queryResult.data.palja;
      let displayData: any;

      if (paljaData.value) {
        // value가 JSON 문자열인 경우 파싱
        try {
          displayData = JSON.parse(paljaData.value);
          // 한글 사주 정보 추출
          if (displayData.palja_korean) {
            setPaljaKorean(displayData.palja_korean);
          }
        } catch {
          // JSON 파싱 실패 시 그대로 사용
          displayData = paljaData;
        }
      } else {
        displayData = paljaData;
      }

      setResult(JSON.stringify(displayData, null, 2));
    } catch (err) {
      setResult(JSON.stringify(queryResult.data.palja, null, 2));
    }
  }, [queryResult.data?.palja]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!birth.trim() || !timezone.trim()) return;

    setLocalError(null);
    setResult(null);
    setPaljaKorean(null);

    const nextVars = {
      birthdate: birth.trim(),
      timezone: timezone.trim(),
    };

    try {
      if (queryVars && queryVars.birthdate === nextVars.birthdate && queryVars.timezone === nextVars.timezone) {
        await queryResult.refetch(nextVars);
      } else {
        setQueryVars(nextVars);
      }
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('요청 중 오류가 발생했습니다.');
      }
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Sxtwl 테스트</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="sxtwl-test-form"
          spacing={2}
          onSubmit={handleSubmit}
          sx={{ pt: 1 }}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <TextField
            label="생년월일시"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            placeholder="YYYYMMDDHHmm (예: 199001011230)"
            required
            fullWidth
            inputProps={{ inputMode: 'numeric' }}
          />

          <TextField
            label="타임존"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Asia/Seoul"
            required
            fullWidth
          />

          {paljaKorean || result ? (
            <Stack spacing={2}>
              {paljaKorean ? (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    사주팔자:
                  </Typography>
                  <Alert severity="success" sx={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 600 }}>
                    {paljaKorean}
                  </Alert>
                </Stack>
              ) : null}

              {result ? (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    상세 정보 (JSON):
                  </Typography>
                  <TextField
                    multiline
                    rows={12}
                    value={result}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </Stack>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          닫기
        </Button>
        <Button
          type="submit"
          form="sxtwl-test-form"
          variant="contained"
          disabled={loading || !birth.trim() || !timezone.trim()}
        >
          {loading ? '요청 중...' : '요청'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SxtwlTestModal;
