'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import { usePinnedSections } from '@/hooks/usePinnedSections';
import { HubIcon } from './hub-icons';
import { MemoryIcon } from './icons/MemoryIcon';
import { SETTINGS_SECTIONS } from './settings/settings-nav-config';
import { getThreadIdFromPathname } from './ThreadSidebar/thread-navigation';

const NAV_ITEMS = [
  { id: 'home', path: '/', label: '对话', match: (p: string) => p === '/' || p.startsWith('/thread/') },
  { id: 'memory', path: '/memory', label: '记忆', match: (p: string) => p.startsWith('/memory') },
] as const;

function ChatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <title>对话</title>
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <title>设置</title>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON_MAP = {
  home: ChatIcon,
  memory: MemoryIcon,
} as const;

interface ActivityBarProps {
  className?: string;
}

function readFromParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('from');
}

function getNavigationReferrer(pathname: string): string | null {
  const threadId = getThreadIdFromPathname(pathname);
  return threadId !== 'default' ? threadId : readFromParam();
}

function appendReferrer(path: string, referrer: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}from=${encodeURIComponent(referrer)}`;
}

function resolveNavTarget(path: string, pathname: string): string {
  if (path === '/') {
    const fromParam = readFromParam();
    return fromParam ? `/thread/${encodeURIComponent(fromParam)}` : '/';
  }
  const referrer = getNavigationReferrer(pathname);
  return referrer ? appendReferrer(path, referrer) : path;
}

function PinnedSections({ pinned, onNav }: { pinned: readonly string[]; onNav: (path: string) => void }) {
  const searchParams = useSearchParams();
  const activeSection = searchParams?.get('s') ?? '';
  const isStandalone = searchParams?.get('standalone') === '1';

  const pinnedSections = pinned
    .map((id) => SETTINGS_SECTIONS.find((section) => section.id === id))
    .filter((section): section is (typeof SETTINGS_SECTIONS)[number] => section != null);

  if (pinnedSections.length === 0) return null;

  return (
    <>
      <div className="my-1 h-px w-6 bg-[var(--console-border-soft)] opacity-50" />
      {pinnedSections.map((section) => {
        const active = isStandalone && activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNav(`/settings?s=${section.id}&standalone=1`)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              active
                ? 'bg-[var(--console-rail-active)] shadow-[var(--console-rail-shadow)]'
                : 'hover:bg-[var(--console-rail-item)] hover:shadow-[var(--console-rail-shadow)]'
            }`}
            title={section.label}
            aria-current={active ? 'page' : undefined}
          >
            <HubIcon name={section.icon} className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </>
  );
}

function SettingsButton({ pathname, onNav }: { pathname: string; onNav: (path: string) => void }) {
  const searchParams = useSearchParams();
  const isSettingsRoute = pathname.startsWith('/settings');
  const isStandalone = isSettingsRoute && searchParams?.get('standalone') === '1';
  const isSettings = isSettingsRoute && !isStandalone;

  return (
    <button
      type="button"
      onClick={() => onNav('/settings')}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
        isSettings
          ? 'bg-[var(--console-rail-active)] shadow-[var(--console-rail-shadow)]'
          : 'hover:bg-[var(--console-rail-item)] hover:shadow-[var(--console-rail-shadow)]'
      }`}
      title="设置"
      aria-current={isSettings ? 'page' : undefined}
      data-guide-id="hub.trigger"
      data-testid="settings-button"
    >
      <SettingsIcon className="h-5 w-5" />
    </button>
  );
}

export function ActivityBar({ className }: ActivityBarProps) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { pinned } = usePinnedSections();

  const handleNav = useCallback(
    (path: string) => {
      router.push(resolveNavTarget(path, pathname));
    },
    [pathname, router],
  );

  return (
    <nav
      className={`flex w-[52px] flex-shrink-0 flex-col items-center gap-1.5 bg-[var(--console-rail-bg)] px-[6px] py-2.5 ${className ?? ''}`}
      aria-label="主导航"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.id];
        const active = item.match(pathname);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNav(item.path)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              active
                ? 'bg-[var(--console-rail-active)] shadow-[var(--console-rail-shadow)]'
                : 'hover:bg-[var(--console-rail-item)] hover:shadow-[var(--console-rail-shadow)]'
            }`}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            data-guide-id={`nav.${item.id}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}

      <Suspense>
        <PinnedSections pinned={pinned} onNav={handleNav} />
      </Suspense>

      <div className="mt-auto flex flex-col items-center gap-1.5">
        <Suspense
          fallback={
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all"
              title="设置"
              data-guide-id="hub.trigger"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          }
        >
          <SettingsButton pathname={pathname} onNav={handleNav} />
        </Suspense>
      </div>
    </nav>
  );
}
