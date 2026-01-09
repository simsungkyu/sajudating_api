// Page component for admin dashboard
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import SxtwlTestModal from '../components/SxtwlTestModal';
import { useSystemStatsQuery } from '../graphql/generated';
import { authAtom } from '../state/auth';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const DashboardPage = () => {
  const auth = useAtomValue(authAtom);
  const [sxtwlModalOpen, setSxtwlModalOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { data: statsData } = useSystemStatsQuery({
    pollInterval: isMonitoring ? 1000 : 0,
    fetchPolicy: 'network-only',
  });

  const stats =
    statsData?.systemStats?.node?.__typename === 'SystemStats'
      ? statsData.systemStats.node
      : null;

  return (
    <Stack spacing={2}>
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
          >
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

      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <MonitorHeartIcon color="error" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              시스템 모니터링
            </Typography>
            {stats && (
              <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                Hostname: {stats.hostname}
              </Typography>
            )}
            <Tooltip title={isMonitoring ? '모니터링 중지' : '모니터링 시작'}>
              <IconButton
                onClick={() => setIsMonitoring(!isMonitoring)}
                color={isMonitoring ? 'primary' : 'default'}
                size="small"
              >
                {isMonitoring ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          {stats ? (
            <Stack spacing={2}>
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    CPU Usage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.cpuUsage.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={stats.cpuUsage}
                  color={stats.cpuUsage > 80 ? 'error' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    Memory Usage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(stats.memoryUsage)} /{' '}
                    {formatBytes(stats.memoryTotal)} (
                    {((stats.memoryUsage / stats.memoryTotal) * 100).toFixed(1)}
                    %)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(stats.memoryUsage / stats.memoryTotal) * 100}
                  color={
                    stats.memoryUsage / stats.memoryTotal > 0.8
                      ? 'error'
                      : 'primary'
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              시스템 정보를 불러오는 중...
            </Typography>
          )}
        </CardContent>
      </Card>

      <SxtwlTestModal
        open={sxtwlModalOpen}
        onClose={() => setSxtwlModalOpen(false)}
      />
    </Stack>
  );
};

export default DashboardPage;
