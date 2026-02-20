// 사주 추출 테스트 페이지: /destiny_assemble/saju-test.
import { SajuExtractTestTab } from './destinyassemble/SajuExtractTestTab';

export default function DestinyAssemble_SajuTestPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">명리어셈블 - 사주 추출 테스트</h1>
      <SajuExtractTestTab />
    </div>
  );
}
