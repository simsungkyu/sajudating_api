// REST client for itemncard extraction test (saju, pair) – admweb-only.
import { apiBase, ApiError } from '../api';

export type BirthInput = {
  date: string;
  time: string;
  time_precision?: string;
};

export type SajuExtractTestPayload = {
  birth: BirthInput;
  timezone?: string;
  calendar?: string;
  mode?: string;
  target_year?: string;
  target_month?: string;
  target_day?: string;
  target_daesoon_index?: string;
  gender?: string;
};

export type SelectedCard = {
  card_id: string;
  title: string;
  evidence: string[];
  score: number;
};

export type UserInfoSummary = {
  pillars: Record<string, string>;       // 명식 4주: y=년주, m=월주, d=일주, h=시주 (간지 문자열)
  items_summary: string;                 // 명식에서 추출한 items 요약 (파생요소 기반)
  tokens_summary: string[] | string;      // 카드 트리거 매칭용 토큰 목록 (사주 또는 궁합)
  rule_set: string;                      // 규칙 세트 식별자 (예: korean_standard_v1, 신살 등)
  engine_version: string;                // itemncard 엔진 버전 (예: itemncard@0.1)
  mode?: string;                        // 만세력 모드: 인생|연도별|월별|일간|대운
  period?: string;                      // 연계 기간 표시용 (예: 2025, 2025-03, 2025-03-15)
};

export type PillarSource = {
  base_date: string;
  base_time_used: string;
  mode: string;
  period: string;
  description?: string;
};

export type SajuExtractTestResponse = {
  user_info: UserInfoSummary;
  /** 연계 만세력: which date/period produced the pillars (기준일·기간). */
  pillar_source?: PillarSource;
  selected_cards: SelectedCard[];
  /** Assembled LLM context from selected cards when present (same as llm_context_preview). */
  llm_context?: string;
};

export type PairExtractTestPayload = {
  birthA: BirthInput;
  birthB: BirthInput;
  timezone?: string;
};

export type PairExtractTestResponse = {
  summary_a: UserInfoSummary;
  summary_b: UserInfoSummary;
  p_tokens_summary: string[];
  selected_cards: SelectedCard[];
  /** Assembled LLM context from selected pair cards when present (same as llm_context_preview). */
  llm_context?: string;
};

export type LLMContextPreviewPayload = {
  card_uids?: string[];
  card_ids?: string[];
  scope?: 'saju' | 'pair';
};

export type LLMContextPreviewResponse = {
  context: string;
  length: number;
};

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('admweb-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export async function sajuExtractTest(
  payload: SajuExtractTestPayload,
): Promise<SajuExtractTestResponse> {
  const token = getToken();
  const res = await fetch(`${apiBase}/adm/saju_extract_test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError((err as { error?: string }).error ?? res.statusText, res.status);
  }
  return res.json();
}

export async function pairExtractTest(
  payload: PairExtractTestPayload,
): Promise<PairExtractTestResponse> {
  const token = getToken();
  const res = await fetch(`${apiBase}/adm/pair_extract_test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError((err as { error?: string }).error ?? res.statusText, res.status);
  }
  return res.json();
}

export async function llmContextPreview(
  payload: LLMContextPreviewPayload,
): Promise<LLMContextPreviewResponse> {
  const token = getToken();
  const res = await fetch(`${apiBase}/adm/llm_context_preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError((err as { error?: string }).error ?? res.statusText, res.status);
  }
  return res.json();
}
