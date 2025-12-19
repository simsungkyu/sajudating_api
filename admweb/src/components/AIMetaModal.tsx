// Dialog component for creating and editing AI Meta
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import AIExecutionListModal from './AIExecutionListModal';
import AIExecutionRunModal from './AIExecutionRunModal';
import { useGetAiMetaTypesQuery, usePutAiMetaMutation } from '../graphql/generated';
import { TEXT_MODELS, IMAGE_MODELS, IMAGE_SIZES, VISION_MODELS } from '../types';

export interface AIMetaModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (uid: string) => void;
  meta?: {
    uid?: string;
    name?: string;
    desc?: string;
    prompt?: string;
    metaType?: string;
    inUse?: boolean;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    size?: string;
    createdAt?: number;
    updatedAt?: number;
  } | null;
}

const AIMetaModal: React.FC<AIMetaModalProps> = ({
  open,
  onClose,
  onSaved,
  meta,
}) => {
  const isEditMode = Boolean(meta?.uid);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [prompt, setPrompt] = useState('');
  const [metaType, setMetaType] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [size, setSize] = useState<string>('1024x1024');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionListOpen, setExecutionListOpen] = useState(false);
  const [executionRunOpen, setExecutionRunOpen] = useState(false);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch AI meta types using Apollo hook
  const { data: metaTypesData, loading: metaTypesLoading } = useGetAiMetaTypesQuery();
  const metaTypesMap = metaTypesData?.aiMetaTypes?.nodes
    ?.filter(node => node && '__typename' in node && node.__typename === 'AiMetaType')
    .reduce((acc, node) => {
      if (node && '__typename' in node && node.__typename === 'AiMetaType') {
        acc[node.type] = {
          inputFields: node.inputFields || [],
          outputFields: node.outputFields || [],
          hasInputImage: node.hasInputImage,
          hasOutputImage: node.hasOutputImage,
        };
      }
      return acc;
    }, {} as Record<string, { inputFields: string[]; outputFields: string[]; hasInputImage: boolean; hasOutputImage: boolean }>) || {};

  const metaTypes = Object.keys(metaTypesMap);

  // Determine if current metaType is for image generation or vision input
  const hasInputImage = metaType && metaTypesMap[metaType]?.hasInputImage;
  const hasOutputImage = metaType && metaTypesMap[metaType]?.hasOutputImage;
  const availableModels = hasInputImage
    ? VISION_MODELS
    : (hasOutputImage ? IMAGE_MODELS : TEXT_MODELS);

  // Apollo mutation hook
  const [putAiMetaMutation] = usePutAiMetaMutation();

  const canSubmit = Boolean(name.trim()) && Boolean(desc.trim()) && Boolean(prompt.trim()) && Boolean(metaType) && Boolean(model);

  useEffect(() => {
    if (!open) {
      setName('');
      setDesc('');
      setPrompt('');
      setMetaType('');
      setModel('');
      setTemperature(0.7);
      setMaxTokens(1000);
      setSize('1024x1024');
      setSubmitting(false);
      setError(null);
      return;
    }

    if (isEditMode && meta) {
      setName(meta.name ?? '');
      setDesc(meta.desc ?? '');
      setPrompt(meta.prompt ?? '');
      setMetaType(meta.metaType ?? '');
      setModel(meta.model ?? '');
      setTemperature(meta.temperature ?? 0.7);
      setMaxTokens(meta.maxTokens ?? 1000);
      setSize(meta.size ?? '1024x1024');
    }
  }, [open, isEditMode, meta]);

  // Reset model when metaType changes (only in create mode)
  useEffect(() => {
    if (metaType && !isEditMode) {
      const hasInput = metaTypesMap[metaType]?.hasInputImage;
      const hasOutput = metaTypesMap[metaType]?.hasOutputImage;
      const newAvailableModels = hasInput
        ? VISION_MODELS
        : (hasOutput ? IMAGE_MODELS : TEXT_MODELS);
      if (newAvailableModels.length > 0) {
        setModel(newAvailableModels[0].value);
      }
    }
  }, [metaType, isEditMode, metaTypesMap]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleParamChipClick = (param: string) => {
    const textarea = promptInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + `{{${param}}}` + after;

    setPrompt(newText);

    // 커서를 삽입된 텍스트 뒤로 이동
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + param.length + 4; // {{}}의 길이 4를 더함
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Get current parameters based on selected metaType
  const currentParams = metaType && metaTypesMap[metaType]
    ? [...metaTypesMap[metaType].inputFields, ...metaTypesMap[metaType].outputFields]
    : [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !metaType || !model) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await putAiMetaMutation({
        variables: {
          input: {
            uid: isEditMode ? meta?.uid : undefined,
            name: name.trim(),
            desc: desc.trim(),
            prompt: prompt.trim(),
            metaType: metaType,
            model: model,
            temperature: temperature,
            maxTokens: maxTokens,
            size: size,
          },
        },
      });

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
      maxWidth="xl"
      PaperProps={{ sx: { xs: { borderRadius: 0 }, sm: { borderRadius: 0 }, md: { borderRadius: 3 }, lg: { borderRadius: 3 }, xl: { borderRadius: 3 } } }}
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
              onChange={(e) => setMetaType(e.target.value)}
              disabled={submitting || isEditMode || metaTypesLoading}
            >
              {metaTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
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

          <FormControl required fullWidth>
            <InputLabel>모델</InputLabel>
            <Select
              value={model}
              label="모델"
              onChange={(e) => setModel(e.target.value)}
              disabled={submitting || !metaType}
            >
              {/* Show current model if it's not in the available list (edit mode) */}
              {isEditMode && model && !availableModels.some(m => m.value === model) && (
                <MenuItem value={model}>
                  {model} (현재 설정된 모델)
                </MenuItem>
              )}
              {availableModels.map((modelOption) => (
                <MenuItem key={modelOption.value} value={modelOption.value}>
                  {modelOption.label}
                </MenuItem>
              ))}
            </Select>
            {metaType && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {hasInputImage
                  ? '📷 이미지 입력이 필요한 타입으로 Vision 모델만 사용 가능합니다.'
                  : hasOutputImage
                  ? '🎨 이미지 생성 타입으로 Image 모델만 사용 가능합니다.'
                  : '📝 텍스트 처리 타입으로 Text 모델만 사용 가능합니다.'}
              </Typography>
            )}
          </FormControl>

          {!hasOutputImage ? (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                slotProps={{ htmlInput: { min: 0, max: 2, step: 0.1 } }}
                fullWidth
                disabled={submitting}
                helperText="0.0 ~ 2.0 (낮을수록 일관적, 높을수록 창의적)"
              />
              <TextField
                label="Max Tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 4096, step: 1 } }}
                fullWidth
                disabled={submitting}
                helperText="응답의 최대 토큰 수"
              />
            </Stack>
          ) : (
            <FormControl fullWidth>
              <InputLabel>이미지 크기</InputLabel>
              <Select
                value={size}
                label="이미지 크기"
                onChange={(e) => setSize(e.target.value)}
                disabled={submitting}
              >
                {IMAGE_SIZES.map((sizeOption) => (
                  <MenuItem key={sizeOption.value} value={sizeOption.value}>
                    {sizeOption.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {currentParams.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                사용 가능한 파라미터 (클릭하여 프롬프트에 추가)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {currentParams.map((param) => (
                  <Chip
                    key={param}
                    label={param}
                    onClick={() => handleParamChipClick(param)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            label="프롬프트"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="AI 프롬프트를 입력하세요"
            required
            fullWidth
            multiline
            rows={15}
            disabled={submitting}
            helperText="AI 요청 시 사용될 프롬프트 템플릿을 입력하세요. 파라미터는 {{파라미터명}} 형식으로 사용됩니다."
            inputRef={promptInputRef}
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
          <Button onClick={() => {
            // TODO Develop this feature 
            // 생성시에는 본 버튼 미노출, 수정시에는 본 버튼 출력
            // 본 버튼 클릭시에는 새로운 메타로 현재 폼의 내용을 저장한뒤, 새로운 메타 폼을 열어준다
          }} variant='outlined'  color="secondary" disabled={submitting}>새로운 메타로 생성</Button>
          <Button onClick={handleClose} color="inherit" disabled={submitting}>
            닫기
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
      metaUid={meta?.uid}
      onClose={() => setExecutionListOpen(false)}
    />
    <AIExecutionRunModal
      open={executionRunOpen}
      metaUid={meta?.uid}
      metaType={meta?.metaType}
      meta={meta ? {
        prompt: meta.prompt,
        model: meta.model,
        temperature: meta.temperature,
        maxTokens: meta.maxTokens,
        size: meta.size,
      } : undefined}
      onClose={() => setExecutionRunOpen(false)}
    /></>
  );
};

export default AIMetaModal;
