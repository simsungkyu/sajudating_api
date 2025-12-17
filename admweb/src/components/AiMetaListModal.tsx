// Dialog component for displaying list of AI Meta by metaType
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useEffect, useState } from 'react';
import type { AIRequestType } from '../pages/AIMetaPage';
import { apiBase } from '../api';
import AIExecutionListModal from './AIExecutionListModal';

export interface AiMeta {
  id: string;
  uid: string;
  createdAt: number;
  updatedAt: number;
  metaType: string;
  name: string;
  desc: string;
  prompt: string;
}

export interface AiMetaListModalProps {
  open: boolean;
  token?: string;
  metaType: AIRequestType;
  onClose: () => void;
  onEdit?: (meta: AiMeta) => void;
}

const AiMetaListModal: React.FC<AiMetaListModalProps> = ({
  open,
  token,
  metaType,
  onClose,
  onEdit,
}) => {
  const [metas, setMetas] = useState<AiMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionListOpen, setExecutionListOpen] = useState(false);

  useEffect(() => {
    if (!open || !token) {
      setMetas([]);
      setError(null);
      return;
    }

    const fetchMetas = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = `
          query GetAiMetas($input: AiMetaSearchInput!) {
            aiMetas(input: $input) {
              ok
              nodes {
                ... on AiMeta {
                  id
                  uid
                  createdAt
                  updatedAt
                  metaType
                  name
                  desc
                  prompt
                }
              }
              total
            }
          }
        `;

        const variables = {
          input: {
            limit: 100,
            offset: 0,
            metaType: metaType,
          },
        };

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${apiBase}/admgql`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || '요청 실패');
        }

        const result = await res.json();

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'GraphQL 오류 발생');
        }

        if (result.data?.aiMetas?.ok) {
          const nodes = result.data.aiMetas.nodes || [];
          setMetas(nodes);
        } else {
          throw new Error('목록 조회 실패');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('목록 조회 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetas();
  }, [open, token, metaType]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (<>
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h6">AI 메타 목록</Typography>
          <Chip label={metaType} color="primary" variant="outlined" size="small" />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                로딩 중...
              </Typography>
            </Box>
          ) : metas.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {metaType} 타입의 AI 메타가 없습니다.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>이름</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>설명</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>UID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      작업
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metas.map((meta) => (
                    <TableRow key={meta.uid} hover>
                      <TableCell>{meta.name}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {meta.desc}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                          {meta.uid}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {onEdit ? (
                          <IconButton
                            size="small"
                            onClick={() => onEdit(meta)}
                            color="primary"
                            title="수정"
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          <Button
            onClick={() => setExecutionListOpen(true)}
            color="primary"
            disabled={loading}
            variant="outlined"
          >
            실행 목록
          </Button>
        </Box>
        <Box>
          <Button onClick={handleClose} color="inherit" disabled={loading}>
            닫기
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
    <AIExecutionListModal
      open={executionListOpen}
      token={token}
      metaType={metaType}
      onClose={() => setExecutionListOpen(false)}
    /></>
  );
};

export default AiMetaListModal;
