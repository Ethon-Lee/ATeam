---
feature_ids: []
topics:
  - mini-clowder
  - multi-agent
  - context-management
doc_kind: implementation-plan
created: 2026-08-16
---

# Mini Clowder MVP Implementation Plan

**Feature:** Mini Clowder MVP
**Goal:** Deliver a persistent multi-agent chat workspace that visibly demonstrates parallel routing, serial synthesis, and bounded thread context.
**Acceptance Criteria:** The web surface exposes only Chat, Memory, and Settings; users can create and resume threads, send streaming messages, route to one or more agents, observe per-agent execution state, attach thread/file context, and recover messages/invocations/summaries after reload.
**Architecture cell:** `dispatch` (runtime) + `bubble-pipeline` (web) + existing memory services
**Map delta:** none
**Map delta why:** MVP reuses the existing dispatch, bubble, and memory ownership cells; it narrows the public surface and does not introduce a new runtime boundary.
**Architecture:** Keep the existing Next.js + Fastify modular monolith. AgentRouter resolves mentions and intent, selecting parallel execution for multi-agent ideation and serial execution otherwise. Redis remains the runtime queue/status/event store, while SQLite and workspace files hold durable thread, message, invocation, summary, and evidence data.
**Tech Stack:** Next.js, React, Zustand, Fastify, TypeScript, WebSocket/Socket.IO, Redis on isolated development port 6398, SQLite.
**前端验证:** Yes - run the web typecheck, focused Vitest tests for shell/navigation/context behavior, and a browser preview for the golden path.

---

## Scope

### In scope

- Thread creation, selection, rename, delete, pin/favorite, and reload recovery.
- Streaming chat messages with explicit `@mention` routing and default-agent routing.
- Parallel multi-agent execution with independent output and status per target.
- Serial execution for single-agent work and follow-up synthesis.
- Invocation lifecycle visibility: queued, running, completed, failed, cancelled, retry.
- Thread-local context: recent messages, persisted summary, explicit Thread/File attachments, and recall evidence.
- Memory page for context search/status; Settings for required Agent/Provider configuration.
- Durable messages, invocations, summaries, and evidence; transient queue state in Redis.

### Explicitly out of scope

- Mission Hub/Control and governance workflow surfaces.
- Signals inbox, Story/Showcase/Theater, Pixel Brawl, Visible Cafe, and Starry surfaces.
- External project import, complex connectors, Finance UI, podcast/media export.
- New graph/proactive-memory product surfaces; existing backend primitives remain dormant unless required by the core path.

## Terminal Data Schema

```text
Thread
  id, title, pinned, favorited, participants[], summaryId?, lastActiveAt, deletedAt?

Message
  id, threadId, role, catId?, content, mentions[], contentBlocks?, timestamp, trace?

Invocation
  id, threadId, agentId, strategy, status, parentInvocationId?,
  startedAt?, completedAt?, error?, trace?

ContextSummary
  id, threadId, content, sourceMessageIds[], createdAt, tokenEstimate

MemoryEvidence
  id, threadId, sourceType, sourceId, excerpt, score, createdAt

AgentConfig
  id, provider, enabled, isDefault, displayName, capabilities[]
```

Lifecycle owner is the existing ThreadStore/MessageStore/InvocationRecordStore and memory stores. Redis is allowed to expire transient queue/status entries only; user-visible Thread, Message, Summary, and Evidence records have no TTL by default.

## Implementation Tasks

### Task 1: Freeze the MVP surface

**Files:**

- Modify: `packages/web/src/components/ActivityBar.tsx`
- Modify: `packages/web/src/components/AppShell.tsx`
- Test: `packages/web/src/components/__tests__/activity-bar-referrer.test.ts`
- Test: `packages/web/src/components/__tests__/app-shell-callback-auth-mount.test.tsx`

Remove global entry points for deferred Approval, Concierge, Presentation, and other showcase surfaces. Keep Chat, Memory, Settings, Thread Sidebar, callback-auth status, and the chat-owned contextual workspace intact.

Verification:

- Chat navigation preserves the current/referrer Thread.
- `/memory` and `/settings` render without the Thread Sidebar.
- AppShell no longer mounts deferred global surfaces on every route.
- Existing callback-auth mount behavior remains unchanged.

### Task 2: Preserve the Agent execution contract

**Files:**

- Reuse: `packages/api/src/domains/cats/services/agents/registry/AgentRegistry.ts`
- Reuse: `packages/api/src/domains/cats/services/agents/routing/AgentRouter.ts`
- Reuse: `packages/api/src/domains/cats/services/agents/routing/route-parallel.ts`
- Reuse: `packages/api/src/domains/cats/services/agents/routing/route-serial.ts`
- Reuse: `packages/api/src/domains/cats/services/agents/invocation/InvocationQueue.ts`
- Reuse: `packages/api/src/domains/cats/services/agents/invocation/InvocationTracker.ts`

Do not add a second router or temporary orchestration abstraction. Confirm the terminal routing rule: multi-target ideation uses parallel execution; every other route uses serial execution. Preserve per-agent cancellation and terminal persistence.

Verification:

- A multi-target route creates one invocation per target and emits independent output.
- A serial follow-up can consume persisted preceding output.
- Failed/cancelled invocations reach a terminal status and remain inspectable.

### Task 3: Preserve bounded context and durable recall

**Files:**

- Reuse: `packages/api/src/domains/memory/factory.ts`
- Reuse: `packages/api/src/domains/memory/SummaryCompactionTask.ts`
- Reuse: `packages/api/src/domains/memory/SqliteEvidenceStore.ts`
- Reuse: `packages/web/src/components/ChatContextPicker.tsx`
- Reuse: `packages/web/src/components/memory/MemoryHub.tsx`

Keep context construction as recent messages plus persisted summary plus explicit attachments plus recall evidence. Do not expose graph/proactive-memory controls in the MVP navigation.

Verification:

- Thread/File picker produces a durable attachment reference.
- Compaction records source message IDs and can be used by a later invocation.
- Memory search returns evidence with source identity.

### Task 4: End-to-end verification

Run the existing package commands from the repository source of truth:

```text
pnpm --filter @cat-cafe/web exec tsc --noEmit
pnpm --filter @cat-cafe/web test -- --runInBand
```

Then manually verify the golden path in an isolated acceptance environment:

1. Create a Thread and send a normal message.
2. Send `@AgentA @AgentB` ideation and observe two independent runs.
3. Ask for synthesis and observe serial follow-up.
4. Attach a prior Thread or workspace file.
5. Trigger/inspect context summary and Memory search.
6. Reload and confirm durable recovery.

## Stateful Object Gate

| Object | Owner | Transitions covered | Counter-scenarios |
|---|---|---|---|
| Thread | ThreadStore | create -> active -> renamed/pinned -> deleted | reload after rename; deleted thread absent from list |
| Invocation | InvocationQueue/Tracker | queued -> running -> terminal | cancel one parallel child; provider failure; restart recovery |
| Summary | SummaryCompactionTask | candidate -> persisted -> recalled | summary source mismatch; compaction retry |
| Context attachment | MessageStore | selected -> persisted -> injected | missing file; deleted referenced thread |

## Open Questions

- Technical: provider-specific streaming quirks remain implementation details; resolve through existing adapters and focused tests.
- Technical: exact token budget is governed by existing context-window configuration.
- Value: none blocking the current MVP boundary. Do not add new surfaces without a new scope decision.

## Completion Evidence

- Focused tests and TypeScript checks pass, or failures are recorded with their environmental root cause.
- Browser preview demonstrates the parallel/serial/context recovery path.
- Deferred routes remain absent from the Web app route tree.
