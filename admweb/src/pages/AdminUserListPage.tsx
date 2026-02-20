// Admin user list: card list layout (no table) for mobile-friendly, no horizontal scroll.
import { Pencil, Plus, RefreshCw, UserCog, UserX } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import {
  useAdminUsersQuery,
  useSetAdminUserActiveMutation,
} from '@/graphql/generated';
import { authAtom } from '@/state/auth';
import EditAdminModal from '@/components/EditAdminModal';
import JoinModal from '@/components/JoinModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function toMillis(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const s = (value as string).trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
      const n = Number.parseInt(s, 10);
      return Number.isFinite(n) ? n : null;
    }
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function formatDate(value?: unknown): string {
  if (value == null) return '–';
  const ms = toMillis(value);
  if (ms == null) return String(value);
  return new Date(ms).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type AdminRow = {
  __typename: 'AdminUser';
  uid: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export default function AdminUserListPage() {
  const auth = useAtomValue(authAtom);
  const { data, loading, error, refetch } = useAdminUsersQuery();
  const [setAdminUserActive, { loading: activeLoading }] =
    useSetAdminUserActiveMutation();
  const [joinOpen, setJoinOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminRow | null>(null);

  const raw = data?.adminUsers;
  const list =
    raw?.nodes?.filter(
      (n): n is typeof n & { __typename: 'AdminUser' } => n.__typename === 'AdminUser'
    ) ?? [];
  const total = raw?.total ?? list.length;
  const errMsg = raw?.ok === false ? (raw?.err ?? raw?.msg ?? null) : null;

  const handleSetActive = async (row: AdminRow) => {
    const next = !row.isActive;
    if (!next && !window.confirm(`${row.email} 계정을 비활성화할까요?`)) return;
    try {
      const res = await setAdminUserActive({
        variables: { uid: row.uid, active: next },
      });
      if (res.data?.setAdminUserActive?.ok) refetch();
      else alert(res.data?.setAdminUserActive?.err ?? res.data?.setAdminUserActive?.msg ?? '변경 실패');
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류 발생');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <UserCog className="size-5 shrink-0" />
            <CardTitle>관리자 목록</CardTitle>
          </div>
          <CardDescription className="block space-y-0.5">
            {auth?.adminId && (
              <span className="block break-words text-foreground/80">
                현재 로그인: {auth.adminId}
              </span>
            )}
            {!loading && !error && (
              <span className="block">
                {list.length === 0 ? '등록된 관리자가 없습니다.' : `총 ${total}명`}
              </span>
            )}
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className="size-4" />
              새로고침
            </Button>
            <Button size="sm" onClick={() => setJoinOpen(true)}>
              <Plus className="size-4" />
              관리자 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="py-8 text-center text-muted-foreground text-sm">
              로딩 중…
            </p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                목록을 불러올 수 없습니다. {error.message}
              </AlertDescription>
            </Alert>
          )}

          {errMsg && !loading && (
            <Alert variant="destructive">
              <AlertDescription>{errMsg}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && list.length > 0 && (
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {list.map((row) => (
                <li
                  key={row.uid}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{row.email}</p>
                      <p className="text-muted-foreground text-sm truncate">
                        {row.username || '–'} · {row.uid.length > 8 ? `${row.uid.slice(0, 8)}…` : row.uid}
                      </p>
                    </div>
                    <Badge variant={row.isActive ? 'default' : 'secondary'} className="shrink-0 text-sm">
                      {row.isActive ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    생성 {formatDate(row.createdAt)} · 수정 {formatDate(row.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 border-t pt-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(row)}
                      disabled={activeLoading}
                    >
                      <UserX className="size-4" />
                      {row.isActive ? '비활성화' : '활성화'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditAdmin(row)}
                    >
                      <Pencil className="size-4" />
                      수정
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <JoinModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onSuccess={() => {
          setJoinOpen(false);
          refetch();
        }}
      />

      <EditAdminModal
        open={editAdmin !== null}
        onClose={() => setEditAdmin(null)}
        onSuccess={() => {
          setEditAdmin(null);
          refetch();
        }}
        admin={editAdmin}
      />
    </div>
  );
}
