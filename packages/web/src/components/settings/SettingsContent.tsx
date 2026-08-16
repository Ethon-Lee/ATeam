'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCatData } from '@/hooks/useCatData';
import { catDossierCoversStrengths, useDossierProfiles } from '@/hooks/useDossierProfiles';
import { apiFetch } from '@/utils/api-client';
import { CatOverviewTab, type ConfigData } from '../config-viewer-tabs';
import { DesktopUpdateSettingsPanel } from '../DesktopUpdateSettingsPanel';
import { HubAccountsTab } from '../HubAccountsTab';
import { HubCatEditor } from '../HubCatEditor';
import { HubCoCreatorEditor } from '../HubCoCreatorEditor';
import { HubEnvFilesTab } from '../HubEnvFilesTab';
import { useConfirm } from '../useConfirm';
import { CatDossierContent } from './CatDossierContent';
import { McpManageContent } from './McpManageContent';
import { OpsContent } from './OpsContent';
import { SettingsText } from './primitives';
import { RulesPromptsContent } from './RulesPromptsContent';
import { SettingsPageHeader } from './SettingsPageHeader';
import { SettingsPlaceholder } from './SettingsPlaceholder';
import { SkillsContent } from './SkillsContent';
import { SETTINGS_SECTIONS } from './settings-nav-config';

interface SettingsContentProps {
  section: string;
  initialEditCatId?: string;
}

export function SettingsContent({ section, initialEditCatId }: SettingsContentProps) {
  const { cats, refresh } = useCatData();
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<(typeof cats)[number] | null>(null);
  const [createDraft, setCreateDraft] = useState<Parameters<typeof HubCatEditor>[0]['draft']>(null);
  const [togglingCatId, setTogglingCatId] = useState<string | null>(null);
  const [coCreatorEditorOpen, setCoCreatorEditorOpen] = useState(false);
  const confirm = useConfirm();

  // F208 OQ-9: per-field check — badge only when dossier l0RosterSummary covers teamStrengths (KD-14)
  const { data: dossierData } = useDossierProfiles();
  const editingCatHasDossier = useMemo(
    () => (editingCat ? catDossierCoversStrengths(editingCat.id, dossierData) : false),
    [editingCat, dossierData],
  );

  const fetchData = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await apiFetch('/api/config');
      if (!res.ok) {
        setFetchError(`配置加载失败 (${res.status})`);
        return;
      }
      const payload = (await res.json()) as { config: ConfigData };
      setConfig(payload.config);
    } catch {
      setFetchError('配置加载失败');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const consumedDeepLinkRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      initialEditCatId &&
      section === 'members' &&
      cats.length > 0 &&
      consumedDeepLinkRef.current !== initialEditCatId
    ) {
      const cat = cats.find((c) => c.id === initialEditCatId);
      if (cat) {
        consumedDeepLinkRef.current = initialEditCatId;
        setCreateDraft(null);
        setEditingCat(cat);
        setEditorOpen(true);
      }
    }
  }, [initialEditCatId, section, cats]);

  const handleEditorSaved = useCallback(async () => {
    await Promise.all([fetchData(), refresh()]);
  }, [fetchData, refresh]);

  const handleToggleAvailability = useCallback(
    async (cat: (typeof cats)[number]) => {
      setTogglingCatId(cat.id);
      setFetchError(null);
      try {
        const res = await apiFetch(`/api/cats/${cat.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ available: cat.roster?.available === false }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          setFetchError((payload.error as string) ?? `成员状态切换失败 (${res.status})`);
          return;
        }
        await Promise.all([fetchData(), refresh()]);
      } catch {
        setFetchError('成员状态切换失败');
      } finally {
        setTogglingCatId(null);
      }
    },
    [fetchData, refresh],
  );

  const handleDeleteMember = useCallback(
    async (cat: (typeof cats)[number]) => {
      const ok = await confirm({
        title: '删除确认',
        message: `确认删除成员「${cat.displayName}」吗？此操作不可撤销。`,
        variant: 'danger',
        confirmLabel: '删除',
      });
      if (!ok) return;
      setFetchError(null);
      try {
        const res = await apiFetch(`/api/cats/${cat.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          setFetchError((payload.error as string) ?? `删除失败 (${res.status})`);
          return;
        }
        await Promise.all([fetchData(), refresh()]);
      } catch {
        setFetchError('删除失败');
      }
    },
    [confirm, fetchData, refresh],
  );

  if (section === 'skills') return <SkillsContent />;
  if (section === 'profiles') return <CatDossierContent />;

  const meta = SETTINGS_SECTIONS.find((item) => item.id === section) ?? SETTINGS_SECTIONS[0];

  const content = (() => {
    switch (meta.id) {
      case 'members':
        if (fetchError)
          return (
            <SettingsText as="p" variant="sm" tone="red">
              {fetchError}
            </SettingsText>
          );
        return config ? (
          <CatOverviewTab
            config={config}
            cats={cats}
            onAddMember={() => {
              setEditingCat(null);
              setCreateDraft(null);
              setEditorOpen(true);
            }}
            onEditMember={(cat) => {
              setCreateDraft(null);
              setEditingCat(cat);
              setEditorOpen(true);
            }}
            onEditCoCreator={() => setCoCreatorEditorOpen(true)}
            onDeleteMember={handleDeleteMember}
            onToggleAvailability={handleToggleAvailability}
            togglingCatId={togglingCatId}
          />
        ) : (
          <SettingsText as="p" variant="sm" tone="muted">
            加载中...
          </SettingsText>
        );
      case 'accounts':
        return <HubAccountsTab />;
      case 'system':
        return (
          <div className="space-y-6">
            <DesktopUpdateSettingsPanel />
            <HubEnvFilesTab excludeCategories={['connector']} />
          </div>
        );
      case 'ops':
        return <OpsContent />;
      case 'rules':
        return <RulesPromptsContent />;
      case 'mcp':
        return <McpManageContent />;
      default:
        return <SettingsPlaceholder section={meta.label} description="此分区即将上线" />;
    }
  })();

  return (
    <>
      <SettingsPageHeader title={meta.label} subtitle={meta.description} />
      {content}
      {editorOpen && (
        <HubCatEditor
          open
          cat={editingCat}
          draft={createDraft}
          hasDossier={editingCatHasDossier}
          onClose={() => {
            setEditorOpen(false);
            setEditingCat(null);
            setCreateDraft(null);
          }}
          onSaved={handleEditorSaved}
        />
      )}
      {coCreatorEditorOpen && config && (
        <HubCoCreatorEditor
          open
          coCreator={config.coCreator}
          onClose={() => setCoCreatorEditorOpen(false)}
          onSaved={handleEditorSaved}
        />
      )}
    </>
  );
}
