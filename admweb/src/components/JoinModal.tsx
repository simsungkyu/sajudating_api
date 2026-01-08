// Modal component for creating admin user (join)
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, type FormEvent } from 'react';
import { useCreateAdminUserMutation } from '../graphql/generated';

export interface JoinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const JoinModal: React.FC<JoinModalProps> = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpUrl, setOtpUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [appStoreModalOpen, setAppStoreModalOpen] = useState(false);

  const [createAdminUserMutation] = useCreateAdminUserMutation();

  const iOS_APP_STORE_URL = 'https://apps.apple.com/app/google-authenticator/id388497605';
  const ANDROID_PLAY_STORE_URL =
    'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2';

  const canSubmit =
    Boolean(email.trim()) &&
    Boolean(password.trim()) &&
    password === confirmPassword &&
    password.length >= 6;

  const otpDetails = otpUrl
    ? (() => {
        try {
          const url = new URL(otpUrl);
          const secret = url.searchParams.get('secret') || '';
          const type = url.hostname || 'totp';
          let accountName = decodeURIComponent(url.pathname);
          if (accountName.startsWith('/')) accountName = accountName.substring(1);
          return { accountName, secret, type: type === 'totp' ? 'Time based' : type };
        } catch {
          return null;
        }
      })()
    : null;

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSubmitting(false);
      setError(null);
      setOtpUrl(null);
      setQrModalOpen(false);
      setAppStoreModalOpen(false);
    }
  }, [open]);

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createAdminUserMutation({
        variables: {
          email: email.trim(),
          password: password.trim(),
        },
      });

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL 오류 발생');
      }

      if (result.data?.createAdminUser?.ok) {
        const otpUrlValue = result.data.createAdminUser.value;
        if (otpUrlValue) {
          setOtpUrl(otpUrlValue);
          setQrModalOpen(true);
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        throw new Error(
          result.data?.createAdminUser?.err ||
            result.data?.createAdminUser?.msg ||
            '관리자 생성 실패',
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('관리자 생성 중 오류가 발생했습니다.');
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
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>관리자 계정 생성</DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="join-form"
          spacing={2.5}
          onSubmit={handleSubmit}
          sx={{ pt: 1 }}
        >
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            fullWidth
            disabled={submitting}
            autoComplete="email"
          />

          <TextField
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상 입력하세요"
            required
            fullWidth
            disabled={submitting}
            autoComplete="new-password"
            helperText="비밀번호는 6자 이상이어야 합니다."
            error={password.length > 0 && password.length < 6}
          />

          <TextField
            label="비밀번호 확인"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            required
            fullWidth
            disabled={submitting}
            autoComplete="new-password"
            error={confirmPassword.length > 0 && password !== confirmPassword}
            helperText={
              confirmPassword.length > 0 && password !== confirmPassword
                ? '비밀번호가 일치하지 않습니다.'
                : ''
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          닫기
        </Button>
        <Button
          variant="contained"
          type="submit"
          form="join-form"
          disabled={!canSubmit || submitting}
        >
          {submitting ? '생성 중...' : '계정 생성'}
        </Button>
      </DialogActions>
      {/* QR Code Modal */}
      <Dialog
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          onSuccess?.();
          onClose();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>OTP 설정</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            <Alert severity="info" sx={{ width: '100%' }}>
              계정이 성공적으로 생성되었습니다. 아래 QR 코드를 Google Authenticator 앱으로 스캔하여
              OTP를 설정하세요.
            </Alert>
            <Box
              sx={{
                p: 2,
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {otpUrl && <QRCodeSVG value={otpUrl} size={256} level="M" />}
            </Box>

            {otpDetails && (
              <Stack spacing={2} sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" textAlign="center">
                  또는 아래 정보를 앱에 직접 입력하세요.
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Account Name
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      p: 1.5,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                    >
                      {otpDetails.accountName}
                    </Typography>
                    <Tooltip title="복사">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyToClipboard(otpDetails.accountName)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Your Key
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      p: 1.5,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                    >
                      {otpDetails.secret}
                    </Typography>
                    <Tooltip title="복사">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyToClipboard(otpDetails.secret)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Type of Key
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      p: 1.5,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {otpDetails.type}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            )}

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Google Authenticator 앱을 열고, QR 코드를 스캔하거나 수동으로 키를 입력하세요.
              <br />
              OTP 설정 후 로그인 시 6자리 코드가 필요합니다.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setAppStoreModalOpen(true)}
            sx={{ mr: 'auto' }}
          >
            Google Authenticator 설치
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setQrModalOpen(false);
              onSuccess?.();
              onClose();
            }}
          >
            완료
          </Button>
        </DialogActions>
      </Dialog>
      {/* App Store QR Code Modal */}
      <Dialog
        open={appStoreModalOpen}
        onClose={() => setAppStoreModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Google Authenticator 설치</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={4} sx={{ py: 2 }}>
            {/* iOS App Store */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  iOS (App Store)
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <QRCodeSVG value={iOS_APP_STORE_URL} size={200} level="M" />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    p: 1.5,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                      }}
                    >
                      {iOS_APP_STORE_URL}
                    </Typography>
                    <Tooltip title="클립보드에 복사">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyToClipboard(iOS_APP_STORE_URL)}
                        sx={{ flexShrink: 0 }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
            {/* Android Play Store */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Android (Play Store)
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <QRCodeSVG value={ANDROID_PLAY_STORE_URL} size={200} level="M" />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    p: 1.5,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                      }}
                    >
                      {ANDROID_PLAY_STORE_URL}
                    </Typography>
                    <Tooltip title="클립보드에 복사">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyToClipboard(ANDROID_PLAY_STORE_URL)}
                        sx={{ flexShrink: 0 }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setAppStoreModalOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default JoinModal;
