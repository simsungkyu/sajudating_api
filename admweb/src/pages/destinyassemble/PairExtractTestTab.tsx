// Pair extraction test tab for DataCardsPage (admweb). REST extract + GraphQL runChemiGeneration.
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  Snackbar,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { pairExtractTest, llmContextPreview } from '../../api/itemncard_api';
import { BirthDateTimeField } from '../../components/BirthDateTimeField';
import { PillarsDisplay } from '../../components/PillarDisplay';
import { parseBirthDateTime, validateBirthDateTimeError } from '../../utils/birthDateTime';
import { useRunChemiGenerationMutation, type ChemiGenerationRequest } from '../../graphql/generated';

export const DEFAULT_BIRTH_A = '1990-05-15 10:00';
export const DEFAULT_BIRTH_B = '1992-08-20 14:00';

export function PairExtractTestTab() {
  const [birthDateTimeA, setBirthDateTimeA] = useState(DEFAULT_BIRTH_A);
  const [birthDateTimeB, setBirthDateTimeB] = useState(DEFAULT_BIRTH_B);
  const [birthValidationErrA, setBirthValidationErrA] = useState<string | null>(null);
  const [birthValidationErrB, setBirthValidationErrB] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [maxChars, setMaxChars] = useState(1000);
  const [perspective, setPerspective] = useState('overview');
  const [running, setRunning] = useState(false);
  const [runChemiGenerationMutation, { data: genData, loading: genLoading, error: genError }] = useRunChemiGenerationMutation();
  const [result, setResult] = useState<Awaited<ReturnType<typeof pairExtractTest>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContext, setPreviewContext] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [llmTextareaOpen, setLlmTextareaOpen] = useState(false);
  const [llmTextareaContent, setLlmTextareaContent] = useState('');
  const [llmTextareaLoading, setLlmTextareaLoading] = useState(false);
  const [llmTextareaErr, setLlmTextareaErr] = useState<string | null>(null);

  const handleCopyPairResult = async () => {
    if (!result || !navigator?.clipboard) return;
    const lines = [
      'A 명식:',
      `pillars: ${JSON.stringify(result.summary_a.pillars)}`,
      result.summary_a.items_summary ? `items_summary: ${result.summary_a.items_summary}` : null,
      '',
      'B 명식:',
      `pillars: ${JSON.stringify(result.summary_b.pillars)}`,
      result.summary_b.items_summary ? `items_summary: ${result.summary_b.items_summary}` : null,
      '',
      'P_tokens (궁합 상호작용):',
      ...(result.p_tokens_summary?.length ? result.p_tokens_summary : ['(없음)']),
    ].filter((l): l is string => l != null);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadPairResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pair_extract_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = async () => {
    const errA = validateBirthDateTimeError(birthDateTimeA);
    const errB = validateBirthDateTimeError(birthDateTimeB);
    if (errA) {
      setBirthValidationErrA(errA);
      setBirthValidationErrB(null);
      return;
    }
    if (errB) {
      setBirthValidationErrA(null);
      setBirthValidationErrB(errB);
      return;
    }
    setBirthValidationErrA(null);
    setBirthValidationErrB(null);
    setRunning(true);
    setErr(null);
    setResult(null);
    try {
      const parsedA = parseBirthDateTime(birthDateTimeA);
      const parsedB = parseBirthDateTime(birthDateTimeB);
      const res = await pairExtractTest({
        birthA: { date: parsedA.date, time: parsedA.time, time_precision: parsedA.time_precision },
        birthB: { date: parsedB.date, time: parsedB.time, time_precision: parsedB.time_precision },
        timezone,
      });
      setResult(res);
      if (res.selected_cards?.length) {
        if (res.llm_context != null && res.llm_context !== '') {
          setLlmTextareaContent(res.llm_context);
          setLlmTextareaOpen(true);
          setLlmTextareaErr(null);
        } else {
          setLlmTextareaOpen(true);
          setLlmTextareaErr(null);
          setLlmTextareaContent('');
          setLlmTextareaLoading(true);
          llmContextPreview({
            card_ids: res.selected_cards.map((c) => c.card_id),
            scope: 'pair',
          })
            .then((preview) => {
              setLlmTextareaContent(preview.context);
            })
            .catch((e: unknown) => {
              setLlmTextareaErr(e instanceof Error ? e.message : String(e));
            })
            .finally(() => {
              setLlmTextareaLoading(false);
            });
        }
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const handleRunChemiGeneration = async () => {
    const errA = validateBirthDateTimeError(birthDateTimeA);
    const errB = validateBirthDateTimeError(birthDateTimeB);
    if (errA) {
      setBirthValidationErrA(errA);
      setBirthValidationErrB(null);
      return;
    }
    if (errB) {
      setBirthValidationErrA(null);
      setBirthValidationErrB(errB);
      return;
    }
    setBirthValidationErrA(null);
    setBirthValidationErrB(null);
    const parsedA = parseBirthDateTime(birthDateTimeA);
    const parsedB = parseBirthDateTime(birthDateTimeB);
    const input: ChemiGenerationRequest = {
      pair_input: {
        birthA: { date: parsedA.date, time: parsedA.time, time_precision: parsedA.time_precision },
        birthB: { date: parsedB.date, time: parsedB.time, time_precision: parsedB.time_precision },
        timezone: timezone || undefined,
      },
      targets: [{ perspective: perspective.trim() || 'overview', max_chars: Math.max(100, Math.min(5000, maxChars)) }],
    };
    await runChemiGenerationMutation({ variables: { input } });
  };

  const handlePreviewContext = async () => {
    if (!result?.selected_cards?.length) return;
    setPreviewOpen(true);
    setPreviewErr(null);
    setPreviewContext('');
    setPreviewLoading(true);
    try {
      const res = await llmContextPreview({
        card_ids: result.selected_cards.map((c) => c.card_id),
        scope: 'pair',
      });
      setPreviewContext(res.context);
    } catch (e: unknown) {
      setPreviewErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleLoadLlmTextarea = async () => {
    if (!result?.selected_cards?.length) return;
    setLlmTextareaErr(null);
    setLlmTextareaContent('');
    setLlmTextareaOpen(true);
    setLlmTextareaLoading(true);
    try {
      const res = await llmContextPreview({
        card_ids: result.selected_cards.map((c) => c.card_id),
        scope: 'pair',
      });
      setLlmTextareaContent(res.context);
    } catch (e: unknown) {
      setLlmTextareaErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLlmTextareaLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">궁합 추출 테스트</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="flex-start">
        <BirthDateTimeField
          label="A 생일·시간"
          value={birthDateTimeA}
          onChange={(v) => { setBirthDateTimeA(v); setBirthValidationErrA(null); }}
          error={!!birthValidationErrA}
          helperText={birthValidationErrA ?? undefined}
          sx={{ minWidth: 200 }}
        />
        <BirthDateTimeField
          label="B 생일·시간"
          value={birthDateTimeB}
          onChange={(v) => { setBirthDateTimeB(v); setBirthValidationErrB(null); }}
          error={!!birthValidationErrB}
          helperText={birthValidationErrB ?? undefined}
          sx={{ minWidth: 200 }}
        />
        <TextField label="타임존" value={timezone} onChange={(e) => setTimezone(e.target.value)} size="small" />
        <TextField
          label="대략적인 출력 글자수"
          type="number"
          value={maxChars}
          onChange={(e) => setMaxChars(Number(e.target.value) || 1000)}
          size="small"
          inputProps={{ min: 100, max: 5000, step: 100 }}
          helperText="100–5000"
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="출력관점"
          value={perspective}
          onChange={(e) => setPerspective(e.target.value)}
          size="small"
          placeholder="overview, communication, conflict, compatibility 등"
          helperText="예: overview"
          sx={{ minWidth: 200 }}
        />
        <Button variant="contained" startIcon={<PlayArrowRoundedIcon />} onClick={handleRun} disabled={running}>
          {running ? '실행 중…' : '실행'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={genLoading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
          onClick={handleRunChemiGeneration}
          disabled={genLoading}
        >
          {genLoading ? '생성 중…' : '생성 실행'}
        </Button>
      </Stack>
      {err && <Alert severity="error">{err}</Alert>}
      {genError && <Alert severity="error">GraphQL 궁합 생성: {genError.message}</Alert>}
      {genData?.runChemiGeneration?.targets && genData.runChemiGeneration.targets.length > 0 && (
        <Card variant="outlined" sx={{ borderColor: 'secondary.main' }}>
          <CardContent>
            <Typography variant="subtitle2" color="secondary">GraphQL 궁합 생성 결과</Typography>
            {genData.runChemiGeneration.targets.map((t, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1.5, mt: 1 }}>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Chip size="small" label={t.perspective} variant="outlined" />
                  <Typography variant="caption" color="text.secondary">max_chars: {t.max_chars}</Typography>
                </Stack>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.85rem', mt: 1 }}>
                  {t.result || '(비어 있음)'}
                </Typography>
              </Paper>
            ))}
          </CardContent>
        </Card>
      )}
      {result && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="subtitle2">A/B 명식 분석 정보</Typography>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyPairResult}>
                복사
              </Button>
              <Button size="small" startIcon={<FileDownloadIcon />} onClick={handleDownloadPairResult}>
                JSON 저장
              </Button>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" color="primary">A 명식</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">원국</Typography>
                  <Box><PillarsDisplay pillars={result.summary_a.pillars ?? {}} /></Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  rule_set: {result.summary_a.rule_set}
                  {result.summary_a.engine_version ? ` · engine_version: ${result.summary_a.engine_version}` : ''}
                </Typography>
                {result.summary_a.items_summary != null && result.summary_a.items_summary !== '' && (
                  <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 0.5 }}>items_summary</Typography>
                )}
                {result.summary_a.items_summary != null && result.summary_a.items_summary !== '' && (
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {result.summary_a.items_summary}
                  </Typography>
                )}
                {(() => {
                  const tokens = Array.isArray(result.summary_a.tokens_summary) ? result.summary_a.tokens_summary : typeof result.summary_a.tokens_summary === 'string' ? (result.summary_a.tokens_summary ? [result.summary_a.tokens_summary] : []) : [];
                  if (tokens.length === 0) return null;
                  return (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">tokens_summary </Typography>
                      {tokens.map((t) => (
                        <Chip key={t} size="small" label={t} variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }} />
                      ))}
                    </Stack>
                  );
                })()}
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" color="secondary">B 명식</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">원국</Typography>
                  <Box><PillarsDisplay pillars={result.summary_b.pillars ?? {}} /></Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  rule_set: {result.summary_b.rule_set}
                  {result.summary_b.engine_version ? ` · engine_version: ${result.summary_b.engine_version}` : ''}
                </Typography>
                {result.summary_b.items_summary != null && result.summary_b.items_summary !== '' && (
                  <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 0.5 }}>items_summary</Typography>
                )}
                {result.summary_b.items_summary != null && result.summary_b.items_summary !== '' && (
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {result.summary_b.items_summary}
                  </Typography>
                )}
                {(() => {
                  const tokens = Array.isArray(result.summary_b.tokens_summary) ? result.summary_b.tokens_summary : typeof result.summary_b.tokens_summary === 'string' ? (result.summary_b.tokens_summary ? [result.summary_b.tokens_summary] : []) : [];
                  if (tokens.length === 0) return null;
                  return (
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">tokens_summary </Typography>
                      {tokens.map((t) => (
                        <Chip key={t} size="small" label={t} variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }} />
                      ))}
                    </Stack>
                  );
                })()}
              </Paper>
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Button size="small" startIcon={llmTextareaOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setLlmTextareaOpen((o) => !o)}>
                LLM 요청 전체 내용
              </Button>
              <Collapse in={llmTextareaOpen}>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {result.selected_cards.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">선택된 카드가 없어 LLM 요청 내용이 없습니다.</Typography>
                  ) : (
                    <>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Button size="small" variant="outlined" onClick={handleLoadLlmTextarea} disabled={llmTextareaLoading}>
                          {llmTextareaLoading ? '로딩…' : '불러오기'}
                        </Button>
                        {llmTextareaLoading && <CircularProgress size={16} />}
                      </Stack>
                      {llmTextareaErr && <Alert severity="error">{llmTextareaErr}</Alert>}
                      <TextField
                        label="LLM에 전달되는 전체 텍스트"
                        value={llmTextareaContent}
                        multiline
                        minRows={6}
                        maxRows={16}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                    </>
                  )}
                </Stack>
              </Collapse>
            </Box>
            {result.p_tokens_summary != null && result.p_tokens_summary.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">P_tokens (궁합 상호작용) 요약</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                  {result.p_tokens_summary.map((t) => (
                    <Chip key={t} size="small" label={t} variant="filled" color="primary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                  ))}
                </Stack>
              </Box>
            )}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>선택된 궁합 카드 ({result.selected_cards.length}) — 무엇이 선택되었는지</Typography>
            {result.selected_cards.length === 0 ? (
              <Typography variant="body2" color="text.secondary">없음</Typography>
            ) : (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" onClick={handlePreviewContext} disabled={previewLoading}>
                  {previewLoading ? '로딩…' : 'LLM 컨텍스트 미리보기'}
                </Button>
                {result.selected_cards.map((c) => {
                  const hasEvidence = (c.evidence?.length ?? 0) > 0;
                  const evOpen = evidenceOpen[c.card_id] ?? false;
                  const toggleEv = () => setEvidenceOpen((prev) => ({ ...prev, [c.card_id]: !prev[c.card_id] }));
                  return (
                    <Paper key={c.card_id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                        <Typography variant="subtitle2">{c.card_id}</Typography>
                        <Typography variant="body2">{c.title}</Typography>
                        {c.score != null && c.score !== undefined && (
                          <Chip size="small" label={`score: ${c.score}`} variant="outlined" />
                        )}
                        {hasEvidence && (
                          <Button size="small" startIcon={evOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={toggleEv}>
                            선택 근거 ({c.evidence!.length})
                          </Button>
                        )}
                      </Stack>
                      {hasEvidence && (
                        <Collapse in={evOpen}>
                          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">evidence: </Typography>
                            {c.evidence!.map((tok) => (
                              <Chip key={tok} size="small" label={tok} variant="filled" color="default" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }} />
                            ))}
                          </Stack>
                        </Collapse>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>LLM 컨텍스트 미리보기</DialogTitle>
        <DialogContent>
          {previewErr && <Alert severity="error" sx={{ mb: 1 }}>{previewErr}</Alert>}
          {previewLoading && <CircularProgress size={24} />}
          {!previewLoading && previewContext !== undefined && (
            <>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>가이드라인(guardrails)이 포함되어 있습니다.</Typography>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {previewContext || '(비어 있음)'}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={copyToast} autoHideDuration={2000} onClose={() => setCopyToast(false)} message="복사됨" />
    </Stack>
  );
}
