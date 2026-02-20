// Saju extraction test tab for DataCardsPage (admweb). REST extract test + GraphQL runSajuGeneration.
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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { sajuExtractTest, llmContextPreview } from '../../api/itemncard_api';
import { BirthDateTimeField } from '../../components/BirthDateTimeField';
import { PillarsDisplay } from '../../components/PillarDisplay';
import { parseBirthDateTime, validateBirthDateTimeError } from '../../utils/birthDateTime';
import { modePeriodToSajuTarget } from '../../utils/sajuGenerationTarget';
import { useRunSajuGenerationMutation, type SajuGenerationRequest } from '../../graphql/generated';

export const DEFAULT_BIRTH_DATETIME = '1990-05-15 10:00';

export function SajuExtractTestTab() {
  const [birthDateTime, setBirthDateTime] = useState(DEFAULT_BIRTH_DATETIME);
  const [birthValidationErr, setBirthValidationErr] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [mode, setMode] = useState<'인생' | '연도별' | '월별' | '일간' | '대운'>('인생');
  const [targetYear, setTargetYear] = useState('2025');
  const [targetMonth, setTargetMonth] = useState('03');
  const [targetDay, setTargetDay] = useState('15');
  const [targetDaesoonIndex, setTargetDaesoonIndex] = useState('0');
  const [gender, setGender] = useState('male');
  const [maxChars, setMaxChars] = useState(1000);
  const [running, setRunning] = useState(false);
  const [runSajuGenerationMutation, { data: genData, loading: genLoading, error: genError }] = useRunSajuGenerationMutation();
  const [result, setResult] = useState<Awaited<ReturnType<typeof sajuExtractTest>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [itemsTokensOpen, setItemsTokensOpen] = useState(true);
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

  const handleCopySajuResult = async () => {
    if (!result || !navigator?.clipboard) return;
    const u = result.user_info;
    const ps = result.pillar_source;
    const tokens = Array.isArray(u.tokens_summary) ? u.tokens_summary : typeof u.tokens_summary === 'string' ? (u.tokens_summary ? [u.tokens_summary] : []) : [];
    const lines = [
      `모드: ${u.mode ?? '인생'}${u.period ? ` · 기간: ${u.period}` : ''}`,
      ...(ps
        ? [`연계 만세력: 기준일 ${ps.base_date}, 적용 시간 ${ps.base_time_used}, 모드 ${ps.mode} / ${ps.period}${ps.description ? ` (${ps.description})` : ''}`]
        : u.period || u.mode ? [`기준 기간: ${u.period ?? ''} (${u.mode ?? '인생'})`, '적용 시간: 출생시간'] : []),
      `pillars: ${JSON.stringify(u.pillars)}`,
      `rule_set: ${u.rule_set}${u.engine_version ? ` · engine_version: ${u.engine_version}` : ''}`,
      ...(u.items_summary ? [`items_summary: ${u.items_summary}`] : []),
      ...(tokens.length ? ['tokens_summary:', ...tokens] : []),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadSajuResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saju_extract_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = async () => {
    const validationErr = validateBirthDateTimeError(birthDateTime);
    if (validationErr) {
      setBirthValidationErr(validationErr);
      return;
    }
    setBirthValidationErr(null);
    setRunning(true);
    setErr(null);
    setResult(null);
    try {
      const parsed = parseBirthDateTime(birthDateTime);
      const payload: Parameters<typeof sajuExtractTest>[0] = {
        birth: { date: parsed.date, time: parsed.time, time_precision: parsed.time_precision },
        timezone,
        calendar: 'solar',
        mode,
      };
      if (mode === '연도별') payload.target_year = targetYear;
      if (mode === '월별') {
        payload.target_year = targetYear;
        payload.target_month = targetMonth;
      }
      if (mode === '일간') {
        payload.target_year = targetYear;
        payload.target_month = targetMonth;
        payload.target_day = targetDay;
      }
      if (mode === '대운') {
        payload.target_daesoon_index = targetDaesoonIndex;
        payload.gender = gender;
      }
      const res = await sajuExtractTest(payload);
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
            scope: 'saju',
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

  const handlePreviewContext = async () => {
    if (!result?.selected_cards?.length) return;
    setPreviewOpen(true);
    setPreviewErr(null);
    setPreviewContext('');
    setPreviewLoading(true);
    try {
      const res = await llmContextPreview({
        card_ids: result.selected_cards.map((c) => c.card_id),
        scope: 'saju',
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
        scope: 'saju',
      });
      setLlmTextareaContent(res.context);
    } catch (e: unknown) {
      setLlmTextareaErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLlmTextareaLoading(false);
    }
  };

  const handleRunSajuGeneration = async () => {
    const validationErr = validateBirthDateTimeError(birthDateTime);
    if (validationErr) {
      setBirthValidationErr(validationErr);
      return;
    }
    setBirthValidationErr(null);
    const parsed = parseBirthDateTime(birthDateTime);
    const { kind, period } = modePeriodToSajuTarget(mode, targetYear, targetMonth, targetDay, targetDaesoonIndex);
    const input: SajuGenerationRequest = {
      user_input: {
        birth: {
          date: parsed.date,
          time: parsed.time,
          time_precision: parsed.time_precision,
        },
        timezone: timezone || undefined,
        rule_set: undefined,
        ...(mode === '대운' ? { gender } : {}),
      },
      targets: [{ kind, period, max_chars: Math.max(100, Math.min(5000, maxChars)) }],
    };
    await runSajuGenerationMutation({ variables: { input } });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">사주 추출 테스트</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        <BirthDateTimeField
          value={birthDateTime}
          onChange={(v) => { setBirthDateTime(v); setBirthValidationErr(null); }}
          error={!!birthValidationErr}
          helperText={birthValidationErr ?? undefined}
          sx={{ minWidth: 200 }}
        />
        <TextField label="타임존" value={timezone} onChange={(e) => setTimezone(e.target.value)} size="small" />
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>mode</InputLabel>
          <Select value={mode} label="mode" onChange={(e) => setMode(e.target.value as '인생' | '연도별' | '월별' | '일간' | '대운')}>
            <MenuItem value="인생">인생</MenuItem>
            <MenuItem value="연도별">연도별</MenuItem>
            <MenuItem value="월별">월별</MenuItem>
            <MenuItem value="일간">일간</MenuItem>
            <MenuItem value="대운">대운</MenuItem>
          </Select>
        </FormControl>
        {mode === '연도별' && (
          <TextField label="대상 연도" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} size="small" placeholder="2025" sx={{ width: 120 }} />
        )}
        {mode === '월별' && (
          <>
            <TextField label="연도" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} size="small" placeholder="2025" sx={{ width: 100 }} />
            <TextField label="월" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} size="small" placeholder="03" sx={{ width: 70 }} />
          </>
        )}
        {mode === '일간' && (
          <>
            <TextField label="대상 연도" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} size="small" placeholder="2025" sx={{ width: 100 }} />
            <TextField label="대상 월" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} size="small" placeholder="03" sx={{ width: 70 }} />
            <TextField label="대상 일" value={targetDay} onChange={(e) => setTargetDay(e.target.value)} size="small" placeholder="15" sx={{ width: 70 }} />
          </>
        )}
        {mode === '대운' && (
          <>
            <TextField label="대운 단계 (0부터)" value={targetDaesoonIndex} onChange={(e) => setTargetDaesoonIndex(e.target.value)} size="small" placeholder="0" sx={{ width: 100 }} />
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>성별</InputLabel>
              <Select value={gender} label="성별" onChange={(e) => setGender(e.target.value)}>
                <MenuItem value="male">남</MenuItem>
                <MenuItem value="female">여</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
        <TextField
          label="대략적인 출력 글자수"
          type="number"
          value={maxChars}
          onChange={(e) => setMaxChars(parseInt(String(e.target.value), 10) || 1000)}
          size="small"
          inputProps={{ min: 100, max: 5000 }}
          helperText="100–5000"
          sx={{ width: 140 }}
        />
        <Button variant="contained" startIcon={<PlayArrowRoundedIcon />} onClick={handleRun} disabled={running}>
          {running ? '실행 중…' : '실행'}
        </Button>
        <Button
          variant="outlined"
          startIcon={genLoading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
          onClick={handleRunSajuGeneration}
          disabled={genLoading || !!validateBirthDateTimeError(birthDateTime)}
        >
          {genLoading ? '생성 중…' : '생성 실행'}
        </Button>
      </Stack>
      {err && <Alert severity="error">{err}</Alert>}
      {genError && <Alert severity="error">GraphQL 사주 생성 오류: {genError.message}</Alert>}
      {genData?.runSajuGeneration?.targets && genData.runSajuGeneration.targets.length > 0 && (
        <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
          <CardContent>
            <Typography variant="subtitle2">GraphQL 사주 생성 결과</Typography>
            {genData.runSajuGeneration.targets.map((t, i) => (
              <Box key={i} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t.kind} {t.period ? `· ${t.period}` : ''} (max_chars: {t.max_chars})
                </Typography>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.9rem', mt: 0.5 }}>
                  {t.result || '(비어 있음)'}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
      {result && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2">모드 · 기간</Typography>
            <Typography variant="body2" color="text.secondary">
              {result.user_info.mode ?? '인생'} {result.user_info.period ? `· ${result.user_info.period}` : ''}
            </Typography>
            {(result.pillar_source ?? result.user_info.period ?? result.user_info.mode) && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">연계 만세력</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.pillar_source
                    ? `기준일 ${result.pillar_source.base_date}, 적용 시간 ${result.pillar_source.base_time_used}, 모드 ${result.pillar_source.mode} / ${result.pillar_source.period}${result.pillar_source.description ? ` (${result.pillar_source.description})` : ''}`
                    : `기준 기간: ${result.user_info.period ?? ''} (${result.user_info.mode ?? '인생'}) · 적용 시간: 출생시간`}
                </Typography>
              </Box>
            )}
            <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <Typography variant="subtitle2">유저 명식</Typography>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopySajuResult}>
                복사
              </Button>
              <Button size="small" startIcon={<FileDownloadIcon />} onClick={handleDownloadSajuResult}>
                JSON 저장
              </Button>
            </Stack>
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary" display="block">원국 (양=볼드, 오행=컬러)</Typography>
              <PillarsDisplay pillars={result.user_info.pillars ?? {}} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              rule_set: {result.user_info.rule_set}
              {result.user_info.engine_version ? ` · engine_version: ${result.user_info.engine_version}` : ''}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Button size="small" startIcon={itemsTokensOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setItemsTokensOpen((o) => !o)}>
                items / tokens 요약
              </Button>
              <Collapse in={itemsTokensOpen}>
                <Stack spacing={1} sx={{ mt: 0.5, pl: 0.5 }}>
                  {result.user_info.items_summary != null && result.user_info.items_summary !== '' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">items_summary</Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {result.user_info.items_summary}
                      </Typography>
                    </Box>
                  )}
                  {(() => {
                    const tokens = Array.isArray(result.user_info.tokens_summary)
                      ? result.user_info.tokens_summary
                      : typeof result.user_info.tokens_summary === 'string'
                        ? (result.user_info.tokens_summary ? [result.user_info.tokens_summary] : [])
                        : [];
                    if (tokens.length === 0) return null;
                    return (
                      <Box>
                        <Typography variant="caption" color="text.secondary">tokens_summary</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                          {tokens.map((t) => (
                            <Chip key={t} size="small" label={t} variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }} />
                          ))}
                        </Stack>
                      </Box>
                    );
                  })()}
                </Stack>
              </Collapse>
            </Box>
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
            <Typography variant="subtitle2" sx={{ mt: 1 }}>선택된 카드 ({result.selected_cards.length}) — 무엇이 선택되었는지</Typography>
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
