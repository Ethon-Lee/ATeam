import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/api-client', () => ({
  apiFetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  API_URL: 'http://localhost:3102',
}));
vi.mock('@/stores/chatStore', () => {
  const hook = Object.assign(() => ({}), { getState: () => ({}) });
  return { useChatStore: hook };
});
vi.mock('@/hooks/usePinnedSections', () => ({
  usePinnedSections: () => ({ pinned: [], pin: vi.fn(), unpin: vi.fn(), isPinned: () => false }),
}));

import { SettingsNav } from '../settings/SettingsNav';

describe('SettingsNav search filtering', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as { React?: typeof React }).React = React;
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  afterAll(() => {
    delete (globalThis as { React?: typeof React }).React;
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  });

  it('renders all settings sections when no search query', () => {
    act(() => {
      root.render(React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn() }));
    });
    const buttons = Array.from(container.querySelectorAll('[data-active]'));
    expect(buttons).toHaveLength(8);
    expect(container.textContent).toContain('协作与规则');
    for (const removedLabel of ['IM 对接', '插件集成', '能力市场', '猫猫球', '语音管理', '通知']) {
      expect(container.textContent).not.toContain(removedLabel);
    }
  });

  it.each([
    'telegram',
    'plugin',
    'marketplace',
    '悬浮球',
    '语音',
    '通知',
  ])('does not expose removed settings through the %s search alias', (searchQuery) => {
    act(() => {
      root.render(React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn(), searchQuery }));
    });

    expect(container.querySelectorAll('[data-active]')).toHaveLength(0);
    expect(container.textContent).toContain('没有匹配的设置分区');
  });

  it('renders a primary icon for every settings section', () => {
    act(() => {
      root.render(React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn() }));
    });

    const buttons = Array.from(container.querySelectorAll('[data-active]'));
    expect(buttons).toHaveLength(8);
    for (const button of buttons) {
      expect(button.querySelector('svg.h-4.w-4')).toBeTruthy();
    }
  });

  it('filters sections by label match', () => {
    act(() => {
      root.render(
        React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn(), searchQuery: '密钥' }),
      );
    });
    const buttons = Array.from(container.querySelectorAll('[data-active]'));
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toContain('账户与密钥');
  });

  it('filters governance keywords to the rules and SOP section', () => {
    act(() => {
      root.render(
        React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn(), searchQuery: '家规' }),
      );
    });
    const buttons = Array.from(container.querySelectorAll('[data-active]'));
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toContain('协作与规则');
  });

  it('shows empty message when no match', () => {
    act(() => {
      root.render(
        React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn(), searchQuery: 'zzzznotfound' }),
      );
    });
    const buttons = Array.from(container.querySelectorAll('[data-active]'));
    expect(buttons).toHaveLength(0);
    expect(container.textContent).toContain('没有匹配的设置分区');
  });

  it('marks the active item with font-medium class for visual distinction', () => {
    act(() => {
      root.render(React.createElement(SettingsNav, { activeSection: 'ops', onSelect: vi.fn() }));
    });

    const navButtons = Array.from(container.querySelectorAll('[data-active]'));
    const active = navButtons.find((b) => b.textContent?.includes('运维监控'));
    expect(active).toBeTruthy();
    expect(active?.className).toContain('font-medium');
  });

  it('keeps unpinned section pin controls reachable without hover', () => {
    act(() => {
      root.render(React.createElement(SettingsNav, { activeSection: 'members', onSelect: vi.fn() }));
    });

    const pinButtons = Array.from(container.querySelectorAll('button[title="固定到侧栏"]'));
    expect(pinButtons.length).toBeGreaterThan(0);
    for (const button of pinButtons) {
      expect(button.className).not.toContain('pointer-events-none');
    }
  });
});
