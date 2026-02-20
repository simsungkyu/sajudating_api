// 궁합어셈블 페이지: /destiny_assemble/pair_assemble, 개요 콘텐츠.
import { PairAssembleTab } from './destinyassemble/PairAssembleTab';

export default function DestinyAssemble_PairAssemblePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">명리어셈블 - 궁합어셈블</h1>
      <PairAssembleTab />
    </div>
  );
}
