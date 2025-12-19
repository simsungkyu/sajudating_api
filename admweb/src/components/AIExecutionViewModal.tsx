// Dialog component for viewing AI execution details
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useAiExecutionQuery } from '../graphql/generated';

export interface AIExecutionViewModalProps {
  open: boolean;
  executionUid?: string | null;
  onClose: () => void;
}

const toMillis = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const asInt = Number.parseInt(trimmed, 10);
      return Number.isFinite(asInt) ? asInt : null;
    }
    const parsedDate = new Date(trimmed);
    const ms = parsedDate.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
};

const formatDate = (value?: unknown) => {
  if (value == null) return '-';
  const ms = toMillis(value);
  if (ms == null) return String(value);
  return new Date(ms).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getStatusChip = (status?: string | null) => {
  switch (status) {
    case 'done':
    case 'completed':
      return <Chip label="완료" color="success" size="small" />;
    case 'running':
    case 'pending':
    case 'processing':
      return <Chip label="처리중" color="info" size="small" />;
    case 'failed':
      return <Chip label="실패" color="error" size="small" />;
    default:
      return <Chip label={status || '-'} size="small" />;
  }
};

const toDataUrl = (value?: string | null) => {
  if (!value) return null;
  return value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
};

const Field = ({
  label,
  value,
  monospace,
}: {
  label: string;
  value: ReactNode;
  monospace?: boolean;
}) => {
  const resolved = value == null || value === '' ? '-' : value;
  const isText = typeof resolved === 'string' || typeof resolved === 'number';
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'flex-start', sm: 'baseline' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
        {label}
      </Typography>
      {isText ? (
        <Typography
          variant="body2"
          sx={{
            fontFamily: monospace ? 'monospace' : undefined,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {resolved}
        </Typography>
      ) : (
        <Box>{resolved}</Box>
      )}
    </Stack>
  );
};

const TextBlock = ({ value, monospace }: { value?: string | null; monospace?: boolean }) => {
  if (value == null || value === '') {
    return <Typography color="text.secondary">-</Typography>;
  }
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: monospace ? 'monospace' : undefined,
      }}
    >
      {value}
    </Box>
  );
};

const KVList = ({ items }: { items: Array<{ k: string; v: string }> }) => {
  if (!items.length) {
    return <Typography color="text.secondary">-</Typography>;
  }
  return (
    <Stack spacing={1}>
      {items.map((kv, index) => (
        <Field key={`${kv.k}-${index}`} label={kv.k} value={kv.v} monospace />
      ))}
    </Stack>
  );
};

const AIExecutionViewModal: React.FC<AIExecutionViewModalProps> = ({
  open,
  executionUid,
  onClose,
}) => {
  const shouldSkip = !open || !executionUid;
  const queryResult = useAiExecutionQuery(
    shouldSkip
      ? { skip: true }
      : {
          variables: { uid: executionUid as string },
          fetchPolicy: 'network-only',
        },
  );

  const result = queryResult.data?.aiExecution;
  const node =
    result?.node?.__typename === 'AiExecution' ? result.node : null;
  const inputKvs = node?.inputkvs ?? [];
  const outputKvs = node?.outputkvs ?? [];
  const inputImageUrl = toDataUrl(node?.inputImageBase64);
  const outputImageUrl = toDataUrl(node?.outputImageBase64);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>AI 실행 상세</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {queryResult.loading ? <LinearProgress /> : null}
        {queryResult.error ? (
          <Alert severity="error">{queryResult.error.message}</Alert>
        ) : null}
        {result && !result.ok ? (
          <Alert severity="error">실행 정보를 불러오지 못했습니다.</Alert>
        ) : null}

        {!node && !queryResult.loading && (!result || result.ok) ? (
          <Typography color="text.secondary">표시할 실행 기록이 없습니다.</Typography>
        ) : null}

        {node ? (
          <Stack spacing={2} divider={<Divider flexItem />}>
            {/* 1. 기본 정보 */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                기본 정보
              </Typography>
              <Stack spacing={1}>
                <Field label="UID" value={node.uid} monospace />
                <Field label="상태" value={getStatusChip(node.status)} />
                <Field label="실행자" value={node.runBy || '-'} />
                <Field label="메타 타입" value={node.metaType} />
                <Field label="메타 UID" value={node.metaUid} monospace />
                <Field label="모델" value={node.model} />
                <Field label="Temperature" value={node.temperature} />
                <Field label="Max Tokens" value={node.maxTokens} />
                <Field label="Size" value={node.size} />
                <Field label="생성 시간" value={formatDate(node.createdAt)} />
                <Field label="업데이트 시간" value={formatDate(node.updatedAt)} />
                <Field label="소요 시간" value={node.elapsedTime ? `${(node.elapsedTime / 1000).toFixed(2)}초` : '-'} />
                <Field label="입력 토큰" value={node.inputTokens || 0} />
                <Field label="출력 토큰" value={node.outputTokens || 0} />
                <Field label="총 사용 토큰" value={node.totalTokens || 0} />
                {node.errorText && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, mb: 0.5 }}>
                      오류 메시지
                    </Typography>
                    <Alert severity="error" sx={{ mt: 0.5 }}>{node.errorText}</Alert>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* 2. 입력 값 */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                입력 값
              </Typography>
              <KVList items={inputKvs.map(kv => ({ k: kv.k, v: kv.v }))} />
            </Box>

            {/* 3. 출력 값 */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                출력 값
              </Typography>
              <KVList items={outputKvs.map(kv => ({ k: kv.k, v: kv.v }))} />
            </Box>

            {/* 4. 프롬프트 */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                프롬프트
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    원본 프롬프트
                  </Typography>
                  <TextBlock value={node.prompt} monospace />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    적용된 프롬프트
                  </Typography>
                  <TextBlock value={node.valued_prompt} monospace />
                </Box>
              </Stack>
            </Box>

            {/* 5. 입력 이미지 */}
            {inputImageUrl && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  입력 이미지
                </Typography>
                <Box
                  component="img"
                  src={inputImageUrl}
                  alt="Input image"
                  sx={{
                    maxWidth: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              </Box>
            )}

            {/* 6. 결과 (텍스트) */}
            {node.outputText && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  결과 (텍스트)
                </Typography>
                <TextBlock value={node.outputText} monospace />
              </Box>
            )}

            {/* 7. 결과 (출력 이미지) */}
            {outputImageUrl && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  결과 (출력 이미지)
                </Typography>
                <Box
                  component="img"
                  src={outputImageUrl}
                  alt="Output image"
                  sx={{
                    maxWidth: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              </Box>
            )}

          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIExecutionViewModal;
