import LockRoundedIcon from '@mui/icons-material/LockRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAtom } from 'jotai';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAtom } from '../state/auth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? '/';

  useEffect(() => {
    if (auth?.token) {
      navigate('/');
    }
  }, [auth, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // TODO: 실제 인증 로직 연동
    setAuth({ token: 'dev-login-token', adminId: username || 'admin' });
    navigate(fromPath, { replace: true });
    setLoading(false);
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
      }}
    >
      <Grid container spacing={2} sx={{ width: 'min(1080px, 100%)' }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={6} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <LockRoundedIcon color="primary" />
                <Typography variant="overline" fontWeight={700}>
                  관리자 로그인
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                사주 관리자 콘솔
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                현재는 인증 연동 전이므로 입력값과 상관없이 바로 대시보드로 이동합니다. 추후
                /api/admin/auth 연동 예정입니다.
              </Typography>
              <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                <TextField
                  label="아이디 / 유저네임"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  fullWidth
                />
                <TextField
                  label="비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.4 }}
                >
                  {loading ? '접속 중...' : '대시보드 입장'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  테스트 로그인: 입력값과 상관없이 바로 이동합니다.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
              color: 'primary.contrastText',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
              <Stack spacing={2} height="100%" justifyContent="space-between">
                <Stack spacing={1}>
                  <TrendingUpRoundedIcon fontSize="large" />
                  <Typography variant="h5" fontWeight={800}>
                    사주 프로필 운영
                  </Typography>
                  <Typography variant="body1">
                    관리자 인증을 통과하면 사주 프로필 목록을 조회하고, UID로 상세·이미지·풀이
                    결과를 확인할 수 있습니다.
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="overline">다음 액션</Typography>
                  <Typography variant="body2">
                    1) 로그인 후 사주 프로필 목록 확인
                    <br />
                    2) UID 검색 또는 선택해 상세 열람
                    <br />
                    3) 결과 텍스트 및 이미지 조회
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;
