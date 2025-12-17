// Dialog component for creating and editing AI Meta
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState, type FormEvent } from 'react';
import type { AIRequestType } from '../pages/AIMetaPage';
import { apiBase } from '../api';
import AIExecutionListModal from './AIExecutionListModal';
import AIExecutionRunModal from './AIExecutionRunModal';

export interface AIMetaModalProps {
  open: boolean;
  token?: string;
  onClose: () => void;
  onSaved?: (uid: string) => void;
  meta?: {
    uid?: string;
    name?: string;
    desc?: string;
    prompt?: string;
    metaType?: string;
  } | null;
}

const AIMetaModal: React.FC<AIMetaModalProps> = ({
  open,
  token,
  onClose,
  onSaved,
  meta,
}) => {
  const isEditMode = Boolean(meta?.uid);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [prompt, setPrompt] = useState('');
  const [metaType, setMetaType] = useState<AIRequestType | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionListOpen, setExecutionListOpen] = useState(false);
  const [executionRunOpen, setExecutionRunOpen] = useState(false);

  const canSubmit = Boolean(name.trim()) && Boolean(desc.trim()) && Boolean(prompt.trim()) && Boolean(metaType);

  useEffect(() => {
    if (!open) {
      setName('');
      setDesc('');
      setPrompt('');
      setMetaType('');
      setSubmitting(false);
      setError(null);
      return;
    }

    if (isEditMode && meta) {
      setName(meta.name ?? '');
      setDesc(meta.desc ?? '');
      setPrompt(meta.prompt ?? '');
      setMetaType((meta.metaType as AIRequestType) ?? '');
    }
  }, [open, isEditMode, meta]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !metaType || !token) return;

    setSubmitting(true);
    setError(null);

    try {
      const mutation = `
        mutation PutAiMeta($input: AiMetaInput!) {
          putAiMeta(input: $input) {
            ok
            uid
            msg
          }
        }
      `;

      const variables = {
        input: {
          uid: isEditMode ? meta?.uid : undefined,
          name: name.trim(),
          desc: desc.trim(),
          prompt: prompt.trim(),
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
          query: mutation,
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

      if (result.data?.putAiMeta?.ok) {
        const uid = result.data.putAiMeta.uid || meta?.uid;
        if (uid) {
          onSaved?.(uid);
        }
        onClose();
      } else {
        throw new Error(result.data?.putAiMeta?.msg || '저장 실패');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('저장 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (<>
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEditMode ? 'AI 메타 수정' : 'AI 메타 생성'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="ai-meta-form"
          spacing={2.5}
          onSubmit={handleSubmit}
          sx={{ pt: 1 }}
        >
          {error ? <Alert severity="error">{error}</Alert> : null}

          <FormControl required fullWidth>
            <InputLabel>메타 타입</InputLabel>
            <Select
              value={metaType}
              label="메타 타입"
              onChange={(e) => setMetaType(e.target.value as AIRequestType)}
              disabled={submitting || isEditMode}
            >
              <MenuItem value="Saju">Saju</MenuItem>
              <MenuItem value="FaceFeature">FaceFeature</MenuItem>
              <MenuItem value="Phy">Phy</MenuItem>
              <MenuItem value="IdealPartnerImage">IdealPartnerImage</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AI 메타 이름을 입력하세요"
            required
            fullWidth
            disabled={submitting}
          />

          <TextField
            label="설명"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="AI 메타 설명을 입력하세요"
            required
            fullWidth
            multiline
            rows={3}
            disabled={submitting}
          />

          <TextField
            label="프롬프트"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="AI 프롬프트를 입력하세요"
            required
            fullWidth
            multiline
            rows={8}
            disabled={submitting}
            helperText="AI 요청 시 사용될 프롬프트 템플릿을 입력하세요"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditMode && (
            <>
              <Button
                onClick={() => setExecutionRunOpen(true)}
                color="success"
                disabled={submitting}
                variant="outlined"
              >
                테스트 실행
              </Button>
              <Button
                onClick={() => setExecutionListOpen(true)}
                color="primary"
                disabled={submitting}
                variant="outlined"
              >
                실행 목록
              </Button>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} color="inherit" disabled={submitting}>
            취소
          </Button>
          <Button
            variant="contained"
            type="submit"
            form="ai-meta-form"
            disabled={!canSubmit || submitting}
          >
            {submitting ? (isEditMode ? '저장 중...' : '생성 중...') : isEditMode ? '저장' : '생성'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
    <AIExecutionListModal
      open={executionListOpen}
      token={token}
      metaUid={meta?.uid}
      onClose={() => setExecutionListOpen(false)}
    />
    <AIExecutionRunModal
      open={executionRunOpen}
      token={token}
      metaUid={meta?.uid}
      metaType={meta?.metaType}
      meta={meta ? { prompt: meta.prompt } : undefined}
      onClose={() => setExecutionRunOpen(false)}
    /></>
  );
};

export default AIMetaModal;
