// 궁합 추출 테스트 페이지: /destiny_assemble/pair-test.
import { PairExtractTestTab } from './destinyassemble/PairExtractTestTab';

export default function DestinyAssemble_PairTestPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">명리어셈블 - 궁합 추출 테스트</h1>
      <PairExtractTestTab />
    </div>
  );
}
