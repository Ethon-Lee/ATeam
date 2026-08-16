import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getThreadIdFromPathname } = vi.hoisted(() => ({
  getThreadIdFromPathname: vi.fn((pathname: string) => {
    const match = pathname.match(/^\/thread\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : 'default';
  }),
}));

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/thread/thread-abc',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/ThreadSidebar/thread-navigation', () => ({
  getThreadIdFromPathname,
}));

vi.mock('@/components/icons/MemoryIcon', () => ({
  MemoryIcon: ({ className }: { className?: string }) => React.createElement('span', { className }, 'M'),
}));

vi.mock('@/hooks/usePinnedSections', () => ({
  usePinnedSections: () => ({ pinned: [], pin: vi.fn(), unpin: vi.fn(), isPinned: () => false }),
}));

vi.mock('@/components/hub-icons', () => ({
  HubIcon: ({ name, className }: { name: string; className?: string }) =>
    React.createElement('span', { className }, name),
}));

vi.mock('@/components/settings/settings-nav-config', () => ({
  SETTINGS_SECTIONS: [],
}));

import { ActivityBar } from '@/components/ActivityBar';

describe('ActivityBar referrer forwarding (P2 fix)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockPush.mockClear();
  });

  afterEach(() => {
    root.unmount();
    container.remove();
  });

  it('appends ?from=threadId when navigating to memory', () => {
    React.act(() => {
      root.render(React.createElement(ActivityBar));
    });

    const memoryBtn = container.querySelector('button[title="记忆"]') as HTMLElement;
    expect(memoryBtn).toBeTruthy();

    React.act(() => {
      memoryBtn.click();
    });

    expect(mockPush).toHaveBeenCalledWith('/memory?from=thread-abc');
  });

  it('does NOT append ?from= when clicking the home button', () => {
    React.act(() => {
      root.render(React.createElement(ActivityBar));
    });

    const homeBtn = container.querySelector('button[title="对话"]') as HTMLElement;
    expect(homeBtn).toBeTruthy();

    React.act(() => {
      homeBtn.click();
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('forwards existing ?from= when cross-hopping between non-thread pages', () => {
    getThreadIdFromPathname.mockReturnValueOnce('default');
    const originalSearch = window.location.search;
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?from=thread-abc' },
      writable: true,
      configurable: true,
    });

    React.act(() => {
      root.render(React.createElement(ActivityBar));
    });

    const memoryBtn = container.querySelector('button[title="记忆"]') as HTMLElement;
    expect(memoryBtn).toBeTruthy();

    React.act(() => {
      memoryBtn.click();
    });

    expect(mockPush).toHaveBeenCalledWith('/memory?from=thread-abc');

    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: originalSearch },
      writable: true,
      configurable: true,
    });
  });

  it('encodes existing ?from= when routing back to a thread from the home button', () => {
    const originalSearch = window.location.search;
    const threadId = 'thread/with space?x#frag';
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: `?from=${encodeURIComponent(threadId)}` },
      writable: true,
      configurable: true,
    });

    React.act(() => {
      root.render(React.createElement(ActivityBar));
    });

    const homeBtn = container.querySelector('button[title="对话"]') as HTMLElement;
    expect(homeBtn).toBeTruthy();

    React.act(() => {
      homeBtn.click();
    });

    expect(mockPush).toHaveBeenCalledWith(`/thread/${encodeURIComponent(threadId)}`);

    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: originalSearch },
      writable: true,
      configurable: true,
    });
  });

  it('exposes only the MVP navigation surface', () => {
    React.act(() => {
      root.render(React.createElement(ActivityBar));
    });

    expect(container.querySelector('[data-testid="approval-hub-button"]')).toBeNull();
    expect(container.querySelector('[data-testid="concierge-rail-toggle"]')).toBeNull();
    expect(container.querySelector('[data-testid="presentation-rail-toggle"]')).toBeNull();
    expect(container.querySelector('button[title="对话"]')).toBeTruthy();
    expect(container.querySelector('button[title="记忆"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="settings-button"]')).toBeTruthy();
  });
});
