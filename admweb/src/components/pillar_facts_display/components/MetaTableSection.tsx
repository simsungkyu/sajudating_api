// 입력/엔진 정보 테이블.
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export type MetaTableSectionProps = {
  metaRows: Array<{ label: string; value: string }>;
};

export function MetaTableSection({ metaRows }: MetaTableSectionProps) {
  if (metaRows.length === 0) return null;
  return (
    <div className="MetaTableSection overflow-hidden rounded-xl border border-border/70">
      <div className="border-b border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
        <p className="text-xs font-semibold text-foreground">입력/엔진 정보</p>
      </div>
      <Table className="w-full table-fixed text-xs sm:text-sm">
        <TableBody>
          {metaRows.map((row) => (
            <TableRow key={`${row.label}:${row.value}`}>
              <TableCell className="w-[32%] bg-muted/30 font-medium whitespace-normal break-words text-muted-foreground sm:w-36">
                {row.label}
              </TableCell>
              <TableCell className="whitespace-normal break-words">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
