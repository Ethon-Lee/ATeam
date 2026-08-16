'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useLayoutEffect, useSyncExternalStore } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useWorkspaceNavigate } from '@/hooks/useWorkspaceNavigate';
import { CallbackAuthSnapshotMount } from '@/stores/callbackAuthStore';
import { initSidebarWidth, useSidebarStore } from '@/stores/sidebarStore';
import { ActivityBar } from './ActivityBar';
import { DesktopUpdatePrompt } from './DesktopUpdatePrompt';
import { ThreadSidebar } from './ThreadSidebar';
import {
  getBrowserThreadRoutePathname,
  getThreadIdFromPathname,
  subscribeBrowserThreadRoute,
} from './ThreadSidebar/thread-navigation';
import { ResizeHandle } from './workspace/ResizeHandle';

const SIDEBAR_HIDDEN_ROUTES = ['/settings', '/memory'];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Suspense fallback={children}>
        <AppShellContent>{children}</AppShellContent>
      </Suspense>
      <DesktopUpdatePrompt />
    </>
  );
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname() ?? '/';
  const livePathname = useSyncExternalStore(subscribeBrowserThreadRoute, getBrowserThreadRoutePathname, () => pathname);
  const searchParams = useSearchParams();
  const isExport = searchParams.get('export') === 'true';
  const { isOpen, width, close, handleResize, resetWidth } = useSidebarStore();
  const isDesktop = useIsDesktop();
  const routeThreadId = getThreadIdFromPathname(livePathname);
  const isChatRoute = livePathname === '/' || livePathname.startsWith('/thread/');

  useWorkspaceNavigate(isChatRoute ? routeThreadId : null, {
    isChatRoute,
    isWorkspaceVisible: isDesktop,
    enabled: !isExport,
  });

  useLayoutEffect(() => {
    initSidebarWidth();
  }, []);

  if (isExport) return <>{children}</>;

  const showSidebar = isOpen && isDesktop && !SIDEBAR_HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <div className="console-shell flex h-screen h-dvh overflow-hidden">
      <Suspense fallback={<div className="w-12 flex-shrink-0" aria-hidden="true" />}>
        <ActivityBar />
      </Suspense>
      <CallbackAuthSnapshotMount />
      {showSidebar && (
        <div className="flex flex-shrink-0 items-stretch">
          <div style={{ width }} className="flex-shrink-0">
            <ThreadSidebar onClose={close} className="w-full" routeThreadId={routeThreadId} />
          </div>
          <ResizeHandle
            direction="horizontal"
            label="左侧对话栏"
            onResize={handleResize}
            onCollapse={close}
            onDoubleClick={resetWidth}
            showLine={false}
          />
        </div>
      )}
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
