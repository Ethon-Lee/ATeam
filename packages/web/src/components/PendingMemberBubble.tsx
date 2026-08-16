'use client';

import type { CapabilityTipContext } from '@cat-cafe/shared';
import { formatCatName, useCatData } from '@/hooks/useCatData';
import type { AppServerLifecycleSnapshot, CatStatusType } from '@/stores/chat-types';
import { CatAvatar } from './CatAvatar';
import { MessageBubble } from './MessageBubble';

interface PendingMemberBubbleProps {
  catId: string;
  invocationId: string;
  /** Liveness status for stall suppression — hide tips when cat is stalled (AC-B2 red line). */
  catStatus?: CatStatusType;
  /** App-server lifecycle can become stalled while catStatus remains streaming. */
  appServerLifecycle?: AppServerLifecycleSnapshot;
  /** Retained for call-site compatibility while the Concierge surface is out of the MVP. */
  tipContexts?: readonly CapabilityTipContext[];
  /** Retained for call-site compatibility while the Concierge surface is out of the MVP. */
  showCapabilityTip?: boolean;
}

/**
 * Minimal pending state shown while an invocation has not emitted output.
 */
function PendingDots() {
  return (
    <div className="flex items-center gap-1 py-2 text-cafe-fg-muted" role="status">
      <span className="sr-only">处理中</span>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        <span className="animate-bounce text-sm" style={{ animationDelay: '0ms' }}>
          ·
        </span>
        <span className="animate-bounce text-sm" style={{ animationDelay: '150ms' }}>
          ·
        </span>
        <span className="animate-bounce text-sm" style={{ animationDelay: '300ms' }}>
          ·
        </span>
      </span>
    </div>
  );
}

/**
 * #936: Show a member-level pending bubble with avatar before any stream
 * content arrives.
 *
 * The MVP keeps the pending state deliberately bounded to the streaming dots.
 * Capability tips used to open the global Concierge surface, which is no longer
 * mounted after the MVP surface freeze.
 */
export function PendingMemberBubble({ catId, invocationId }: PendingMemberBubbleProps) {
  const { getCatById } = useCatData();
  const catData = getCatById(catId);
  const catName = catData ? formatCatName(catData) : catId;
  return (
    <MessageBubble
      messageId={`pending-${invocationId}`}
      avatar={<CatAvatar catId={catId} size={32} status="streaming" />}
      header={
        <span className="text-xs font-semibold" style={{ color: catData?.color?.primary, opacity: 0.8 }}>
          {catName}
        </span>
      }
      wrapperClassName="group cat-persona-derived"
    >
      <PendingDots />
    </MessageBubble>
  );
}
