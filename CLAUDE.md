# CLAUDE.md - MycoLab AI Assistant Guide

## Project Overview

**MycoLab** is a comprehensive mycology laboratory management system built as a React/TypeScript single-page web application. It helps cultivators track cultures, grows, recipes, inventory, and analyze performance data for mushroom cultivation operations.

### Key Features
- **Culture Library** - Track spore syringes, liquid cultures, agar plates, and slants with full lineage tracking
- **Grow Tracker** - Monitor grows through stages from spawning to harvest with yield logging
- **Recipe Builder** - Create and scale recipes for agar, LC, grain spawn, and substrates
- **Inventory Management** - Track supplies with reorder alerts
- **Analytics Dashboard** - Visualize performance data and identify trends
- **Calculators** - Substrate hydration, spawn rate, pressure cooking, biological efficiency
- **Contamination Analysis** - Log and analyze contamination patterns

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State Management | React Context (DataContext.tsx) |
| Database | PostgreSQL via Supabase (optional - can work offline) |
| Charts | Recharts |
| Routing | React Router DOM v6 |
| Utilities | date-fns, clsx, uuid |

## Project Structure

```
MycoLab/
├── CLAUDE.md              # This file
├── .gitignore
├── Web App/               # Main application directory
│   ├── package.json       # Dependencies and scripts
│   ├── vite.config.ts     # Vite configuration (port 3000)
│   ├── tsconfig.json      # TypeScript configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── postcss.config.js  # PostCSS configuration
│   ├── index.html         # Entry HTML
│   ├── supabase-schema.sql     # Database schema (idempotent) - MUST CHECK ON DB CHANGES
│   ├── supabase-seed-data.sql  # Reference data (idempotent) - MUST CHECK ON DATA CHANGES
│   ├── supabase-species-data.sql # Species/strains data (idempotent)
│   └── src/
│       ├── App.tsx        # Main app component with routing
│       ├── index.tsx      # Entry point
│       ├── vite-env.d.ts  # Vite type declarations
│       ├── components/    # React components by feature
│       │   ├── analysis/      # ContaminationAnalysis, BiologicalEfficiencyCalculator
│       │   ├── analytics/     # AnalyticsDashboard
│       │   ├── common/        # Reusable UI components (SelectWithAdd)
│       │   ├── cultures/      # CultureManagement, LineageVisualization
│       │   ├── devlog/        # DevLogPage (feature roadmap)
│       │   ├── grows/         # GrowManagement
│       │   ├── inventory/     # UnifiedItemView
│       │   ├── recipes/       # RecipeBuilder
│       │   ├── settings/      # SettingsPage
│       │   ├── setup/         # SetupWizard
│       │   └── tools/         # Calculators (Substrate, SpawnRate, PressureCooking)
│       ├── data/          # Initial/seed data and devlog
│       │   ├── initialData.ts   # Default state values
│       │   └── devlog/          # Feature roadmap - MUST UPDATE ON CHANGES
│       ├── lib/           # Supabase client configuration
│       ├── store/         # State management
│       │   ├── index.ts       # Re-exports
│       │   ├── types.ts       # Shared type definitions
│       │   ├── DataContext.tsx # Main data provider with CRUD operations
│       │   └── initialData.ts  # Default state values
│       ├── styles/        # Global CSS (globals.css)
│       └── types/         # Additional TypeScript definitions
│           └── index.ts       # Comprehensive type system
```

## !!! Mandatory Directive

When assisting with this project, always operate with the following context in mind:

1. **Always refer to the roadmap in DevLogPage** for planned features and priorities, add features that we have added or are working on if they are not already in the list, and avoid suggesting features that are already planned or in progress.
2. **Main code is in `Web App/` directory** - Always work relative to this path
3. **Two type files exist** - `store/types.ts` (runtime) and `types/index.ts` (extended)
4. **Context-based state** - Use `useData()` hook for all data operations
5. **Dark theme** - UI uses zinc/emerald color scheme
6. **Offline-first** - Don't assume Supabase is connected
7. **Idempotent schema** - SQL migrations are safe to re-run
8. **No testing yet** - Be careful with refactoring without tests
9. **⛔ NEVER EDIT WITHOUT READING FIRST** - ALWAYS use the Read tool on a file BEFORE attempting to Edit it. Editing a file you haven't read in the current context will fail and waste time. No exceptions.

### ⚠️ DRY PRINCIPLE - NO DUPLICATE INTERFACES ⚠️

**CRITICAL: Before creating ANY new UI component or form, ALWAYS search for existing implementations first.**

This app has a history of creating multiple different interfaces for the same task (e.g., recording harvests). This creates:
- Inconsistent UX for users
- Maintenance burden (bugs fixed in one place, not others)
- Confusion about which interface to use

**Rules:**
1. **ONE interface per task** - If a task can be done from multiple pages, use the SAME component (import it, don't recreate it)
2. **Search first** - Before building: `grep -r "Record.*[Hh]arvest\|harvest.*[Ff]orm" src/`
3. **Shared components** - Put reusable forms/modals in `components/common/` or a dedicated folder
4. **Entry points != interfaces** - Multiple buttons can trigger the same modal

**Current consolidation needed:**
- Harvest entry: GrowManagement, CommandCenter, HarvestWorkflow all have different forms
- TODO: Create single `HarvestEntryModal` component used everywhere

**Always ask yourself:**
- Does this task already have a UI component somewhere?
- Can I reuse an existing component instead of creating a new one?
- If I must create new, can it be shared across the app?

### 🏗️ CANONICAL FORM ARCHITECTURE - SINGLE SOURCE OF TRUTH

**MANDATORY: Every entity type has ONE canonical form/modal used EVERYWHERE in the app.**

This is a core architectural principle. When a user adds a Location, Culture, Grow, Inventory Item, or ANY entity - they MUST see the exact same form regardless of WHERE they trigger it from. This follows the **Single Source of Truth** pattern used in enterprise software development.

#### Why This Matters

| Bad (Multiple Forms) | Good (Canonical Form) |
|---------------------|----------------------|
| User learns different UIs for same task | Consistent experience everywhere |
| Bug in one form doesn't fix others | Fix once, fixed everywhere |
| Different validation rules | Uniform data quality |
| Code duplication | DRY, maintainable code |
| Confusing for users | Predictable, learnable |

#### Architecture Pattern

```
components/
├── forms/                    # CANONICAL FORMS - Single source of truth
│   ├── LocationForm.tsx      # THE Location form (used everywhere)
│   ├── CultureForm.tsx       # THE Culture form (or CultureWizard.tsx)
│   ├── GrowForm.tsx          # THE Grow form
│   ├── InventoryItemForm.tsx # THE Inventory form
│   ├── RecipeForm.tsx        # THE Recipe form
│   ├── HarvestEntryForm.tsx  # THE Harvest entry form
│   └── EntityFormModal.tsx   # Generic modal wrapper that loads any form
│
├── cultures/                 # Page-specific components
│   └── CultureManagement.tsx # Uses CultureWizard via import
│
├── grows/
│   └── GrowManagement.tsx    # Uses GrowForm via EntityFormModal
│
└── locations/
    └── LabSpaces.tsx         # Uses LocationForm via EntityFormModal
```

#### Rules for Canonical Forms

1. **ONE FORM PER ENTITY TYPE**
   - Every entity (Location, Culture, Grow, etc.) has exactly ONE form component
   - That form lives in `components/forms/` (or is clearly designated as canonical)
   - ALL entry points (buttons, menus, workflows) use this ONE form

2. **FORMS ARE COMPREHENSIVE**
   - The canonical form includes ALL fields and options
   - Use conditional rendering or tabs for beginner/expert modes
   - Never create a "simplified" duplicate - add modes to the canonical form instead

3. **ENTRY POINTS TRIGGER, DON'T DUPLICATE**
   - A "+Add Location" button on Lab Spaces page → opens LocationForm
   - A "+Add Location" button in Culture wizard → opens THE SAME LocationForm
   - The triggering code just provides: `<EntityFormModal entityType="location" />`

4. **CONTEXT-AWARE BUT SAME FORM**
   - Forms may receive context (e.g., `parentLocationId` for nested locations)
   - Forms may pre-fill fields based on context
   - BUT the form UI, fields, and validation are IDENTICAL

5. **QUALITY STANDARD**
   - The canonical form should be the BEST version
   - If one page has a better form than another, the better one becomes canonical
   - Example: Lab Spaces has better Location form → that becomes the canonical LocationForm

#### Implementation Checklist

When adding/modifying entity creation:

- [ ] Check if canonical form exists in `components/forms/`
- [ ] If yes: Import and use it via EntityFormModal
- [ ] If no: Create it in `components/forms/` and use it everywhere
- [ ] NEVER create inline forms for entities that have canonical forms
- [ ] NEVER create "quick add" simplified versions - add quick mode to canonical form

#### Experience Level Integration

Canonical forms MUST respect user experience level:

```typescript
const { state } = useData();
const isExpert = state.settings.experienceLevel === 'expert' || state.settings.advancedMode;

// In the canonical form:
{isExpert && (
  <AdvancedOptionsSection>
    {/* Expert-only fields */}
  </AdvancedOptionsSection>
)}
```

Beginners see simplified UI. Experts see full UI. SAME form component.

#### Current Canonical Forms (as of v0.5)

| Entity | Canonical Component | Location |
|--------|-------------------|----------|
| Location | `LocationForm.tsx` | `components/forms/` - NEEDS UPDATE to match Lab Spaces quality |
| Culture | `CultureWizard.tsx` | `components/cultures/` |
| Grow | *inline in GrowManagement* | NEEDS: Extract to `GrowForm.tsx` |
| Recipe | *inline in RecipeBuilder* | NEEDS: Extract to `RecipeForm.tsx` |
| Inventory Item | `InventoryItemForm.tsx` | `components/forms/` |
| Harvest | *3 different implementations* | NEEDS: Create `HarvestEntryForm.tsx` |
| Strain | `StrainForm.tsx` | `components/forms/` |
| Container | `ContainerForm.tsx` | `components/forms/` |

#### Anti-Patterns to Avoid

❌ **DON'T**: Create simplified inline forms
```tsx
// BAD - Creates duplicate interface
const QuickAddLocation = () => (
  <div>
    <input placeholder="Name" />
    <button>Add</button>
  </div>
);
```

✅ **DO**: Use the canonical form
```tsx
// GOOD - Uses single source of truth
<EntityFormModal
  entityType="location"
  onComplete={handleLocationCreated}
  context={{ parentId: currentLocation.id }}
/>
```

❌ **DON'T**: Duplicate form fields across pages
```tsx
// BAD - Same fields defined in multiple places
// In GrowManagement.tsx:
<input value={newGrow.name} />
<select>{strains.map(...)}</select>

// In CommandCenter.tsx:
<input value={growName} />
<select>{strains.map(...)}</select>
```

✅ **DO**: Extract to canonical form
```tsx
// GOOD - One definition, used everywhere
// In GrowForm.tsx:
export const GrowForm = ({ onSubmit, initialData }) => (
  <FormFields>...</FormFields>
);

// In GrowManagement.tsx:
<EntityFormModal entityType="grow" />

// In CommandCenter.tsx:
<EntityFormModal entityType="grow" />
```

### ⚠️⚠️⚠️ DATA INTEGRITY & CASCADING UPDATES - CRITICAL ⚠️⚠️⚠️

**EVERY piece of data in this app connects to or relies on other pieces of data. NEVER implement a feature without considering ALL related data, views, and entities.**

#### The Problem This Solves

A past bug allowed observations to be logged without updating parent entity:
- Logging contamination observation → Culture status stayed "Active" (WRONG)
- Logging health rating → Culture health didn't update (WRONG)
- User saw their observation but the culture looked unchanged

This violates data integrity and confuses users.

#### Mandatory Rules for ALL Data Operations

**1. When adding child records (observations, transfers, flushes), ALWAYS cascade relevant changes to parent:**

| Child Record | Parent Entity | Cascading Fields |
|-------------|---------------|------------------|
| CultureObservation with healthRating | Culture | `healthRating` |
| CultureObservation type='contamination' | Culture | `status = 'contaminated'` |
| GrowObservation type='contamination' | Grow | `currentStage = 'contaminated'`, `status = 'failed'` |
| Flush (harvest) | Grow | `totalYield`, `flushes`, `currentStage` |
| Transfer depleting source | Culture | `status = 'depleted'`, `fillVolumeMl` |

**2. When modifying a field that affects other entities, check ALL relationships:**

```typescript
// WRONG - Incomplete implementation
const addObservation = (observation) => {
  setState(prev => ({
    cultures: prev.cultures.map(c =>
      c.id === id ? { ...c, observations: [...c.observations, obs] } : c
    )
  }));
};

// CORRECT - Cascades all relevant changes
const addObservation = (observation) => {
  setState(prev => ({
    cultures: prev.cultures.map(c => {
      if (c.id !== id) return c;

      const updates = { observations: [...c.observations, obs] };

      // CASCADE: Health rating from observation
      if (observation.healthRating != null) {
        updates.healthRating = observation.healthRating;
      }

      // CASCADE: Contamination status
      if (observation.type === 'contamination') {
        updates.status = 'contaminated';
      }

      return { ...c, ...updates };
    })
  }));
};
```

**3. Before writing ANY CRUD function, answer these questions:**

- [ ] Does this operation create a child record? → What fields on the parent should update?
- [ ] Does this operation change a status/stage? → What related entities need to know?
- [ ] Does this operation affect quantities/volumes? → What calculations need updating?
- [ ] Does this operation mark something as contaminated/failed? → What parent records are affected?
- [ ] Can this operation deplete/exhaust something? → What status changes should cascade?

**4. Entity Relationship Map (Reference)**

```
Culture
├── Observations[] ←─ Can update: healthRating, status
├── Transfers[] ←─ Can update: fillVolumeMl, volumeUsed, status (depleted)
├── Parent Culture ←─ Affects: lineage, generation
└── Child Cultures ←─ Linked via parentCultureId

Grow
├── Observations[] ←─ Can update: currentStage, status
├── Flushes[] ←─ Can update: totalYield, totalYieldDry, currentStage
├── Source Culture ←─ References sourceCultureId
└── Inventory Usage ←─ Affects cost calculations

Recipe
├── Ingredients[] ←─ Affects: totalCost, nutritional calculations
└── Cultures using this recipe ←─ Referenced by Culture.recipeId

Inventory Item
├── Lots[] ←─ Affects: totalQuantity, averageCost
└── Purchase Orders ←─ Updates stock levels on receive
```

**5. Testing Cascades**

When implementing any data operation, mentally test:
1. What does the UI show BEFORE the operation?
2. What should change AFTER the operation?
3. Are ALL relevant displays updated?
4. Would a user be confused by any stale/unchanged data?

#### Anti-Patterns to NEVER Do

❌ **Adding observation without updating parent health/status**
❌ **Recording transfer without updating source volume**
❌ **Marking contamination without changing status/stage**
❌ **Adding flush without updating totalYield**
❌ **Depleting inventory without updating lot quantities**
❌ **Assuming "the UI will handle it" - data layer must be consistent**

#### Files to Check for Cascading Logic

- `src/store/DataContext.tsx` - All CRUD operations with cascade logic
- `src/store/types.ts` - Entity relationships and type definitions
- `supabase-schema.sql` - Database triggers (if using server-side cascades)

### !!! MANDATORY PRE-COMMIT CHECKLIST - NO EXCEPTIONS !!!

**⚠️ STOP! BEFORE RUNNING `git commit`, YOU MUST COMPLETE ALL THREE CHECKS BELOW. ⚠️**

**This is NOT optional. This is NOT "when relevant." This is EVERY SINGLE COMMIT.**

**DO NOT SKIP THESE CHECKS. DO NOT ASSUME THEY DON'T APPLY. DO NOT COMMIT WITHOUT READING THESE FILES.**

---

#### ✅ CHECK 1: Schema File (`supabase-schema.sql`)
**BEFORE EVERY COMMIT, read `Web App/supabase-schema.sql` and verify:**

**Structure & Idempotency:**
- [ ] New tables use `CREATE TABLE IF NOT EXISTS`
- [ ] New columns use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- [ ] Removed tables use `DROP TABLE IF EXISTS` (with CASCADE if has dependents)
- [ ] Removed columns use `ALTER TABLE ... DROP COLUMN IF EXISTS`
- [ ] The file can be run multiple times without errors

**Error Handling & Exception Safety (REQUIRED):**
- [ ] Risky operations wrapped in `DO $$ BEGIN ... EXCEPTION WHEN ... END $$;` blocks
- [ ] Use `EXCEPTION WHEN undefined_table THEN NULL;` for conditional drops
- [ ] Use `EXCEPTION WHEN duplicate_column THEN NULL;` for conditional adds
- [ ] Use `EXCEPTION WHEN duplicate_object THEN NULL;` for constraints/indexes
- [ ] Use `EXCEPTION WHEN foreign_key_violation THEN RAISE WARNING '...';` for FK issues
- [ ] Use `RAISE NOTICE` or `RAISE WARNING` for non-fatal issues (don't fail silently)
- [ ] Critical operations should `RAISE EXCEPTION` on failure, not continue silently
- [ ] Wrap related changes in transactions where atomicity matters

**Safe Migration Patterns:**
- [ ] DROP CASCADE only when dependencies are intentionally removed
- [ ] Column type changes: add new → migrate data → drop old (not ALTER TYPE)
- [ ] NOT NULL additions: backfill NULLs first → then add constraint
- [ ] FK additions: validate data first → then add constraint
- [ ] Index creation uses `CREATE INDEX IF NOT EXISTS` or `CONCURRENTLY`

**Dependency Order:**
- [ ] Tables are created in dependency order (referenced tables before referencing tables)
- [ ] Tables are dropped in reverse dependency order (referencing tables before referenced tables)
- [ ] Triggers are created AFTER their referenced tables and functions exist
- [ ] Views are created AFTER their source tables exist
- [ ] RLS policies are created AFTER their tables exist

**Data Safety:**
- [ ] Destructive operations (DROP, TRUNCATE) are clearly commented with warnings
- [ ] Data migrations are handled BEFORE structural changes that would lose data
- [ ] Backup/rollback considerations are documented for risky operations
- [ ] Column renames preserve data (add new → copy data → drop old, NOT direct rename)

**Intelligent Defaults:**
- [ ] New NOT NULL columns have DEFAULT values to handle existing rows
- [ ] New columns with constraints are added in stages (add column → backfill → add constraint)
- [ ] Enum/check constraint changes handle existing invalid values

**If your changes ADD, MODIFY, or REMOVE ANY database field, table, or relationship - UPDATE THIS FILE.**

---

#### ✅ CHECK 2: Seed Data Files (`supabase-seed-data.sql`, `supabase-species-data.sql`)
**BEFORE EVERY COMMIT, read these files and verify:**

**File Scope:**
- [ ] `Web App/supabase-seed-data.sql` - Contains all reference data (containers, substrate types, inventory categories, recipe categories, location types, grain types, etc.)
- [ ] `Web App/supabase-species-data.sql` - Contains all species and strain reference data

**Idempotency & Upsert Patterns:**
- [ ] All INSERTs use `ON CONFLICT (id) DO UPDATE SET ...` pattern
- [ ] UPDATE SET clause includes ALL columns that might change (not just some)
- [ ] Removed seed data is deleted with `DELETE FROM ... WHERE id = ...`
- [ ] DELETE operations run BEFORE INSERTs to avoid constraint conflicts

**Referential Integrity:**
- [ ] Seed data is inserted in dependency order (parent tables before child tables)
- [ ] Foreign key references use valid IDs that exist in referenced tables
- [ ] Deletions cascade properly or remove dependent records first
- [ ] No orphaned records are left after deletions

**Data Consistency:**
- [ ] System-level seed data has `user_id = NULL` for global visibility
- [ ] UUIDs are stable (don't regenerate on each run - use fixed UUIDs for seed data)
- [ ] Timestamps use `NOW()` or are omitted to use defaults
- [ ] Text values are properly escaped and handle special characters

**Error Handling & Exception Safety (REQUIRED):**
- [ ] Bulk inserts wrapped in `DO $$ BEGIN ... EXCEPTION WHEN ... END $$;` blocks
- [ ] Use `EXCEPTION WHEN unique_violation THEN NULL;` for idempotent inserts
- [ ] Use `EXCEPTION WHEN foreign_key_violation THEN RAISE WARNING '...';` for FK issues
- [ ] Use `EXCEPTION WHEN check_violation THEN RAISE WARNING '...';` for constraint issues
- [ ] Use `RAISE NOTICE` to log successful operations for debugging
- [ ] Use `RAISE WARNING` for recoverable issues that shouldn't stop execution
- [ ] Use `RAISE EXCEPTION` for critical failures that must stop execution
- [ ] Wrap related seed data in transactions for atomicity

**Robustness:**
- [ ] Seed file can be run on empty database (fresh install)
- [ ] Seed file can be run on existing database (migration/update)
- [ ] Seed file handles partial failures gracefully (continues where possible, logs issues)
- [ ] Comments explain the purpose of each data section
- [ ] Each major section has a RAISE NOTICE indicating start/completion

**If your changes ADD, MODIFY, or REMOVE ANY dropdown options, default values, or reference data - UPDATE THESE FILES.**

---

#### ✅ CHECK 3: DevLog/Roadmap (`src/data/devlog/`)
**BEFORE EVERY COMMIT, read the devlog files and verify:**
- [ ] `Web App/src/data/devlog/recent-phases.ts` - Check for the feature you're working on
- [ ] Update `status: 'completed'` for finished features
- [ ] Update `status: 'in_progress'` for started features
- [ ] Add new entries for features NOT already in any devlog file
- [ ] Include `actualHours` if known

**If your changes implement, modify, or complete ANY feature - UPDATE THE DEVLOG.**

---

### ⛔ FAILURE TO COMPLETE THESE CHECKS IS UNACCEPTABLE ⛔

**Common excuses that are NOT valid:**
- ❌ "This is a small change" - CHECK ANYWAY
- ❌ "I already know what's in those files" - READ THEM AGAIN
- ❌ "This doesn't affect the database" - VERIFY BY READING THE FILES
- ❌ "The devlog doesn't have this feature" - ADD IT
- ❌ "I checked earlier in this session" - CHECK AGAIN BEFORE THIS COMMIT

**The user has been burned by skipped checks. Do not add to that pain.**

**SQL Files Location & Execution Order:**
```
Web App/
├── supabase-schema.sql         # 1️⃣ RUN FIRST - Database structure
├── supabase-seed-data.sql      # 2️⃣ RUN SECOND - Reference data
├── supabase-species-data.sql   # 3️⃣ RUN THIRD - Species/strain data
├── supabase-wipe-user-data.sql # ⚠️ DESTRUCTIVE - Wipes user data, keeps schema
└── supabase-reset-database.sql # ☢️ NUCLEAR - Drops EVERYTHING (tables, functions, all)
```

**SQL Files Relationship:**
- `supabase-schema.sql` - Creates tables, indexes, triggers, RLS policies. Idempotent.
- `supabase-seed-data.sql` - Populates reference tables (containers, categories). user_id=NULL for system data.
- `supabase-species-data.sql` - Populates species/strains. user_id=NULL for system data.
- `supabase-wipe-user-data.sql` - **DESTRUCTIVE**: Removes ALL user data, preserves seed data and schema.
- `supabase-reset-database.sql` - **NUCLEAR**: Drops ALL tables, functions, triggers, policies. Use when schema has orphaned objects or needs complete rebuild. Requires running schema + seed scripts after.

**Choosing the Right Reset Option:**
| Script | Use Case | Preserves Schema | Preserves Seed Data |
|--------|----------|------------------|---------------------|
| `wipe-user-data.sql` | Clear user data for testing/GDPR | Yes | Yes |
| `reset-database.sql` | Fix broken schema, remove old tables | No | No |

**⚠️ When Schema Changes - Update These Files:**
1. Add new table to `supabase-schema.sql`
2. Add default data to `supabase-seed-data.sql` (if reference table)
3. Add species data to `supabase-species-data.sql` (if species/strain)
4. **Add to wipe script** `supabase-wipe-user-data.sql` (if table has user data)
5. **Add to reset script** `supabase-reset-database.sql` (add to drop list for new tables)

**DevLog Files Location:**
```
Web App/src/data/devlog/
├── index.ts          # Combined exports and utility functions
├── types.ts          # Phase ID ranges and type exports
├── early-phases.ts   # Phases 1-9: Foundation through Yields
├── mid-phases.ts     # Phases 10-18: QR Labels through Virtual Lab
├── later-phases.ts   # Phases 19-27: Future through Environmental
└── recent-phases.ts  # Phases 28+: Container Workflow, Recent Dev, etc.
```

## Development Commands

All commands should be run from the `Web App/` directory:

```bash
# Install dependencies
npm install

# Start development server (opens http://localhost:3000)
npm run dev

# Type check without emitting
npm run type-check

# Lint the codebase
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Patterns

### State Management

The app uses React Context via `DataContext.tsx` for global state:

```typescript
// Access state and CRUD operations
import { useData } from './store';

const {
  state,           // Full application state
  isLoading,       // Loading indicator
  isConnected,     // Supabase connection status
  addCulture,      // CRUD operations...
  updateGrow,
  // ... etc
} = useData();
```

**Key State Objects:**
- `cultures` - Culture records (LC, agar, spore syringes, slants)
- `grows` - Grow tracking records with stages and flushes
- `strains` - Mushroom strain lookup table
- `locations` - Lab location definitions
- `recipes` - Agar, LC, substrate recipes
- `settings` - User preferences

### Data Flow

1. **Offline-First**: App works without Supabase using localStorage
2. **Cloud Sync**: When Supabase is configured, data syncs to PostgreSQL
3. **Credentials**: Stored in `localStorage` keys:
   - `mycolab-supabase-url`
   - `mycolab-supabase-key`

### Data Architecture Tiers

The application uses a three-tier data architecture for multi-tenant operation:

#### Tier 1: System Shared Data (`user_id = NULL`)
Global reference data visible to ALL users. Managed via SQL seed files.

| Table | Purpose | Examples |
|-------|---------|----------|
| `species` | Mushroom species taxonomy | Pleurotus ostreatus, Hericium erinaceus |
| `strains` (system) | Common/commercial strains | Blue Oyster, Lion's Mane, etc. |
| `container_types` | Standard container definitions | 1L jar, 5lb bag, petri dish |
| `substrate_types` | Common substrate formulas | Masters Mix, CVG, etc. |
| `inventory_categories` | Standard supply categories | Grains, chemicals, equipment |
| `recipe_categories` | Recipe type definitions | Agar, LC, grain spawn |
| `location_types` | Location category definitions | Incubator, fruiting room |
| `grain_types` | Common grain spawn bases | Rye, millet, oats |

**Key characteristics:**
- `user_id IS NULL` in database
- Defined in `supabase-seed-data.sql` and `supabase-species-data.sql`
- Visible via RLS policies: `user_id IS NULL OR user_id = auth.uid()`
- Users CANNOT modify system data
- Updates require schema migration

#### Tier 2: Default Seed Data (Created at Account Signup)
User-owned copies of common reference data, created when account is first established.

| Data Type | Purpose | Source |
|-----------|---------|--------|
| User strains | Personal strain library | Copied from system strains |
| User locations | Lab/grow room definitions | Default templates |
| User settings | Preferences, units, timezone | Default values |
| Notification prefs | Alert configurations | Default enabled categories |

**Key characteristics:**
- `user_id = auth.uid()` (user-owned)
- Created by `handle_new_user()` trigger on signup
- Users CAN modify their copies
- Provides personalization starting point

#### Tier 3: User-Generated Data
All operational data created by users during normal app usage.

| Table | Purpose |
|-------|---------|
| `cultures` | Spore syringes, LC, agar plates, slants |
| `grows` | Grow projects with stage tracking |
| `flushes` | Harvest records per grow |
| `recipes` | Custom recipes (agar, LC, substrates) |
| `inventory_items` | Supply tracking with stock levels |
| `observations` | Culture/grow observations and logs |
| `prepared_spawn` | Prepared grain spawn jars/bags |

**Key characteristics:**
- `user_id = auth.uid()` always
- Full CRUD via DataContext
- RLS restricts to owner only
- Subject to archive/versioning
- Deleted by `supabase-wipe-user-data.sql` (preserves schema) or `supabase-reset-database.sql` (drops all)

#### RLS Policy Pattern

All tables follow this visibility pattern:
```sql
-- System data (NULL user_id) visible to all, user data only to owner
CREATE POLICY "table_select" ON table_name
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

-- Users can only modify their own data
CREATE POLICY "table_modify" ON table_name
  FOR ALL USING (user_id = auth.uid());
```

#### Important: Data Separation Rules

1. **Never mix tiers** - System data should never have user_id, user data should always have user_id
2. **Seed data is idempotent** - Running seed files multiple times won't create duplicates (uses UPSERT)
3. **User wipe is safe** - `supabase-wipe-user-data.sql` only removes Tier 2/3 data, preserves Tier 1
4. **Database reset is nuclear** - `supabase-reset-database.sql` drops EVERYTHING, requires rebuilding from schema + seed files
5. **Strains are special** - System strains (Tier 1) are copied to user strains (Tier 2) on signup for personalization

### Type System

Two type definition files exist:
- `src/store/types.ts` - Core types used by DataContext
- `src/types/index.ts` - Extended types for complex features

**Important Types:**
```typescript
// Culture types
type CultureType = 'liquid_culture' | 'agar' | 'slant' | 'spore_syringe';
type CultureStatus = 'active' | 'colonizing' | 'ready' | 'contaminated' | 'archived' | 'depleted';

// Grow stages
type GrowStage = 'spawning' | 'colonization' | 'fruiting' | 'harvesting' | 'completed' | 'contaminated' | 'aborted';
type GrowStatus = 'active' | 'paused' | 'completed' | 'failed';

// Recipe categories
type RecipeCategory = 'agar' | 'liquid_culture' | 'grain_spawn' | 'bulk_substrate' | 'casing' | 'other';
```

### Database Schema

The Supabase schema (`supabase-schema.sql`) includes:
- **Lookup Tables**: species, strains, locations, vessels, container_types, substrate_types, suppliers, inventory_categories
- **Core Tables**: cultures, grows, recipes, inventory_items, flushes
- **Observation Tables**: culture_observations, grow_observations
- **Support Tables**: user_settings, recipe_ingredients, culture_transfers

The schema is idempotent - safe to run multiple times.

## Code Conventions

### Component Structure

Components follow this pattern:
```typescript
// Component file structure
import React from 'react';
import { useData } from '../store';

interface ComponentProps {
  // Props interface
}

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  const { state, someAction } = useData();

  // Component logic

  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

### Styling

- Use Tailwind CSS utility classes exclusively
- Dark theme by default (zinc color palette)
- Common patterns:
  ```
  bg-zinc-900/50          # Semi-transparent backgrounds
  border border-zinc-800  # Subtle borders
  text-emerald-400        # Accent color for success/active states
  rounded-lg              # Consistent border radius
  ```

### Icons

Icons are inline SVG components defined in `App.tsx`:
```typescript
const Icons = {
  Dashboard: () => <svg>...</svg>,
  Culture: () => <svg>...</svg>,
  // etc.
};
```

### ID Generation

Use the `generateId` helper from context:
```typescript
const { generateId } = useData();
const newId = generateId('culture'); // Returns: "culture-xxx-yyy"
```

### Date Handling

- Use ISO strings for database storage
- Use `date-fns` for formatting and calculations
- Dates in state are `Date` objects, transform on DB read/write

## Database Transformations

When working with Supabase, use transformation functions:
```typescript
// Transform from DB format (snake_case) to app format (camelCase)
const transformCultureFromDb = (row: any): Culture => ({
  id: row.id,
  strainId: row.strain_id,  // Note the transformation
  // ...
});

// Transform to DB format for writes
const transformCultureToDb = (culture: Partial<Culture>) => ({
  strain_id: culture.strainId,
  // ...
});
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

Can also use `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` as an alias.

## Common Tasks

### Adding a New Entity Type

**COMPLETE CHECKLIST - All steps required:**

1. **Define types in `src/store/types.ts`**
   - Add the interface (e.g., `PreparedSpawn`)
   - Add any associated types (e.g., `PreparedSpawnType`, `PreparedSpawnStatus`)
   - Add to `DataStoreState` interface array
   - Add lookup helper to `LookupHelpers` interface (e.g., `getPreparedSpawn`, `availablePreparedSpawn`)

2. **Add transformation functions in `src/store/transformations.ts`**
   - Import the new type at top of file
   - Add `transformXxxFromDb()` function (snake_case → camelCase)
   - Add `transformXxxToDb()` function (camelCase → snake_case)

3. **Update `src/store/defaults.ts`**
   - Add empty array for new entity in `emptyState` (e.g., `preparedSpawn: []`)

4. **Update `src/store/initialData.ts`**
   - Add empty array or initial data for new entity in `initialDataState`

5. **Add CRUD operations in `src/store/DataContext.tsx`**
   - Import new type and transform functions
   - Add CRUD function signatures to `DataContextValue` interface
   - Add lookup helper (e.g., `const getPreparedSpawn = useCallback(...)`)
   - Add active/available list (e.g., `const availablePreparedSpawn = useMemo(...)`)
   - Add CRUD implementations (add, update, delete, plus any special operations)
   - Add data fetch in `loadDataFromSupabase()` function
   - Add to `setState()` in the data load section
   - **IMPORTANT: Add to contextValue AND dependency array (BOTH have same list - use replace_all)**

6. **Add database schema in `supabase-schema.sql`**
   - Add CREATE TABLE statement
   - Add indexes as needed
   - Handle any forward references with deferred ALTER TABLE

**⚠️ DataContext.tsx has DUPLICATE lists:**
The contextValue useMemo has two identical-looking lists:
1. The value object (what gets exported)
2. The dependency array (for React memoization)

When adding new functions/helpers, you must add to BOTH lists. Use `replace_all: true` when editing these sections to update both at once.

**Example pattern:**
```
addCulture, updateCulture, deleteCulture, addCultureObservation, addCultureTransfer,
getCultureLineage, generateCultureLabel,
addPreparedSpawn, updatePreparedSpawn, deletePreparedSpawn, inoculatePreparedSpawn, getAvailablePreparedSpawn,
addGrow, updateGrow, deleteGrow, advanceGrowStage, markGrowContaminated,
```

### Adding a New Page/Feature

1. Create component in appropriate `components/` subdirectory
2. Add navigation entry in `App.tsx` `navItems` array
3. Add page config in `pageConfig` object
4. Add route case in `renderPage()` switch statement

### Working with Cultures

```typescript
const { addCulture, updateCulture, getCultureLineage, generateCultureLabel } = useData();

// Generate label like "LC-241212-001"
const label = generateCultureLabel('liquid_culture');

// Create new culture
const newCulture = await addCulture({
  type: 'liquid_culture',
  label,
  strainId: 'strain-id',
  status: 'active',
  // ... other fields
});

// Get lineage (ancestors and descendants)
const { ancestors, descendants } = getCultureLineage(cultureId);
```

### Working with Grows

```typescript
const { addGrow, advanceGrowStage, addFlush, markGrowContaminated } = useData();

// Advance through stages: spawning -> colonization -> fruiting -> harvesting -> completed
await advanceGrowStage(growId);

// Record a harvest
await addFlush(growId, {
  harvestDate: new Date(),
  wetWeight: 450,
  dryWeight: 45,
  quality: 'good',
});
```

## Testing Considerations

- No test framework is currently configured
- When adding tests, consider:
  - Unit tests for calculation utilities (substrate calculator, etc.)
  - Integration tests for CRUD operations
  - Component tests with React Testing Library

## Potential Improvements

The DevLog/Roadmap page tracks planned features. Key areas:
- Image upload and storage
- QR code label generation
- Multi-user authentication
- Mobile responsiveness enhancements
- IoT sensor integration

## Troubleshooting

### Database Connection Issues
1. Check Supabase URL and key in Settings page
2. Verify schema has been applied via SQL Editor
3. Check browser console for specific errors

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall dependencies
rm -rf node_modules && npm install
```

### Type Errors
- Ensure both `src/store/types.ts` and `src/types/index.ts` are consistent
- Run `npm run type-check` to identify issues

## Versioning Policy

**IMPORTANT: DO NOT bump the version without explicit user approval.**

This project follows semantic versioning but is currently in **early beta** (v0.x.x). The version number in `package.json` should reflect the actual maturity of the application.

### Version Guidelines:
- **v0.1.x - v0.4.x**: Early development, core features being built
- **v0.5.x - v0.7.x**: Feature complete but untested, known bugs
- **v0.8.x - v0.9.x**: Beta testing, bug fixes, security audits
- **v1.0.0**: Production ready - thoroughly tested, security reviewed, stable

### Current Status (v0.2.0):
- App was rapidly prototyped (~2 days of development)
- **No automated tests** exist yet
- **No security audit** has been performed
- **No real-world testing** has been done
- Many potential vulnerabilities, bugs, and errors may exist
- Current version: **v0.2.0** (early alpha/beta)

### Rules for AI Assistants:
1. **NEVER** bump the version number without explicit user request
2. **NEVER** assume the app is ready for v1.0 based on feature count
3. If asked to bump version, remind user of the testing/audit requirements
4. Version changes should be documented in commit messages

## Notes for AI Assistants

1. **Main code is in `Web App/` directory** - Always work relative to this path
2. **Two type files exist** - `store/types.ts` (runtime) and `types/index.ts` (extended)
3. **Context-based state** - Use `useData()` hook for all data operations
4. **Dark theme** - UI uses zinc/emerald color scheme
5. **Offline-first** - Don't assume Supabase is connected
6. **Idempotent schema** - SQL migrations are safe to re-run
7. **No testing yet** - Be careful with refactoring without tests
8. **Version control** - See "Versioning Policy" above - NEVER bump version without user approval
9. **⛔ NEVER ESTIMATE TIME** - Do not provide time estimates, hour counts, or timeline projections for any work. This is not a metric the user wants, needs, or uses. Focus on what needs to be done, not how long it takes. This is a mandatory directive - no exceptions.
10. **⚠️ MANDATORY PRE-COMMIT: Check SQL files BEFORE EVERY COMMIT** - Not "when relevant", EVERY commit:
    - READ `supabase-schema.sql` - verify schema changes are included
    - READ `supabase-seed-data.sql` - verify reference data is included
    - READ `supabase-species-data.sql` - verify species/strain data is included
    - DO NOT SKIP THIS. DO NOT ASSUME. READ THE FILES.
11. **⚠️ MANDATORY PRE-COMMIT: Update DevLog BEFORE EVERY COMMIT** - Not "when relevant", EVERY commit:
    - READ `src/data/devlog/*.ts` files
    - UPDATE status for features you touched
    - ADD new entries for features not already tracked
    - DO NOT SKIP THIS. DO NOT ASSUME. READ THE FILES.
