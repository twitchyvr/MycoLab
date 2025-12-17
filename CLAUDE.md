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

### !!! MANDATORY PRE-COMMIT CHECKLIST - NO EXCEPTIONS !!!

**⚠️ STOP! BEFORE RUNNING `git commit`, YOU MUST COMPLETE ALL THREE CHECKS BELOW. ⚠️**

**This is NOT optional. This is NOT "when relevant." This is EVERY SINGLE COMMIT.**

**DO NOT SKIP THESE CHECKS. DO NOT ASSUME THEY DON'T APPLY. DO NOT COMMIT WITHOUT READING THESE FILES.**

---

#### ✅ CHECK 1: Schema File (`supabase-schema.sql`)
**BEFORE EVERY COMMIT, read `Web App/supabase-schema.sql` and verify:**
- [ ] Any new database tables are defined with `CREATE TABLE IF NOT EXISTS`
- [ ] Any new columns are added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- [ ] Any removed tables/columns are dropped with `DROP TABLE IF EXISTS` / `DROP COLUMN IF EXISTS`
- [ ] Any new indexes, constraints, or foreign keys are included
- [ ] Any removed indexes, constraints, or foreign keys are dropped
- [ ] Any new triggers or RLS policies are defined
- [ ] Any removed triggers or RLS policies are dropped
- [ ] The file remains idempotent (safe to run multiple times)

**If your changes ADD, MODIFY, or REMOVE ANY database field, table, or relationship - UPDATE THIS FILE.**

---

#### ✅ CHECK 2: Seed Data Files (`supabase-seed-data.sql`, `supabase-species-data.sql`)
**BEFORE EVERY COMMIT, read these files and verify:**
- [ ] `Web App/supabase-seed-data.sql` - Contains all reference data (containers, substrate types, inventory categories, recipe categories, location types, grain types, etc.)
- [ ] `Web App/supabase-species-data.sql` - Contains all species and strain reference data
- [ ] New lookup data uses `ON CONFLICT (id) DO UPDATE SET ...` pattern
- [ ] Removed seed data is deleted with `DELETE FROM ... WHERE id = ...`
- [ ] Modified seed data is updated in the `ON CONFLICT` clause
- [ ] System-level seed data has `user_id = NULL` for global visibility

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

**SQL Files Location:**
```
Web App/
├── supabase-schema.sql      # Database structure (tables, indexes, triggers, RLS)
├── supabase-seed-data.sql   # System reference data (containers, categories, etc.)
└── supabase-species-data.sql # Species and strain reference data
```

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

1. Define types in `src/store/types.ts`
2. Add to `DataStoreState` interface
3. Create transformation functions in `DataContext.tsx`
4. Add CRUD operations to context
5. Update `emptyState` with default array
6. Add database table to `supabase-schema.sql`

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
9. **⚠️ MANDATORY PRE-COMMIT: Check SQL files BEFORE EVERY COMMIT** - Not "when relevant", EVERY commit:
   - READ `supabase-schema.sql` - verify schema changes are included
   - READ `supabase-seed-data.sql` - verify reference data is included
   - READ `supabase-species-data.sql` - verify species/strain data is included
   - DO NOT SKIP THIS. DO NOT ASSUME. READ THE FILES.
10. **⚠️ MANDATORY PRE-COMMIT: Update DevLog BEFORE EVERY COMMIT** - Not "when relevant", EVERY commit:
    - READ `src/data/devlog/*.ts` files
    - UPDATE status for features you touched
    - ADD new entries for features not already tracked
    - DO NOT SKIP THIS. DO NOT ASSUME. READ THE FILES.
