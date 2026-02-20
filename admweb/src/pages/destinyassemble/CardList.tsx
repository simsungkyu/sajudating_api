// Card list table, paging, bulk import and form dialog for saju/pair tabs (DataCardsPage).
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useItemnCardsQuery, useDeleteItemnCardMutation, useCreateItemnCardMutation } from '../../graphql/generated';
import type { ItemnCardBasicFragment, ItemNCardInput } from '../../graphql/generated';
import { CardFormDialog } from './CardFormDialog';
import {
  cardToInput,
  duplicateToInput,
  downloadCardAsJson,
  seedCardToInput,
  parseBulkCardItem,
  validateCardInput,
} from './cardFormUtils';

export type CardListQueryInput = {
  limit: number;
  offset: number;
  scope: string;
  status?: string;
  category?: string;
  tags?: string[];
  ruleSet?: string;
  domain?: string;
  cooldownGroup?: string;
  orderBy?: string;
  orderDirection?: string;
  includeDeleted?: boolean;
};

export type CardListProps = {
  scope: 'saju' | 'pair';
  input: CardListQueryInput;
  onOffsetChange: (offset: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function CardList({ scope, input: queryInput, onOffsetChange, pageSize, onPageSizeChange }: CardListProps) {
  const { data, loading, error, refetch } = useItemnCardsQuery({
    variables: {
      input: {
        limit: queryInput.limit,
        offset: queryInput.offset,
        scope: queryInput.scope,
        status: queryInput.status ?? undefined,
        category: queryInput.category ?? undefined,
        tags: queryInput.tags?.length ? queryInput.tags : undefined,
        ruleSet: queryInput.ruleSet ?? undefined,
        domain: queryInput.domain ?? undefined,
        cooldownGroup: queryInput.cooldownGroup ?? undefined,
        orderBy: queryInput.orderBy ?? undefined,
        orderDirection: queryInput.orderDirection ?? undefined,
        includeDeleted: queryInput.includeDeleted ?? undefined,
      },
    },
  });
  const [deleteCard, { loading: deleteLoading }] = useDeleteItemnCardMutation();
  const [createCard] = useCreateItemnCardMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCard, setEditCard] = useState<ItemnCardBasicFragment | null>(null);
  const [createInitial, setCreateInitial] = useState<ItemNCardInput | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: { index: number; msg: string }[] } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const nodes = (data?.itemnCards?.nodes ?? []) as ItemnCardBasicFragment[];
  const total = data?.itemnCards?.total ?? 0;
  const offset = data?.itemnCards?.offset ?? 0;
  const limit = data?.itemnCards?.limit ?? pageSize;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + nodes.length, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const handleDelete = async (uid: string) => {
    if (!confirm('이 카드를 삭제할까요? (소프트 삭제됩니다)')) return;
    await deleteCard({ variables: { uid } });
    refetch();
  };

  const openCreate = () => {
    setEditCard(null);
    setCreateInitial(null);
    setDialogOpen(true);
  };
  const openEdit = (card: ItemnCardBasicFragment) => {
    setEditCard(card);
    setCreateInitial(null);
    setDialogOpen(true);
  };
  const openDuplicate = (card: ItemnCardBasicFragment) => {
    setEditCard(null);
    setCreateInitial(duplicateToInput(card));
    setDialogOpen(true);
  };
  const handleDialogSuccess = () => {
    refetch();
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBulkOpen(true);
    setBulkResult(null);
    setBulkLoading(true);
    try {
      const text = await file.text();
      let arr: unknown[];
      try {
        const parsed = JSON.parse(text);
        arr = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        setBulkResult({ created: 0, failed: [{ index: 0, msg: 'JSON 파싱 실패' }] });
        setBulkLoading(false);
        return;
      }
      const failed: { index: number; msg: string }[] = [];
      let created = 0;
      for (let i = 0; i < arr.length; i++) {
        const item = parseBulkCardItem(arr[i]);
        if (!item || item.scope !== scope) {
          failed.push({ index: i + 1, msg: item ? 'scope 불일치' : '필수 필드 없음 (card_id, scope, title, trigger)' });
          continue;
        }
        const input = seedCardToInput(item);
        const err = validateCardInput(input);
        if (err) {
          failed.push({ index: i + 1, msg: err });
          continue;
        }
        try {
          const res = await createCard({ variables: { input } });
          if (res.data?.createItemnCard?.ok) created++; else failed.push({ index: i + 1, msg: res.data?.createItemnCard?.msg ?? '생성 실패' });
        } catch (err) {
          failed.push({ index: i + 1, msg: err instanceof Error ? err.message : String(err) });
        }
      }
      setBulkResult({ created, failed });
      if (created > 0) refetch();
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={openCreate}>카드 생성</Button>
        <Button startIcon={<UploadFileIcon />} variant="outlined" size="small" onClick={() => document.getElementById('bulk-import-input')?.click()} disabled={bulkLoading}>일괄 등록</Button>
        <input id="bulk-import-input" type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleBulkFileChange} />
      </Box>
      <CardFormDialog open={dialogOpen} scope={scope} initial={createInitial ?? (editCard ? cardToInput(editCard) : null)} editUid={editCard?.uid ?? null} onClose={() => { setDialogOpen(false); setCreateInitial(null); }} onSuccess={handleDialogSuccess} />
      <Dialog open={bulkOpen} onClose={() => { setBulkOpen(false); setBulkResult(null); refetch(); }} maxWidth="sm" fullWidth>
        <DialogTitle>일괄 등록</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            JSON 파일은 카드 객체의 배열이어야 합니다. CardDataStructure(saju) 또는 ChemiStructure(pair) 형식. 현재 탭 scope: {scope}.
          </Typography>
          {bulkLoading && <CircularProgress size={24} sx={{ my: 1 }} />}
          {bulkResult && !bulkLoading && (
            <Stack spacing={1}>
              <Alert severity={bulkResult.failed.length === 0 ? 'success' : 'info'}>
                {bulkResult.created}건 생성, {bulkResult.failed.length}건 실패
              </Alert>
              {bulkResult.failed.length > 0 && (
                <Typography variant="caption" component="div">실패 행: {bulkResult.failed.map((f) => `#${f.index}: ${f.msg}`).join('; ')}</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBulkOpen(false); setBulkResult(null); refetch(); }}>닫기</Button>
        </DialogActions>
      </Dialog>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>cardId</TableCell>
              <TableCell>scope</TableCell>
              <TableCell>rule_set</TableCell>
              <TableCell>status</TableCell>
              <TableCell>title</TableCell>
              <TableCell>category</TableCell>
              <TableCell>priority</TableCell>
              <TableCell align="right">편집 / 삭제</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map((card) => (
              <TableRow key={card.uid}>
                <TableCell>{card.cardId}</TableCell>
                <TableCell>{card.scope}</TableCell>
                <TableCell>{card.ruleSet ?? '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
                    <Chip label={card.status} size="small" color={card.status === 'published' ? 'success' : 'default'} />
                    {'deletedAt' in card && Number((card as ItemnCardBasicFragment).deletedAt) > 0 && (
                      <Chip label="삭제됨" size="small" color="default" variant="outlined" />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{card.title}</TableCell>
                <TableCell>{card.category}</TableCell>
                <TableCell>{card.priority}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(card)}>편집</Button>
                  <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => openDuplicate(card)}>복제</Button>
                  <Button size="small" startIcon={<FileDownloadIcon />} onClick={() => downloadCardAsJson(card)}>JSON 내보내기</Button>
                  <Button size="small" color="error" disabled={deleteLoading} onClick={() => handleDelete(card.uid)}>삭제</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {nodes.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">카드가 없습니다. 카드 생성을 눌러 추가하세요.</Typography>
        </Box>
      )}
      {total > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              {total}개 중 {from}–{to}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select value={pageSize} onChange={(e) => { onPageSizeChange(Number(e.target.value)); onOffsetChange(0); }} displayEmpty>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>{n}개</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Button size="small" variant="outlined" disabled={!canPrev} onClick={() => onOffsetChange(Math.max(0, offset - limit))}>이전</Button>
            <Button size="small" variant="outlined" disabled={!canNext} onClick={() => onOffsetChange(offset + limit)}>다음</Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
