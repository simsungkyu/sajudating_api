// Page component for admin dashboard
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import {
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { authAtom } from '../state/auth';
import SxtwlTestModal from '../components/SxtwlTestModal';

const DashboardPage = () => {
  const auth = useAtomValue(authAtom);
  const [sxtwlModalOpen, setSxtwlModalOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <SpaceDashboardRoundedIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              관리자 대시보드
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            관리자 대시보드에 오신 것을 환영합니다.
          </Typography>
          {auth?.adminId && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              관리자: {auth.adminId}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSxtwlModalOpen(true)}
              disabled={!auth?.token}
            >
              Sxtwl 테스트
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {auth?.token && (
        <SxtwlTestModal
          open={sxtwlModalOpen}
          onClose={() => setSxtwlModalOpen(false)}
          token={auth.token}
        />
      )}
    </Stack>
  );
};

export default DashboardPage;
