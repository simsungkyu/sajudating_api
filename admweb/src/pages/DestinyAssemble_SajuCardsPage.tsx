// 사주 카드 목록 페이지: /destiny_assemble/saju, 필터·카드 리스트.
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CardList } from './destinyassemble/CardList';
import { CardListFilters } from './destinyassemble/CardListFilters';

const DEFAULT_PAGE_SIZE = 25;

export default function DestinyAssemble_SajuCardsPage() {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [ruleSet, setRuleSet] = useState('');
  const [domain, setDomain] = useState('');
  const [cooldownGroup, setCooldownGroup] = useState('');
  const [orderBy, setOrderBy] = useState('priority');
  const [orderDir, setOrderDir] = useState('desc');
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const input = {
    limit: pageSize,
    offset,
    scope: 'saju',
    status: status || undefined,
    category: category.trim() || undefined,
    tags: tagsStr.split(',').map((s) => s.trim()).filter(Boolean),
    ruleSet: ruleSet.trim() || undefined,
    domain: domain.trim() || undefined,
    cooldownGroup: cooldownGroup.trim() || undefined,
    orderBy,
    orderDirection: orderDir,
    includeDeleted: includeDeleted || undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">명리어셈블 - 사주 카드</h1>
      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <CardListFilters
            scope="saju"
            status={status}
            category={category}
            tagsStr={tagsStr}
            ruleSet={ruleSet}
            domain={domain}
            cooldownGroup={cooldownGroup}
            orderBy={orderBy}
            orderDirection={orderDir}
            includeDeleted={includeDeleted}
            onStatusChange={(v) => { setStatus(v); setOffset(0); }}
            onCategoryChange={(v) => { setCategory(v); setOffset(0); }}
            onTagsStrChange={(v) => { setTagsStr(v); setOffset(0); }}
            onRuleSetChange={(v) => { setRuleSet(v); setOffset(0); }}
            onDomainChange={(v) => { setDomain(v); setOffset(0); }}
            onCooldownGroupChange={(v) => { setCooldownGroup(v); setOffset(0); }}
            onOrderByChange={(v) => { setOrderBy(v); setOffset(0); }}
            onOrderDirectionChange={(v) => { setOrderDir(v); setOffset(0); }}
            onIncludeDeletedChange={(v) => { setIncludeDeleted(v); setOffset(0); }}
          />
          <CardList scope="saju" input={input} onOffsetChange={setOffset} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </CardContent>
      </Card>
    </div>
  );
}
