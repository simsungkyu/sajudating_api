// Modal to edit admin user: email and password via updateAdminUser mutation.
import { useEffect, useState, type FormEvent } from 'react';
import { useUpdateAdminUserMutation } from '@/graphql/generated';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface EditAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  admin: { uid: string; email: string; username: string } | null;
}

export default function EditAdminModal({
  open,
  onClose,
  onSuccess,
  admin,
}: EditAdminModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [updateAdminUser] = useUpdateAdminUserMutation();

  const reset = () => {
    setEmail(admin?.email ?? '');
    setPassword('');
    setConfirmPassword('');
    setSubmitting(false);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      reset();
    }
  };

  useEffect(() => {
    if (open && admin) {
      setEmail(admin.email);
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [open, admin?.uid, admin?.email]);

  const canSubmit =
    Boolean(email.trim()) &&
    Boolean(password.trim()) &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!admin || !canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await updateAdminUser({
        variables: {
          uid: admin.uid,
          email: email.trim(),
          password: password.trim(),
        },
      });

      if (result.errors) {
        setError(result.errors[0]?.message ?? 'GraphQL 오류');
        return;
      }

      const res = result.data?.updateAdminUser;
      if (res?.ok) {
        onSuccess?.();
        onClose();
        reset();
      } else {
        setError(res?.err ?? res?.msg ?? '수정에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>관리자 수정</DialogTitle>
          <DialogDescription>
            이메일과 비밀번호를 입력하세요. 비밀번호는 6자 이상이어야 합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-admin-email" className="text-sm font-medium">
                이메일
              </label>
              <input
                id="edit-admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-admin-password" className="text-sm font-medium">
                새 비밀번호
              </label>
              <input
                id="edit-admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                minLength={6}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-admin-confirm" className="text-sm font-medium">
                비밀번호 확인
              </label>
              <input
                id="edit-admin-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="동일하게 입력"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? '저장 중…' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
