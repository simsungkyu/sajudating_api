// Card create/edit dialog for saju/pair cards (DataCardsPage).
import { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useCreateItemnCardMutation, useUpdateItemnCardMutation } from '../../graphql/generated';
import { SEED_CARD_OPTIONS } from '../../data/seedCards';
import type { ItemNCardInput } from '../../graphql/generated';
import {
  defaultInput,
  seedCardToInput,
  validateTriggerJson,
  validateScoreJson,
  validateCardInput,
} from './cardFormUtils';

export type CardFormDialogProps = {
  open: boolean;
  scope: 'saju' | 'pair';
  initial: ItemNCardInput | null;
  editUid: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function CardFormDialog({ open, scope, initial, editUid, onClose, onSuccess }: CardFormDialogProps) {
  const [input, setInput] = useState<ItemNCardInput>(() => initial ?? defaultInput(scope));
  const [tagsStr, setTagsStr] = useState(() => (initial?.tags ?? []).join(', '));
  const [validateErr, setValidateErr] = useState<string | null>(null);
  const [triggerInlineErr, setTriggerInlineErr] = useState<string | null>(null);
  const [scoreInlineErr, setScoreInlineErr] = useState<string | null>(null);
  const [createCard, { loading: createLoading }] = useCreateItemnCardMutation();
  const [updateCard, { loading: updateLoading }] = useUpdateItemnCardMutation();

  useEffect(() => {
    if (open) {
      const next = initial ?? defaultInput(scope);
      setInput(next);
      setTagsStr((initial?.tags ?? []).join(', '));
      setValidateErr(null);
      setTriggerInlineErr(null);
      setScoreInlineErr(null);
    }
  }, [open, scope, initial]);

  const updateTriggerValidation = (triggerJson: string) => {
    setTriggerInlineErr(validateTriggerJson(triggerJson, scope));
  };
  const updateScoreValidation = (scoreJson: string) => {
    setScoreInlineErr(validateScoreJson(scoreJson));
  };

  const isEdit = editUid != null;
  const loading = createLoading || updateLoading;

  const handleClose = useCallback(() => {
    setInput(initial ?? defaultInput(scope));
    setTagsStr((initial?.tags ?? []).join(', '));
    setValidateErr(null);
    onClose();
  }, [initial, scope, onClose]);

  const handleSubmit = async () => {
    const tags = tagsStr.split(',').map((s) => s.trim()).filter(Boolean);
    const next: ItemNCardInput = { ...input, tags };
    const err = validateCardInput(next);
    if (err) {
      setValidateErr(err);
      return;
    }
    setValidateErr(null);
    if (isEdit && editUid) {
      const res = await updateCard({ variables: { uid: editUid, input: next } });
      if (res.data?.updateItemnCard?.ok) {
        handleClose();
        onSuccess();
      } else {
        setValidateErr(res.data?.updateItemnCard?.msg ?? '수정 실패');
      }
    } else {
      const res = await createCard({ variables: { input: next } });
      if (res.data?.createItemnCard?.ok) {
        handleClose();
        onSuccess();
      } else {
        setValidateErr(res.data?.createItemnCard?.msg ?? '생성 실패');
      }
    }
  };

  const toggleStatus = () => {
    setInput((prev) => ({ ...prev, status: prev.status === 'published' ? 'draft' : 'published' }));
  };

  if (!open) return null;
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? '카드 수정' : '카드 생성'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {validateErr && <Alert severity="error">{validateErr}</Alert>}
          {!isEdit && (
            <FormControl size="small" fullWidth>
              <InputLabel>시드에서 불러오기</InputLabel>
              <Select
                value=""
                label="시드에서 불러오기"
                onChange={(e) => {
                  const id = e.target.value as string;
                  if (!id) return;
                  const opt = SEED_CARD_OPTIONS.find((o) => o.id === id);
                  if (opt && opt.scope === scope) {
                    setInput(seedCardToInput(opt.data));
                    setTagsStr((opt.data.tags ?? []).join(', '));
                    setTriggerInlineErr(validateTriggerJson(JSON.stringify(opt.data.trigger ?? {}), scope));
                    setScoreInlineErr(validateScoreJson(JSON.stringify(opt.data.score ?? {})));
                  }
                }}
                displayEmpty
              >
                <MenuItem value="">(선택 안 함)</MenuItem>
                {SEED_CARD_OPTIONS.filter((o) => o.scope === scope).map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>선택 시 폼에 시드 데이터를 채웁니다. 그 후 생성 시 새 카드로 등록됩니다.</FormHelperText>
            </FormControl>
          )}
          <TextField label="card_id" value={input.cardId} onChange={(e) => setInput((p) => ({ ...p, cardId: e.target.value }))} required size="small" fullWidth disabled={isEdit} />
          <FormControl size="small" fullWidth required>
            <InputLabel>scope</InputLabel>
            <Select value={input.scope} label="scope" onChange={(e) => setInput((p) => ({ ...p, scope: e.target.value as 'saju' | 'pair' }))} disabled={isEdit}>
              <MenuItem value="saju">saju</MenuItem>
              <MenuItem value="pair">pair</MenuItem>
            </Select>
          </FormControl>
          <TextField label="title" value={input.title} onChange={(e) => setInput((p) => ({ ...p, title: e.target.value }))} required size="small" fullWidth />
          <FormControl size="small" fullWidth required>
            <InputLabel>status</InputLabel>
            <Select value={input.status} label="status" onChange={(e) => setInput((p) => ({ ...p, status: e.target.value }))}>
              <MenuItem value="draft">draft</MenuItem>
              <MenuItem value="published">published</MenuItem>
            </Select>
          </FormControl>
          <TextField label="rule_set" value={input.ruleSet} onChange={(e) => setInput((p) => ({ ...p, ruleSet: e.target.value }))} size="small" fullWidth />
          <TextField label="category" value={input.category} onChange={(e) => setInput((p) => ({ ...p, category: e.target.value }))} size="small" fullWidth />
          <TextField label="tags (쉼표 구분)" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} size="small" fullWidth placeholder="conflict, communication" />
          <TextField type="number" label="priority" value={input.priority} onChange={(e) => setInput((p) => ({ ...p, priority: parseInt(e.target.value, 10) || 0 }))} size="small" fullWidth />
          <TextField label="trigger (JSON)" value={input.triggerJson} onChange={(e) => { setInput((p) => ({ ...p, triggerJson: e.target.value })); updateTriggerValidation(e.target.value); }} onBlur={(e) => updateTriggerValidation(e.target.value)} required size="small" fullWidth multiline minRows={2} error={!!triggerInlineErr} helperText={triggerInlineErr ?? undefined} />
          <TextField label="score (JSON)" value={input.scoreJson} onChange={(e) => { setInput((p) => ({ ...p, scoreJson: e.target.value })); updateScoreValidation(e.target.value); }} onBlur={(e) => updateScoreValidation(e.target.value)} size="small" fullWidth multiline minRows={1} error={!!scoreInlineErr} helperText={scoreInlineErr ?? undefined} />
          <TextField label="content (JSON)" value={input.contentJson} onChange={(e) => setInput((p) => ({ ...p, contentJson: e.target.value }))} size="small" fullWidth multiline minRows={2} />
          <TextField label="cooldown_group" value={input.cooldownGroup} onChange={(e) => setInput((p) => ({ ...p, cooldownGroup: e.target.value }))} size="small" fullWidth />
          <TextField type="number" label="max_per_user" value={input.maxPerUser} onChange={(e) => setInput((p) => ({ ...p, maxPerUser: parseInt(e.target.value, 10) || 0 }))} size="small" fullWidth />
          <TextField label="debug (JSON)" value={input.debugJson} onChange={(e) => setInput((p) => ({ ...p, debugJson: e.target.value }))} size="small" fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={toggleStatus}>status ↔ {input.status === 'published' ? 'draft' : 'published'}</Button>
        <Button onClick={handleClose}>취소</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>{isEdit ? '저장' : '생성'}</Button>
      </DialogActions>
    </Dialog>
  );
}
