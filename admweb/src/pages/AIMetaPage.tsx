// AI Meta 페이지 - AI 메타정보 관리 및 기본 설정된 메타 정보 노출

import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { useState } from 'react';
import AIMetaModal from '../components/AIMetaModal';
import AIMetaSetUseModal from '../components/AIMetaSetUseModal';

import { useAiMetasQuery, useDelAiMetaMutation, type AiMeta } from '../graphql/generated';

export interface AIMetaPageProps {}

const AIMetaPage: React.FC<AIMetaPageProps> = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editMeta, setEditMeta] = useState<AiMeta | null>(null);
  const [setUseMeta, setSetUseMeta] = useState<{ uid: string; metaType: string; name: string } | null>(null);
  const [deleteMeta, setDeleteMeta] = useState<{ uid: string; name: string; inUse: boolean } | null>(null);
  const [inUseFilter, setInUseFilter] = useState<boolean | undefined>(true);

  const { data, loading, error, refetch } = useAiMetasQuery({
    variables: {
      input: {
        limit: 1000,
        offset: 0,
        inUse: inUseFilter,
      },
    },
  });

  const [delAiMeta, { loading: deleteLoading }] = useDelAiMetaMutation();

  const handleEdit = (meta: AiMeta) => {
    setEditMeta(meta);
  };

  const handleCloseEdit = () => {
    setEditMeta(null);
  };

  const handleInUseFilterChange = (checked: boolean) => {
    setInUseFilter(checked ? true : undefined);
  };

  const handleSetUseClick = (uid: string, metaType: string, name: string) => {
    setSetUseMeta({ uid, metaType, name });
  };

  const handleCloseSetUse = () => {
    setSetUseMeta(null);
  };

  const handleDeleteClick = (uid: string, name: string, inUse: boolean) => {
    setDeleteMeta({ uid, name, inUse });
  };

  const handleCloseDelete = () => {
    setDeleteMeta(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteMeta) return;

    try {
      const { data: deleteData } = await delAiMeta({
        variables: { uid: deleteMeta.uid },
      });

      if (deleteData?.delAiMeta?.ok) {
        handleCloseDelete();
        refetch();
      } else {
        alert(deleteData?.delAiMeta?.msg || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // Filter only AiMeta nodes
  const metas = data?.aiMetas.nodes?.filter((node) => node.__typename === 'AiMeta') || [];

  return (
    <Stack spacing={2}>
      {/* 상단: 헤더 및 생성 버튼 */}
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <SmartToyRoundedIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                AI 메타정보 관리
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={inUseFilter === true}
                    onChange={(e) => handleInUseFilterChange(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">사용중만 표시</Typography>}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateModalOpen(true)}
              >
                AI 메타 생성
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* 하단: 전체 목록 테이블 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </Alert>
      )}

      {!loading && !error && (
        <Card elevation={1} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 60 }} align="center">사용</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>메타 타입</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>이름</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">수정일</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">
                          메타 정보가 없습니다.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    metas.map((meta) => {
                      if (meta.__typename !== 'AiMeta') return null;
                      return (
                        <TableRow
                          key={meta.uid}
                          hover
                          onClick={() => handleEdit({
                            uid: meta.uid,
                            id: meta.uid,
                            metaType: meta.metaType,
                            inUse: meta.inUse,
                            createdAt: meta.createdAt,
                            updatedAt: meta.updatedAt,
                            name: meta.name,
                            desc: meta.desc,
                            prompt: meta.prompt,
                            model: meta.model,
                            temperature: meta.temperature,
                            maxTokens: meta.maxTokens,
                            size: meta.size,
                          })}
                          sx={{
                            '&:hover': {
                              cursor: 'pointer',
                            },
                          }}
                        >
                          <TableCell
                            align="center"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!meta.inUse) {
                                handleSetUseClick(meta.uid, meta.metaType, meta.name);
                              }
                            }}
                            sx={{
                              cursor: meta.inUse ? 'default' : 'pointer',
                            }}
                          >
                            {meta.inUse ? (
                              <CheckCircleRoundedIcon
                                color="success"
                                fontSize="small"
                                titleAccess="사용중"
                              />
                            ) : (
                              <RadioButtonUncheckedRoundedIcon
                                color="disabled"
                                fontSize="small"
                                titleAccess="미사용 (클릭하여 기본설정)"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={meta.metaType}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {meta.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                              {meta.desc}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {new Date(meta.updatedAt).toLocaleDateString('ko-KR')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(meta.uid, meta.name, meta.inUse);
                              }}
                              title="삭제"
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <AIMetaModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />

      {editMeta && (
        <AIMetaModal
          open={Boolean(editMeta)}
          onClose={handleCloseEdit}
          meta={{
            uid: editMeta.uid,
            name: editMeta.name,
            desc: editMeta.desc,
            prompt: editMeta.prompt,
            metaType: editMeta.metaType,
            model: editMeta.model,
            temperature: editMeta.temperature,
            maxTokens: editMeta.maxTokens,
            size: editMeta.size,
            inUse: editMeta.inUse,
            createdAt: editMeta.createdAt,
            updatedAt: editMeta.updatedAt,
          }}
          onSaved={() => {
            handleCloseEdit();
            refetch();
          }}
        />
      )}

      {setUseMeta && (
        <AIMetaSetUseModal
          open={Boolean(setUseMeta)}
          onClose={handleCloseSetUse}
          metaUid={setUseMeta.uid}
          metaType={setUseMeta.metaType}
          metaName={setUseMeta.name}
          onSuccess={() => {
            handleCloseSetUse();
            refetch();
          }}
        />
      )}

      {deleteMeta && (
        <Dialog open={Boolean(deleteMeta)} onClose={handleCloseDelete}>
          <DialogTitle>AI 메타 삭제</DialogTitle>
          <DialogContent>
            {deleteMeta.inUse ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                <strong>{deleteMeta.name}</strong>은(는) 현재 사용 중인 메타입니다.
                <br />
                사용 중인 메타는 삭제할 수 없습니다.
              </Alert>
            ) : (
              <DialogContentText>
                <strong>{deleteMeta.name}</strong>을(를) 삭제하시겠습니까?
                <br />
                삭제된 데이터는 복구할 수 없습니다.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDelete} disabled={deleteLoading}>
              {deleteMeta.inUse ? '닫기' : '취소'}
            </Button>
            {!deleteMeta.inUse && (
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                color="error"
                disabled={deleteLoading}
                startIcon={deleteLoading ? <CircularProgress size={16} /> : null}
              >
                삭제
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
};

export default AIMetaPage;
