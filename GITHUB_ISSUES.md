# GitHub Issues for Grow Tracking

Copy these to GitHub Issues at: https://github.com/twitchyvr/Sporely/issues/new

---

## Issue 1: Grow Stage Advancement - Unclear UX with no confirmation or context

**Labels:** `bug`, `ux`, `high-priority`

### Problem Description

When advancing a grow through stages (spawning → colonization → fruiting → harvesting → completed), the UX is confusing and lacks essential feedback.

### Issues Identified:

1. **No Confirmation Dialog**
   - Single click on "Advance" button immediately advances the stage
   - No confirmation asking "Are you sure you want to advance from X to Y?"
   - Easy to accidentally click and progress to wrong stage
   - Cannot undo without manually editing the grow

2. **No Contextual Information**
   - Button just says "Advance" with no indication of current stage or target stage
   - User doesn't know what they're advancing **from** or **to**
   - Should show: "Advance from Colonization → Fruiting"

3. **No Information Gathering**
   - Some stage transitions should prompt for data:
     - Spawning → Colonization: "Estimated colonization %?"
     - Colonization → Fruiting: "Colonization complete? Any notes?"
     - Fruiting → Harvesting: "First pins visible date?"
   - Current implementation just advances with no data capture

4. **No Stage-Specific Guidance**
   - No tips or checklist for what to look for before advancing
   - New cultivators don't know when it's appropriate to advance

### Current Implementation

Located in `Web App/src/components/grows/GrowManagement.tsx`:
- Lines 943-950: "Advance" button with no confirmation
- `advanceGrowStage()` in DataContext.tsx (lines 1287-1305) advances automatically

### Proposed Solution

1. Add confirmation modal showing current → next stage
2. Include stage-specific data capture fields
3. Show checklist of criteria for advancement
4. Allow optional notes during transition
5. Display visual indicator of what each stage means

### Priority
High - Core workflow is confusing and error-prone

### Related Files
- `Web App/src/components/grows/GrowManagement.tsx`
- `Web App/src/store/DataContext.tsx`

---

## Issue 2: [BUG] Grow Observations disappear after page refresh - Data not persisted

**Labels:** `bug`, `critical`, `data-loss`

### Problem Description

When logging observations on a grow, they appear in the UI but **disappear completely after a page refresh**. This is a data loss bug.

### Root Cause Analysis

After code inspection, the `addGrowObservation()` function in `DataContext.tsx` (lines 1316-1326) **only updates in-memory state** and does NOT persist to Supabase:

```typescript
const addGrowObservation = (growId: string, observationData: Omit<GrowObservation, 'id'>) => {
  const newObs: GrowObservation = {
    ...observationData,
    id: generateId('gobs'),
  };
  setState(prev => ({
    ...prev,
    grows: prev.grows.map(g =>
      g.id === growId
        ? { ...g, observations: [...g.observations, newObs] }
        : g
    ),
  }));
  // NOTE: No Supabase call here! Data is NOT persisted!
};
```

### Expected Behavior
- Observations should persist to database
- Observations should survive page refresh
- Observations should sync across devices (when Supabase connected)

### Actual Behavior
- Observations only exist in React state
- Page refresh clears all observations
- Data is lost permanently

### Steps to Reproduce
1. Navigate to Grow Tracking
2. Select a grow
3. Click "Log" button
4. Fill out observation form and save
5. Observe that observation appears in Timeline tab
6. Refresh the page (F5)
7. **Result:** Observation is gone

### Impact
- **Critical** - Users lose valuable cultivation notes
- Users may not realize data isn't saved until it's too late
- Undermines trust in the entire application

### Required Fix
1. Add `grow_observations` table to `supabase-schema.sql` (may already exist, needs verification)
2. Implement Supabase insert in `addGrowObservation()`
3. Load observations with grows on app startup
4. Add error handling and user feedback

### Related Files
- `Web App/src/store/DataContext.tsx` - lines 1316-1326
- `Web App/supabase-schema.sql` - needs grow_observations table
- `Web App/src/components/grows/GrowManagement.tsx` - observation modal

---

## Issue 3: [BUG] Harvest button doesn't work - Cannot record flush data

**Labels:** `bug`, `critical`, `harvest`

### Problem Description

When trying to record a harvest (flush):
1. Clicking the "Harvest" button doesn't open the modal or respond
2. Can only ever see "Flush #1" label
3. Cannot record subsequent flushes
4. Even if data could be entered, it may not persist properly

### User Report
> "when I advance a grow to harvest, and I click 'harvest', there is an issue entering the data.. when I click the button, it doesn't work. I can only ever see 'flush #1' and cannot advance it"

### Investigation Needed
1. Check if harvest modal is conditionally rendered correctly
2. Verify `addFlush()` function is being called
3. Check for JavaScript errors in console
4. Test flush number incrementing logic
5. Verify database writes are successful

### Current Implementation
- Harvest button: `GrowManagement.tsx` lines 952-959
- Modal: lines 1488-1586
- `addFlush()`: DataContext.tsx lines 1328-1385
- Conditional display: Only shown during 'fruiting' or 'harvesting' stages

### Steps to Reproduce
1. Create or select a grow
2. Advance to "Fruiting" or "Harvesting" stage
3. Click "Harvest" button
4. **Expected:** Harvest modal opens
5. **Actual:** Button doesn't respond / modal doesn't open

### Environment
- Mobile browser (see screenshot)
- Potentially related to touch events vs click events

### Related Files
- `Web App/src/components/grows/GrowManagement.tsx`
- `Web App/src/store/DataContext.tsx`

---

## Issue 4: Complete Grow Tracking UX Overhaul Required - Especially Mobile

**Labels:** `enhancement`, `ux`, `mobile`, `high-priority`

### Problem Description

The Grow Tracking page has fundamental UX problems that make it difficult to use, especially on mobile devices. The interface needs to be completely reimagined with a "mushroom growing" vibe.

### Current Problems

#### Mobile UX Issues:
1. **Detail panel is 384px fixed width** (`w-96` class)
   - Exceeds most phone screen widths
   - Panel either overflows or gets cut off
   - No responsive breakpoints for mobile

2. **Filter bar wraps awkwardly**
   - Multiple dropdowns stack poorly on small screens
   - Search box has `min-w-64` which is too wide
   - No collapsible filter panel for mobile

3. **Cards don't adapt to mobile**
   - Grid view uses `md:grid-cols-2 xl:grid-cols-3`
   - On phones, cards are cramped or overflow
   - Stage timeline dots are tiny and hard to tap

4. **Modal interactions problematic on mobile**
   - Touch events may not trigger properly
   - Form fields have tight spacing

#### General UX Issues:
1. **No visual "mushroom" identity**
   - Generic dark UI with no cultivation theming
   - Could incorporate growth imagery, spore patterns, etc.
   - Should feel like a cultivation tool, not a generic dashboard

2. **Stage visualization is minimal**
   - Small numbered dots don't convey stage meaning
   - No imagery showing what each stage looks like
   - New users don't understand the progression

3. **Information density is wrong**
   - Cards show lots of data but not the most important info
   - "Days Active" is prominent but "Current Stage" should be primary
   - Yield shown even when 0g (not useful until harvesting)

4. **No quick actions**
   - Must select grow, then click action in panel
   - Should have swipe actions or contextual menus on cards

### Proposed Redesign Goals

1. **Mobile-First Layout**
   - Single column on mobile with expandable cards
   - Bottom sheet for detail panel on mobile
   - Sticky filters that collapse to icon bar

2. **Visual Stage Progression**
   - Large, clear stage indicators with icons/imagery
   - Progress bar showing time in current stage
   - Color coding for stage health

3. **Quick Actions**
   - Swipe to advance stage
   - Long-press for quick menu
   - FAB (Floating Action Button) for common actions

4. **Mushroom Cultivation Theme**
   - Organic shapes, growth imagery
   - Stage icons showing mushroom lifecycle
   - Success animations for harvests

5. **Contextual Information**
   - Show what matters for current stage
   - Hide irrelevant data (yield before harvest)
   - Smart tips based on grow state

### Screenshot Reference
See attached screenshot showing current mobile UX problems.

### Related Files
- `Web App/src/components/grows/GrowManagement.tsx` - main component
- `Web App/tailwind.config.js` - theme configuration

---

## Summary of Issues

| # | Title | Severity | Type |
|---|-------|----------|------|
| 1 | Stage Advancement UX | High | Enhancement |
| 2 | Observations not persisted | Critical | Bug |
| 3 | Harvest button broken | Critical | Bug |
| 4 | Complete UX Overhaul | High | Enhancement |

### Recommended Priority Order
1. **Issue 2** (Observations) - Data loss bug, fix immediately
2. **Issue 3** (Harvest) - Core functionality broken
3. **Issue 1** (Stage Advancement) - Confusing but functional
4. **Issue 4** (UX Overhaul) - Larger project, can be phased
