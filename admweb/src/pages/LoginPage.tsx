import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JoinModal from '../components/JoinModal';
import { useLoginMutation } from '../graphql/generated';
import { authAtom } from '../state/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const navigate = useNavigate();
  const location = useLocation();
  const [loginMutation, { loading }] = useLoginMutation();

  const fromPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? '/';

  useEffect(() => {
    if (auth?.token) {
      navigate('/');
    }
  }, [auth, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim() || !otp.trim()) {
      setError('이메일, 비밀번호, OTP를 모두 입력해주세요.');
      return;
    }

    try {
      const result = await loginMutation({
        variables: {
          email: email.trim(),
          password: password.trim(),
          otp: otp.trim(),
        },
      });

      if (result.errors) {
        throw new Error(result.errors[0]?.message || '로그인 오류 발생');
      }

      if (result.data?.login?.ok && result.data.login.value) {
        const token = result.data.login.value;
        const adminId = result.data.login.msg || email.trim();
        setAuth({ token, adminId });
        navigate(fromPath, { replace: true });
      } else {
        throw new Error(
          result.data?.login?.err || result.data?.login?.msg || '로그인에 실패했습니다.',
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        px: 2,
        bgcolor: 'grey.50',
      }}
    >
      <Box sx={{ width: 'min(440px, 100%)' }}>
        <Card elevation={6} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
              <LockRoundedIcon color="primary" />
              <Typography variant="overline" fontWeight={700}>
                Admin Access
              </Typography>
            </Stack>
            <Typography variant="h4" fontWeight={800} gutterBottom textAlign="center">
              Y2SL Admin
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3} textAlign="center">
              이메일, 비밀번호, OTP를 입력하여 로그인하세요.
            </Typography>
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                fullWidth
                autoComplete="email"
                disabled={loading}
              />
              <TextField
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
                disabled={loading}
              />
              <TextField
                label="OTP (Google Authenticator)"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6자리 숫자"
                required
                fullWidth
                inputProps={{ maxLength: 6 }}
                helperText="Google Authenticator 앱에서 생성된 6자리 코드를 입력하세요."
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.4 }}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="medium"
                onClick={() => setJoinModalOpen(true)}
                disabled={loading}
                sx={{ py: 1.2 }}
              >
                관리자 계정 생성
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
      <JoinModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          setJoinModalOpen(false);
        }}
      />
    </Box>
  );
};

export default LoginPage;
