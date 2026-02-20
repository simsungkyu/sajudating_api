// Saju(사주) 추출/표시용 타입 정의 (SajuExtracted, SajuPillar).

export type SajuExtracted = {
    birth: string; // YYYYMMDDHHmm or YYYYMMDD
    timezone: string;
    calendar: 'solar' | 'lunar';

    eightkey: string; // YyMmDdHh or YyMmDd 한글 천간(대문자) 지지(소문자) 연월일시 순
    charDetails: CharDetail[];
    pillars: SajuPillar[];
    /** 신강/신약 (일주 강약) */
    bodyStrength?: string;
    /** 격국(격) */
    chartPattern?: string;
    /** 용희신 요약(문자열) */
    chartGodsSummary: string;
    chartGods: ChartGod[];
    /** 오행분포 */
    fiveElementDistribution?: string;
    /** 조후(한난조습 밸런스 판단) */
    climateBalance?: string;
    /** 전체 구조 요약(예: "재관인 식상 비중", "통근/득령/득지 종합" 같은 해석용 지표) */
    chartSummary?: string;
    /** 대운(10년 단위 운) 요약 또는 기간 정보 */
    majorLuck?: string;
    /** 공망(빈 글자) 천간 목록 또는 요약 */
    emptyStems?: string;
    /** 합·충·형·파·해 등 간지 관계 요약 */
    stemBranchRelations?: string;
    /** 합·충·형·파·해 세부 목록(구조화) */
    stemBranchRelationDetails?: BranchInteraction[];


}

type SajuPillar = {
    k: string; // 천간
    n: string; // 지지
    /** 천간 십성 */
    stemTenGods?: string;
    /** 지지 십성 */
    branchTenGods?: string;
    /** 지지 지장간 */
    hiddenStems?: string;
    /** 지지 십이운성 */
    branchTwelveFortune?: string;
    /** 지지 신살 */
    branchDivineKillers?: string;
    /** 공망 여부(이 주의 천간이 공망인지) */
    isVoid?: boolean;
    /** 득령/득지/통근 등 근(根) 강약 요약 */
    rootStatus?: string;
    /** 지지 합(육합·방합·삼합 등) 관계 요약 */
    branchCombinations?: string;
    /** 이 주가 관여하는 합·충·형·파·해 세부 목록 */
    interactionDetails?: BranchInteraction[];
};


/** 용신·희신·기신·구신 한 건. 데이터 / 보완 / 요약 항목을 한 타입에 포함 */
export type ChartGod = {
    /** 용신/희신/기신/구신 구분 */
    role: 'yong' | 'hee' | 'ki' | 'goo';

    /** [데이터] 해당 오행 목록(예: 목·화·토·금·수 또는 木火土金水 코드) */
    elements: string[];
    /** [데이터] 해당 간지 글자 목록(천간·지지) */
    characters?: string[];
    /** [데이터] 해당 신이 강하게 나타나는 주 위치. 0=년, 1=월, 2=일, 3=시 */
    pillarIndices?: number[];

    /** [보완] 세부 라벨(해석 도구/UI용) */
    label?: string;
    /** [보완] 강도·비중 등(예: "강", "중", "약") */
    strength?: string;

    /** [요약] 해석용 한 줄 요약 */
    summary?: string;
};

/** 합·충·형·파·해(간지 간 관계) 한 건. 데이터 / 보완 / 요약 항목을 한 타입에 포함 */
export type BranchInteraction = {
    /** 관계 종류: 합/충/형/파/해 */
    kind: 'hap' | 'chung' | 'hyung' | 'pa' | 'hae';

    /** [데이터] 관여하는 주의 위치. 0=년주, 1=월주, 2=일주, 3=시주. 삼합=3개, 그 외 보통 2개 */
    pillarIndices: number[];
    /** [데이터] 관여하는 간지 글자 목록(순서 유지). 삼합=3글자, 육합·충·형·파·해=2글자 */
    characters: string[];
    /** [데이터] 천간 간 관계인지, 지지 간 관계인지 */
    target: 'stem' | 'branch';

    /** [보완] 합일 때 세부: 육합, 방합, 삼합, 천간합 등 */
    subKind?: string;
    /** [보완] 삼합 시 방(方) 또는 오행(예: 인오술=화방) */
    directionOrElement?: string;
    /** [보완] 기타 보조 라벨(해석 도구/UI용) */
    label?: string;

    /** [요약] 해석용 한 줄 요약 */
    summary?: string;
}

export type PeriodLuck = {
    target: 'decade' | 'year' | 'month' | 'day' | 'hour';
    period: string; // 대운일때 시작나이, 세운일때 시작년도, 월별일때 시작월, 일간일때 시작일, 시간일때 시작시간
    pillarkey: string; // 천간지지 글자 2자 구성


}

type PillarPos = '연' | '월' | '일' | '시';
type StemPos = '간' | '지';
type Stem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계';
type Branch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해';
type Element = '목' | '화' | '토' | '금' | '수';
type YinYang = '양' | '음';
type TenStem = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';
export type CharDetail = {
    char: Stem | Branch; // 글자 한글로 표시
    pillarPos: PillarPos; // 연/월/일/시
    stemPos: StemPos; // 간/지
    yinyang: YinYang; // 음양
    element: Element; // 오행
    tenStem: TenStem | '본원'; // 십성
}
