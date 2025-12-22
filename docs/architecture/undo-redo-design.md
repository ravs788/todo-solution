# Undo/Redo Design

## Overview
Provide robust Undo/Redo for common todo operations to protect against accidental edits/deletes. Implemented purely on the frontend using a command/history pattern with minimal backend impact. Works on desktop and mobile.

## Goals
- Undo/Redo for: create, update (title, description, due date, tags), toggle complete, delete, restore.
- Keyboard shortcuts and UI buttons.
- Session-scoped persistence to survive soft reloads.
- Clear toasts after destructive actions with "Undo" CTA.

## Non-Goals
- Global time travel across sessions/users.
- Server-side audit/history in this phase.
- Undo of admin-only operations (outside todo owner scope).

## User Stories & Acceptance Criteria
- As a user, I can press Ctrl+Z (Cmd+Z on Mac) to undo my last change; Ctrl+Shift+Z (Cmd+Shift+Z) to redo it.
- After deleting a todo, I see a toast "Todo deleted" with an Undo button; clicking Undo restores it.
- Undo reverts the exact prior state (title, tags, dueDate, completed).
- Redo reapplies the reverted change.
- History persists across soft reloads in the same session, capped at 50 steps.
- Mobile: on small viewports, Undo/Redo buttons are available in the toolbar menu; keyboard shortcuts work when focus is not in an input.

## UX Spec
- Toolbar: Add "Undo" and "Redo" buttons with disabled states and tooltips (Undo (Ctrl+Z), Redo (Ctrl+Shift+Z)).
- Shortcuts:
  - Ctrl/Cmd+Z → Undo (if target is not an input OR when in input, only when no IME/selection interfering).
  - Ctrl/Cmd+Shift+Z → Redo.
- Toasts: After delete/update, show toast with Undo; time out after 5-8s.
- Visual feedback: briefly highlight updated row on undo/redo.

## Architecture
### Command Pattern
Define a Command interface for each reversible action:
```ts
interface Command {
  id: string; // uuid
  kind: 'create'|'update'|'toggle'|'delete'|'restore'|'tags-update'|...;
  do(): Promise<void> | void;   // perform action
  undo(): Promise<void> | void; // revert action
  // minimal payload to perform inverse ops, e.g. previous snapshot
  meta?: { createdAt: number; merged?: boolean; };
}
```

### History Manager
- Stacks: `undoStack: Command[]`, `redoStack: Command[]`, cap = 50.
- API: `push(cmd)`, `undo()`, `redo()`, `clear()`, `canUndo`, `canRedo`.
- Persistence: serialize small metadata to `sessionStorage` (reconstruct safely on load; drop commands that cannot be safely replayed).
- Merging: collapse rapid successive `update` commands on the same todo within 1-2s to a single command (reduce noise).
- Error handling: if an API call fails during undo/redo, show toast and roll back stack pointer (no stack corruption).

### Integration Points
- State: integrate with existing React Context/Reducer (AuthContext, Todo list state).
- Each mutating action creates a command with an inverse:
  - create → undo: delete; redo: create again.
  - update → undo: patch with previous snapshot; redo: patch with new snapshot.
  - toggle complete → inverse toggle.
  - delete → undo: re-create item with previous snapshot (new id if server generates ids).
- ID considerations:
  - If backend has soft delete/restore, prefer it.
  - If not, undo delete will re-create a new todo with same content; acceptable trade-off (doc this behavior).

### Keyboard & Buttons
- Global hotkeys at app shell level with focus guards.
- Buttons wired to `HistoryManager.undo/redo`.

### Persistence & Lifecycle
- Write stack heads + compressed command metadata to `sessionStorage`.
- Clear stacks on logout or when user switches account.
- Prune to cap; discard non-replayable commands on rehydrate (e.g., missing snapshot).

## Data & API Impact
- No schema changes required.
- Continue using existing create/update/delete endpoints.
- For undo delete, re-create via `POST /todos` with previous snapshot.

## Accessibility
- Buttons are keyboard focusable; tooltips have ARIA labels.
- Toasts announce via ARIA live region.
- Shortcuts do not interfere when user is typing in a field (scope/guards).

## Performance
- Commands store minimal snapshots (previous and next).
- Cap stacks to avoid memory growth.
- Debounce merge for continuous typing updates.

## Testing Strategy
- Unit:
  - HistoryManager push/undo/redo, cap, merge, persistence (serialize/rehydrate), error paths.
  - Command implementations for each action.
- Integration (React):
  - Reducer + commands interplay; ensure UI reflects undo/redo states.
- E2E (Playwright):
  - Undo delete restores item; Redo deletes again.
  - Undo update reverts title/tags/due date; Redo reapplies.
  - Keyboard shortcuts on desktop and mobile (where supported).
  - Toast with Undo CTA reverts as expected.
  - Ensure behavior with small viewport and in inputs (no accidental undo while typing).

## Rollout
- Feature flag (simple env/config toggle) optional; default enabled.
- Update README and `advanced-features.md` status with "In progress" → "Done" once merged.

## Tasks
- [ ] HistoryManager + Command types + persistence
- [ ] Wire commands for create/update/toggle/delete
- [ ] UI: toolbar buttons + tooltips + disabled states
- [ ] Keyboard hooks + guards for inputs
- [ ] Toast integration for destructive actions
- [ ] Tests (unit, integration, Playwright)
- [ ] Docs update
