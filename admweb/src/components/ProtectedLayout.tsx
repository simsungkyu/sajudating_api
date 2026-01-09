import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
} from '@mui/material';
import { useAtom } from 'jotai';
import { Link as RouterLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authAtom } from '../state/auth';

const ProtectedLayout = () => {
  const [auth, setAuth] = useAtom(authAtom);
  const location = useLocation();
  const navigate = useNavigate();

  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = () => {
    setAuth(null);
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{ backdropFilter: 'blur(10px)', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Button
            color="primary"
            startIcon={<SpaceDashboardRoundedIcon />}
            onClick={() => navigate('/')}
            sx={{ fontWeight: 700 }}
          >
            Saju Admin
          </Button>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1, flexWrap: 'wrap' }}>
            <Button component={RouterLink} to="/saju-profiles" color="inherit">
              사주 프로필
            </Button>
            <Button component={RouterLink} to="/phy-partners" color="inherit">
              관상 파트너
            </Button>
            <Button component={RouterLink} to="/ai-meta" color="inherit" startIcon={<SmartToyRoundedIcon />}>
              AI 메타
            </Button>
            <Button component={RouterLink} to="/local-logs" color="inherit" startIcon={<DescriptionRoundedIcon />}>
              로그
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" color="inherit" disabled>
              관리자: {auth.adminId ?? 'admin'}
            </Button>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/')}>
              대시보드
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4, pb: 8 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default ProtectedLayout;
