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
│   ├── supabase-schema.sql # Database schema (idempotent)
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
│       ├── data/          # Initial/seed data (initialData.ts)
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

## Notes for AI Assistants

1. **Main code is in `Web App/` directory** - Always work relative to this path
2. **Two type files exist** - `store/types.ts` (runtime) and `types/index.ts` (extended)
3. **Context-based state** - Use `useData()` hook for all data operations
4. **Dark theme** - UI uses zinc/emerald color scheme
5. **Offline-first** - Don't assume Supabase is connected
6. **Idempotent schema** - SQL migrations are safe to re-run
7. **No testing yet** - Be careful with refactoring without tests
