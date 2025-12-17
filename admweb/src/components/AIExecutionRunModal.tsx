// Dialog component for running AI tests and viewing execution results
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
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiBase } from '../api';
import {
  useAiExecutionLazyQuery,
  useRunAiExecutionMutation,
  type RunAiExecutionMutationVariables,
} from '../graphql/generated';

export interface AIExecutionRunModalProps {
  open: boolean;
  token?: string;
  metaUid?: string;
  metaType?: string;
  executionUid?: string;
  meta?: {
    prompt?: string;
  };
  onClose: () => void;
}

interface ExecutionResult {
  uid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metaType?: string;
  prompt?: string;
  params?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  size?: string;
  outputText?: string;
  outputImage?: string;
  createdAt: string;
  updatedAt: string;
}

const AIExecutionRunModal: React.FC<AIExecutionRunModalProps> = ({
  open,
  token,
  metaUid,
  metaType,
  executionUid,
  meta,
  onClose,
}) => {
  const apolloClient = useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri: `${apiBase}/admgql`,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      cache: new InMemoryCache(),
    });
  }, [token]);

  return (
    <ApolloProvider client={apolloClient}>
      <AIExecutionRunModalInner
        open={open}
        token={token}
        metaUid={metaUid}
        metaType={metaType}
        executionUid={executionUid}
        meta={meta}
        onClose={onClose}
      />
    </ApolloProvider>
  );
};

const AIExecutionRunModalInner: React.FC<AIExecutionRunModalProps> = ({
  open,
  token,
  metaUid,
  metaType,
  executionUid,
  meta,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [params, setParams] = useState<string[]>(['']);
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [size, setSize] = useState('1024x1024');
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const [runAiExecutionMutation] = useRunAiExecutionMutation();
  const [fetchAiExecution] = useAiExecutionLazyQuery({ fetchPolicy: 'network-only' });

  const isViewMode = Boolean(executionUid);
  const isProcessing = execution?.status === 'pending' || execution?.status === 'processing';

  // Count %s occurrences in prompt
  const paramCount = (prompt.match(/%s/g) || []).length;
  const promptLabel = paramCount > 0 ? `프롬프트 (파라미터 ${paramCount}개)` : '프롬프트';

  // MetaType descriptions
  const metaTypeDescriptions: Record<string, string> = {
    Saju: '사주 분석 AI - 생년월일시, 성별, 팔자를 기반으로 사주 팔자를 분석합니다.',
    FaceFeature: '얼굴 특징 분석 AI - 얼굴 이미지에서 특징을 추출하고 분석합니다. (얼굴이미지 필요)',
    Phy: '신체 특징 분석 AI - 신체적 특징을 분석하고 평가합니다. (눈썹, 눈, 코, 입, 입술 묘사 정보필요)',
    IdealPartnerImage: '이상형 이미지 생성 AI - 설명을 바탕으로 이상형 이미지를 생성합니다.',
  };

  const currentMetaType = execution?.metaType || metaType;
  const metaTypeDescription = currentMetaType ? metaTypeDescriptions[currentMetaType] : null;

  // Check if current metaType is for image generation
  const isImageGeneration = currentMetaType === 'IdealPartnerImage';

  // Model options based on metaType
  const textModels = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ];

  const imageModels = [
    { value: 'dall-e-3', label: 'DALL-E 3' },
    { value: 'dall-e-2', label: 'DALL-E 2' },
    { value: 'stable-diffusion-xl', label: 'Stable Diffusion XL' },
  ];

  const availableModels = isImageGeneration ? imageModels : textModels;

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setParams(['']);
      const defaultModel = isImageGeneration ? 'dall-e-3' : 'gpt-4o';
      setModel(defaultModel);
      setTemperature(0.7);
      setMaxTokens(2000);
      setSize('1024x1024');
      setExecution(null);
      setSubmitting(false);
      setError(null);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    if (executionUid && token) {
      fetchExecution(executionUid);
    } else if (!executionUid && meta?.prompt) {
      // Set default prompt from meta when opening for test execution
      setPrompt(meta.prompt);
    }
  }, [open, executionUid, token, isImageGeneration, meta]);

  useEffect(() => {
    // Reset model when metaType changes
    if (open && !executionUid) {
      const defaultModel = isImageGeneration ? 'dall-e-3' : 'gpt-4o';
      setModel(defaultModel);
    }
  }, [isImageGeneration, open, executionUid]);

  useEffect(() => {
    // Start polling if execution is in progress
    if (isProcessing && execution?.uid && token && open) {
      const interval = setInterval(() => {
        fetchExecution(execution.uid);
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isProcessing, execution?.uid, token, open]);

  const fetchExecution = async (uid: string) => {
    if (!token) return;

    try {
      const result = await fetchAiExecution({ variables: { uid } });

      const node = result.data?.aiExecution?.node;
      if (result.data?.aiExecution?.ok && node?.__typename === 'AiExecution') {
        const executionData = node;
        setExecution({
          uid: executionData.uid,
          status: executionData.status as 'pending' | 'processing' | 'completed' | 'failed',
          metaType: executionData.metaType || undefined,
          prompt: executionData.prompt || undefined,
          params: executionData.params || undefined,
          model: executionData.model || undefined,
          temperature: executionData.temperature || undefined,
          maxTokens: executionData.maxTokens || undefined,
          size: executionData.size || undefined,
          outputText: executionData.outputText || undefined,
          outputImage: executionData.outputImage || undefined,
          createdAt: String(executionData.createdAt),
          updatedAt: String(executionData.updatedAt),
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('실행 결과를 불러오는 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim() || !metaUid || !metaType || !token) return;

    // Filter out empty params
    const filteredParams = params.filter(p => p.trim());

    // Check if param count matches %s count in prompt
    if (paramCount !== filteredParams.length) {
      setError(`프롬프트에 ${paramCount}개의 파라미터(%s)가 필요하지만 ${filteredParams.length}개가 입력되었습니다.`);
      return;
    }

    // Validate size format for image generation
    if (isImageGeneration && size) {
      const sizePattern = /^\d+x\d+$/;
      if (!sizePattern.test(size)) {
        setError('이미지 크기는 "너비x높이" 형식이어야 합니다 (예: 1024x1024)');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const variables: RunAiExecutionMutationVariables = {
        input: {
          metaUid,
          metaType,
          prompt: prompt.trim(),
          params: filteredParams,
          model,
          temperature,
          maxTokens,
          size,
        },
      };

      const result = await runAiExecutionMutation({ variables });

      if (result.data?.runAiExecution?.ok) {
        const uid = result.data.runAiExecution.uid;
        if (uid) {
          // Fetch the execution result
          await fetchExecution(uid);
        }
      } else {
        throw new Error(result.data?.runAiExecution?.msg || '실행 실패');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('실행 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddParam = () => {
    setParams([...params, '']);
  };

  const handleRemoveParam = (index: number) => {
    if (params.length > 1) {
      setParams(params.filter((_, i) => i !== index));
    }
  };

  const handleParamChange = (index: number, value: string) => {
    const newParams = [...params];
    newParams[index] = value;
    setParams(newParams);
  };

  const handleClose = () => {
    if (submitting || isProcessing) return;
    onClose();
  };

  const getStatusChip = (status: ExecutionResult['status']) => {
    switch (status) {
      case 'completed':
        return <Chip label="완료" color="success" size="small" />;
      case 'processing':
        return <Chip label="처리중" color="info" size="small" />;
      case 'pending':
        return <Chip label="대기중" color="warning" size="small" />;
      case 'failed':
        return <Chip label="실패" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isViewMode ? 'AI 실행 결과' : 'AI 테스트 실행'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {metaTypeDescription && (
            <Alert severity="info" sx={{ fontWeight: 500 }}>
              {metaTypeDescription}
            </Alert>
          )}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {!execution && !isViewMode ? (
            <Stack
              component="form"
              id="ai-execution-form"
              spacing={2.5}
              onSubmit={handleSubmit}
            >
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth required>
                  <InputLabel>모델</InputLabel>
                  <Select
                    value={model}
                    label="모델"
                    onChange={(e) => setModel(e.target.value)}
                    disabled={submitting}
                  >
                    {availableModels.map((modelOption) => (
                      <MenuItem key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {isImageGeneration ? (
                  <TextField
                    label="이미지 크기"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="예: 1024x1024, 1024x1792, 1792x1024"
                    required
                    fullWidth
                    disabled={submitting}
                    helperText="너비x높이 형식으로 입력하세요 (예: 256x256, 512x512, 768x768, 1024x1024, 1024x1792, 1792x1024)"
                  />
                ) : (
                  <>
                    <TextField
                      label="Temperature"
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      required
                      fullWidth
                      disabled={submitting}
                      inputProps={{ min: 0, max: 2, step: 0.1 }}
                    />

                    <TextField
                      label="Max Tokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      required
                      fullWidth
                      disabled={submitting}
                    />
                  </>
                )}
              </Stack>

              <TextField
                label={promptLabel}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI에게 전달할 프롬프트를 입력하세요 (%s를 사용하여 파라미터 삽입)"
                required
                fullWidth
                multiline
                rows={4}
                disabled={submitting}
                helperText="AI 요청 시 사용될 프롬프트 (%s는 파라미터로 치환됩니다)"
                slotProps={{
                  input: {
                    sx: {
                      '& textarea': {
                        resize: 'vertical',
                      },
                    },
                  },
                }}
              />

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    파라미터 {paramCount > 0 ? `(필요: ${paramCount}개)` : '(선택사항)'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleAddParam}
                    disabled={submitting}
                  >
                    추가
                  </Button>
                </Stack>
                <Stack spacing={1.5}>
                  {params.map((param, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <TextField
                        value={param}
                        onChange={(e) => handleParamChange(index, e.target.value)}
                        placeholder={`파라미터 ${index + 1}`}
                        fullWidth
                        disabled={submitting}
                        size="small"
                      />
                      {params.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveParam(index)}
                          disabled={submitting}
                          color="error"
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          ) : null}

          {execution ? (
            <Box>
              {isProcessing && <LinearProgress sx={{ mb: 2 }} />}

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    상태
                  </Typography>
                  {getStatusChip(execution.status)}
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    실행 시작
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(execution.createdAt)}
                  </Typography>
                </Box>

                {execution.updatedAt !== execution.createdAt && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      마지막 업데이트
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(execution.updatedAt)}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    프롬프트
                  </Typography>
                  <TextField
                    value={execution.prompt || ''}
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                    slotProps={{
                      input: {
                        sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    파라미터
                  </Typography>
                  <Stack spacing={0.5}>
                    {execution.params?.map((param, index) => (
                      <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {index + 1}. {param}
                      </Typography>
                    ))}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={3}>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      모델
                    </Typography>
                    <Typography variant="body2">{execution.model}</Typography>
                  </Box>
                  {execution.metaType === 'IdealPartnerImage' ? (
                    execution.size && (
                      <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          이미지 크기
                        </Typography>
                        <Typography variant="body2">{execution.size}</Typography>
                      </Box>
                    )
                  ) : (
                    <>
                      <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Temperature
                        </Typography>
                        <Typography variant="body2">{execution.temperature}</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Max Tokens
                        </Typography>
                        <Typography variant="body2">{execution.maxTokens}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>

                {execution.status === 'completed' && execution.outputText && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      실행 결과 (텍스트)
                    </Typography>
                    <TextField
                      value={execution.outputText}
                      fullWidth
                      multiline
                      rows={8}
                      disabled
                      slotProps={{
                        input: {
                          sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                        },
                      }}
                    />
                  </Box>
                )}

                {execution.status === 'completed' && execution.outputImage && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      실행 결과 (이미지)
                    </Typography>
                    <Box
                      component="img"
                      src={`data:image/png;base64,${execution.outputImage}`}
                      alt="Generated image"
                      sx={{
                        maxWidth: '100%',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Box>
                )}

                {execution.status === 'failed' && (
                  <Box>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      오류 발생
                    </Typography>
                    <Alert severity="error">실행이 실패했습니다.</Alert>
                  </Box>
                )}

                {isProcessing && (
                  <Alert severity="info">
                    AI 실행이 진행 중입니다. 잠시만 기다려주세요...
                  </Alert>
                )}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={submitting || isProcessing}
        >
          {isProcessing ? '처리중...' : '닫기'}
        </Button>
        {!execution && !isViewMode ? (
          <Button
            variant="contained"
            type="submit"
            form="ai-execution-form"
            disabled={!prompt.trim() || submitting}
          >
            {submitting ? '실행 중...' : '테스트 실행'}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default AIExecutionRunModal;
