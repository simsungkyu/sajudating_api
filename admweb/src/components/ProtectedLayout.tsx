// Layout for authenticated admin: left drawer (nav + 관리자 + 로그아웃), desktop fixed / mobile Sheet.
import { LayoutDashboard, FileText, LogOut, Bot, Layers, Menu, UserCog } from 'lucide-react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { type ComponentType, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { authAtom } from '@/state/auth';

const DRAWER_WIDTH = '16rem'; /* 256px */

const destinyAssembleSubmenu = [
  { to: '/destiny_assemble/saju_assemble', label: '사주어셈블' },
  { to: '/destiny_assemble/pair_assemble', label: '궁합어셈블' },
  { to: '/destiny_assemble/saju', label: '사주 카드' },
  { to: '/destiny_assemble/pair', label: '궁합 카드' },
  { to: '/destiny_assemble/saju-test', label: '사주 추출 테스트' },
  { to: '/destiny_assemble/pair-test', label: '궁합 추출 테스트' },
] as const;

type NavLinkItem =
  | { to: string; label: string; icon?: ComponentType<{ className?: string }> }
  | { to: string; label: string; icon?: ComponentType<{ className?: string }>; children: readonly { to: string; label: string }[] };

const navLinks: NavLinkItem[] = [
  { to: '/saju-profiles', label: '사주 프로필' },
  { to: '/phy-partners', label: '관상 파트너' },
  { to: '/ai-meta', label: 'AI 메타', icon: Bot },
  { to: '/destiny_assemble', label: '명리어셈블', icon: Layers, children: destinyAssembleSubmenu },
  { to: '/local-logs', label: '로그', icon: FileText },
  { to: '/adminusers', label: '관리자 목록', icon: UserCog },
];

function DrawerContent({
  onNavigate,
  onLogout,
  adminId,
}: {
  onNavigate: () => void;
  onLogout: () => void;
  adminId: string | undefined;
}) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <Button
          variant="ghost"
          className="font-bold"
          onClick={() => {
            navigate('/');
            onNavigate();
          }}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          Y2SL Admin
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => {
            navigate('/');
            onNavigate();
          }}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          대시보드
        </Button>
        {navLinks.map((item) => {
          const Icon = 'icon' in item ? item.icon : undefined;
          const hasChildren = 'children' in item && item.children?.length;
          return (
            <div key={item.to} className="flex flex-col gap-0.5">
              <Button variant="ghost" className="justify-start" asChild>
                <Link to={item.to} onClick={onNavigate}>
                  {Icon ? <Icon className="size-4 shrink-0" /> : null}
                  {item.label}
                </Link>
              </Button>
              {hasChildren &&
                item.children.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-md px-8 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    {sub.label}
                  </NavLink>
                ))}
            </div>
          );
        })}
      </nav>
      <div className="shrink-0 border-t p-3">
        <p className="mb-2 truncate px-2 text-sm text-muted-foreground" title={adminId ?? ''}>
          관리자: {adminId ?? 'admin'}
        </p>
        <Button variant="default" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="size-4 shrink-0" />
          로그아웃
        </Button>
      </div>
    </>
  );
}

const ProtectedLayout = () => {
  const [auth, setAuth] = useAtom(authAtom);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = () => {
    setAuth(null);
    setMobileOpen(false);
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  const drawerContent = (
    <DrawerContent
      onNavigate={closeMobile}
      onLogout={handleLogout}
      adminId={auth.adminId ?? undefined}
    />
  );

  return (
    <div className="min-h-screen">
      {/* Desktop: fixed left drawer */}
      <aside
        className="fixed left-0 top-0 z-20 hidden h-full flex-col border-r bg-background md:flex"
        style={{ width: DRAWER_WIDTH }}
      >
        <DrawerContent
          onNavigate={() => {}}
          onLogout={handleLogout}
          adminId={auth.adminId ?? undefined}
        />
      </aside>

      {/* Mobile: hamburger + Sheet drawer */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 w-full items-center border-b bg-background px-3 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="메뉴 열기">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[min(280px,85vw)] flex-col p-0"
            showCloseButton
          >
            {drawerContent}
          </SheetContent>
        </Sheet>
        <span className="ml-2 font-semibold">Y2SL Admin</span>
      </div>

      {/* Main content: below mobile header, offset by drawer on desktop */}
      <main
        className="min-h-screen px-4 pb-10 pt-16 md:pl-[calc(16rem+1rem)] md:pr-4 md:pt-6"
      >
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;
