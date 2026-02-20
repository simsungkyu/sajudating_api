// Card list filter row for saju/pair tabs (DataCardsPage).
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

export type CardListFiltersProps = {
  scope: 'saju' | 'pair';
  status: string;
  category: string;
  tagsStr: string;
  ruleSet: string;
  domain: string;
  cooldownGroup: string;
  orderBy: string;
  orderDirection: string;
  includeDeleted: boolean;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onTagsStrChange: (v: string) => void;
  onRuleSetChange: (v: string) => void;
  onDomainChange: (v: string) => void;
  onCooldownGroupChange: (v: string) => void;
  onOrderByChange: (v: string) => void;
  onOrderDirectionChange: (v: string) => void;
  onIncludeDeletedChange: (v: boolean) => void;
};

export function CardListFilters({
  scope: _scope,
  status,
  category,
  tagsStr,
  ruleSet,
  domain,
  cooldownGroup,
  orderBy,
  orderDirection,
  includeDeleted,
  onStatusChange,
  onCategoryChange,
  onTagsStrChange,
  onRuleSetChange,
  onDomainChange,
  onCooldownGroupChange,
  onOrderByChange,
  onOrderDirectionChange,
  onIncludeDeletedChange,
}: CardListFiltersProps) {
  return (
    <Stack
      direction="row"
      spacing={{ xs: 1.5, sm: 2 }}
      flexWrap="wrap"
      alignItems="center"
      useFlexGap
    >
      <FormControlLabel
        control={<Checkbox checked={includeDeleted} onChange={(e) => onIncludeDeletedChange(e.target.checked)} size="small" />}
        label="삭제 포함"
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>status</InputLabel>
        <Select value={status} label="status" onChange={(e) => onStatusChange(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="published">published</MenuItem>
          <MenuItem value="draft">draft</MenuItem>
        </Select>
      </FormControl>
      <TextField label="category" value={category} onChange={(e) => onCategoryChange(e.target.value)} size="small" sx={{ width: 140 }} placeholder="필터" />
      <TextField label="tags" value={tagsStr} onChange={(e) => onTagsStrChange(e.target.value)} size="small" sx={{ width: 180 }} placeholder="쉼표 구분" />
      <TextField label="rule_set" value={ruleSet} onChange={(e) => onRuleSetChange(e.target.value)} size="small" sx={{ width: 160 }} placeholder="korean_standard_v1" />
      <TextField label="domain" value={domain} onChange={(e) => onDomainChange(e.target.value)} size="small" sx={{ width: 120 }} placeholder="domains 포함" />
      <TextField label="cooldown_group" value={cooldownGroup} onChange={(e) => onCooldownGroupChange(e.target.value)} size="small" sx={{ width: 140 }} placeholder="부분 일치" />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>정렬</InputLabel>
        <Select value={orderBy} label="정렬" onChange={(e) => onOrderByChange(e.target.value)}>
          <MenuItem value="priority">priority</MenuItem>
          <MenuItem value="card_id">card_id</MenuItem>
          <MenuItem value="updated_at">updated_at</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>방향</InputLabel>
        <Select value={orderDirection} label="방향" onChange={(e) => onOrderDirectionChange(e.target.value)}>
          <MenuItem value="asc">asc</MenuItem>
          <MenuItem value="desc">desc</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
