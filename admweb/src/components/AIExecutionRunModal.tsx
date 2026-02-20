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
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import { useEffect, useState, useRef, useMemo, type FormEvent } from 'react';
import {
  useAiExecutionLazyQuery,
  useRunAiExecutionMutation,
  useGetAiMetaTypesQuery,
  useGetAiMetaKVsLazyQuery,
  type RunAiExecutionMutationVariables,
} from '../graphql/generated';
import { TEXT_MODELS, IMAGE_MODELS, IMAGE_SIZES, VISION_MODELS } from '../types';
import AIExecutionViewModal from './AIExecutionViewModal';

export interface AIExecutionRunModalProps {
  open: boolean;
  metaUid?: string;
  metaType?: string;
  executionUid?: string;
  meta?: {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    size?: string;
  };
  onClose: () => void;
}

interface ExecutionResult {
  uid: string;
  status: string;
  metaType?: string;
  prompt?: string;
  valuedPrompt?: string;
  params?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  size?: string;
  inputImageBase64?: string;
  outputText?: string;
  errorText?: string;
  outputImageBase64?: string;
  createdAt: string;
  updatedAt: string;
}

const AIExecutionRunModal: React.FC<AIExecutionRunModalProps> = ({
  open,
  metaUid,
  metaType,
  executionUid,
  meta,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [inputParams, setInputParams] = useState<Record<string, string>>({});
  const [outputParams, setOutputParams] = useState<Record<string, string>>({});
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [size, setSize] = useState('1024x1024');
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'both' | 'preview'>('both');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);
  const [viewDetailUid, setViewDetailUid] = useState<string | null>(null);

  const [runAiExecutionMutation] = useRunAiExecutionMutation();
  const [fetchAiExecution] = useAiExecutionLazyQuery({ fetchPolicy: 'network-only' });
  const { data: metaTypesData } = useGetAiMetaTypesQuery();
  const [fetchAiMetaKVs] = useGetAiMetaKVsLazyQuery({ fetchPolicy: 'network-only' });

  const isViewMode = Boolean(executionUid);
  const hasOutput = Boolean(execution?.outputText) || Boolean(execution?.outputImageBase64);
  const isProcessing = (execution?.status === 'running' || execution?.status === 'pending' || execution?.status === 'processing')
    && !hasOutput;
  const isCompleted = execution?.status === 'done' || execution?.status === 'completed' || hasOutput;

  // Get input and output fields from metaType query
  const metaTypeInfo = useMemo(() => {
    return metaTypesData?.aiMetaTypes?.nodes
      ?.find(node => node.__typename === 'AiMetaType' && node.type === metaType);
  }, [metaTypesData, metaType]);

  const inputFields = useMemo(() => {
    return metaTypeInfo?.__typename === 'AiMetaType' ? metaTypeInfo.inputFields : [];
  }, [metaTypeInfo]);

  const outputFields = useMemo(() => {
    return metaTypeInfo?.__typename === 'AiMetaType' ? metaTypeInfo.outputFields : [];
  }, [metaTypeInfo]);

  const hasInputImage = metaTypeInfo?.__typename === 'AiMetaType' ? metaTypeInfo.hasInputImage : false;
  const hasOutputImage = metaTypeInfo?.__typename === 'AiMetaType' ? metaTypeInfo.hasOutputImage : false;

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
  const isImageGeneration = hasOutputImage;

  // Model options based on metaType (from types.ts)
  const availableModels = hasInputImage
    ? VISION_MODELS
    : (isImageGeneration ? IMAGE_MODELS : TEXT_MODELS);

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setInputParams({});
      setOutputParams({});
      setInputImage(null);
      const defaultModel = hasInputImage
        ? (VISION_MODELS[0]?.value || 'gpt-4o-mini')
        : (isImageGeneration
          ? (IMAGE_MODELS[0]?.value || 'gpt-image-1-mini')
          : (TEXT_MODELS[0]?.value || 'gpt-4.1-mini'));
      setModel(defaultModel);
      setTemperature(0.7);
      setMaxTokens(2000);
      setSize('1024x1024');
      setExecution(null);
      setSubmitting(false);
      setError(null);
      setViewDetailOpen(false);
      setViewDetailUid(null);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    if (executionUid) {
      fetchExecution(executionUid);
    } else if (!executionUid && meta) {
      // Set values from meta when opening for test execution
      if (meta.prompt) {
        setPrompt(meta.prompt);
      }
      if (meta.model) {
        setModel(meta.model);
      }
      if (meta.temperature !== undefined) {
        setTemperature(meta.temperature);
      }
      if (meta.maxTokens !== undefined) {
        setMaxTokens(meta.maxTokens);
      }
      if (meta.size) {
        setSize(meta.size);
      }
    }
  }, [open, executionUid, hasInputImage, isImageGeneration, meta]);

  // Separate effect for initializing input params based on metaType
  useEffect(() => {
    if (open && !executionUid && inputFields.length > 0) {
      const initialParams: Record<string, string> = {};

      // Default values mapping
      const defaultValues: Record<string, string> = {
        sex: 'male',
        gender: 'male',
        birthdate: '19900101',
        birth: '19900101',
        palja: '庚午 戊寅 甲子 丙寅',
        featureEyes: '쌍꺼풀이 있는 큰 눈',
        featureNose: '오똑한 콧날',
        featureMouth: '도톰한 입술',
        featureFaceShape: '계란형 얼굴',
        featureEyebrows: '진한 일자 눈썹',
        featureLips: '도톰하고 붉은 입술',
        personalityMatch: '밝고 긍정적인 성격',
        summary: '이상형에 대한 간단한 설명',
        age: '30',
        notes: '기타 특징',
      };

      inputFields.forEach(field => {
        const fieldLower = field.toLowerCase();

        // Find matching default value
        let defaultValue = '';
        for (const [key, value] of Object.entries(defaultValues)) {
          if (fieldLower.includes(key)) {
            defaultValue = value;
            break;
          }
        }

        initialParams[field] = defaultValue || '테스트';
      });

      setInputParams(initialParams);
    }
  }, [open, executionUid, metaType]);

  useEffect(() => {
    // Reset model when metaType changes
    if (open && !executionUid) {
      const defaultModel = hasInputImage
        ? (VISION_MODELS[0]?.value || 'gpt-4o-mini')
        : (isImageGeneration
          ? (IMAGE_MODELS[0]?.value || 'dall-e-3')
          : (TEXT_MODELS[0]?.value || 'gpt-4.1-mini'));
      setModel(defaultModel);
    }
  }, [hasInputImage, isImageGeneration, open, executionUid]);

  useEffect(() => {
    // Start polling if execution is in progress
    if (isProcessing && execution?.uid && open) {
      const interval = setInterval(() => {
        fetchExecution(execution.uid);
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
        setPollingInterval(null);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isProcessing, execution?.uid, open]);

  // Open detail view when execution is completed
  useEffect(() => {
    if (isCompleted && execution?.uid && !viewDetailOpen && open) {
      setViewDetailUid(execution.uid);
      setViewDetailOpen(true);
    }
  }, [isCompleted, execution?.uid, viewDetailOpen, open]);

  const fetchExecution = async (uid: string) => {
    try {
      const result = await fetchAiExecution({ variables: { uid } });

      const node = result.data?.aiExecution?.node;
      if (result.data?.aiExecution?.ok && node?.__typename === 'AiExecution') {
        const executionData = node;
        const inputParams = executionData.inputkvs?.map(kv => `input.${kv.k}: ${kv.v}`) ?? [];
        const outputParams = executionData.outputkvs?.map(kv => `output.${kv.k}: ${kv.v}`) ?? [];
        const params = [...inputParams, ...outputParams];

        setExecution({
          uid: executionData.uid,
          status: executionData.status,
          metaType: executionData.metaType || undefined,
          prompt: executionData.prompt || undefined,
          valuedPrompt: executionData.valued_prompt || undefined,
          params: params.length > 0 ? params : undefined,
          model: executionData.model || undefined,
          temperature: executionData.temperature || undefined,
          maxTokens: executionData.maxTokens || undefined,
          size: executionData.size || undefined,
          inputImageBase64: executionData.inputImageBase64 || undefined,
          outputText: executionData.outputText || undefined,
          errorText: executionData.errorMessage || undefined,
          outputImageBase64: executionData.outputImageBase64 || undefined,
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

  const handleGenerateParams = async () => {
    if (!metaType) {
      setError('메타 타입이 설정되지 않았습니다.');
      return;
    }

    // Validate all required input params are filled
    const missingFields = inputFields.filter(field => !inputParams[field]?.trim());
    if (missingFields.length > 0) {
      setError(`다음 필드를 입력해주세요: ${missingFields.join(', ')}`);
      return;
    }

    try {
      // Convert input params to KV array format
      const kvs = Object.entries(inputParams).map(([k, v]) => ({ k, v }));

      const result = await fetchAiMetaKVs({
        variables: {
          input: {
            type: metaType,
            kvs,
          },
        },
      });

      if (result.data?.aiMetaKVs?.ok && result.data?.aiMetaKVs?.kvs) {
        // Store all KV pairs from the response (including input params and any additional fields)
        const generatedOutputs: Record<string, string> = {};
        result.data.aiMetaKVs.kvs.forEach(kv => {
          generatedOutputs[kv.k] = kv.v;
        });
        setOutputParams(generatedOutputs);
        setError(null);
      } else {
        throw new Error(result.data?.aiMetaKVs?.msg || '샘플 생성 실패');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('샘플 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleInputParamChange = (field: string, value: string) => {
    setInputParams(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('이미지 파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64Data = base64.split(',')[1];
      setInputImage(base64Data);
      setError(null);
    };
    reader.onerror = () => {
      setError('이미지 파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setInputImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Replace {{paramName}} in prompt with actual values
  const getPreviewPrompt = () => {
    let previewPrompt = prompt;

    // Replace input parameters first
    Object.entries(inputParams).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewPrompt = previewPrompt.replace(regex, value || `{{${key}}}`);
    });

    // Replace output parameters with generated values
    Object.entries(outputParams).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewPrompt = previewPrompt.replace(regex, value || `{{${key}}}`);
    });

    return previewPrompt;
  };

  // Insert parameter into prompt at cursor position
  const handleParamChipClick = (paramName: string) => {
    const textarea = promptInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const paramText = `{{${paramName}}}`;
    const newText = before + paramText + after;

    setPrompt(newText);

    // Move cursor after inserted parameter
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + paramText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim() || !metaUid || !metaType) return;

    // Validate all required input params are filled
    const missingFields = inputFields.filter(field => !inputParams[field]?.trim());
    if (missingFields.length > 0) {
      setError(`다음 필드를 입력해주세요: ${missingFields.join(', ')}`);
      return;
    }

    // Validate input image if required
    if (hasInputImage && !inputImage) {
      setError('입력 이미지를 업로드해주세요.');
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
      const valuedPrompt = getPreviewPrompt().trim();
      const promptType = hasOutputImage ? 'image' : (hasInputImage ? 'vision' : 'text');
      const inputkvs = inputFields.map(field => ({
        k: field,
        v: inputParams[field] ?? '',
      }));
      const outputkvs = [
        ...outputFields.map(field => ({
          k: field,
          v: outputParams[field] ?? '',
        })),
        ...Object.entries(outputParams)
          .filter(([field]) => !inputFields.includes(field) && !outputFields.includes(field))
          .map(([k, v]) => ({ k, v })),
      ];

      const variables: RunAiExecutionMutationVariables = {
        input: {
          metaUid,
          metaType,
          promptType,
          prompt: valuedPrompt || prompt.trim(),
          valued_prompt: valuedPrompt || prompt.trim(),
          inputkvs,
          outputkvs,
          model,
          temperature,
          maxTokens,
          size,
          inputImageBase64: hasInputImage ? inputImage : undefined,
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

  const handleClose = () => {
    if (submitting || isProcessing) return;
    onClose();
  };

  const getStatusChip = (status: ExecutionResult['status']) => {
    switch (status) {
      case 'done':
      case 'completed':
        return <Chip label="완료" color="success" size="small" />;
      case 'running':
      case 'processing':
        return <Chip label="처리중" color="info" size="small" />;
      case 'pending':
        return <Chip label="대기중" color="warning" size="small" />;
      case 'failed':
        return <Chip label="실패" color="error" size="small" />;
      default:
        return <Chip label={status || '-'} size="small" />;
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
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
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
                  <FormControl fullWidth required>
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
                      slotProps={{ htmlInput: { min: 0, max: 2, step: 0.1 } }}
                    />

                    <TextField
                      label="Max Tokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      required
                      fullWidth
                      disabled={submitting}
                      slotProps={{ htmlInput: { min: 1, max: 4096, step: 1 } }}
                    />
                  </>
                )}
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box flex={hasInputImage ? 1 : undefined} width={hasInputImage ? undefined : '100%'}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    입력 파라미터 {inputFields.length > 0 && `(${inputFields.length}개 필수)`}
                  </Typography>
                  {inputFields.length > 0 ? (
                    <Stack spacing={1.5}>
                      {inputFields.map((field) => (
                        <TextField
                          key={field}
                          label={field}
                          value={inputParams[field] || ''}
                          onChange={(e) => handleInputParamChange(field, e.target.value)}
                          placeholder={`${field} 값을 입력하세요`}
                          fullWidth
                          required
                          disabled={submitting}
                          size="small"
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      입력 파라미터가 없습니다.
                    </Typography>
                  )}
                </Box>

                {hasInputImage && (
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      입력 이미지 {hasInputImage && '(필수)'}
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: inputImage ? 'success.main' : 'divider',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                        minHeight: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {inputImage ? (
                        <Stack spacing={1} width="100%">
                          <Box
                            component="img"
                            src={`data:image/png;base64,${inputImage}`}
                            alt="Uploaded"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 200,
                              objectFit: 'contain',
                              borderRadius: 1,
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={handleRemoveImage}
                            disabled={submitting}
                          >
                            이미지 제거
                          </Button>
                        </Stack>
                      ) : (
                        <Stack spacing={2}>
                          <Typography variant="body2" color="text.secondary">
                            클릭하여 이미지를 업로드하세요
                          </Typography>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            disabled={submitting}
                          />
                          <Button
                            variant="outlined"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={submitting}
                          >
                            이미지 선택
                          </Button>
                          <Typography variant="caption" color="text.secondary">
                            최대 10MB, JPG/PNG/GIF 등
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Box>
                )}
              </Stack>

              {outputFields.length > 0 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      출력 파라미터 (클릭하여 프롬프트에 삽입)
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleGenerateParams}
                      disabled={submitting}
                    >
                      샘플 생성
                    </Button>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {/* 1. Display input parameters from KV */}
                    {inputFields.map((field) => {
                      const value = outputParams[field];
                      if (!value) return null;

                      return (
                        <Chip
                          key={`input-${field}`}
                          label={`${field}: ${value}`}
                          onClick={() => handleParamChipClick(field)}
                          variant="outlined"
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            maxWidth: '100%',
                            bgcolor: 'white',
                            color: 'text.primary',
                            borderColor: 'success.main',
                            borderWidth: 2,
                            '& .MuiChip-label': {
                              display: 'block',
                              whiteSpace: 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                            '&:hover': {
                              bgcolor: 'white',
                              borderColor: 'success.dark',
                            },
                          }}
                        />
                      );
                    })}

                    {/* 2. Display output parameters from KV */}
                    {outputFields.map((field) => {
                      const value = outputParams[field];

                      return (
                        <Chip
                          key={`output-${field}`}
                          label={value ? `${field}: ${value}` : field}
                          onClick={() => handleParamChipClick(field)}
                          variant="outlined"
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            maxWidth: '100%',
                            bgcolor: 'white',
                            color: 'text.primary',
                            borderColor: 'primary.main',
                            borderWidth: 2,
                            borderStyle: value ? 'solid' : 'dashed',
                            '& .MuiChip-label': {
                              display: 'block',
                              whiteSpace: 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                            '&:hover': {
                              bgcolor: 'white',
                              borderColor: 'primary.dark',
                            },
                          }}
                        />
                      );
                    })}

                    {/* 3. Display additional KV fields not in inputFields or outputFields */}
                    {Object.entries(outputParams)
                      .filter(([field]) => !inputFields.includes(field) && !outputFields.includes(field))
                      .map(([field, value]) => (
                        <Chip
                          key={`additional-${field}`}
                          label={`${field}: ${value}`}
                          onClick={() => handleParamChipClick(field)}
                          variant="outlined"
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            maxWidth: '100%',
                            bgcolor: 'white',
                            color: 'text.primary',
                            borderColor: 'secondary.main',
                            borderWidth: 2,
                            '& .MuiChip-label': {
                              display: 'block',
                              whiteSpace: 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                            '&:hover': {
                              bgcolor: 'white',
                              borderColor: 'secondary.dark',
                            },
                          }}
                        />
                      ))}
                  </Box>
                </Box>
              )}

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    프롬프트
                  </Typography>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => {
                      if (newMode !== null) {
                        setViewMode(newMode);
                      }
                    }}
                    size="small"
                  >
                    <ToggleButton value="edit">편집</ToggleButton>
                    <ToggleButton value="both">Both</ToggleButton>
                    <ToggleButton value="preview">미리보기</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                {viewMode === 'edit' && (
                  <TextField
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="AI에게 전달할 프롬프트를 입력하세요 ({{파라미터명}} 형식으로 파라미터 삽입)"
                    required
                    fullWidth
                    multiline
                    rows={6}
                    disabled={submitting}
                    inputRef={promptInputRef}
                    helperText="AI 요청 시 사용될 프롬프트 ({{파라미터명}}은 입력값으로 치환됩니다)"
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
                )}

                {viewMode === 'preview' && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      minHeight: 150,
                      bgcolor: 'action.hover',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {getPreviewPrompt() || '프롬프트를 입력하세요'}
                  </Paper>
                )}

                {viewMode === 'both' && (
                  <Stack direction="row" spacing={2}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        편집
                      </Typography>
                      <TextField
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="프롬프트 입력"
                        required
                        fullWidth
                        multiline
                        rows={6}
                        disabled={submitting}
                        inputRef={promptInputRef}
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
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        미리보기
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          height: 'calc(6 * 1.5em + 32px)', // Match TextField height
                          bgcolor: 'action.hover',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflow: 'auto',
                        }}
                      >
                        {getPreviewPrompt() || '프롬프트를 입력하세요'}
                      </Paper>
                    </Box>
                  </Stack>
                )}
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

                {(isCompleted || execution.outputText) && execution.outputText && (
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

                {(isCompleted || execution.outputImageBase64) && execution.outputImageBase64 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      실행 결과 (이미지)
                    </Typography>
                    <Box
                      component="img"
                      src={`data:image/png;base64,${execution.outputImageBase64}`}
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
    <AIExecutionViewModal
      open={viewDetailOpen}
      executionUid={viewDetailUid}
      onClose={() => {
        setViewDetailOpen(false);
        setExecution(null);
      }}
    />
    </>
  );
};

export default AIExecutionRunModal;
