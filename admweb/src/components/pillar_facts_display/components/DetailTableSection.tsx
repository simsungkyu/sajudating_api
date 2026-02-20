// 파생요소 상세 테이블(facts / evals).
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DetailRow } from '../common/pillarFactsTypes';
import { scoreToneClass } from '../common/pillarFactsUtils';

export type DetailTableSectionProps = {
  detailRows: DetailRow[];
  maxDetailsShown: number;
};

export function DetailTableSection({ detailRows, maxDetailsShown }: DetailTableSectionProps) {
  if (detailRows.length === 0) return null;
  const hiddenDetails = Math.max(0, detailRows.length - maxDetailsShown);
  return (
    <div className="DetailTableSection overflow-hidden rounded-xl border border-border/70">
      <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
        <p className="text-xs font-semibold text-foreground">파생요소 상세 (facts / evals)</p>
      </div>
      <Table className="w-full table-fixed text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[12%] whitespace-normal break-words sm:w-16">구분</TableHead>
            <TableHead className="w-[20%] whitespace-normal break-words sm:w-28">키</TableHead>
            <TableHead className="w-[22%] whitespace-normal break-words sm:w-40">항목</TableHead>
            <TableHead className="w-[36%] whitespace-normal break-words">값</TableHead>
            <TableHead className="w-[10%] whitespace-normal break-words sm:w-20">점수</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detailRows.slice(0, maxDetailsShown).map((row, index) => (
            <TableRow
              key={`${row.type}:${row.keyName}:${index}`}
              className={index % 2 === 1 ? 'bg-muted/15' : ''}
            >
              <TableCell className="font-medium uppercase whitespace-normal break-words text-muted-foreground">
                {row.type}
              </TableCell>
              <TableCell className="font-mono text-xs whitespace-normal break-all">{row.keyName}</TableCell>
              <TableCell className="whitespace-normal break-words">{row.label}</TableCell>
              <TableCell className="whitespace-normal break-words">{row.value}</TableCell>
              <TableCell className={scoreToneClass(row.score)}>{row.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hiddenDetails > 0 && (
        <p className="border-t border-border/70 px-2 py-1.5 text-xs text-muted-foreground">
          상세 항목 {hiddenDetails}개는 생략되었습니다.
        </p>
      )}
    </div>
  );
}
