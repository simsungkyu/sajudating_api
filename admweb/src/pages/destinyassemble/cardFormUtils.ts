// Card form helpers and validation for DataCardsPage (saju/pair card create/edit, bulk, export).
import type { ItemnCardBasicFragment, ItemNCardInput } from '../../graphql/generated';
import type { SeedCardData } from '../../data/seedCards';

export function defaultInput(scope: 'saju' | 'pair'): ItemNCardInput {
  return {
    cardId: '',
    version: 1,
    status: 'draft',
    ruleSet: 'korean_standard_v1',
    scope: scope === 'saju' ? 'saju' : 'pair',
    title: '',
    category: '',
    tags: [],
    domains: [],
    priority: 0,
    triggerJson: '{}',
    scoreJson: '{}',
    contentJson: '{}',
    cooldownGroup: '',
    maxPerUser: 0,
    debugJson: '{}',
  };
}

export function cardToInput(card: ItemnCardBasicFragment): ItemNCardInput {
  return {
    cardId: card.cardId,
    version: card.version,
    status: card.status,
    ruleSet: card.ruleSet,
    scope: card.scope,
    title: card.title,
    category: card.category,
    tags: card.tags ?? [],
    domains: card.domains ?? [],
    priority: card.priority,
    triggerJson: card.triggerJson || '{}',
    scoreJson: card.scoreJson || '{}',
    contentJson: card.contentJson || '{}',
    cooldownGroup: card.cooldownGroup || '',
    maxPerUser: card.maxPerUser ?? 0,
    debugJson: card.debugJson || '{}',
  };
}

export function duplicateToInput(card: ItemnCardBasicFragment): ItemNCardInput {
  return {
    ...cardToInput(card),
    cardId: (card.cardId || '').trim() ? `${card.cardId}_copy` : '',
    status: 'draft',
    title: (card.title || '').trim() ? `사본: ${card.title}` : '',
  };
}

export function buildCardExportJson(card: ItemnCardBasicFragment): Record<string, unknown> {
  const trigger = parseJsonSafe(card.triggerJson ?? '{}');
  const score = parseJsonSafe(card.scoreJson ?? '{}');
  const content = parseJsonSafe(card.contentJson ?? '{}');
  const debug = parseJsonSafe(card.debugJson ?? '{}');
  return {
    card_id: card.cardId,
    scope: card.scope,
    status: card.status,
    rule_set: card.ruleSet,
    title: card.title,
    category: card.category,
    tags: card.tags ?? [],
    domains: card.domains ?? [],
    priority: card.priority,
    trigger,
    score,
    content,
    cooldown_group: card.cooldownGroup ?? '',
    max_per_user: card.maxPerUser ?? 0,
    debug,
  };
}

export function parseJsonSafe(s: string): unknown {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
}

export function downloadCardAsJson(card: ItemnCardBasicFragment): void {
  const obj = buildCardExportJson(card);
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(card.cardId || 'card').replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateTriggerJson(triggerJson: string, scope: 'saju' | 'pair'): string | null {
  if (!triggerJson?.trim()) return 'trigger(JSON)를 입력하세요.';
  try {
    const o = JSON.parse(triggerJson) as Record<string, unknown>;
    if (typeof o !== 'object' || o === null) return 'trigger: object가 필요합니다.';
    const arrKeys = ['all', 'any', 'not'] as const;
    for (const key of arrKeys) {
      if (!(key in o)) continue;
      const arr = o[key];
      if (!Array.isArray(arr)) return `trigger.${key}: 배열이어야 합니다.`;
      for (let i = 0; i < arr.length; i++) {
        const c = arr[i] as Record<string, unknown>;
        if (typeof c !== 'object' || c === null) return `trigger.${key}[${i}]: 객체여야 합니다.`;
        if (scope === 'pair' && c.src != null && !['P', 'A', 'B'].includes(String(c.src))) {
          return `trigger.${key}[${i}].src: P, A, B 중 하나여야 합니다.`;
        }
        if (typeof c.token !== 'string' || !c.token.trim()) return `trigger.${key}[${i}].token: 문자열이 필요합니다.`;
      }
    }
    return null;
  } catch {
    return 'trigger는 유효한 JSON이어야 합니다.';
  }
}

export function validateScoreJson(scoreJson: string): string | null {
  if (!scoreJson?.trim()) return null;
  try {
    const o = JSON.parse(scoreJson) as Record<string, unknown>;
    if (typeof o !== 'object' || o === null) return 'score: object가 필요합니다.';
    if (typeof o.base !== 'number') return 'score.base: 숫자가 필요합니다.';
    const bonus = o.bonus_if;
    if (bonus != null) {
      if (!Array.isArray(bonus)) return 'score.bonus_if: 배열이어야 합니다.';
      for (let i = 0; i < bonus.length; i++) {
        const b = bonus[i] as Record<string, unknown>;
        if (typeof b?.token !== 'string' || typeof b?.add !== 'number') {
          return `score.bonus_if[${i}]: token(문자열), add(숫자) 필요.`;
        }
      }
    }
    const penalty = o.penalty_if;
    if (penalty != null) {
      if (!Array.isArray(penalty)) return 'score.penalty_if: 배열이어야 합니다.';
      for (let i = 0; i < penalty.length; i++) {
        const p = penalty[i] as Record<string, unknown>;
        if (typeof p?.token !== 'string' || typeof p?.sub !== 'number') {
          return `score.penalty_if[${i}]: token(문자열), sub(숫자) 필요.`;
        }
      }
    }
    return null;
  } catch {
    return 'score는 유효한 JSON이어야 합니다.';
  }
}

export function validateCardInput(input: ItemNCardInput): string | null {
  if (!input.cardId?.trim()) return 'card_id를 입력하세요.';
  if (!input.title?.trim()) return 'title을 입력하세요.';
  if (!input.status?.trim()) return 'status를 선택하세요.';
  if (input.scope !== 'saju' && input.scope !== 'pair') return 'scope는 saju 또는 pair여야 합니다.';
  const triggerErr = validateTriggerJson(input.triggerJson ?? '', input.scope);
  if (triggerErr) return triggerErr;
  const scoreErr = validateScoreJson(input.scoreJson ?? '');
  if (scoreErr) return scoreErr;
  return null;
}

export function seedCardToInput(data: SeedCardData): ItemNCardInput {
  return {
    cardId: data.card_id,
    version: data.version ?? 1,
    status: (data.status as 'draft' | 'published') ?? 'draft',
    ruleSet: data.rule_set ?? 'korean_standard_v1',
    scope: data.scope,
    title: data.title,
    category: data.category ?? '',
    tags: data.tags ?? [],
    domains: data.domains ?? [],
    priority: data.priority ?? 0,
    triggerJson: JSON.stringify(data.trigger ?? {}, null, 2),
    scoreJson: JSON.stringify(data.score ?? {}, null, 2),
    contentJson: JSON.stringify(data.content ?? {}, null, 2),
    cooldownGroup: data.cooldown_group ?? '',
    maxPerUser: data.max_per_user ?? 0,
    debugJson: JSON.stringify(data.debug ?? {}, null, 2),
  };
}

export function parseBulkCardItem(obj: unknown): SeedCardData | null {
  if (obj == null || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const cardId = typeof o.card_id === 'string' ? o.card_id : null;
  const scope = o.scope === 'saju' || o.scope === 'pair' ? o.scope : null;
  const title = typeof o.title === 'string' ? o.title : null;
  const trigger = o.trigger && typeof o.trigger === 'object' ? o.trigger as Record<string, unknown> : {};
  if (!cardId || !scope || !title) return null;
  return {
    card_id: cardId,
    version: typeof o.version === 'number' ? o.version : 1,
    status: typeof o.status === 'string' ? o.status : 'draft',
    rule_set: typeof o.rule_set === 'string' ? o.rule_set : 'korean_standard_v1',
    scope,
    title,
    category: typeof o.category === 'string' ? o.category : '',
    tags: Array.isArray(o.tags) ? (o.tags as string[]) : [],
    domains: Array.isArray(o.domains) ? (o.domains as string[]) : [],
    priority: typeof o.priority === 'number' ? o.priority : 0,
    cooldown_group: typeof o.cooldown_group === 'string' ? o.cooldown_group : '',
    max_per_user: typeof o.max_per_user === 'number' ? o.max_per_user : 0,
    trigger,
    score: o.score && typeof o.score === 'object' ? o.score as Record<string, unknown> : {},
    content: o.content && typeof o.content === 'object' ? o.content as Record<string, unknown> : {},
    debug: o.debug && typeof o.debug === 'object' ? o.debug as Record<string, unknown> : {},
  };
}
