// AI Meta 페이지 - AI 메타정보 관리 및 기본 설정된 메타 정보 노출
// AI Requrest Type = Saju
export type AIRequestType = "Saju" | "FaceFeature" | "Phy" | "IdealPartnerImage"

import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { authAtom } from '../state/auth';
import AIMetaModal from '../components/AIMetaModal';
import AiMetaListModal, { type AiMeta } from '../components/AiMetaListModal';

export interface AIMetaPageProps {}

const AIMetaPage: React.FC<AIMetaPageProps> = () => {
  const auth = useAtomValue(authAtom);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [selectedMetaType, setSelectedMetaType] = useState<AIRequestType | null>(null);
  const [editMeta, setEditMeta] = useState<AiMeta | null>(null);

  const metaTypes: AIRequestType[] = ["Saju", "FaceFeature", "Phy", "IdealPartnerImage"];

  const handleOpenList = (metaType: AIRequestType) => {
    setSelectedMetaType(metaType);
    setListModalOpen(true);
  };

  const handleCloseList = () => {
    setListModalOpen(false);
    setSelectedMetaType(null);
  };

  const handleEdit = (meta: AiMeta) => {
    setEditMeta(meta);
    setListModalOpen(false);
  };

  const handleCloseEdit = () => {
    setEditMeta(null);
  };

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
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateModalOpen(true)}
                disabled={!auth?.token}
              >
                AI 메타 생성
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* 하단: 메타타입별 목록 영역 */}
      <Card elevation={1} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack spacing={3}>
            {metaTypes.map((metaType, index) => (
              <Box key={metaType}>
                <Stack 
                  direction="row" 
                  spacing={1.5} 
                  alignItems="center" 
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      label={metaType}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      기본 설정된 메타 정보
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ListRoundedIcon />}
                    onClick={() => handleOpenList(metaType)}
                    disabled={!auth?.token}
                  >
                    목록
                  </Button>
                </Stack>
                
                {/* Default AIMeta 정보 표시 영역 */}
                <Box
                  sx={{
                    p: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    minHeight: 120,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {metaType} 타입의 기본 AIMeta 정보가 여기에 표시됩니다.
                  </Typography>
                </Box>

                {index < metaTypes.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {auth?.token ? (
        <>
          <AIMetaModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            token={auth.token}
            onSaved={() => {
              setCreateModalOpen(false);
              // TODO: 목록 새로고침
            }}
          />
          {selectedMetaType && (
            <AiMetaListModal
              open={listModalOpen}
              onClose={handleCloseList}
              token={auth.token}
              metaType={selectedMetaType}
              onEdit={handleEdit}
            />
          )}
          {editMeta && (
            <AIMetaModal
              open={Boolean(editMeta)}
              onClose={handleCloseEdit}
              token={auth.token}
              meta={{
                uid: editMeta.uid,
                name: editMeta.name,
                desc: editMeta.desc,
                prompt: editMeta.prompt,
                metaType: editMeta.metaType,
              }}
              onSaved={() => {
                handleCloseEdit();
                // TODO: 목록 새로고침
              }}
            />
          )}
        </>
      ) : null}
    </Stack>
  );
};

export default AIMetaPage;
