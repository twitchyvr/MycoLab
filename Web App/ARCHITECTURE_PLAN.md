# MycoLab Architecture Improvement Plan

## Overview

This plan addresses three interconnected issues:
1. **Detail View Architecture** - Inconsistent patterns for viewing entity details
2. **Audit/History UI** - Database has comprehensive history, but no user-facing way to see it
3. **UX Clutter** - Accordions in small panels, inconsistent layouts, hard to maintain overview

---

## Current State Analysis

### What Exists

**UI Components:**
- `CultureDetailView.tsx` - Has `variant` prop (panel/drawer/page) but not used consistently
- `RecordHistory.tsx` - Timeline component for version history (exists, barely used)
- `RecordHistoryTab.tsx` - History tab with amendment buttons (exists, barely used)
- `CollapsibleSection` - Accordion pattern baked into CultureDetailView
- `Portal.tsx` - Modal container component
- `EntityFormModal.tsx` - Nested form modal with stack-based navigation

**Database Schema (already exists):**
- `observation_history` - Immutable observation records with supersession chains
- `harvest_history` - Immutable harvest records
- `transfer_history` - Culture transfer lineage
- `stage_transition_history` - Entity lifecycle events
- `data_amendment_log` - All corrections with diff summaries
- `lab_events` - Flexible event logging
- Versioning columns on cultures/grows (`version`, `record_group_id`, `valid_from`, `valid_to`)

### The Problems

1. **Detail views are cluttered accordions in small panels**
   - CultureDetailView shows everything at once in collapsible sections
   - Panels are max-w-md (448px) - too narrow for complex data
   - Accordions expand inline, pushing content around
   - No dedicated space for deep-diving into history/observations

2. **Rich history data exists but is invisible to users**
   - RecordHistory component exists but is barely used
   - Observation history tables are populated but never queried for display
   - Users have no way to answer "what happened to my culture?"
   - Amendment system exists but no UI shows corrections

3. **No standardized drill-down pattern**
   - Some entities use sticky panels (cultures)
   - Some use inline expansion (grows)
   - Some use full-screen modals (inventory)
   - No consistent way to "view more details"

---

## Part 1: Detail View Architecture

### Design: EntityDetailModal

Create a standardized modal/drawer component for viewing ANY entity with full details.

```
┌──────────────────────────────────────────────────────────────────┐
│ [←] Culture: LC-241212-001                              [✕] Close │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┬───────────┬──────────┬───────────┬────────────────┐ │
│  │ Overview│ Timeline  │ Lineage  │ History   │ Related        │ │
│  └─────────┴───────────┴──────────┴───────────┴────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │                    TAB CONTENT AREA                          │ │
│  │                                                              │ │
│  │    (Full width, full height - room to breathe)               │ │
│  │                                                              │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [Edit]  [Log Observation]  [Transfer]  [Archive]            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Structure

```
components/
├── modals/
│   ├── EntityDetailModal.tsx      # Generic wrapper - handles open/close, sizing
│   ├── EntityDetailTabs.tsx       # Tab navigation component
│   └── entity-tabs/
│       ├── OverviewTab.tsx        # Quick summary, key metrics, status
│       ├── TimelineTab.tsx        # Chronological event view
│       ├── LineageTab.tsx         # Family tree (cultures) / related items
│       ├── HistoryTab.tsx         # Version history, amendments
│       └── RelatedTab.tsx         # Linked entities, transfers, grows
```

### Tab Definitions by Entity Type

| Entity | Overview | Timeline | Lineage | History | Related |
|--------|----------|----------|---------|---------|---------|
| Culture | Status, health, volume, age | Observations, transfers, stages | Parent/children visualization | Versions, amendments | Grows using this culture |
| Grow | Stage, yield, BE, days | Observations, stage changes, flushes | Source culture | Versions, amendments | Harvests, photos |
| Inventory | Stock levels, cost, reorder | Usage events, lot history | N/A | Versions | Recipes using this |
| Recipe | Ingredients, scaling | Usage log | N/A | Versions | Cultures/grows using |
| Location | Type, parent, capacity | Environmental readings | Child locations | Versions | Items in location |

### Key Principles

1. **Single Modal Pattern** - ONE component used everywhere
2. **Tab-Based Organization** - Keep overview clean, details in tabs
3. **Full Width Content** - No more cramped accordions
4. **Entity-Aware** - Tabs adapt based on entity type
5. **Action Bar** - Consistent bottom actions

### Modal Sizing

```tsx
// Size variants
const sizes = {
  default: 'max-w-4xl',      // 896px - most entities
  wide: 'max-w-6xl',         // 1152px - lineage views
  full: 'max-w-7xl',         // 1280px - complex data
};

// Always use sufficient height
<div className="max-h-[90vh] min-h-[60vh]">
```

### Implementation Approach

**Phase 1: Create base infrastructure**
- EntityDetailModal.tsx with Portal, sizing, close handling
- EntityDetailTabs.tsx with tab state management
- Generic tab components (Overview, Timeline, History)

**Phase 2: Migrate CultureDetailView**
- Extract existing CollapsibleSection content into tab components
- Wire up to EntityDetailModal
- Replace inline panel usage with modal trigger

**Phase 3: Extend to other entities**
- Create GrowOverviewTab, GrowTimelineTab, etc.
- Add modal trigger to GrowManagement
- Repeat for Inventory, Recipes, Locations

---

## Part 2: Audit/History UI

### Design: Unified History Experience

Make the existing history data visible and understandable to users.

### TimelineTab Design

```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline                                        [Filter ▼] [↻]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Today                                                           │
│  ─────                                                           │
│  ● 2:30 PM  Observation logged                                   │
│  │          Health rating: 4/5, Colonization: 85%                │
│  │          "Looking healthy, good mycelium growth"              │
│  │                                                               │
│  ● 10:15 AM Status changed: Colonizing → Ready                   │
│  │          Triggered by: colonization reached 100%              │
│  │                                                               │
│  Yesterday                                                        │
│  ─────────                                                        │
│  ● 4:45 PM  Transfer recorded                                    │
│  │          → Created LC-241213-002 (50ml)                       │
│  │                                                               │
│  ● 9:00 AM  Observation logged                                   │
│  │          Health rating: 4/5, Colonization: 70%                │
│  │                                                               │
│  Dec 12, 2024                                                     │
│  ────────────                                                     │
│  ● 3:20 PM  Culture created                                      │
│  │          From: Spore Syringe SS-241201-001                    │
│  │          Recipe: Standard LC Recipe                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Sources for Timeline

The timeline aggregates from multiple sources:

| Event Type | Source Table | Icon | Color |
|------------|--------------|------|-------|
| Created | cultures.created_at | 🌱 | emerald |
| Status Change | stage_transition_history | 🔄 | blue |
| Observation | observation_history / culture_observations | 📋 | zinc |
| Contamination | observation_history (type=contamination) | ⚠️ | red |
| Transfer Out | transfer_history | ➡️ | purple |
| Transfer In | transfer_history | ⬅️ | purple |
| Amendment | data_amendment_log | ✏️ | yellow |
| Harvest | harvest_history | 🍄 | green |

### HistoryTab Design (Version History)

```
┌─────────────────────────────────────────────────────────────────┐
│ Version History                                     [Amend]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ● Current Version (v3)                                      │ │
│  │   Last modified: Dec 15, 2024 at 2:30 PM                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Version History                                                 │
│  ───────────────                                                 │
│  │                                                               │
│  ├─● v3 (Current) - Dec 15, 2024                               │
│  │    Correction: Fixed strain assignment                       │
│  │    Changed: strain_id (Pearl Oyster → Blue Oyster)          │
│  │                                                               │
│  ├─● v2 - Dec 14, 2024                                          │
│  │    Update: Added fill volume                                 │
│  │    Changed: fill_volume_ml (null → 950)                      │
│  │                                                               │
│  └─● v1 (Original) - Dec 12, 2024                               │
│       Created by: User                                          │
│                                                                  │
│  [View Full Diff] [Export History]                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Unified Timeline Query**
   ```typescript
   // Combine multiple history sources into single timeline
   const getEntityTimeline = async (entityType: string, entityId: string) => {
     const [observations, transitions, transfers, amendments] = await Promise.all([
       supabase.from('observation_history').select('*').eq('entity_id', entityId),
       supabase.from('stage_transition_history').select('*').eq('entity_id', entityId),
       supabase.from('transfer_history').select('*').or(`from_culture_id.eq.${entityId},to_entity_id.eq.${entityId}`),
       supabase.from('data_amendment_log').select('*').eq('original_record_id', entityId),
     ]);

     return mergeAndSortByDate([...observations, ...transitions, ...transfers, ...amendments]);
   };
   ```

2. **Filter Options**
   - Event type (observations, transfers, amendments, all)
   - Date range
   - Show/hide minor events

3. **Diff Viewer**
   - Side-by-side comparison of versions
   - Highlight changed fields
   - Link to amendment reason

### Implementation Approach

**Phase 1: Timeline infrastructure**
- Create TimelineEvent type that unifies all event sources
- Build query functions to fetch and merge history
- Create TimelineItem component for rendering events

**Phase 2: History tab**
- Wire up RecordHistory.tsx (already exists) to actual version data
- Add diff viewing for amendments
- Connect to data_amendment_log

**Phase 3: Timeline tab**
- Create TimelineTab.tsx with date grouping
- Add filtering UI
- Add click-through to event details

---

## Part 3: UX Improvement Plan

### Current Problems

1. **Accordion overload** - CollapsibleSections everywhere, nested accordions
2. **Small panels** - max-w-md (448px) isn't enough for complex data
3. **No visual hierarchy** - Everything looks equally important
4. **Inconsistent interaction** - Click row? Click button? Expand inline?
5. **Context loss** - Drilling into details loses view of the list

### Design Principles

1. **List → Summary → Detail** (3-level hierarchy)
2. **Modals for details, panels for context**
3. **Cards for scannable info, tables for data**
4. **Consistent interaction patterns per level**

### New Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Page title, filters, view toggles, + Add button                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LIST VIEW (left/main)              │  CONTEXT PANEL (right)            │
│  ─────────────────────              │  ──────────────────────            │
│                                     │                                    │
│  ┌─────────────────────────────┐   │  Quick Summary                     │
│  │ Card 1 (selected)           │   │  ─────────────                     │
│  │ Key info, status badge      │   │  • Status: Active                  │
│  │ [→ View Details]            │   │  • Age: 12 days                    │
│  └─────────────────────────────┘   │  • Health: 4/5                     │
│                                     │  • Last activity: 2 hrs ago       │
│  ┌─────────────────────────────┐   │                                    │
│  │ Card 2                      │   │  Quick Actions                     │
│  │ Key info, status badge      │   │  ─────────────                     │
│  │ [→ View Details]            │   │  [Log Observation]                 │
│  └─────────────────────────────┘   │  [Transfer]                        │
│                                     │  [View Full Details →]             │
│  ┌─────────────────────────────┐   │                                    │
│  │ Card 3                      │   │  Recent Activity                   │
│  │ Key info, status badge      │   │  ───────────────                   │
│  └─────────────────────────────┘   │  • Obs logged (2h ago)             │
│                                     │  • Status changed (1d ago)         │
│                                     │                                    │
└─────────────────────────────────────┴────────────────────────────────────┘

        ↓ Click "View Full Details"

┌─────────────────────────────────────────────────────────────────────────┐
│                         ENTITY DETAIL MODAL                             │
│                     (Full tabs, all data, history)                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interaction Hierarchy

| Level | What User Sees | How to Access | Width |
|-------|---------------|---------------|-------|
| 1. List | Cards/rows with key info | Default page view | Full width |
| 2. Summary | Quick stats, recent activity | Click/select item | 280-320px panel |
| 3. Detail | Full tabs, history, related | Click "View Details" | max-w-4xl modal |
| 4. Edit | Form fields | Click "Edit" from detail | max-w-lg modal |

### Decluttering Strategy

**Remove from cards:**
- Observations list (move to detail modal)
- Full lineage (move to detail modal)
- Health history chart (move to detail modal)
- Nested accordions (move content to tabs)

**Keep in cards:**
- Name/label
- Type/status badge
- Key metric (1-2 numbers)
- Age/last activity
- Action button

**Keep in summary panel:**
- Quick stats (3-5 items)
- Quick actions (2-3 buttons)
- Last 3 events (1-line each)
- Link to full details

### Standardized Card Component

```tsx
interface EntityCardProps {
  title: string;
  subtitle?: string;
  status: { label: string; color: 'emerald' | 'blue' | 'red' | 'yellow' | 'zinc' };
  metrics?: Array<{ label: string; value: string | number }>;
  lastActivity?: Date;
  onClick: () => void;  // Opens summary panel
  onViewDetails: () => void;  // Opens detail modal
}
```

### Implementation Approach

**Phase 1: Create standardized components**
- EntityCard.tsx - Consistent card for all entities
- SummaryPanel.tsx - Right-side quick view
- Migrate CultureCard to use EntityCard

**Phase 2: Update page layouts**
- CultureManagement: List + Summary Panel + Detail Modal
- GrowManagement: Same pattern
- Remove inline accordions

**Phase 3: Polish and consistency**
- Standardize colors, spacing, typography
- Add keyboard navigation
- Add animations/transitions

---

## Implementation Order

### Sprint 1: Foundation
1. Create `EntityDetailModal.tsx` with Portal, sizing, tab infrastructure
2. Create `EntityDetailTabs.tsx` with generic tab management
3. Create base tab components (OverviewTab, TimelineTab, HistoryTab)

### Sprint 2: Culture Migration
4. Extract CultureDetailView content into tab components
5. Wire up timeline query to aggregate history sources
6. Replace sticky panel with summary panel + modal trigger
7. Update CultureManagement to use new pattern

### Sprint 3: Extend & Polish
8. Apply pattern to GrowManagement
9. Apply pattern to Inventory
10. Create standardized EntityCard component
11. Polish transitions, keyboard nav, responsive design

### Sprint 4: History Deep Dive
12. Build full diff viewer for amendments
13. Add export history feature
14. Add timeline filtering
15. Connect all history tables to timeline

---

## File Changes Summary

### New Files
```
components/
├── modals/
│   ├── EntityDetailModal.tsx
│   ├── EntityDetailTabs.tsx
│   └── entity-tabs/
│       ├── OverviewTab.tsx
│       ├── TimelineTab.tsx
│       ├── HistoryTab.tsx
│       ├── LineageTab.tsx
│       └── RelatedTab.tsx
├── cards/
│   ├── EntityCard.tsx
│   └── SummaryPanel.tsx
└── timeline/
    ├── TimelineEvent.tsx
    ├── TimelineGroup.tsx
    └── useEntityTimeline.ts
```

### Modified Files
```
components/
├── cultures/
│   ├── CultureManagement.tsx    # Use new layout pattern
│   └── CultureDetailView.tsx    # Deprecate or convert to modal content
├── grows/
│   └── GrowManagement.tsx       # Use new layout pattern
└── inventory/
    └── UnifiedItemView.tsx      # Use new layout pattern
```

### DataContext Additions
```typescript
// New query functions
getEntityTimeline(entityType: string, entityId: string): Promise<TimelineEvent[]>
getEntityVersionHistory(entityType: string, entityId: string): Promise<VersionRecord[]>
```

---

## Success Metrics

After implementation:

1. **Consistency**: Every entity uses same detail modal pattern
2. **Discoverability**: Users can find history of any entity in 2 clicks
3. **Clarity**: Overview stays clean, details available on demand
4. **Confidence**: Users can answer "what happened to my data?"
5. **Maintainability**: One modal component, one card component, reused everywhere

---

## Appendix: Current Component Inventory

### Components to Keep/Enhance
- `Portal.tsx` - Modal container (keep)
- `RecordHistory.tsx` - Version timeline (enhance, use more widely)
- `RecordHistoryTab.tsx` - History with actions (integrate into new tabs)
- `EntityFormModal.tsx` - Form modal (keep for editing)

### Components to Deprecate
- `CollapsibleSection` inside CultureDetailView (replace with tabs)
- Inline accordions in detail panels (move to modal tabs)
- `CultureDetailView` as sticky panel (convert to modal content)

### Components to Create
- `EntityDetailModal` - Generic detail viewer
- `EntityCard` - Standardized list card
- `SummaryPanel` - Quick context panel
- `TimelineTab` - Unified event timeline
- `useEntityTimeline` - History query hook
