// Bundled seed card data for "시드에서 불러오기" in card create form (CardDataStructure/ChemiStructure).
export interface SeedCardOption {
  id: string;
  label: string;
  scope: 'saju' | 'pair';
  data: SeedCardData;
}

export interface SeedCardData {
  card_id: string;
  version?: number;
  status?: string;
  rule_set?: string;
  scope: 'saju' | 'pair';
  title: string;
  category?: string;
  tags?: string[];
  domains?: string[];
  priority?: number;
  cooldown_group?: string;
  max_per_user?: number;
  trigger: Record<string, unknown>;
  score?: Record<string, unknown>;
  content?: Record<string, unknown>;
  debug?: Record<string, unknown>;
}

const saju정재강함: SeedCardData = {
  card_id: '십성_정재_강함_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'saju',
  title: '정재가 강하게 드러남',
  category: '십성',
  tags: ['money', 'planning'],
  domains: ['personality', 'work'],
  priority: 60,
  cooldown_group: 'money_core',
  max_per_user: 1,
  trigger: {
    all: [{ token: '십성:정재' }, { token: '십성:정재#H' }],
    any: [{ token: '십성:정재@월간' }, { token: '확신:전체#H' }],
    not: [],
  },
  score: {
    base: 50,
    bonus_if: [
      { token: '십성:정재@월간#H', add: 20 },
      { token: '오행:토#H', add: 10 },
    ],
    penalty_if: [{ token: '관계:충#H', sub: 10 }],
  },
  content: {
    summary: '현실적인 계획과 자원 관리 성향이 강해질 수 있습니다.',
    points: ['장점: 예산/일정 루틴 강점.', '주의: 변화 대응이 늦어질 수 있음.'],
    questions: ['요즘 관리 부담이 큰 영역이 있나요?'],
    guardrails: ['단정 표현 금지'],
  },
  debug: { description: '정재 HIGH + (월간 또는 확신)에서 선택' },
};

const pair궁합충: SeedCardData = {
  card_id: '궁합_충_일지_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'pair',
  title: 'A·B 일지 충',
  category: '궁합',
  tags: ['conflict', 'chemistry'],
  domains: ['compatibility'],
  priority: 60,
  cooldown_group: 'pair_core',
  max_per_user: 1,
  trigger: {
    all: [],
    any: [
      { src: 'P', token: '궁합:충@A.일지-B.일지' },
      { src: 'P', token: '궁합:충@A.일지-B.일지#H' },
    ],
    not: [],
  },
  score: { base: 50, bonus_if: [], penalty_if: [] },
  content: {
    summary: '두 사람의 일지가 충하는 궁합입니다. 긴장과 끌림이 공존할 수 있습니다.',
    points: ['서로 다른 성향이 부딪히며 성장할 수 있음.'],
    questions: ['갈등이 생겼을 때 어떻게 풀어가고 있나요?'],
    guardrails: [],
  },
  debug: { description: 'P 궁합:충@A.일지-B.일지' },
};

const saju신살도화: SeedCardData = {
  card_id: '신살_도화_일지_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'saju',
  title: '도화가 일지에 있음',
  category: '신살',
  tags: ['romance', 'charm'],
  domains: ['personality', 'relationship'],
  priority: 50,
  cooldown_group: '',
  max_per_user: 0,
  trigger: {
    all: [],
    any: [
      { token: '신살:도화@일지' },
      { token: '신살:도화@일지~common_v1' },
    ],
    not: [],
  },
  score: { base: 45, bonus_if: [], penalty_if: [] },
  content: {
    summary: '도화가 일지에 있어 인연과 매력이 드러나기 쉬운 구조입니다.',
    points: ['대인관계·연애에 유리할 수 있음.'],
    questions: ['요즘 새로운 인연이 생겼나요?'],
    guardrails: [],
  },
  debug: { description: '신살:도화@일지 매칭' },
};

const saju오행토: SeedCardData = {
  card_id: '오행_토_강함_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'saju',
  title: '오행 토(土)가 강하게 드러남',
  category: '오행',
  tags: ['stability', 'trust', 'grounding'],
  domains: ['personality', 'work'],
  priority: 55,
  cooldown_group: 'five_element',
  max_per_user: 1,
  trigger: {
    all: [
      { token: '오행:토' },
      { token: '오행:토#H' },
    ],
    any: [
      { token: '오행:토@월간' },
      { token: '오행:토@일지' },
      { token: '오행:토@전체#H' },
    ],
    not: [],
  },
  score: {
    base: 50,
    bonus_if: [
      { token: '오행:토@월간#H', add: 15 },
      { token: '십성:정재#H', add: 10 },
    ],
    penalty_if: [{ token: '관계:충#H', sub: 5 }],
  },
  content: {
    summary: '토(土) 기운이 강해 안정 추구와 신뢰·현실 감각이 두드러질 수 있습니다.',
    points: [
      '장점: 일과 관계에서 꾸준함·신뢰를 주기 쉬움.',
      '주의: 고정관념이 강해지면 유연성이 줄어들 수 있음.',
    ],
    questions: [
      '요즘 \'안정\'을 가장 중요하게 느끼는 영역이 있나요?',
      '변화가 필요할 때 어떻게 결정하시나요?',
    ],
    guardrails: [
      '단정 표현(반드시/무조건) 금지',
      '민감한 개인사 질문은 선택형으로',
    ],
  },
  debug: { description: '오행:토 HIGH + (월간/일지/전체)에서 선택' },
};

const pair궁합합: SeedCardData = {
  card_id: '궁합_합_일지_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'pair',
  title: 'A·B 일지 합',
  category: '궁합',
  tags: ['harmony', 'bond'],
  domains: ['compatibility'],
  priority: 58,
  cooldown_group: '',
  max_per_user: 0,
  trigger: {
    all: [],
    any: [
      { src: 'P', token: '궁합:합@A.일지-B.일지' },
      { src: 'P', token: '궁합:합@A.일지-B.일지#H' },
    ],
    not: [],
  },
  score: { base: 50, bonus_if: [], penalty_if: [] },
  content: {
    summary: '두 사람의 일지가 합하는 궁합입니다. 조화와 유대가 잘 맞을 수 있습니다.',
    points: ['서로를 보완하고 편안함을 주는 경향.'],
    questions: ['처음 만났을 때 편했다는 기억이 있나요?'],
    guardrails: [],
  },
  debug: { description: 'P 궁합:합@A.일지-B.일지' },
};

const pair궁합천간합: SeedCardData = {
  card_id: '궁합_천간합_천간_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'pair',
  title: 'A·B 천간합',
  category: '궁합',
  tags: ['harmony', 'heavenly_stem'],
  domains: ['compatibility'],
  priority: 55,
  cooldown_group: '',
  max_per_user: 0,
  trigger: {
    all: [],
    any: [
      { src: 'P', token: '궁합:천간합' },
      { src: 'P', token: '궁합:천간합@A.일간-B.월간' },
      { src: 'P', token: '궁합:천간합@A.일간-B.월간#M' },
      { src: 'P', token: '궁합:천간합@A.일간-B.월간#H' },
    ],
    not: [{ src: 'P', token: '궁합:확신#L' }],
  },
  score: {
    base: 50,
    bonus_if: [{ src: 'P', token: '궁합:천간합#H', add: 10 }],
    penalty_if: [],
  },
  content: {
    summary: '두 사람의 천간이 합하는 궁합입니다. 기운이 맞고 소통이 잘 맞을 수 있습니다.',
    points: [
      '천간합은 지지합보다 의지·성향 차원에서 잘 맞는 편.',
      '일간-월간 등 쌍이 있으면 해당 영역에서 조화를 느끼기 쉬움.',
    ],
    questions: [
      '서로 말이 잘 통한다고 느끼는 주제가 있나요?',
      '의견이 다를 때 어떻게 맞추는 편인가요?',
    ],
    guardrails: ['단정 표현(반드시/무조건) 금지'],
  },
  debug: { description: 'P 궁합:천간합 또는 A.일간-B.월간 천간합 매칭' },
};

const saju격국정재격: SeedCardData = {
  card_id: '격국_정재격_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'saju',
  title: '정재격이 드러남',
  category: '격국',
  tags: ['money', 'stability', 'planning'],
  domains: ['personality', 'work'],
  priority: 58,
  cooldown_group: 'guk_core',
  max_per_user: 1,
  trigger: {
    all: [{ token: '격국:정재격' }],
    any: [{ token: '격국:정재격#H' }, { token: '격국:정재격#M' }],
    not: [{ token: '확신:격국#L' }],
  },
  score: {
    base: 52,
    bonus_if: [
      { token: '격국:정재격#H', add: 15 },
      { token: '십성:정재#H', add: 8 },
    ],
    penalty_if: [{ token: '관계:충#H', sub: 5 }],
  },
  content: {
    summary: '정재격이 있어 재물과 현실 관리에 비중이 커질 수 있는 구조입니다.',
    points: [
      '장점: 계획적 자원 관리와 안정 추구 성향이 두드러질 수 있음.',
      '주의: 격이 흐트러지면 소비·불안이 늘어날 수 있음.',
    ],
    questions: [
      '요즘 돈·자원을 관리할 때 가장 신경 쓰는 부분이 있나요?',
      '안정을 위해 포기한 것과 얻은 것이 있다면 어떤가요?',
    ],
    guardrails: [
      '단정 표현(반드시/무조건) 금지',
      '민감한 개인사 질문은 선택형으로',
    ],
  },
  debug: { description: '격국:정재격 존재 + (H 또는 M 등급), 확신:격국 낮으면 제외' },
};

const pair궁합형: SeedCardData = {
  card_id: '궁합_형_일지_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'pair',
  title: 'A·B 일지 형(刑)',
  category: '궁합',
  tags: ['tension', 'adjustment'],
  domains: ['compatibility'],
  priority: 55,
  cooldown_group: '',
  max_per_user: 0,
  trigger: {
    all: [],
    any: [
      { src: 'P', token: '궁합:형@A.일지-B.일지' },
      { src: 'P', token: '궁합:형@A.일지-B.일지#H' },
    ],
    not: [],
  },
  score: {
    base: 48,
    bonus_if: [],
    penalty_if: [{ src: 'P', token: '궁합:확신#L', sub: 15 }],
  },
  content: {
    summary: '두 사람의 일지가 형(刑)하는 궁합입니다. 서로 조정과 이해가 필요할 수 있습니다.',
    points: [
      '긴장감이나 미묘한 마찰이 있을 수 있음.',
      '소통과 경청으로 완화 가능.',
    ],
    questions: ['의견이 엇갈릴 때 어떻게 맞춰 가시나요?'],
    guardrails: ['단정 표현(반드시/무조건) 금지'],
  },
  debug: { description: 'P 궁합:형@A.일지-B.일지' },
};

const saju확신전체: SeedCardData = {
  card_id: '확신_전체_v1',
  version: 1,
  status: 'published',
  rule_set: 'korean_standard_v1',
  scope: 'saju',
  title: '전체 명식 확신이 높음',
  category: '확신',
  tags: ['confidence', 'quality', 'reliability'],
  domains: ['personality', 'reading_quality'],
  priority: 40,
  cooldown_group: 'confidence_core',
  max_per_user: 1,
  trigger: {
    all: [{ token: '확신:전체' }],
    any: [{ token: '확신:전체#H' }, { token: '확신:전체#M' }],
    not: [],
  },
  score: {
    base: 45,
    bonus_if: [{ token: '확신:전체#H', add: 10 }],
    penalty_if: [],
  },
  content: {
    summary: '입력 정보가 충분해 전체 명식 해석의 신뢰도가 높은 편입니다.',
    points: [
      '장점: 생년월일시·시간대가 명확하면 십성·관계·강약 등 판단 근거가 탄탄해짐.',
      '참고: 이후 연도·월별 운은 별도로 보는 것이 좋습니다.',
    ],
    questions: ['지금 가장 궁금한 주제(일·관계·재물·건강 등)가 있나요?'],
    guardrails: [
      '단정 표현(반드시/무조건) 금지',
      '확신 높아도 개인 차이는 있음을 전제로 표현',
    ],
  },
  debug: {
    description: '확신:전체 존재 + (H 또는 M 등급)일 때 선택; 읽기 품질이 좋은 경우 안내',
  },
};

export const SEED_CARD_OPTIONS: SeedCardOption[] = [
  { id: 'saju_정재_강함', label: 'saju_정재_강함', scope: 'saju', data: saju정재강함 },
  { id: 'pair_궁합_충', label: 'pair_궁합_충', scope: 'pair', data: pair궁합충 },
  { id: 'saju_신살_도화', label: 'saju_신살_도화', scope: 'saju', data: saju신살도화 },
  { id: 'saju_오행_토', label: 'saju_오행_토', scope: 'saju', data: saju오행토 },
  { id: 'pair_궁합_합', label: 'pair_궁합_합', scope: 'pair', data: pair궁합합 },
  { id: 'pair_궁합_천간합', label: 'pair_궁합_천간합', scope: 'pair', data: pair궁합천간합 },
  { id: 'saju_격국_정재격', label: 'saju_격국_정재격', scope: 'saju', data: saju격국정재격 },
  { id: 'pair_궁합_형', label: 'pair_궁합_형', scope: 'pair', data: pair궁합형 },
  { id: 'saju_확신_전체', label: 'saju_확신_전체', scope: 'saju', data: saju확신전체 },
];
