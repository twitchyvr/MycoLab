// ============================================================================
// DEV LOG: RECENT PHASES (28-30)
// Container Workflow, Inline Creation, Recent Development, v1.0 Priorities
// December 2025 Updates, UX Improvements
// ============================================================================

import type { DevLogFeature } from '../../types';

const timestamp = () => new Date().toISOString();

/**
 * Phase 28: Culture & Container Workflow (Critical Gaps)
 * Phase 29: Inline Creation & Draft Workflow (Critical UX Gap)
 * Phase 30: Recent Development (v0.9.0)
 * v1.0 Priorities
 * December 2025 Updates
 * UX Improvements
 */
export const recentPhases: DevLogFeature[] = [
  // =============================================================================
  // PHASE 28: CULTURE & CONTAINER WORKFLOW (Critical Gaps)
  // These are fundamental workflow issues that affect daily use
  // =============================================================================
  {
    id: 'dev-500',
    title: 'Recipe-to-Culture Linking',
    description: 'When creating a culture (LC, agar, slant, etc.), allow user to select which recipe was used to make the media. Track what\'s actually IN each container. Essential for knowing what recipe produced which results.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    dependencies: ['dev-050'],
    notes: 'Core workflow gap - users need to know what recipe is in each culture container',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-501',
    title: 'Fill Volume vs Container Capacity',
    description: 'Containers have total capacity (e.g., 1000ml jar) but are often partially filled (e.g., 600ml of LC). Track both: vessel.volume_ml (max capacity) and culture.fill_volume_ml (actual amount). Show fill percentage.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 6,
    notes: 'Real-world usage: a 1000ml jar might only have 600ml of LC. Users need to track actual volume.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-502',
    title: 'Batch/Prep Session Tracking',
    description: 'When you prep a batch of media (e.g., make 5L of LC and fill 8 jars), track it as a "prep session" or "batch". Link all containers filled from the same batch. Track prep date, sterilization params, recipe used.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-500'],
    notes: 'Essential for batch-level contamination tracking - if one jar from a batch contams, check the others',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-503',
    title: 'Container Lifecycle States',
    description: 'Track container status through its lifecycle: empty → sterilized → filled → inoculated → colonizing → ready → in-use → exhausted/contaminated. Different from culture status - this is the physical container.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 6,
    notes: 'Users need to know: is this jar clean? sterilized? what\'s in it?',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-504',
    title: 'Sterilization Logging',
    description: 'Log sterilization events for containers: date, method (PC/autoclave), pressure, time, who did it. Track if container was sterilized before filling. Alert if using unsterilized container.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-166'],
    notes: 'Links to pressure cooking calculator. Important for contamination root cause analysis.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-505',
    title: 'Container Reuse Tracking',
    description: 'For reusable vessels (jars, bottles), track usage count and history. How many times has this jar been used? Last cleaned? Any contamination history? Flag high-use containers for inspection.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-503'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-506',
    title: 'Media Age & Expiration',
    description: 'Track how old the media is in each container. LC degrades over time, agar dries out. Show "days since prep", calculate viability window, alert when media is getting old.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 6,
    dependencies: ['dev-500'],
    notes: 'LC viability is typically 2-6 months. Agar plates dry out. Users need expiration awareness.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-507',
    title: 'Culture Creation Workflow Redesign',
    description: 'Redesign "Add Culture" flow to capture: container type, fill volume, recipe used, prep/sterilization date, source (if inoculated), location. Guided multi-step form for complete data capture.',
    category: 'ui',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 12,
    dependencies: ['dev-500', 'dev-501', 'dev-504'],
    notes: 'Implemented as CultureWizard component with 5-step guided flow, auto-save to localStorage via CreationContext, parent culture selection for lineage tracking, and sterilization date capture.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-508',
    title: 'Quick Fill from Batch',
    description: 'After prepping a batch of media, quickly log multiple containers filled from it. "I made LC today and filled 8 jars" → creates 8 culture records with shared batch ID, recipe, prep date.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-502', 'dev-401'],
    notes: 'Reduces data entry burden when prepping multiple containers at once',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-509',
    title: 'What\'s In This Container View',
    description: 'For any container/culture, show complete contents: recipe name, ingredients, prep date, sterilization date, inoculation date, source culture, current volume remaining, age, viability status.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-500', 'dev-501', 'dev-506'],
    notes: 'Single view to answer "what exactly is in this jar?"',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-510',
    title: 'Volume Deduction on Use',
    description: 'When using culture (e.g., inoculating grain from LC), deduct volume used. "Used 10ml from LC-042" updates remaining volume. Track usage history per container.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-501'],
    notes: 'Know how much LC is left in each jar',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 29: INLINE CREATION & DRAFT WORKFLOW (Critical UX Gap)
  // Identified as highest priority - blocking basic workflow
  // =============================================================================
  {
    id: 'dev-600',
    title: 'Inline "Add New" in Form Dropdowns',
    description: 'When creating a grow/culture/etc, allow "Add New..." option in dropdown for strains, spawn types, substrates, containers. Opens mini-form inline or modal without losing form state.',
    category: 'ui',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 16,
    actualHours: 20,
    completedAt: timestamp(),
    notes: `Comprehensive inline creation system implemented:

**Core Infrastructure:**
- StandardDropdown component with entityType prop for "+ Add" buttons
- CreationContext with draft stack for nested creation (create strain → create species → back to strain)
- EntityFormModal with 14+ entity type forms
- useEntityForm hook for form state management

**Supported Entity Types (all with "+ Add" in dropdowns):**
- Strains (with nested species creation)
- Locations (with type/classification creation)
- Vessels, Container Types
- Grain Types, Substrate Types
- Suppliers
- Recipe Categories
- Location Types, Location Classifications
- Inventory Items (with category creation)
- Inventory Categories

**Pre-configured dropdown variants:**
- StrainDropdown, LocationDropdown, VesselDropdown
- SupplierDropdown, GrainTypeDropdown, SubstrateTypeDropdown
- ContainerTypeDropdown, InventoryItemDropdown, InventoryCategoryDropdown

**Key Features:**
- Draft auto-selection after creation
- Nested creation support (up to 3 levels deep)
- Breadcrumb navigation in nested forms
- Form validation with required field indicators`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-601',
    title: 'Form Draft Auto-Save',
    description: 'Automatically save form state to localStorage as user fills it out. Restore drafts on return. Prevents data loss when navigating away to add missing items.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 0,
    dependencies: ['dev-600'],
    notes: 'Implemented via CreationContext draft stack system with localStorage persistence. CultureWizard auto-saves on every field change.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-602',
    title: 'Draft Resume Flow',
    description: 'After adding a new strain/substrate/etc, automatically return user to their saved draft with the new item selected. Clear draft on successful submission.',
    category: 'ui',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 0,
    dependencies: ['dev-601'],
    notes: 'Implemented via CreationContext - StandardDropdown triggers nested creation, draft is preserved, and new entity auto-selected on return.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-603',
    title: 'Draft Indicator in UI',
    description: 'Show visual indicator when drafts exist. "Continue editing Grow Draft" button on dashboard or relevant page. List pending drafts.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 0,
    dependencies: ['dev-601'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 30: RECENT DEVELOPMENT (v0.9.0)
  // Features completed in recent development cycles
  // =============================================================================
  {
    id: 'dev-700',
    title: 'Admin Data Management Panel',
    description: 'Centralized admin panel for managing master data (strains, locations, vessels, etc.) with tabbed interface. Includes notification settings and system configuration.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 10,
    completedAt: timestamp(),
    notes: 'Accessible from Settings page. Manages all lookup tables in one place.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-701',
    title: 'Account Deletion Functionality',
    description: 'Allow users to permanently delete their account and all associated data. Includes confirmation dialog with safety checks.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    dependencies: ['dev-122'],
    notes: 'Part of user account management. Includes logout confirmation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-702',
    title: 'Emergency Logout Functionality',
    description: 'Force logout mechanism for stuck authentication sessions. Clears all local auth state and redirects to login.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    dependencies: ['dev-122'],
    notes: 'Accessible from login screen for recovery.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-703',
    title: 'StandardDropdown Component System',
    description: 'Unified dropdown component that combines selection with inline "Add New" capability. Automatically opens entity creation modal without losing form state.',
    category: 'ui',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    dependencies: ['dev-600'],
    notes: 'Implemented as StandardDropdown with nested draft stack for entity creation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-704',
    title: 'Stock Management Page',
    description: 'Dedicated page for managing lab stock/inventory separate from culture containers. Track supplies, ingredients, and consumables.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 10,
    actualHours: 8,
    completedAt: timestamp(),
    dependencies: ['dev-070'],
    notes: 'Complements Lab Inventory view with dedicated stock management.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-705',
    title: 'Version Display in UI',
    description: 'Display current app version in sidebar. Version pulled from package.json at build time via Vite define.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 1,
    actualHours: 1,
    completedAt: timestamp(),
    notes: 'Shows version below app name in sidebar.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-706',
    title: 'Default User Data Seed Script',
    description: 'SQL script to populate new user accounts with default lookup data (strains, locations, vessels, etc.). Bootstraps new users with essential data.',
    category: 'data',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    dependencies: ['dev-120'],
    notes: 'Runs on new user signup to provide initial data set.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-707',
    title: 'Auth Flow Improvements',
    description: 'Enhanced signup flow with proper email verification, success UX, and safeguards against auth trigger failures. Fixed signOut hanging issues.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 5,
    completedAt: timestamp(),
    dependencies: ['dev-122'],
    notes: 'Includes form attributes for password manager recognition.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // v1.0.0 TARGET PRIORITIES
  // High-impact features for v1.0 release
  // =============================================================================
  {
    id: 'dev-800',
    title: 'Photo Upload & Storage',
    description: 'Enable photo uploads for cultures, grows, and observations. Cloud storage integration (Supabase Storage or external). Image gallery views.',
    category: 'core',
    status: 'planned',
    priority: 'critical',
    estimatedHours: 16,
    dependencies: ['dev-060'],
    notes: 'Foundational feature for photo journaling. Required for contamination documentation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-801',
    title: 'Observation Logging System',
    description: 'Quick observation entry for any culture or grow. Timestamps, notes, optional photos, categorized by type (growth, contamination, harvest, general).',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 10,
    actualHours: 4,
    completedAt: timestamp(),
    dependencies: ['dev-062'],
    notes: 'Unified observation timeline with filtering, quick entry modal, and navigation integration.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-802',
    title: 'Notification Engine Implementation',
    description: 'Background notification system that evaluates rules and generates alerts. Culture expiration, stage transitions, low stock, etc.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 14,
    dependencies: ['dev-100'],
    notes: 'Foundation for all automated alerts. In-app notifications first, push later.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-803',
    title: 'Today View Dashboard Widget',
    description: 'What needs attention TODAY: items expiring, stage transitions due, scheduled tasks, low stock alerts. One glance for daily priorities.',
    category: 'ui',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    dependencies: ['dev-423'],
    notes: 'Full TodayView component with task generation from cultures and grows, priority filtering, and quick navigation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-804',
    title: 'Batch Transfer Workflow',
    description: 'Transfer from one culture to multiple targets (e.g., LC to 10 agar plates). Auto-generate labels, increment generations, update lineage.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-401', 'dev-404'],
    notes: 'Critical for efficient agar work and LC transfers.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-805',
    title: 'Global Search',
    description: 'Cmd+K style search across all entities. Search cultures, grows, strains, recipes by name, label, or notes.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 10,
    actualHours: 3,
    completedAt: timestamp(),
    dependencies: ['dev-140'],
    notes: 'Full Cmd+K search modal with keyboard navigation, entity type badges, and instant navigation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-810',
    title: 'Grow Creation Workflow Redesign',
    description: 'Redesign "Add Grow" flow similar to CultureWizard. Multi-step guided form capturing: strain selection, source culture, container type, substrate recipe, spawn type/weight, location, target conditions. Streamlines data entry for new grows.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-507'],
    notes: 'Follow-up to CultureWizard (dev-507). Apply same guided workflow pattern to grow creation for consistent UX.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-811',
    title: 'Culture Health Indicators',
    description: 'Visual health indicators for cultures based on age, contamination risk, and observation history. Color-coded badges, viability warnings, and health score calculation.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-506'],
    notes: 'Builds on Media Age & Expiration tracking. Helps users identify cultures needing attention.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-812',
    title: 'Grow Stage Transition Prompts',
    description: 'Smart prompts when grow is ready for stage transition based on elapsed time and species parameters. "Ready to move to fruiting?" notifications with one-click stage advancement.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 8,
    dependencies: ['dev-710', 'dev-802'],
    notes: 'Uses species automation parameters to determine optimal transition timing.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // DECEMBER 2024 UPDATES
  // Species data improvements and grow management enhancements
  // =============================================================================
  {
    id: 'dev-710',
    title: 'Species Automation Parameters',
    description: 'Full automation-ready parameters for all species grow phases. Includes temperature/humidity/CO2 ranges with warning and critical thresholds, light schedules, stage transition criteria, and equipment notes.',
    category: 'data',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    notes: 'Updated 20+ species with complete GrowPhaseParameters for spawn colonization, bulk colonization, pinning, and maturation stages. Automation-ready for future IoT integration.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-711',
    title: 'Species Stage Notes',
    description: 'Human-readable stage-specific notes for species cultivation. Added spawn_colonization_notes, bulk_colonization_notes, pinning_notes, and maturation_notes TEXT columns.',
    category: 'data',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    dependencies: ['dev-710'],
    notes: 'Provides practical guidance for each growth stage. Separate from technical parameters for easy UI display.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-712',
    title: 'Grow Inoculation Date Field',
    description: 'Added user-selectable inoculation date field to new grow form. Defaults to today but allows backdating for retroactive logging.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: 'Uses HTML date input with proper timezone handling (noon time to avoid day shift issues).',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-713',
    title: 'Recipe Transform Fixes',
    description: 'Fixed missing sourceUrl and costPerBatch field mappings in recipe transforms. Data was being lost on save/load.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: 'Part of schema/code consistency audit.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-714',
    title: 'SpeciesInfoPanel Component',
    description: 'Enhanced species detail view with tabbed interface showing Overview, Growing Conditions, Stage Guide, and Automation tabs. Includes tooltips for technical parameters and visual progress indicators.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    dependencies: ['dev-710', 'dev-711'],
    notes: 'Displays rich species data including environmental ranges, stage notes, and automation config. Includes compact SpeciesPreview for dropdowns.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-715',
    title: 'Inventory Items Cost Column Fix',
    description: 'Fixed missing cost_per_unit column in inventory_items table causing save errors. Added migration for backwards compatibility.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: 'Schema had inconsistent column naming (unit_cost vs cost_per_unit). Migration ensures both exist.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-716',
    title: 'Expandable Species UI in Settings',
    description: 'Integrated SpeciesInfoPanel into Settings page species tab with click-to-expand functionality. Each species row shows category icon, name, difficulty badge, and yield preview. Clicking expands to show full tabbed detail view.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 3,
    actualHours: 2,
    completedAt: timestamp(),
    dependencies: ['dev-714'],
    notes: 'Replaced simple data table with rich interactive list. Shows Overview, Growing, Stage Guide, and Automation tabs when expanded.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-717',
    title: 'Schema FK Constraint Safety',
    description: 'Fixed species seed data deletion causing FK constraint violation. Schema now safely handles re-runs by checking existing data and using ON CONFLICT DO NOTHING.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1.5,
    completedAt: timestamp(),
    notes: 'Added conditional block to skip seeding if 5+ species exist. Created partial unique index for conflict handling.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-718',
    title: 'Inventory Items Column Mismatch Fix',
    description: 'Fixed 400 error when creating inventory items. Code was using min_quantity but database column is reorder_point. Added debug logging for future troubleshooting.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 1,
    actualHours: 1,
    completedAt: timestamp(),
    dependencies: ['dev-715'],
    notes: 'Part of schema/code alignment audit. Console now logs insert data and errors for debugging.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // UX IMPROVEMENTS
  // =============================================================================
  {
    id: 'dev-806',
    title: 'Navigation Revamp - Grouped Collapsible Sections',
    description: 'Revamped sidebar navigation from 28 flat items to 7 grouped collapsible sections. Implemented accordion-style navigation with section icons and expand/collapse functionality.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    notes: `Implemented grouped navigation with collapsible sections:

**Navigation Groups:**
- Command (Dashboard, Today, Daily Check, Harvest Forecast)
- Library (Species Library, Cultures, Lineage, Grows, Recipes)
- Inventory (Lab Inventory, Stock, Cold Storage)
- Lab Setup (Lab Mapping, Occupancy, Labels, Scanner)
- Analytics (Analytics Dashboard, Strain Analytics, Contamination, Efficiency)
- Tools (Substrate Calculator, Spawn Rate, Pressure Cooking)
- Settings (Settings, Profile, Dev Roadmap)

**Features:**
- Each section has an icon and expand/collapse chevron
- Sections remember expanded state
- Cleaner visual hierarchy
- Active page highlighted within section
- Much improved mobile navigation experience`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-807',
    title: 'Theming System with 4 Visual Variants',
    description: 'Implemented comprehensive theming system with 4 distinct visual variants: Mycelium (default bioluminescent blue/cyan), Fruiting (earthy warm tones), Spore (light mode with organic feel), and Substrate (rich warm browns).',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 10,
    actualHours: 8,
    completedAt: timestamp(),
    notes: `Full theming implementation:

**Theme Variants:**
- Mycelium: Bioluminescent blue/cyan (default dark theme)
- Fruiting: Warm earthy tones with forest greens
- Spore: Light mode with organic cream/sage colors
- Substrate: Rich warm browns and earth tones

**Technical Implementation:**
- ThemeContext with CSS custom properties injection
- Theme selector in Settings > Preferences
- localStorage persistence for theme preference
- CSS variables in globals.css for all theme tokens
- Smooth transitions between themes`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-808',
    title: 'Lab Command Center Dashboard',
    description: 'New operational hub dashboard replacing simple stats. Shows lab health score, active cultivation timeline, alerts/notifications, quick actions, and upcoming milestones.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 10,
    completedAt: timestamp(),
    notes: `Comprehensive operational dashboard:

**Status Cards:**
- Active Cultures count with health indicator
- Active Grows with stage breakdown
- Ready to Harvest count
- Lab Health Score (calculated from contamination rate, expiring cultures, overdue tasks)

**Features:**
- Health score ring visualization with color coding
- Active Cultivation Timeline showing current grows by stage
- Alerts & Notifications panel with severity levels
- Quick Actions bar for common tasks (new culture, new grow, log observation)
- Upcoming Milestones section for anticipated transitions

**Implementation:**
- Smart alert generation from grow and culture data
- Dismissable alerts with state persistence
- Navigation integration for quick actions`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-809',
    title: 'Temperature Unit Settings Consistency',
    description: 'Fixed temperature unit settings to properly reflect throughout the app. When user changes from Celsius to Fahrenheit (or vice versa), all temperature displays update accordingly.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    notes: `Temperature unit fix:

**New Utilities (src/utils/temperature.ts):**
- formatTemperatureRange() - formats temp range with unit conversion
- fahrenheitToCelsius() / celsiusToFahrenheit()
- getTemperatureUnit() - returns °F or °C symbol

**Updated Components:**
- SpeciesInfoPanel - all phase temperatures
- SpeciesLibrary - species and strain temperature displays
- ColdStorageCheck - location temperatures
- LabMapping - location details and form labels

All temperatures stored in Fahrenheit, converted on display based on user preference.`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // MODULARIZATION TASK (Added during code refactoring)
  // =============================================================================
  {
    id: 'dev-900',
    title: 'Codebase Modularization',
    description: 'Modularize large files for better maintainability. Split devlog features into phase-based files, extract DataContext transforms. Ensures easier updates and reduced cognitive load when editing.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    notes: `Completed modularization:

**initialData.ts** (3000→551 lines, 81% reduction):
- src/data/devlog/early-phases.ts (Phases 1-9)
- src/data/devlog/mid-phases.ts (Phases 10-18)
- src/data/devlog/later-phases.ts (Phases 19-27)
- src/data/devlog/recent-phases.ts (Phases 28-30)
- src/data/devlog/index.ts (utilities + exports)
- src/data/projectScope.ts

**DataContext.tsx** (2953→2321 lines, 21% reduction):
- src/store/defaults.ts (emptyState, defaultRecipeCategories, etc.)
- src/store/transformations.ts (all transform functions)

Benefits:
- Smaller, focused files for targeted editing
- Easier to locate specific features/phases
- Reduced merge conflicts
- Faster code navigation
- All imports remain backward compatible`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-901',
    title: 'Vessel/Container Table Consolidation',
    description: 'Merged separate vessels (culture containers) and container_types (grow containers) tables into a unified containers table. Eliminates confusing dual-terminology and simplifies data model.',
    category: 'data',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    notes: `Database schema consolidation:

**Problem:**
- vessels table: For culture containers (jars, plates, tubes, syringes) - volume in ml
- container_types table: For grow containers (tubs, buckets, beds) - volume in liters
- Confusing overlap (bags used in both), redundant code, inconsistent naming

**Solution - Unified containers table:**
- Single table with all container categories
- usageContext[] array field: ['culture'], ['grow'], or ['culture', 'grow']
- Volume standardized to volumeMl (liters converted to ml * 1000)
- Added dimensions support for larger containers

**Files Updated:**
- supabase-schema.sql (new table, migration logic, FK updates)
- store/types.ts (Container interface, updated Culture/Grow interfaces)
- store/defaults.ts, transformations.ts
- DataContext.tsx (addContainer replaces addVessel/addContainerType)
- initialData.ts (combined sample data)
- CultureManagement.tsx, GrowManagement.tsx (use containerId)
- AdminMasterData.tsx, StandardDropdown.tsx
- StrainPerformanceAnalytics.tsx, CreationContext.tsx
- EntityFormModal.tsx, forms/index.ts
- types/index.ts (extended types)

**Backward Compatibility:**
- Legacy aliases: VesselDropdown, ContainerTypeDropdown → ContainerDropdown
- Type aliases: Vessel, ContainerType → Container
- Database views for backward compatibility`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-902',
    title: 'Species/Strains Data Extraction',
    description: 'Extracted species and strains seed data into a separate SQL file to reduce main seed file size and improve maintainability.',
    category: 'data',
    status: 'completed',
    priority: 'low',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `SQL file reorganization:

**New File Structure:**
- supabase-schema.sql - Database schema (idempotent)
- supabase-species-data.sql - Species & strains reference data (NEW)
- supabase-seed-data.sql - Containers, substrates, categories, etc.

**Benefits:**
- Smaller, more focused SQL files
- Easier to maintain species/strain data separately
- Faster editing and review of seed data
- All files remain idempotent (safe to re-run)

**Run Order:**
1. supabase-schema.sql
2. supabase-species-data.sql
3. supabase-seed-data.sql`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-903',
    title: 'Version Reset & Versioning Policy',
    description: 'Reset version from v0.9.0 to v0.2.0 to accurately reflect early alpha/beta status. Established versioning policy in CLAUDE.md.',
    category: 'enhancement',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 0.5,
    actualHours: 0.25,
    completedAt: timestamp(),
    notes: `Version management update:

**Problem:**
- App was at v0.9.0 implying near-production readiness
- Reality: 2-day rapid prototype with no tests or security audit
- Risk of AI assistants auto-bumping to v1.0 in future sessions

**Solution:**
- Reset to v0.2.0 (early alpha/beta)
- Added Versioning Policy section to CLAUDE.md
- Clear guidelines for AI assistants: NEVER bump version without explicit user approval

**Version Guidelines (documented in CLAUDE.md):**
- v0.1.x - v0.4.x: Early development
- v0.5.x - v0.7.x: Feature complete but untested
- v0.8.x - v0.9.x: Beta testing, bug fixes, security audits
- v1.0.0: Production ready (requires thorough testing + security review)

**Current Status:**
- No automated tests
- No security audit
- No real-world testing
- Many potential bugs and vulnerabilities`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-904',
    title: 'URL Deep-Linking Support',
    description: 'Implemented React Router for URL-based navigation. Users can now copy/paste URLs to navigate directly to specific pages or items.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1.5,
    completedAt: timestamp(),
    notes: `Implemented comprehensive deep-linking support using React Router DOM v6.

**What Changed:**
- App now uses BrowserRouter for URL-based navigation
- URLs update when navigating between pages (e.g., /cultures, /grows, /settings)
- Item-specific URLs supported (e.g., /cultures/uuid, /grows/uuid)
- Browser back/forward navigation works correctly

**Route Examples:**
- / → Dashboard
- /cultures → Culture Management
- /cultures/abc-123 → Culture Management with specific culture selected
- /grows/xyz-456 → Grow Management with specific grow selected
- /settings → Settings page
- /devlog → Dev Roadmap

**Technical Implementation:**
- Added routeConfig mapping Page types to URL paths
- Added pathToPage reverse lookup for URL parsing
- Updated App component to use BrowserRouter
- Created AppWithRouter inner component with useNavigate/useLocation
- onNavigate prop updated across components to support optional itemId
- Existing mycolab:select-item events work seamlessly with URL navigation

**Components Updated:**
- App.tsx (main routing)
- UnifiedItemView (Lab Inventory)
- ObservationTimeline
- TodayView
- LabCommandCenter
- CultureManagement (already had listeners)
- GrowManagement (already had listeners)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-905',
    title: 'Multi-Purpose Room Support',
    description: 'Locations/rooms can now have multiple purposes (e.g., both Colonization and Fruiting). Changed roomPurpose from single value to roomPurposes array. Daily Room Check now shows rooms with ANY growing-related purpose.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    notes: `Multi-purpose room implementation:

**Problem:**
- Rooms could only have one purpose (e.g., "general" or "fruiting")
- Selecting "general" meant room didn't appear in Daily Room Check
- Many labs use multi-purpose rooms (colonization + fruiting in same space)

**Solution - roomPurposes array:**
- Location type now has roomPurposes: RoomPurpose[] (array of purposes)
- Legacy roomPurpose field kept for backwards compatibility
- UI changed from dropdown to checkbox grid for purpose selection

**Files Updated:**
- store/types.ts (added roomPurposes field)
- store/transformations.ts (transform functions for DB)
- components/locations/LabMapping.tsx (multi-select UI)
- components/dailycheck/DailyCheck.tsx (filter logic)
- supabase-schema.sql (room_purposes TEXT[] column)
- supabase-seed-data.sql (updated seed with arrays)
- data/initialData.ts (sample locations with arrays)

**Key Behavior:**
- Rooms appear in Daily Check if ANY purpose is fruiting, colonization, or inoculation
- Form shows checkboxes for all 9 purpose types
- Helpful note shows which purposes trigger Daily Check inclusion
- Backwards compatible: old single roomPurpose data still works`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-906',
    title: 'Location Form Modal State Reset Fix',
    description: 'Fixed bug where LocationFormModal in Lab Mapping would show stale data from previous sessions. Creating a new room showed old values, and editing showed incorrect data.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Form state reset bug fix:

**Problem:**
- React useState only initializes on first render
- When modal reopened with different props, old formData persisted
- Creating new location showed previous values
- Editing location showed wrong data (from last create)

**Solution:**
- Added useEffect to reset form state when modal opens
- useCallback helper creates fresh form data from props
- Resets both formData and showEnvironmental when isOpen changes
- Properly derives initial state from initialData and parentLocation props

**File Updated:**
- components/locations/LabMapping.tsx (LocationFormModal)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-907',
    title: 'Selected Item State Sync Fix',
    description: 'Fixed bug where detail panels in GrowManagement and CultureManagement did not update after adding observations, marking contaminated, or other changes. Required page refresh to see updates.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `UI state sync bug fix:

**Problem:**
- selectedGrow/selectedCulture stored in local useState
- When state.grows/state.cultures updated, local selection didn't sync
- setTimeout(0) hacks didn't work for async operations
- Adding observations, harvests, or changing status didn't reflect in UI

**Solution:**
- Added useEffect that syncs selectedGrow/selectedCulture with store data
- Watches for changes to grows/cultures arrays
- Updates local selection when underlying data changes
- Properly handles deletion (clears selection if item deleted)
- Made async handlers properly await operations (advanceGrowStage, markGrowContaminated, addFlush)
- Removed obsolete setTimeout hacks

**Files Updated:**
- components/grows/GrowManagement.tsx
- components/cultures/CultureManagement.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-908',
    title: 'Inventory Items Not Loading from Supabase',
    description: 'Fixed bug where inventory items were not appearing in recipe ingredient dropdowns. The loadDataFromSupabase function was missing the fetch for inventory_items table.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Data loading bug fix:

**Problem:**
- Recipe "From Inventory" dropdown only showed "Manual entry..."
- User's inventory items were not appearing in the list
- Items were being saved to Supabase but never loaded back

**Root Cause:**
- loadDataFromSupabase in DataContext.tsx was missing:
  1. The fetch query for inventory_items table
  2. The transformInventoryItemFromDb function
  3. inventoryItems in the setState call

**Solution:**
- Added transformInventoryItemFromDb/ToDb to transformations.ts
- Added inventory_items fetch in loadDataFromSupabase
- Added inventoryItems to setState with proper transformation

**Files Updated:**
- store/transformations.ts (new transform functions)
- store/DataContext.tsx (fetch + setState)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-909',
    title: 'Remove Hardcoded Defaults - Database as Single Source of Truth',
    description: 'Fixed duplicate entries in dropdowns by removing all hardcoded defaults. All lookup data now comes exclusively from the database seed data.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `Removed hardcoded defaults from app state:

**Problem:**
- Recipe category dropdown showed duplicates (e.g., "Agar Media" twice)
- Code was merging hardcoded defaults with database data
- emptyState initialized with default arrays for lookup tables
- location_types, location_classifications, grain_types not being loaded from DB

**Root Cause:**
- loadDataFromSupabase was merging defaultRecipeCategories with DB data
- emptyState had [...defaultLocationTypes], [...defaultGrainTypes], etc.
- Missing fetch queries for location_types, location_classifications, grain_types

**Solution - Database as Single Source of Truth:**
1. Updated emptyState to use empty arrays for all lookup tables
2. Added fetch queries for location_types, location_classifications, grain_types
3. Removed defaultRecipeCategories merge - now uses only DB data
4. All lookup data now comes from supabase-seed-data.sql

**Files Updated:**
- store/defaults.ts (emptyState with empty arrays)
- store/DataContext.tsx (added fetches, removed merging)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-910',
    title: 'Grow Edit Button Not Working from Lab Inventory',
    description: 'Fixed bug where clicking "Edit" button on a grow in the Lab Inventory modal navigated to the Grows page but did not open the edit modal. Added full edit functionality with a warning for downstream data effects.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1.5,
    completedAt: timestamp(),
    notes: `Grow edit functionality bug fix:

**Problem:**
- Edit button in UnifiedItemView (Lab Inventory) dispatched mycolab:edit-item event
- GrowManagement event handler only selected the grow, didn't open edit modal
- Code comment said "For now, just select it - could open edit modal in future"

**Solution:**
1. Added showEditModal state and editGrow form state to GrowManagement
2. Implemented openEditModal() function to populate edit form with grow data
3. Updated mycolab:edit-item event handler to call openEditModal()
4. Added full edit modal UI with all grow fields editable
5. Added getDownstreamEffects() to detect linked data (flushes, observations, yield)
6. Added warning banner when grow has existing data that could be affected
7. Added Edit icon button to detail panel actions for discoverability

**Warning Display:**
- Shows amber warning banner when grow has flushes, observations, or yield data
- Lists specific downstream data (e.g., "3 harvest records", "5 observations")
- Warns about data integrity for core field changes (strain, dates, container)

**Files Updated:**
- components/grows/GrowManagement.tsx (edit modal, warning, handlers)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-911',
    title: 'Outcome Logging System (Phase 1)',
    description: 'Comprehensive outcome tracking when removing/completing grows. Exit survey captures outcome category (success/failure/neutral/partial), contamination details, and user feedback. Foundation for analytics and insights.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 12,
    actualHours: 8,
    completedAt: timestamp(),
    notes: `Outcome Logging System - Phase 1:

**User Pain Point:**
- Contaminated grows only showed a delete button with no way to log what happened
- No data capture on why grows failed/succeeded
- Lost valuable pattern data for contamination analysis

**Solution:**
1. Database tables: entity_outcomes, contamination_details, exit_surveys (v18)
2. Comprehensive type system for outcomes (GrowOutcomeCode, CultureOutcomeCode, ContaminationType, etc.)
3. ExitSurveyModal component with multi-step wizard flow
4. Context integration with saveEntityOutcome, saveContaminationDetails
5. GrowManagement updated with outcome buttons and exit survey integration

**Outcome Categories:**
- Success: completed_success, completed_excellent, completed_low_yield
- Failure: contamination_early/mid/late, stalled_colonization, stalled_fruiting, genetics_failure
- Neutral: aborted_user, experiment_ended, transferred_out
- Environmental: aborted_environmental

**Contamination Tracking:**
- Type: trichoderma, cobweb, black_mold, penicillium, aspergillus, bacterial, lipstick, wet_spot, yeast, unknown
- Stage: agar, liquid_culture, grain_spawn, bulk_colonization, fruiting, storage
- Suspected Cause: sterilization_failure, inoculation_technique, contaminated_source, environmental, substrate_issue, equipment, user_error

**Files Updated:**
- supabase-schema.sql (v18 - added entity_outcomes, contamination_details, exit_surveys tables)
- store/types.ts (outcome types, options arrays)
- store/DataContext.tsx (saveEntityOutcome, saveContaminationDetails, updated deleteGrow)
- components/surveys/ExitSurveyModal.tsx (new modal component)
- components/grows/GrowManagement.tsx (exit survey integration, outcome buttons)

**Future Phases:**
- Phase 2: Culture exit surveys
- Phase 3: Inventory item exit surveys
- Phase 4: Strain experience tracking
- Phase 5: Anonymous telemetry and reporting`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-912',
    title: 'Command Center - Unified Daily Operations Hub',
    description: 'New consolidated view combining Today tasks, Room Walkthrough, and Harvest workflow into a single "mushroom cultivator\'s cockpit" interface. Three modes: Overview (tasks), Walkthrough (room-by-room inspection), Harvest (quick recording).',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Command Center - Unified Daily Operations:

**User Pain Point:**
- Today, Daily Check, and Harvest pages had overlapping purposes
- Too many nav items created cognitive overload
- Cultivators wanted a single "cockpit" for daily operations

**Solution - Three Modes in One View:**
1. **Overview Mode**: Auto-generated task list from cultures and grows
   - Priority-sorted (urgent → high → medium → low)
   - Session-based completion tracking
   - Quick stats: cultures, grows, fruiting, urgent count

2. **Walkthrough Mode**: Room-by-room inspection
   - Progress tracking (X of Y rooms checked)
   - Per-room: attention flag, harvest estimate, notes
   - localStorage persistence (date-keyed)
   - Shows grows and fruiting status per room

3. **Harvest Mode**: Quick harvest recording
   - Lists all fruiting/harvesting grows
   - Weight entry with BE% preview
   - Quality rating and notes

**Design Philosophy:**
- "Mycelium Model" - operations flow from central hub
- Mushroom-themed UI with cultivator-friendly language
- Mobile-first responsive design
- Preserves ALL functionality from original pages

**Files Created:**
- components/command/CommandCenter.tsx (new unified component)
- components/command/index.ts (exports)

**Files Updated:**
- App.tsx (added route, nav item, page config, render case)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-913',
    title: 'Navigation Consolidation & UX Cleanup',
    description: 'Consolidated overlapping navigation items into a cleaner, more intuitive structure. Reduced nav clutter by 30% while preserving all functionality.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `Navigation Consolidation - Reducing Cognitive Load:

**Problem:**
- Lab Command section had 9 items, causing cognitive overload
- Today, Daily Check, and Harvest overlapped with Command Center
- Users confused about which page to use

**Solution:**
1. **Removed Redundant Nav Items**: Today, Daily Check, Harvest removed from sidebar
2. **Unified in Command Center**: All daily operations now in one place
3. **Legacy URL Support**: Old routes (/today, /daily-check, /harvest) auto-redirect to /command
4. **Reorganized Groups**: Better categorization for intuitive navigation

**New Navigation Structure:**
- **Daily Ops** (4 items): Dashboard, Command Center, Harvest Forecast, Cold Storage
- **Cultivation** (5 items): Cultures, Grows, Lineage Tree, Observations, Event Log
- **Knowledge Base** (2 items): Species & Strains, Recipes
- **Lab & Storage** (6 items): Lab Inventory, Stock & Orders, Lab Layout, Space Tracker, Label Maker, QR Scanner
- **Analytics** (4 items): Overview, Strain Stats, Contam Analysis, BE Calculator
- **Calculators** (3 items): Substrate, Spawn Rate, Pressure Cook
- **Settings** (3 items): Preferences, Profile, Roadmap

**Key Changes:**
- Renamed sections for clarity (Genetics → Cultivation, Inventory → Lab & Storage)
- Moved Observations and Event Log to Cultivation (where the data lives)
- Cleaner labels (Lab Mapping → Lab Layout, Occupancy → Space Tracker)

**Files Updated:**
- App.tsx (navGroups, removed imports, added redirects)

**Backward Compatibility:**
- All old URLs still work via automatic redirects
- No functionality removed, just reorganized`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-914',
    title: 'Contamination Event Detail Modal & Interactivity',
    description: 'Made contamination events in Contam Analysis clickable with drill-down detail modal. Users can now click on any contamination event to view details, edit type/cause/notes, see prevention tips, and navigate to the source culture or grow.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 3,
    actualHours: 2,
    completedAt: timestamp(),
    notes: `Contamination Analysis Event Interactivity:

**User Pain Point:**
- Contamination events in the list were non-interactive
- No way to drill down into details or edit information
- Couldn't easily navigate to the source culture/grow

**Solution:**
1. Made event list items clickable buttons with hover effects
2. Added chevron indicator for clickability
3. Created comprehensive detail modal with:
   - Quick stats (detection date, day count, location)
   - Stage badge display
   - Editable contamination type dropdown
   - Editable suspected cause dropdown
   - Editable notes textarea
   - Knowledge card showing selected type info
   - Prevention tips from knowledge base
   - Context info (grain type, substrate, PC params if available)

**Actions in Detail Modal:**
- "View Culture/Grow" button to navigate to source entity
- Save Changes button to persist edits
- Cancel button to close without saving

**Technical Implementation:**
- Added selectedEvent and editingEvent state
- Event cards changed from divs to buttons
- Added Icons: ChevronRight, Edit, ExternalLink, Save, Calendar, Clock, MapPin
- Detail modal uses sticky header/footer for long content
- Dispatches custom navigate event to link to source items

**Files Updated:**
- components/analysis/ContaminationAnalysis.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-915',
    title: 'Flushes Table Schema Fix - Missing Columns',
    description: 'Fixed database schema for flushes table which was missing mushroom_count and quality columns, causing 400 errors when recording harvests.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Database schema bug fix for harvest recording:

**Problem:**
- Recording harvests in GrowManagement threw 400 errors
- Console showed "Failed to load resource: the server responded with a status of 400"
- Users unable to save harvest data for their grows

**Root Cause:**
- flushes table in supabase-schema.sql was missing two columns:
  - mushroom_count INTEGER
  - quality TEXT
- transformFlushToDb was sending these fields to Supabase
- Supabase rejected the insert due to unknown columns

**Solution:**
- Added mushroom_count INTEGER column to flushes table
- Added quality TEXT with CHECK constraint ('excellent', 'good', 'fair', 'poor')
- Added idempotent ALTER TABLE migrations for existing databases
- Added check constraint with exception handling for duplicate_object

**Files Updated:**
- supabase-schema.sql (flushes table definition + migration blocks)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-916',
    title: 'Sparkline NaN Error Fix',
    description: 'Fixed NaN errors in chart Sparkline components when data has only one element, causing "Problem parsing points=NaN,30" errors.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Chart rendering bug fix:

**Problem:**
- Console showed repeated "Error: Problem parsing points='NaN,30'" errors
- Also showed "Error: Invalid value for <circle> attribute cx='NaN'"
- Charts would fail to render when yield data had only one data point

**Root Cause:**
- Sparkline component calculated x position as: idx / (data.length - 1)
- When data.length = 1, this becomes 0/0 = NaN
- SVG polyline couldn't parse NaN coordinates

**Solution:**
- Added early return for single data point case
- Single point now renders as centered circle instead of line
- Prevents division by zero in all coordinate calculations
- Also fixed circle cx calculation for end dot

**Files Updated:**
- components/analytics/AnalyticsDashboard.tsx (Sparkline component)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-917',
    title: 'Harvest Modal Error Handling',
    description: 'Added comprehensive error handling and loading states to the harvest recording modal in GrowManagement.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Improved harvest recording UX:

**Problem:**
- Harvest modal had no error handling
- If save failed, user saw no feedback
- Button had no loading state during save

**Solution:**
1. Added harvestError state for error messages
2. Added isSavingHarvest loading state
3. Wrapped addFlush in try-catch with user-friendly error display
4. Added spinner animation during save
5. Added helpful error message suggesting schema update
6. Disabled buttons during save to prevent double-submit

**Files Updated:**
- components/grows/GrowManagement.tsx (handleAddHarvest, Harvest Modal UI)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-918',
    title: 'Grows Page Complete Reimagining (v3)',
    description: 'Full redesign of the Grows page with Kanban view, Today\'s Focus section, inline harvest recording, and mobile-friendly design.',
    category: 'ui',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    actualHours: 3,
    completedAt: timestamp(),
    notes: `Major UI/UX overhaul for the Grows page focused on grower workflow:

**New Features:**

1. **Kanban/Stage View** (Default)
   - 4 columns: Spawning, Colonizing, Fruiting, Harvesting
   - Optional "Completed" column with toggle
   - Color-coded columns by stage
   - Stage count badges

2. **Today's Focus Section**
   - Smart task generation based on grow age and stage
   - Highlights grows ready to advance (14+ days in colonization)
   - Shows grows ready to harvest (7+ days in fruiting)
   - Alerts for grows in harvesting stage
   - Priority sorting (high/medium/low)
   - Collapsible UI

3. **Inline Harvest Recording**
   - No more modal for harvests!
   - Record harvest directly on grow card
   - Quick quality selection (E/G/F/P buttons)
   - Auto-estimate dry weight (~10%)
   - Shows flush number

4. **Quick Action Buttons**
   - One-click stage advancement on each card
   - Complete button for harvesting stage
   - Contamination marking with exit survey

5. **Mobile-Friendly Design**
   - Responsive 4-column to single-column layout
   - Large touch targets
   - Scrollable stage summary bar
   - Expandable card details

6. **Flush Timeline**
   - Horizontal flush history in expanded cards
   - Shows "F1: 450g, F2: 320g" format
   - BE% calculation displayed

7. **View Mode Toggle**
   - Kanban (default), Grid, and List views
   - All views share the same GrowCard component
   - Consistent quick actions across views

**Preserved Features:**
- Create/Edit modals with full form
- Draft auto-save for new grows
- Exit survey integration
- Observation logging
- All existing data points

**Files Updated:**
- components/grows/GrowManagement.tsx (complete rewrite ~1640 lines)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-919',
    title: 'Grows Kanban Layout & Harvest Error Handling Fixes',
    description: 'Fixed cramped Kanban layout on desktop and added error handling for inline harvest form.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Two fixes for the Grows page:

**Issue 1: Cramped Kanban Layout on Desktop**
- Problem: 4-column grid forced narrow cards on laptops (~250px each)
- Solution: Changed to flexbox with horizontal scrolling
- Column widths now scale: sm:288px, md:320px, lg:340px
- Columns stack vertically on mobile, horizontal scroll on larger screens

**Issue 2: Harvest Save Errors Not Shown**
- Problem: 400 errors from Supabase caused "Unhandled Promise Rejection"
- Users saw no feedback when harvest save failed
- Solution: Added saveError state and try-catch in handleSubmitHarvest
- Error message now displays in red box above Save button
- Clear error when canceling form

**Files Updated:**
- components/grows/GrowManagement.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-920',
    title: 'Flush Save RPC Fallback for PostgREST Schema Cache Issues',
    description: 'Added RPC function fallback to bypass PostgREST schema cache errors (PGRST204) when saving harvests.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    actualHours: 0.75,
    completedAt: timestamp(),
    notes: `**Initial Symptom**: PGRST204 error when saving harvests

**Solution**: Created RPC function to bypass PostgREST cache
1. Added insert_flush() PostgreSQL function in schema
   - Uses direct SQL INSERT, bypasses PostgREST API
   - Includes RLS validation for grow ownership
   - Returns inserted record as JSONB
2. Updated addFlush() in DataContext to:
   - Try direct insert first
   - On PGRST204 error, fall back to RPC function
   - Log warnings to console for debugging

**Files Updated:**
- supabase-schema.sql (added insert_flush RPC function, v19)
- store/DataContext.tsx (added RPC fallback logic)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-921',
    title: 'Critical Fix: Flushes Table Column Name Mismatch',
    description: 'Fixed fundamental database schema drift where actual column names did not match expected names.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `**ROOT CAUSE DISCOVERED**:
The PGRST204 error was NOT a schema cache issue - the columns literally did not exist!

**Database Reality vs Code Expectation:**
| Database Had | Code Expected |
|--------------|---------------|
| wet_weight (integer) | wet_weight_g (DECIMAL) |
| dry_weight (integer) | dry_weight_g (DECIMAL) |

**Why This Happened:**
- Schema SQL uses CREATE TABLE IF NOT EXISTS
- Table already existed with old column names
- New schema with _g suffix never got applied
- PostgREST correctly reported column did not exist

**Proper Fix (v20):**
1. Added migration that:
   - Adds new columns (wet_weight_g, dry_weight_g) as DECIMAL
   - Copies data from old columns to new columns
   - Drops old columns (wet_weight, dry_weight)
2. Made transformation code defensive:
   - Handles both old and new column names
   - Falls back gracefully during migration

**Industry Best Practice Lessons:**
- Always verify actual DB schema vs expected schema
- Column naming should include units (_g for grams)
- Use proper migrations, not just CREATE IF NOT EXISTS
- Defensive code that handles schema variations gracefully

**Files Updated:**
- supabase-schema.sql (migration v20, column rename)
- store/transformations.ts (defensive column handling)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-922',
    title: 'UUID Format Fix & Global Error Handling System',
    description: 'Fixed entity_outcomes UUID format mismatch causing grow survey save failures. Implemented comprehensive user-facing error handling so users never need to check developer console.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 4,
    actualHours: 2,
    completedAt: timestamp(),
    notes: `**User Problem:**
- Grow exit survey appeared to work but silently failed to save
- Error only visible in browser developer console
- Users had no indication their survey data wasn't saved

**Root Cause - UUID Format Mismatch:**
The database expects UUID format for entity_outcomes.id but the code was generating
custom IDs like 'outcome-mjbw2cne-h7jx2' which caused Postgres error 22P02.

**Fix #1 - Database ID Generation:**
- Removed custom ID generation in saveEntityOutcome() and saveContaminationDetails()
- Let Postgres generate UUIDs via uuid_generate_v4() (schema already has DEFAULT)
- Use .select().single() to retrieve the DB-generated UUID after insert
- Same pattern already used correctly in addCulture(), addGrow(), etc.

**Fix #2 - Global Error Handler:**
- Created GlobalErrorHandler component that:
  - Listens for 'mycolab:error' custom events
  - Displays user-friendly toast notifications
  - Logs errors for potential bug reporting
  - Catches unhandled promise rejections
  - Stores error history in localStorage (last 50 errors)

**Fix #3 - Error Boundary:**
- Created ErrorBoundary component that:
  - Catches React component crashes
  - Shows graceful fallback UI instead of white screen
  - Allows user feedback submission
  - Provides "Try Again", "Reload", "Go Home" actions
  - Shows optional technical details for debugging

**Industry Best Practices Applied:**
1. Database as authority for ID generation (UUID)
2. Never require users to check dev console for errors
3. User-friendly error messages (not raw error codes)
4. Error logging for support/debugging without user involvement
5. Graceful degradation (fallback to local ID if DB save fails)
6. Error boundary prevents full app crash

**Files Created:**
- components/errors/GlobalErrorHandler.tsx
- components/errors/ErrorBoundary.tsx
- components/errors/index.ts

**Files Updated:**
- store/DataContext.tsx (UUID fix, error events)
- App.tsx (added ErrorBoundary, GlobalErrorHandler)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 31: PUBLIC SHARING & BATCH PASSPORTS
  // Trust-building features for sellers and customer transparency
  // =============================================================================
  {
    id: 'dev-1000',
    title: 'Share Token System',
    description: 'Secure token-based sharing for public/anonymous access to grows, cultures, and batches. Opaque tokens with expiration, revocation, and rate limiting.',
    category: 'core',
    status: 'planned',
    priority: 'critical',
    estimatedHours: 12,
    notes: 'Foundation for all public sharing features. Uses opaque tokens per API security best practices. See docs/PUBLIC_SHARING_IMPLEMENTATION_PLAN.md',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1001',
    title: 'Batch Passport / Digital Product Passport',
    description: 'Create shareable "passports" for products following EU DPP standards. Includes unique passport code, QR generation, and frozen lineage snapshot.',
    category: 'core',
    status: 'planned',
    priority: 'critical',
    estimatedHours: 16,
    dependencies: ['dev-1000'],
    notes: 'Trust-builder for Etsy sellers and co-ops. Customer scans QR, sees full grow story.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1002',
    title: 'Field Redaction System',
    description: 'Allow owners to control which fields are visible in public views. Preset templates (Customer, Auditor, Minimal) plus custom configurations.',
    category: 'core',
    status: 'planned',
    priority: 'critical',
    estimatedHours: 10,
    dependencies: ['dev-1001'],
    notes: 'Redact prices, addresses, failures, personal notes. Essential for privacy-conscious sellers.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1003',
    title: 'Public Passport Viewer',
    description: 'Anonymous public page for viewing batch passports. Beautiful, mobile-first design showing grow story, lineage, yields, and photos.',
    category: 'ui',
    status: 'planned',
    priority: 'critical',
    estimatedHours: 14,
    dependencies: ['dev-1002'],
    notes: 'The customer-facing view. Clean, professional, builds trust.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1004',
    title: 'Passport QR Code Labels',
    description: 'Generate printable labels with passport QR codes for products. Integrate with existing label system.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 6,
    dependencies: ['dev-1001', 'dev-091'],
    notes: 'QR on syringe labels, bag labels, etc. Links to passport page.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1005',
    title: 'Passport Analytics Dashboard',
    description: 'Track passport views, engagement, geographic distribution. Anonymized analytics for sellers.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 8,
    dependencies: ['dev-1003'],
    notes: 'See how many customers scanned your QR codes.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1006',
    title: 'Role-Based View Access',
    description: 'Implement owner/auditor/customer role hierarchy for viewing shared content. Different permission levels see different data.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-1000', 'dev-1002'],
    notes: 'Auditors see costs and failures. Customers see clean product view.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1007',
    title: 'Lineage Snapshot System',
    description: 'When creating a passport, freeze the current lineage tree as immutable snapshot. Prevents post-hoc lineage modifications.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-014', 'dev-1001'],
    notes: 'Customer sees lineage as it was when passport was created.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1008',
    title: 'Species Library Citation System',
    description: 'Add source citations to species/strain data. Links to books, papers, videos, forum threads. User-contributed with moderation.',
    category: 'data',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 12,
    dependencies: ['dev-020'],
    notes: 'Every data point cited with direct links to sources.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1009',
    title: 'Strain Mastery & Reputation System',
    description: 'Track verified successful grows per user. Users can mark "I\'ve successfully grown this strain" on profiles. Builds seller credibility.',
    category: 'enhancement',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 14,
    dependencies: ['dev-1001', 'dev-021'],
    notes: 'Buyers can see which strains a grower has real experience with.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1010',
    title: 'Weather API Integration',
    description: 'Connect to weather API to log ambient conditions. Correlate with grow outcomes. Optional for outdoor/greenhouse grows.',
    category: 'integration',
    status: 'planned',
    priority: 'low',
    estimatedHours: 10,
    dependencies: ['dev-460'],
    notes: 'Show how that freak rainstorm affected your flush.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1011',
    title: 'Yield-Per-Jar Auto-Stats',
    description: 'Auto-calculate and display yield efficiency metrics. Bragging stats for sellers: grams per quart jar, BE% rankings.',
    category: 'enhancement',
    status: 'planned',
    priority: 'low',
    estimatedHours: 6,
    dependencies: ['dev-1001'],
    notes: 'Fun stats for enthusiasts and marketing.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 32: ACTIVITY & AUDIT IMPROVEMENTS
  // User feedback from competitor apps (MycoFile)
  // =============================================================================
  {
    id: 'dev-1020',
    title: 'Activity Log Editing',
    description: 'Allow users to edit or delete accidental activity log entries. Maintains audit trail of edits for compliance. Popular user request from competitor apps.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 6,
    notes: 'MycoFile users consistently complain about this. Keep original + edit history for audit.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1021',
    title: 'Full Audit Trail System',
    description: 'Track every change to every entity with before/after snapshots. User, timestamp, and reason for each change. Export for compliance.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 14,
    dependencies: ['dev-183'],
    notes: 'Foundation for lab notebook compliance and GPSR traceability.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 33: BATCH & BULK OPERATIONS
  // Essential for users with 100+ items
  // =============================================================================
  {
    id: 'dev-1030',
    title: 'Batch Grouping System',
    description: 'Group multiple items into a batch (e.g., "LC Transfer Batch 2025-12-15"). Track outcomes at batch level. Identify if one jar from batch contaminates.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 12,
    dependencies: ['dev-502'],
    notes: 'Essential for contamination root cause analysis across related items.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1031',
    title: 'Bulk Edit Operations',
    description: 'Select multiple items and edit common fields at once. Bulk status change, bulk location move, bulk archive.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-142'],
    notes: 'Users with 100+ items need this for practical management.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1032',
    title: 'Clone Successful Grow',
    description: 'One-click duplicate a completed grow setup. Copies strain, substrate, container, conditions as template for new grow.',
    category: 'enhancement',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-402'],
    notes: 'Popular garden app feature - repeat what works.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 34: COMMERCIAL & SELLER FEATURES
  // Etsy, farmers markets, co-ops
  // =============================================================================
  {
    id: 'dev-1040',
    title: 'Inventory Depletion Tracking',
    description: 'Track when products are sold/transferred out. "Sold 5 syringes from LC-042, 45 remaining". Links to passports.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-1001'],
    notes: 'Essential for sellers tracking what they sold from each batch.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1041',
    title: 'Certificate of Authenticity Generator',
    description: 'Generate PDF certificates for products. Includes passport link, lineage summary, verification code. Professional format for markets.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 10,
    dependencies: ['dev-1001', 'dev-451'],
    notes: 'Farmers market and Etsy sellers want this for premium products.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1042',
    title: 'GPSR Compliance Fields',
    description: 'Add fields required for EU General Product Safety Regulation: batch number, serial number, country of origin, responsible person contact.',
    category: 'data',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    notes: 'Required for selling products in EU as of 2024.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1043',
    title: 'Vendor/Lot Number Tracking',
    description: 'Track vendor lot numbers for spore syringes, cultures, and supplies. Full chain-of-custody from vendor to final product.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    notes: 'Complete traceability from spore source to harvest.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 35: PHOTO & VISUAL FEATURES
  // High user demand from garden apps
  // =============================================================================
  {
    id: 'dev-1050',
    title: 'Photo Progress Timeline',
    description: 'Visual timeline showing photos in chronological order. Compare day 1 vs day 30. Animated progress view option.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-060', 'dev-061'],
    notes: 'One of the most requested features in plant/garden apps.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1051',
    title: 'AI Contamination Photo Analysis',
    description: 'Upload photo, get AI assessment of contamination type and severity. Uses trained model for trichoderma, cobweb, bacterial, etc.',
    category: 'integration',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 20,
    dependencies: ['dev-201', 'dev-060'],
    notes: 'Build on contamination knowledge base. Could use Claude Vision or custom model.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1052',
    title: 'Quick Photo Capture',
    description: 'One-tap photo capture with auto-timestamp and entity linking. Camera shortcut from any grow/culture detail view.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-060'],
    notes: 'Mobile-first convenience feature.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 36: COST & BUSINESS ANALYTICS
  // For commercial growers
  // =============================================================================
  {
    id: 'dev-1058',
    title: 'Consumable Cost Tracking Foundation',
    description: 'Track proportional costs when using consumables. When you use 1ml of a 10ml syringe that cost $20, it calculates $2 consumed cost. Equipment vs consumable distinction prevents lab equipment from counting toward grow costs.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Foundational cost tracking system:

**New Type Fields:**
- InventoryUsage: unitCostAtUsage, consumedCost (calculated at time of use)
- InventoryItem: assetType (consumable/equipment/durable/culture_source), purchasePrice, depreciationYears, currentValue, includeInGrowCost
- Culture: purchaseCost, productionCost, parentCultureCost, volumeUsed, costPerMl
- Grow: sourceCultureCost, inventoryCost, laborCost, overheadCost, totalCost, revenue, profit, costPerGramWet, costPerGramDry

**Cost Calculation Helpers:**
- calculateCultureCostPerMl(): Calculate cost per ml for proportional usage
- calculateSourceCultureCost(): Calculate cost when using portion of a culture
- calculateGrowInventoryCost(): Sum all inventory costs for a grow
- recalculateGrowCosts(): Update all cost fields for a grow
- getLabValuation(): Get total lab value broken down by asset type

**Asset Types:**
- consumable: Flows to grow costs (substrate, grain, etc.)
- equipment: Lab valuation only, NOT grow costs (tables, rugs, scales)
- durable: Reusable items with partial depreciation (monotubs, jars)
- culture_source: Purchased cultures, cost tracked per-use (LC syringes)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1059',
    title: 'Data Correction Outcome Codes',
    description: 'New abort reasons: "Bad Data Entry" and "Starting Over" for cases where data is invalid and needs to be discarded. These are marked as neutral outcomes and can be filtered from analytics.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 1,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `New outcome codes for data correction:

**GrowOutcomeCode additions:**
- aborted_bad_data: Data entry error, record invalid
- aborted_restart: Starting over, discarding old data

**CultureOutcomeCode additions:**
- aborted_bad_data: Data entry error, record invalid
- aborted_restart: Starting over, discarding old data

**InventoryOutcomeCode additions:**
- aborted_bad_data: Data entry error, record invalid
- aborted_restart: Starting over, discarding old data

All are categorized as 'neutral' to not affect failure/success analytics.`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1060',
    title: 'Cost Per Gram Calculator',
    description: 'True cost analysis including: substrate, spawn, utilities, labor estimate, overhead. Calculate $/gram for each grow.',
    category: 'core',
    status: 'in_progress',
    priority: 'medium',
    estimatedHours: 10,
    dependencies: ['dev-1058'],
    notes: 'Foundation complete (dev-1058). Needs UI components for manual labor/overhead entry and cost display.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1061',
    title: 'Profitability Dashboard',
    description: 'Track revenue vs costs per strain, per month, per grow method. Identify most profitable strains and techniques.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 12,
    dependencies: ['dev-1060', 'dev-1040'],
    notes: 'Essential for commercial operations.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1062',
    title: 'Lab Valuation Summary',
    description: 'Show total value of lab assets: equipment, consumables, durables. Track projected sales value of active grows. Full business accounting view.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 8,
    dependencies: ['dev-1058'],
    notes: 'getLabValuation() helper already implemented. Needs UI dashboard.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1063',
    title: 'Financial Data Export',
    description: 'Export cost/revenue data to CSV, JSON, and PDF. Include grows, cultures, inventory, purchases. Support for accounting software import.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 10,
    dependencies: ['dev-1058', 'dev-453'],
    notes: 'Part of broader export feature (dev-453). Add financial-specific reports.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 37: OFFLINE & SYNC
  // Critical for labs with poor connectivity
  // =============================================================================
  {
    id: 'dev-1070',
    title: 'Enhanced Offline Mode',
    description: 'Full functionality when offline. Queue changes for sync when connection restored. Conflict resolution for simultaneous edits.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 20,
    dependencies: ['dev-131'],
    notes: 'Labs/grow rooms often have poor connectivity. Critical for reliability.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1071',
    title: 'Real-Time Multi-Device Sync',
    description: 'Changes sync instantly across all logged-in devices. Supabase real-time subscriptions. Show sync status indicator.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 12,
    dependencies: ['dev-120'],
    notes: 'Users switch between phone and computer frequently.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 38: LAB SPACES REDESIGN
  // Chamber-centric location management with environmental presets
  // =============================================================================
  {
    id: 'dev-1080',
    title: 'Lab Spaces - Unified Location Management',
    description: 'Consolidated Lab Layout and Space Tracker into a single "Lab Spaces" page. Combines location tree management with occupancy tracking in one unified interface.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Major UI consolidation for location management:

**What Changed:**
- Combined Lab Layout (CRUD) + Space Tracker (visualization) into single page
- New unified "Lab Spaces" nav item replaces separate entries
- Legacy routes (/lab-mapping, /occupancy) redirect to /lab-spaces
- Dual view modes: Tree view and Overview dashboard

**Key Features:**
- Tree view with inline occupancy indicators (culture/grow counts)
- Dashboard overview with environment type breakdown
- Click-to-select shows detailed location panel
- Quick navigation to cultures/grows from location details

**Benefits:**
- No more switching between pages to manage vs view occupancy
- Single source of truth for lab locations
- Cleaner navigation (2 items → 1 item)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1081',
    title: 'Environmental Chamber Presets',
    description: 'One-click presets for common controlled environments. Select "Incubator", "Fruiting Chamber", "Cold Storage", etc. and auto-fill temperature/humidity targets.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 2,
    completedAt: timestamp(),
    dependencies: ['dev-1080'],
    notes: `Chamber presets for quick setup:

**Available Presets:**
- Incubator (75-82°F, 60-80% RH) - Warm colonization
- Fruiting Chamber (65-75°F, 85-95% RH) - High humidity fruiting
- Cold Storage (35-45°F, 30-50% RH) - Fridge/refrigeration
- Martha Tent (68-75°F, 90-99% RH) - Budget fruiting
- Still Air Box - Sterile inoculation workspace
- Flow Hood Area - Laminar flow workspace
- Drying Chamber (95-165°F, 10-30% RH) - Dehydrator
- Monotub (68-76°F, 85-95% RH) - Self-contained fruiting
- Outdoor Area - Garden/log growing

**Features:**
- Semantic icons for each environment type
- Auto-detect environment type from temp/humidity ranges
- Cold storage indicator (snowflake) for locations < 50°F
- Each preset has appropriate default room purposes`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1082',
    title: 'Chamber-Centric Location Hierarchy',
    description: 'Renamed and reorganized location levels to be more intuitive for cultivators. "Zone" becomes "Environment/Chamber", "Rack" becomes "Equipment".',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    dependencies: ['dev-1080'],
    notes: `Location type hierarchy redesign:

**New Labels (dropdown):**
- Facility (Building/Property)
- Room
- Environment / Chamber (for controlled spaces like fridges, incubators)
- Equipment (Rack/Chamber/Box within a room)
- Shelf
- Position / Slot

**Semantic Meaning:**
- Users now understand "Environment" = controlled temperature/humidity space
- "Equipment" makes more sense than "Rack" for a fridge or martha tent
- Help text explains appropriate usage for each level`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 39: USER FEEDBACK & QUALITY TRACKING (Suggested by Leia)
  // Grow quality ratings, vendor assessment, community features
  // =============================================================================
  {
    id: 'dev-1100',
    title: 'Harvest Quality Ratings',
    description: 'Rate harvests on multiple quality dimensions: potency, bruising, taste (for gourmet), appearance. Save data points for analytics.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    notes: 'Suggested by Leia. Captures subjective quality data beyond just weight. Useful for strain selection and grow method comparison.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1101',
    title: 'Grow Experience Reviews',
    description: 'After completing a grow, prompt for a review: overall rating, what went well, what to improve. "Mark as Grown" workflow with structured feedback.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-911'],
    notes: 'Suggested by Leia. Builds on exit survey system. Captures qualitative experience data for learning.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1102',
    title: 'Vendor Assessment & Consistency Tracking',
    description: 'Rate vendors/suppliers on consistency, quality, shipping speed. Track which vendors have been inconsistent. Flag problematic suppliers.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    notes: 'Suggested by Leia. Essential for identifying unreliable suppliers. Link to contamination tracking - did bad vendor supplies cause issues?',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1103',
    title: 'Non-Contamination Abort Reasons',
    description: 'Expanded abort reasons for grows: vendor issues (bad genetics, contaminated source), environment failure (equipment malfunction, power outage), stalled growth, user error. Not all failures are contamination.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 6,
    dependencies: ['dev-911'],
    notes: 'Suggested by Leia. Current system focuses on contamination - need broader failure categorization.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1104',
    title: 'Dual Rating System (AI vs Grower)',
    description: 'Two-score system like Rotten Tomatoes: MycoLab AI score based on objective metrics (BE%, time, contamination rate) vs Grower score based on subjective experience.',
    category: 'enhancement',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 12,
    dependencies: ['dev-1100', 'dev-1101'],
    notes: 'Suggested by Leia. Inspired by "critics vs audience" scores. AI analyzes data, grower rates experience. Both valuable.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1105',
    title: 'Community Comments & Likes',
    description: 'Allow comments on shared grows/strains with likes and "helpful" voting. Filter/sort by most helpful. Build community knowledge base.',
    category: 'enhancement',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 16,
    dependencies: ['dev-1000', 'dev-1003'],
    notes: 'Suggested by Leia. Social features for community building. Requires public sharing foundation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1106',
    title: 'Grow Duration Estimation from Feedback',
    description: 'Aggregate user feedback and comments to estimate accurate grow durations per strain. "Based on 47 grows, Golden Teacher typically takes 28-35 days to first harvest."',
    category: 'enhancement',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 8,
    dependencies: ['dev-1105', 'dev-180'],
    notes: 'Suggested by Leia. Use community data to improve predictions. Statistical analysis of actual grow times.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1107',
    title: 'Photo Widget for Grows',
    description: 'Photo gallery widget on grow detail pages. Quick photo upload, timeline view, before/after comparisons. Essential visual documentation.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-800', 'dev-1050'],
    notes: 'Suggested by Leia. Builds on photo upload infrastructure. Visual progress tracking is highly requested.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1108',
    title: 'Avery Sheet Label Templates',
    description: 'Pre-configured label templates for standard Avery sheet sizes. Print multiple labels per sheet for home printers. Common sizes: 5160, 5163, 5164.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-091'],
    notes: 'Suggested by Leia. Current system supports thermal printers - add standard inkjet/laser Avery sheets.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 40: MYCELIUM NAVIGATION SYSTEM
  // Organic, mushroom-themed navigation redesign
  // =============================================================================
  {
    id: 'dev-1200',
    title: 'Mycelium Navigation System - Complete Redesign',
    description: 'Unique, mushroom-themed navigation system inspired by fungal networks. Three main components: MyceliumHub (network-style full navigation), SporeMenu (radial FAB), GrowthTrail (organic breadcrumbs). REVERTED - Components too intrusive, poor mobile UX. CSS animations preserved for future use.',
    category: 'ui',
    status: 'cancelled',
    priority: 'high',
    estimatedHours: 20,
    actualHours: 11,
    completedAt: timestamp(),
    notes: `Mycelium Navigation System - REVERTED:

**Why Reverted:**
- MyceliumHub took up too much screen space
- SporeMenu (mushroom FAB) expanded beyond browser window on desktop
- Breadcrumb trails didn't render properly on mobile
- Original navigation sidebar was not replaced, causing confusion
- User feedback: "not the kind of creativity I was expecting"

**What Was Preserved:**
- CSS animations in tailwind.config.js and globals.css
- Animation keyframes for future organic UI enhancements
- Component files remain for potential future refinement

**Original Implementation:

**Vision:**
- Navigation inspired by the organic, interconnected nature of mycelial networks
- Pages as "fruiting bodies" connected by mycelial threads
- Bioluminescent glow effects for active states
- Organic animations throughout

**MyceliumHub Component:**
- Full-screen network visualization overlay
- Category clusters arranged radially
- Connection threads showing page relationships
- Search integration with visual filtering
- Keyboard shortcut: Cmd/Ctrl + .

**SporeMenu Component:**
- Radial quick-access FAB (replaces standard FAB)
- Mushroom cap button that "disperses spores" when opened
- Quick access to most-used pages (Dashboard, Cultures, Grows, etc.)
- Touch-friendly for mobile

**GrowthTrail Component:**
- Organic breadcrumb navigation
- Mycelium-thread styled connectors
- Shows related pages based on connections
- Category indicator with glow effect
- Compact version for mobile

**Organic Animations:**
- bioluminescence: Pulsing glow effect
- sporeDisperse: Radial expansion animation
- drawThread: SVG path animation for connections
- fruitingEmergence: Bounce-in for nodes
- hyphalGrowth: Clip-path expansion
- threadPulse: Subtle connection pulsing

**Files Created:**
- components/navigation/types.ts
- components/navigation/navData.ts
- components/navigation/MyceliumHub.tsx
- components/navigation/SporeMenu.tsx
- components/navigation/GrowthTrail.tsx
- components/navigation/index.ts

**Files Updated:**
- App.tsx (integration, navigation history, keyboard shortcuts)
- styles/globals.css (new animation keyframes)
- tailwind.config.js (animation extensions)

**Accessibility:**
- Full keyboard navigation
- Screen reader labels
- Focus management
- Reduced motion support via CSS
- ARIA attributes throughout`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1201',
    title: 'Fix Numeric Input Backspace Behavior',
    description: 'Fixed bug where backspacing in numeric input fields would leave a trailing zero, causing values like "01713" when typing a new number. Created reusable NumericInput component.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 2,
    completedAt: timestamp(),
    notes: `Numeric input backspace fix:

**Problem:**
- In all numeric inputs (spawn weight, substrate weight, cost, etc.)
- Backspacing to clear field resulted in "0" remaining
- Typing new number appended to "0", creating "01713" instead of "1713"
- Had to manually select and overwrite the zero

**Root Cause:**
- Pattern \`parseInt(e.target.value) || 0\` converted empty string to 0
- \`parseInt('')\` returns NaN, \`NaN || 0\` returns 0
- Controlled input then displayed "0", new keystrokes appended

**Solution:**
Created reusable NumericInput component (components/common/NumericInput.tsx):
- Tracks display value as string internally
- Allows empty string state (no forced "0")
- Converts to number on onChange/onBlur
- Supports min/max, step, allowEmpty, defaultValue props
- Uses type="text" with inputMode="decimal" for better mobile UX

**Components Updated:**
- GrowManagement.tsx (spawn weight, substrate weight, count, cost, colonization %)
- CommandCenter.tsx (harvest estimate, wet/dry weight, mushroom count)
- CultureManagement.tsx (transfer quantity)
- CultureWizard.tsx (volume, fill volume, cost)
- HarvestWorkflow.tsx (WeightInput component, mushroom count)
- ContainerForm.tsx (volume, dimensions)
- InventoryItemForm.tsx (unit cost, reorder point, reorder qty)
- RecipeForm.tsx (yield amount, prep time, sterilization time/psi)
- StrainForm.tsx (added import)

**Files Created:**
- components/common/NumericInput.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1202',
    title: 'Session/Version Refresh Detection',
    description: 'Automatically detect when the app has been rebuilt and prompt users to refresh their browser. Shows blocking modal to ensure clean session after deployments.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 2,
    completedAt: timestamp(),
    notes: `Version refresh detection system:

**Problem:**
- After app rebuilds/redeployments, Supabase sessions could become stale
- Users had to manually "triple escape" to log out on desktop
- No equivalent workaround on mobile
- Stale sessions caused data sync issues

**Solution:**
Created VersionContext (lib/VersionContext.tsx):
- Uses Vite build-time constants (__BUILD_TIME__, __APP_VERSION__)
- Stores last known build time in localStorage
- Compares on app load to detect version mismatch
- Shows blocking modal when new version detected

**VersionUpdateModal Features:**
- Clear messaging about new version availability
- "Refresh Now" button (simple window.location.reload)
- "Clear Session & Refresh" button (clears all localStorage first)
- Blocking overlay prevents interaction until refreshed
- Works on both desktop and mobile

**Files Created:**
- lib/VersionContext.tsx

**Files Updated:**
- App.tsx (VersionProvider wrapping, modal integration)
- vite.config.ts (build-time constants injection)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1203',
    title: 'Weight Input with Imperial/Metric Switching',
    description: 'Smart weight input component that supports metric (g, kg) and imperial (oz, lb) units. Users can enter weights in any format and the system stores everything in grams internally.',
    category: 'ux',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Imperial/metric weight system:

**Problem:**
- All weight inputs were grams-only
- Users comfortable with oz/lb had to convert manually
- No flexibility for different regional preferences

**Solution:**
Created comprehensive weight utilities (utils/weight.ts):
- Type definitions: WeightUnit ('g'|'kg'|'oz'|'lb'), WeightSystem ('metric'|'imperial')
- Conversion functions: toGrams(), fromGrams(), convertWeight()
- Smart parsing: parseWeight() handles various formats:
  - Plain numbers with default unit
  - "500g", "1.5kg", "8oz", "2lb"
  - Compound imperial: "1 lb 8 oz"
- Formatting: formatWeight(), formatWeightAuto(), formatWeightCompound()
- Auto-selects best unit (g vs kg, oz vs lb) based on value
- Conversion hints for opposite system

**WeightInput Component (components/common/WeightInput.tsx):**
- Unit dropdown with g/kg/oz/lb options
- Remembers last selected unit in localStorage
- Shows conversion hint below input
- Compact mode for tight spaces
- Always stores/returns grams internally

**Forms Updated:**
- GrowManagement.tsx (spawn weight, substrate weight, wet/dry weight)
- HarvestWorkflow.tsx (wet/dry weight)
- CommandCenter.tsx (wet/dry weight in harvest form)

**Files Created:**
- utils/weight.ts
- components/common/WeightInput.tsx

**Files Updated:**
- utils/index.ts (export weight utilities)
- GrowManagement.tsx, HarvestWorkflow.tsx, CommandCenter.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 41: EMAIL/SMS NOTIFICATION SYSTEM
  // External notification channels for event alerts
  // =============================================================================
  {
    id: 'dev-1300',
    title: 'Email/SMS Event Notification System',
    description: 'Comprehensive email and SMS notification system for alerting users about important events. Configurable per-event preferences, quiet hours, rate limiting, and delivery tracking.',
    category: 'core',
    status: 'in_progress',
    priority: 'high',
    estimatedHours: 20,
    notes: `Email/SMS Notification System:

**Database Schema:**
- notification_channels: Store email/SMS configuration per user with verification status
- notification_event_preferences: Per-event channel preferences (which events trigger email/SMS)
- notification_delivery_log: Track all sent notifications with status and error handling
- notification_templates: Customizable message templates with placeholder support
- Extended user_settings with email/SMS fields and quiet hours

**TypeScript Types:**
- NotificationChannelType: 'email' | 'sms' | 'push'
- NotificationDeliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed'
- NotificationPriority: 'low' | 'normal' | 'high' | 'urgent'
- NotificationChannel, NotificationEventPreference, NotificationDeliveryLog, NotificationTemplate interfaces

**Service Layer (NotificationService.ts):**
- sendNotification(): Main entry point for sending notifications
- sendEmail(), sendSms(): Channel-specific delivery via Supabase Edge Functions
- isInQuietHours(): Respects user's quiet hours settings
- getEventPreferences(): Fetches user's per-event channel preferences
- logDelivery(): Records all delivery attempts for audit trail
- Convenience functions: notifyContamination(), notifyHarvestReady(), notifyStageTransition(), notifyLowInventory(), notifyCultureExpiring(), notifyLcAge()

**UI Component (Settings > Preferences):**
- Email Notifications toggle with email input and verification button
- SMS Notifications toggle with phone input and verification button
- Quiet Hours configuration (start/end times with timezone display)
- Event category toggles showing which events trigger which channels
- Urgent event badges for contamination alerts

**Event Categories:**
- contamination: Immediate alert (URGENT)
- harvest_ready: When grows are ready for harvest
- stage_transition: When grows should advance stages
- low_inventory: When supplies fall below reorder point
- culture_expiring: When cultures approach expiration
- lc_age: When liquid cultures are getting old

**Features:**
- Email notifications via Supabase Edge Functions (SendGrid/Resend)
- SMS notifications via Supabase Edge Functions (Twilio)
- Quiet hours support (don't disturb between configurable times)
- Rate limiting (max per hour/day)
- SMS reserved for urgent alerts by default
- Verification flow for email and phone numbers
- Full delivery tracking with error logging

**Security:**
- RLS policies for all notification tables
- Users can only see/modify their own notification settings
- Admins can view all delivery logs
- Templates are system-managed (only admins can modify)

**UI Implementation (Completed):**
- Verification modal with code entry flow
- Functional Verify buttons for email and SMS
- Event preference toggles that visually indicate enabled/disabled state
- Admin "Email/SMS Config" tab with:
  - Service status cards (configured/not configured)
  - Test notification sending
  - Environment variable reference guide
  - Setup instructions with external documentation links

**Netlify Functions (Completed):**
- send-notification-email.ts - Resend/SendGrid email delivery with fallback
- send-notification-sms.ts - Twilio SMS delivery
- send-verification.ts - Email/SMS verification code sending (Resend/SendGrid)
- verify-code.ts - Verification code validation
- check-notification-config.ts - Service status checking (detects Resend/SendGrid)
- send-test-notification.ts - Test email/SMS sending (Resend/SendGrid)

**Environment Variables (Netlify Dashboard):**
- RESEND_API_KEY - For email notifications (primary, recommended)
- SENDGRID_API_KEY - For email notifications (fallback if Resend not configured)
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER - For SMS
- SUPABASE_URL, SUPABASE_SERVICE_KEY - For verification code storage
- FROM_EMAIL, FROM_NAME - Optional email sender configuration

**Email Provider Logic:**
- Auto-detects which API keys are configured
- Tries Resend first if RESEND_API_KEY is set
- Falls back to SendGrid if Resend fails or isn't configured
- Returns clear error messages if no provider is configured

**Database Schema:**
- Added verification_codes table with RLS policies

**Next Steps:**
- Configure environment variables in Netlify dashboard
- Integrate notification triggers in DataContext operations
- Add notification history view in Settings`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1301',
    title: 'pg_cron Scheduled Notification System',
    description: 'Background job scheduling using PostgreSQL pg_cron extension. Automatically generates notifications for expiring cultures, stage transitions, low inventory, and harvest reminders even when users are not logged in.',
    category: 'core',
    status: 'in_progress',
    priority: 'high',
    notes: `pg_cron Background Notification System:

**Notification Queue Table:**
- notification_queue: Central queue for all pending notifications
- Status tracking: pending → queued → sent/failed/cancelled
- Priority levels (1-10, 1 = highest)
- Automatic expiration (24 hours default)
- Deduplication to prevent repeat notifications

**Notification Check Functions:**
- check_culture_expirations(): Cultures expiring within 7 days
- check_grow_stage_transitions(): Grows overdue for stage advancement
- check_low_inventory(): Items at or below reorder point
- check_harvest_ready(): Grows in harvesting stage
- process_scheduled_notifications(): Master function running all checks

**Cron Job Configuration:**
- mycolab-notification-check: Runs every 15 minutes
- mycolab-queue-cleanup: Daily cleanup at 3 AM

**Setup Process:**
1. Enable pg_cron extension in Supabase Dashboard
2. Run schema migration (creates tables and functions)
3. Execute: SELECT setup_notification_cron_jobs()
4. Verify with: SELECT * FROM cron.job

**Helper Functions:**
- trigger_notification_check(): Manual testing
- get_pending_notifications(): View queued notifications
- setup_notification_cron_jobs(): Idempotent job setup

**RLS Policies:**
- Users can view their own queued notifications
- Service role can insert/update for background processing
- Admins have full access

**Integration Points:**
- Respects notification_event_preferences per user
- Uses notification_channels for delivery routing
- Logs to notification_delivery_log for audit trail`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1204',
    title: 'Fix Data Not Loading After Email Login',
    description: 'Fixed bug where data would not display after logging in with email/password, but worked correctly with Google OAuth. Root cause was DataContext not listening to auth state changes.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `Data loading bug fix for email authentication:

**Problem:**
- When logging in with Google OAuth, data loaded correctly (due to page redirect/reload)
- When logging in with email/password, data would not display
- User had to log out and back in with Google to see their data
- Issue appeared after version refresh detection was added

**Root Cause:**
- DataContext loaded data once on mount via useEffect
- OAuth login triggers a page redirect, so DataContext re-initializes with the new session
- Email login changes auth state without page reload, so DataContext never knew to reload data

**Solution:**
Added auth state listener in DataContext that:
1. Subscribes to supabase.auth.onAuthStateChange
2. On SIGNED_IN event (non-anonymous), reloads all data from Supabase
3. On TOKEN_REFRESHED event, refreshes data if last sync was >5 seconds ago (debounce)

**Files Updated:**
- store/DataContext.tsx (added onAuthStateChange listener after initialization useEffect)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1205',
    title: 'Netlify Credit Optimization',
    description: 'Optimized Netlify configuration to reduce credit usage through smart build skipping, caching headers, and build optimizations.',
    category: 'enhancement',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 1,
    actualHours: 0.5,
    completedAt: timestamp(),
    notes: `Netlify credit optimization to reduce hosting costs:

**Build Minute Savings:**
- Smart build skipping: Only build when Web App files actually change (was building on every commit)
- Disabled deploy previews for branches (saves build minutes per PR)
- Disabled branch deploys (only main branch deploys to production)

**Bandwidth Savings:**
- Aggressive caching for static assets (1 year, immutable)
- Cache fonts with long expiration
- Proper cache headers for HTML (no-cache to ensure updates propagate)

**Build Speed Improvements:**
- Disabled source maps in production (smaller bundles, faster builds)
- Code splitting: vendor chunk (react, react-dom, react-router-dom), charts chunk (recharts)
- Better caching of unchanged chunks

**Files Updated:**
- netlify.toml (build skipping, caching headers, deploy contexts)
- Web App/vite.config.ts (source maps disabled, code splitting)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1206',
    title: 'Grows Table Schema Fix - Missing Columns',
    description: 'Fixed database schema for grows table which was missing 15+ columns expected by the application, causing 400 errors when creating new grows.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 1,
    actualHours: 0.75,
    completedAt: timestamp(),
    notes: `Database schema bug fix for grow creation:

**Problem:**
- Creating new grows in GrowManagement threw 400 errors
- Console showed "Failed to load resource: the server responded with a status of 400"
- Users unable to create or save grow data

**Root Cause:**
- grows table in supabase-schema.sql had an old schema structure
- Application transformation functions (transformGrowToDb) expected different column names
- Missing columns: status, current_stage, spawn_type, spawn_weight, substrate_weight, spawn_rate, spawned_at, colonization_started_at, fruiting_started_at, completed_at, target_temp_colonization, target_temp_fruiting, target_humidity, total_yield, estimated_cost
- Wrong column names: stage vs current_stage, spawn_date vs spawned_at, substrate_weight_g vs substrate_weight

**Solution:**
- Added idempotent migration block to supabase-schema.sql
- Creates all missing columns with proper defaults
- Migrates data from old columns (stage -> current_stage, spawn_date -> spawned_at, etc.)
- Handles 'colonizing' -> 'colonization' stage name difference
- Added CHECK constraints for current_stage and status values

**Files Updated:**
- supabase-schema.sql (added grows table migration block after table creation)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1207',
    title: 'Financial Dashboard',
    description: 'Comprehensive financial dashboard with lab valuation, cost analysis, profitability metrics, and CSV/JSON export functionality.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    completedAt: timestamp(),
    notes: `Financial Dashboard implementation:

**Features:**
- Lab Valuation Summary: Equipment, consumables, durables, culture values
- Cost Analysis: Breakdown by category, cost per grow by strain
- Profitability: Margin analysis, revenue vs costs by strain
- Data Export: JSON and CSV download functionality

**Components Added:**
- FinancialDashboard.tsx with tabbed interface (Overview, Cost Analysis, Profitability, Export)
- Added to analytics navigation group
- Route: /financial

**Integration:**
- Uses existing cost fields in Grow, Culture, InventoryItem
- Calculates derived metrics (margins, cost per gram)
- Export includes all financial data with proper formatting`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1208',
    title: 'Misting and FAE Event Types',
    description: 'Added misting and fresh air exchange (FAE) as dedicated event types for grow observations and lab events.',
    category: 'data',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 0.5,
    completedAt: timestamp(),
    notes: `Added misting and FAE event types:

**Changes:**
- GrowObservation.type: Added 'misting' and 'fae' options
- EventLogger EventCategory: Added 'misting' and 'fae' categories
- GrowManagement dropdown: Added misting, FAE, and photo options

**Purpose:**
- Track misting frequency for fruiting conditions
- Log FAE (fresh air exchange) events
- Better data for environmental correlation analysis`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1209',
    title: 'Proactive Version Notifications',
    description: 'App now checks for updates while running, notifying users of new versions without waiting for them to take action.',
    category: 'enhancement',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 1,
    completedAt: timestamp(),
    notes: `Proactive version checking:

**Previous Behavior:**
- Version check only happened on page load
- Users with long-running sessions wouldn't know about updates

**New Behavior:**
- Polls server every 5 minutes (in production only)
- Also checks when tab regains focus (visibility change)
- Uses HEAD requests with cache-busting to detect server changes
- Compares ETag/Last-Modified headers to detect new deployments
- Shows update modal when new version detected

**Implementation:**
- Added polling useEffect in VersionContext
- Uses sessionStorage to track server timestamp
- Skipped in development mode to avoid noise`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1210',
    title: 'Annual Wrapped Feature',
    description: 'Spotify Wrapped-style year-end summary showing cultivation statistics, top strains, success rates, and fun facts.',
    category: 'ui',
    status: 'completed',
    priority: 'low',
    estimatedHours: 3,
    completedAt: timestamp(),
    notes: `Annual Wrapped feature:

**Features:**
- Multi-slide presentation with swipe/keyboard navigation
- Year overview: total grows, cultures, harvests, yield
- Top strain with count and yield
- Success rate visualization (circular progress)
- Best/worst month analysis
- Contamination stats
- Activity summary (observations, mistings, FAE events)
- Records: best yield, fastest grow
- Financial summary
- Fun facts generated from data
- Share prompt with #MycoLabWrapped

**Components:**
- AnnualWrapped: Full-screen slideshow modal
- WrappedTrigger: Button to open (shows in Dec/Jan)
- WrappedWidget: Dashboard card with preview stats

**Integration:**
- Added to Lab Command Center dashboard
- Shows automatically in December and January
- Year automatically selected based on current month`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1211',
    title: 'Lineage Visualization UI Enhancement',
    description: 'Improved text visibility and visual design of the Lineage Tree page. Fixed SVG text rendering and enhanced card styling.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 1,
    completedAt: timestamp(),
    notes: `Lineage Visualization improvements:

**Problems Fixed:**
- SVG text elements were using Tailwind classes that don't work in SVG context
- Low contrast backgrounds (50% opacity) made text unreadable
- Poor visual hierarchy between labels, strains, and generations

**Solutions Implemented:**
- Used proper SVG fill attributes instead of CSS classes
- Increased background opacity (80%) for better contrast
- Added explicit hex color values for all text elements
- Enhanced card styling with drop shadows and accent highlights

**Visual Enhancements:**
- Culture cards: Solid colored backgrounds with type-specific accent borders
- Status indicators: Ring + filled circle design with proper colors
- Connection lines: Gradient lines with shadow for depth, dot endpoints
- Generation badges: Contained in subtle pill-shaped backgrounds
- Health bars: Added subtle glow effect to filled segments
- Detail panel: Improved spacing, typography, and color contrast
- Footer cards: Interactive hover effects, click to filter

**Technical Changes:**
- cultureConfig: Added svgBg, svgBorder, svgAccent hex values
- statusColors: Changed from class strings to {ring, fill} objects
- renderNode: Complete rewrite with proper SVG attributes
- renderConnections: Added gradients, shadows, and endpoint dots`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1212',
    title: 'Fix Analytics Dashboard Harvest Heatmap Accuracy',
    description: 'Fixed harvest activity heatmap to use actual flush harvest dates instead of grow completion dates. Added drill-down functionality to view harvest details by clicking on any day.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    estimatedHours: 1,
    completedAt: timestamp(),
    notes: `Analytics Dashboard harvest heatmap accuracy fix:

**Problems Fixed:**
- Heatmap was using grow completion dates (completedAt) instead of actual flush harvest dates
- No way to drill-down and see details of what was harvested on each day
- Potential division by zero errors in BE calculations
- Success rate calculation could produce NaN with certain data

**Solutions Implemented:**
- Harvest heatmap now iterates through all flushes and uses their harvestDate field
- Added click-to-drill-down: clicking a day shows all harvests with grow name, strain, flush number, weights, and quality
- Fixed BE calculations to filter out grows with zero substrate weight
- Fixed success rate to only divide by finishedGrows (completed + contaminated)
- Fixed strain/substrate performance calculations to handle zero substrate weight

**UI Enhancements:**
- Clickable heatmap cells with cursor pointer on days with harvests
- Selected day highlighted with ring indicator
- Drill-down panel shows all harvests for selected day
- Quality color coding (excellent=green, good=blue, fair=yellow, poor=red)
- Empty state message when no harvests in time period
- "Click a day to see details" hint text

**Files Changed:**
- components/analytics/AnalyticsDashboard.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1213',
    title: 'Culture Transfers Table Schema Fix - Missing Columns',
    description: 'Fixed culture_transfers table schema to include quantity, unit, and to_type columns required by the application for transfer tracking.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 1,
    completedAt: timestamp(),
    notes: `Database schema bug fix for culture transfer recording:

**Problem:**
- User reported PGRST204 error when attempting culture transfers
- Error: "Could not find the 'source_culture_id' column of 'culture_transfers' in the schema cache"
- Code was trying to insert columns that didn't exist in the database schema
- Transfer functionality was completely broken for Supabase users

**Root Cause Analysis:**
- The culture_transfers table was created with basic columns (source_culture_id, target_culture_id, date, notes, user_id)
- Later development added transfer tracking features requiring additional columns
- Code in DataContext.tsx was inserting: quantity, unit, to_type
- These columns were never added to supabase-schema.sql migration

**Columns Added to culture_transfers:**
1. quantity (DECIMAL) - Amount transferred (e.g., 5 for 5ml)
2. unit (TEXT, default 'ml') - Unit of measurement (ml, cc, pieces)
3. to_type (TEXT) - Transfer destination type (liquid_culture, agar, grow, etc.)

**Database Schema Audit Performed:**
- Verified cultures table columns match transformCultureToDb() - OK
- Verified grows table columns match transformGrowToDb() - OK
- Verified flushes table columns match transformFlushToDb() - OK
- Verified entity_outcomes columns match saveEntityOutcome() - OK
- Verified contamination_details columns match saveContaminationDetails() - OK
- Verified inventory_lots columns match transformInventoryLotToDb() - OK
- Verified purchase_orders columns match transformPurchaseOrderToDb() - OK
- Verified notification_delivery_log columns match NotificationService.logDelivery() - OK
- Verified user_profiles table exists and columns match AuthContext usage - OK
- All 15+ transformation functions in transformations.ts verified against schema

**Fix Applied:**
- Added CULTURE_TRANSFERS TABLE MIGRATIONS block to supabase-schema.sql
- Uses idempotent IF NOT EXISTS pattern
- Includes RAISE NOTICE for migration logging
- Follows same pattern as other table migrations

**User Action Required:**
- Re-run supabase-schema.sql in Supabase SQL Editor
- PostgREST schema cache will auto-refresh after table changes
- If cache issues persist, can trigger reload via Supabase dashboard

**Prevention:**
- This is another instance of schema drift between code and database
- CLAUDE.md mandates checking SQL files before every commit
- Any database column changes must be reflected in schema file

**Files Changed:**
- supabase-schema.sql (added CULTURE_TRANSFERS TABLE MIGRATIONS block at line 1660)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1214',
    title: 'Multi-Provider Account Linking',
    description: 'Implemented account linking flow for users who sign up with multiple providers (Google OAuth and email/password) using the same email address. Detects duplicate accounts and offers to merge data.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Account linking feature for multi-provider authentication:

**Problem:**
- Users signing in with Google OAuth and email/password got separate accounts
- Same email resulted in different user_ids and separate data
- No way to merge accounts or consolidate data

**Solution - Database Layer (supabase-schema.sql v23):**
1. check_email_account(p_email) function:
   - Checks if email exists in system
   - Returns provider info (has_password, has_google)
   - Uses SECURITY DEFINER to access auth.users and auth.identities

2. migrate_user_data(from_user_id, to_user_id) function:
   - Transfers all user data between accounts
   - Updates cultures, grows, recipes, inventory, settings, etc.
   - Security: Can only migrate TO your own account

**Solution - Client Layer:**
1. AccountLinkingModal component:
   - Shows when duplicate account detected
   - Options: Sign in with existing, Link accounts, Keep separate
   - Handles migration and provides feedback

2. AuthContext integration:
   - Detects duplicate accounts after OAuth sign-in
   - Stores linking state and provides handlers
   - Auto-triggers check on Google OAuth callback

3. AuthModal updates:
   - Checks for existing Google account during email signup
   - Prompts user to sign in with Google instead
   - Prevents accidental duplicate account creation

**Detection Flow:**
1. User signs in with Google OAuth (new account)
2. After SIGNED_IN event, check if email exists elsewhere
3. If different user_id with same email found, show linking modal
4. User can merge data or keep accounts separate

**Linking Flow:**
1. User chooses to link accounts
2. migrate_user_data() transfers all data to current account
3. Old account's data now accessible under current user_id

**Files Changed:**
- supabase-schema.sql (v23 - added check_email_account, migrate_user_data functions)
- src/lib/supabase.ts (added checkEmailAccount, migrateUserData, linkGoogleIdentity utilities)
- src/lib/AuthContext.tsx (added account linking state and handlers)
- src/components/auth/AccountLinkingModal.tsx (new component)
- src/components/auth/AuthModal.tsx (integrated linking detection)

**Requires:**
- Manual linking API must be enabled in Supabase dashboard
- Run updated supabase-schema.sql to add new functions`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // SETTINGS & ADMIN OVERHAUL (v0.3.0)
  // Complete restructure of settings for different user roles
  // =============================================================================
  {
    id: 'dev-700',
    title: 'Settings & Admin Permissions Overhaul',
    description: 'Complete restructure of Settings page for role-based access. Anonymous users see minimal settings (units, theme). Growers get preferences, notifications, library browser. Admins get full console with Database, User Management, Library CRUD, Suggestion Queue, Audit Log, and Services Config all consolidated in one place.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    estimatedHours: 16,
    completedAt: timestamp(),
    notes: `Major Settings & Admin restructure for role-based permissions:

**Problem:**
- Database section was separate from Admin section (confusing)
- All users saw all 12 tabs regardless of permissions
- No experience level system for UI complexity
- No way for users to suggest library entries
- Admin features scattered across multiple tabs

**Solution - Three-Tier Settings Architecture:**

**1. Anonymous Users (Local-Only):**
- Minimal settings: Units (F/C), Theme, Currency
- Sign-up prompt to access full features
- Library browser (read-only)

**2. Growers (Authenticated Non-Admin):**
- Profile: Account info, password change
- Preferences: Experience level, units, timezone, UI options
- Notifications: In-app, email, SMS settings
- Library: Read-only browse, submit suggestions
- My Data: Export/import, sync status

**3. Admins (Global Administrators):**
All grower settings PLUS Admin Console:
- Dashboard: Quick stats, pending suggestions
- Database: Connection status, table health, schema
- User Management: Full CRUD, role assignment
- Library Management: Species, strains, containers, etc.
- Suggestion Queue: Review user submissions
- Admin Notifications: System alerts
- Audit Log: Admin action history
- Services Config: Email/SMS provider setup

**New Database Schema (v19):**
- user_settings: Added experience_level, advanced_mode,
  has_completed_setup_wizard, show_tooltips, show_guided_workflows
- library_suggestions: Expanded suggestion_type to include all library types
  (container, substrate_type, grain_type, supplier, etc.)
- suggestion_messages: New table for admin-user communication
- Full RLS policies for new tables

**New TypeScript Types:**
- ExperienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
- SuggestionType: 12 library entity types
- SuggestionStatus: 7 workflow states
- LibrarySuggestion, SuggestionMessage interfaces

**New Components:**
- AnonymousSettings.tsx: Minimal settings for unauthenticated users
- GrowerSettings.tsx: Full settings for authenticated non-admins
- admin/AdminConsole.tsx: Consolidated admin panel
- common/SettingsSection.tsx: Reusable section wrapper
- SettingsPageNew.tsx: Role-based router

**Experience Level System:**
- Beginner: Simplified UI, tooltips, guided workflows
- Intermediate: Standard feature set
- Advanced: All options visible
- Expert: Power user features, bulk operations
- Advanced Mode toggle overrides experience level

**Future: First-Time Wizard:**
- Schema ready for setup wizard tracking
- has_completed_setup_wizard flag
- Will ask user experience level on first login
- Pre-configure settings based on responses

**Files Changed:**
- supabase-schema.sql (v19 - user_settings columns, suggestion_messages table)
- src/store/types.ts (ExperienceLevel, suggestion types)
- src/components/settings/AnonymousSettings.tsx (new)
- src/components/settings/GrowerSettings.tsx (new)
- src/components/settings/admin/AdminConsole.tsx (new)
- src/components/settings/common/SettingsSection.tsx (new)
- src/components/settings/SettingsPageNew.tsx (new router)
- src/App.tsx (import SettingsPageNew)
- SETTINGS_OVERHAUL_PLAN.md (design document)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1215',
    title: 'Restrict User Preferences to User-Editable Data Only',
    description: 'Security fix: Non-admin users can now only access Preferences and Locations tabs in Settings. All library/reference data tabs (species, strains, containers, substrates, suppliers, categories, location types, classifications) are now admin-only.',
    category: 'security',
    status: 'completed',
    priority: 'high',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `User preferences access control fix:

**Problem:**
- Non-admin users could see all Settings tabs including library data
- Species, strains, containers, substrates, etc. are global/system data
- Users should NOT be able to add/edit/delete globally-accessible library entries
- Only admins should manage system-level reference data

**Previous State:**
- adminOnlyTabs only included: ['admin', 'database']
- Non-admins could access all other tabs including library management

**Solution:**
- Expanded adminOnlyTabs to include ALL library/reference data tabs
- Non-admins now only see: preferences, locations
- Locations are user-scoped at database level (RLS: user_id = auth.uid())

**Access Matrix After Fix:**
| Tab | Non-Admin | Admin |
|-----|-----------|-------|
| preferences | ✅ | ✅ |
| locations | ✅ (own only) | ✅ |
| species | ❌ | ✅ |
| strains | ❌ | ✅ |
| containers | ❌ | ✅ |
| substrates | ❌ | ✅ |
| suppliers | ❌ | ✅ |
| categories | ❌ | ✅ |
| locationTypes | ❌ | ✅ |
| locationClassifications | ❌ | ✅ |
| admin | ❌ | ✅ |
| database | ❌ | ✅ |

**Note:** Users wanting to add to the global library should use the suggestion workflow (library_suggestions table) which requires admin approval.

**Files Changed:**
- src/components/settings/SettingsPage.tsx (expanded adminOnlyTabs array)
- src/store/types.ts (added userId to all library types + helper functions)
- src/store/transformations.ts (include userId in all FromDb transforms)
- src/components/common/DataOwnershipBadge.tsx (new visual component)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PREPARED SPAWN & CONTAINER ENHANCEMENTS (v0.3.x)
  // Track sterilized containers awaiting inoculation, streamline transfer workflow
  // =============================================================================
  {
    id: 'dev-1220',
    title: 'Prepared Spawn/Container Tracking System',
    description: 'New entity type for tracking sterilized containers (grain jars, LC jars, agar plates, etc.) that are prepped and waiting for inoculation. Links to containers, recipes, grain types. Tracks prep date, sterilization date/method, expiration, and connects to resulting culture/grow after inoculation.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 8,
    completedAt: timestamp(),
    notes: `Complete prepared spawn tracking system:

**Problem:**
- Users prep batches of sterilized containers but couldn't track them
- No way to select an existing prepared container when transferring cultures
- Container status (sterilized, filled, inoculated) wasn't tracked

**Solution - PreparedSpawn Entity:**
- New PreparedSpawn type with full lifecycle tracking
- Types: grain_jar, lc_jar, agar_plate, slant_tube, spawn_bag, other
- Status: available, reserved, inoculated, contaminated, expired
- Links to: containerId, recipeId, grainTypeId, locationId
- Tracks: prepDate, sterilizationDate/Method, expiresAt, productionCost
- After inoculation: resultCultureId or resultGrowId

**CRUD Operations:**
- addPreparedSpawn, updatePreparedSpawn, deletePreparedSpawn
- inoculatePreparedSpawn (marks as used, links to result)
- getAvailablePreparedSpawn (filter by type)

**Database Schema:**
- prepared_spawn table with all fields
- Foreign keys to containers, recipes, grain_types, locations, cultures
- Deferred FK to grows (circular reference handling)
- RLS policies for user data ownership

**Files Changed:**
- src/store/types.ts (PreparedSpawn interface, PreparedSpawnType, PreparedSpawnStatus)
- src/store/DataContext.tsx (CRUD operations, data fetching, lookups)
- src/store/transformations.ts (transformPreparedSpawnFromDb/ToDb)
- src/store/defaults.ts (preparedSpawn: [] in emptyState)
- src/store/initialData.ts (preparedSpawn: [] in initialDataState)
- supabase-schema.sql (prepared_spawn table)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1221',
    title: 'Container Sterilizable Flag',
    description: 'Added isSterilizable boolean flag to Container type. Distinguishes between reusable+sterilizable containers (glass jars, metal tools) and reusable but not sterilizable (certain plastics) or disposable (plastic syringes). Defaults based on isReusable when not specified.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 1,
    completedAt: timestamp(),
    notes: `Container sterilizable flag:

**Problem:**
- isReusable doesn't indicate if container can be sterilized
- Glass syringes are sterilizable, plastic ones aren't
- Users need to know which containers can go in the pressure cooker

**Solution:**
- Added isSterilizable: boolean to Container interface
- Database column with migration for existing containers
- Defaults: isReusable ?? true when not explicitly set
- All seed containers updated with appropriate values

**Files Changed:**
- src/store/types.ts (Container.isSterilizable)
- src/store/transformations.ts (transform functions)
- src/store/initialData.ts (all containers have isSterilizable)
- src/components/forms/EntityFormModal.tsx (container creation)
- src/components/settings/SettingsPage.tsx (container form)
- supabase-schema.sql (is_sterilizable column + migration)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1222',
    title: 'Transfer Modal Prepared Container Selection',
    description: 'Enhanced Transfer Culture modal to allow selecting from available prepared containers instead of always creating new records. Shows available prepared spawn matching the transfer type, displays container details, and marks as inoculated when transfer completes.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Transfer modal enhancement:

**Problem:**
- Transfer always created new culture/grow records
- No way to link transfer to pre-existing prepared container
- Users prep containers ahead of time, want to select them

**Solution:**
- Toggle between "Create New" and "Use Prepared" in transfer modal
- Dropdown shows available prepared spawn matching transfer type
- Type mapping: grain_spawn→grain_jar/spawn_bag, liquid_culture→lc_jar, etc.
- Shows container details (name, volume, prep date) when selected
- Calls inoculatePreparedSpawn on transfer completion
- Message when no prepared containers available, links to Lab & Storage

**Files Changed:**
- src/components/cultures/CultureManagement.tsx (Transfer modal UI)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1223',
    title: 'Database Connection & Query Optimization',
    description: 'Comprehensive database optimization layer with parallel query execution, caching, request deduplication, retry logic, real-time subscriptions, O(1) lookups, write batching, and connection health monitoring. Designed for scalability to thousands of users.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 24,
    actualHours: 16,
    completedAt: timestamp(),
    notes: `Major database optimization for scalability and reliability:

**Problem:**
- Sequential query execution (25 queries one-by-one, ~2.5s load time)
- No caching or request deduplication
- No retry logic for transient failures
- No real-time subscriptions for cross-tab sync
- O(n) array lookups for entity access
- getCurrentUserId() called 30+ times without caching
- No connection health monitoring

**Solution - New Database Service Layer (src/lib/db/):**

**1. QueryCache.ts - LRU Cache with TTL:**
- Configurable max size and TTL per entry
- Eviction strategies: lru, fifo, ttl
- Pattern-based invalidation (string or regex)
- Cache statistics tracking (hits, misses, hit rate)

**2. RequestDeduplicator.ts - Prevent Duplicate Requests:**
- Shares promises for identical concurrent requests
- Auto-cleanup of completed requests
- Timeout-based cleanup for safety
- Query key generation helpers

**3. QueryExecutor.ts - Core Query Execution:**
- Retry logic with exponential backoff (3 attempts)
- Retryable error detection (network, timeout, rate limit)
- Query timeout support (30s default)
- Integrates caching and deduplication
- Detailed timing metrics

**4. ConnectionManager.ts - Health Monitoring:**
- Heartbeat polling (30s interval)
- Automatic reconnection with exponential backoff
- Network online/offline event listeners
- State change callbacks for UI updates
- Connection health metrics (latency, uptime)

**5. RealtimeManager.ts - Cross-Tab Sync:**
- Supabase real-time subscriptions
- Event debouncing (100ms default)
- Per-table subscription limits
- Auto-reconnect on channel errors
- Cleanup on unsubscribe

**6. BatchWriter.ts - Write Batching:**
- Groups operations by table and type
- Batch insert/update/upsert/delete
- Configurable flush interval and batch size
- Error handling per batch

**7. EntityLoader.ts - Parallel Loading:**
- Parallel query execution with configurable concurrency
- Priority-based loading (core lookups first)
- TABLE_CONFIGS for all 20+ tables
- Minimal load config for critical data

**8. LookupMaps.ts - O(1) Entity Lookups:**
- LookupMap<T> for ID-based lookups
- IndexedLookupMap<T> for secondary indexes
- EntityStore for centralized entity storage
- React hooks for map access

**9. DataLoader.ts - DataContext Integration:**
- loadAllDataOptimized() replaces sequential loading
- setupRealtimeSync() for subscription setup
- createLookupMaps() for typed map creation
- Special handling for flushes → grows mapping

**10. useDatabase.ts - React Hooks:**
- useDatabase() for full database access
- useEntity() for O(1) single entity lookup
- useFilteredEntities() for filtered queries
- useConnectionStatus() for connection state

**11. DatabaseService.ts - Orchestration:**
- Main entry point for all services
- Singleton pattern with getDatabaseService()
- Initialize/dispose lifecycle management

**Performance Improvements:**
- Parallel loading: 25 queries execute concurrently
- Cache hit rate: Reduces duplicate fetches
- Request deduplication: Prevents race conditions
- O(1) lookups: Map-based instead of array.find()
- Cached user ID: Single fetch per session

**Database Indexes Added (supabase-schema.sql):**
- idx_inventory_items_user_id
- idx_grows_created_at
- idx_cultures_created_at
- idx_locations_user_id
- idx_recipes_user_id
- idx_flushes_harvest_date
- idx_inventory_lots_created_at
- idx_purchase_orders_created_at

**Files Created:**
- src/lib/db/types.ts
- src/lib/db/QueryCache.ts
- src/lib/db/RequestDeduplicator.ts
- src/lib/db/QueryExecutor.ts
- src/lib/db/ConnectionManager.ts
- src/lib/db/RealtimeManager.ts
- src/lib/db/BatchWriter.ts
- src/lib/db/EntityLoader.ts
- src/lib/db/LookupMaps.ts
- src/lib/db/DataLoader.ts
- src/lib/db/useDatabase.ts
- src/lib/db/DatabaseService.ts
- src/lib/db/index.ts

**Files Modified:**
- src/store/DataContext.tsx (parallel loading integration)
- supabase-schema.sql (performance indexes)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1224',
    title: 'Release Preparation: Critical Bug Fixes',
    description: 'Comprehensive bug fixes to stabilize app for release: fixed infinite data reload loop, reduced excessive production logging, fixed EntityFormModal showing for cultures/grows with dedicated wizards, and improved anonymous user handling for settings.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    notes: `Release preparation bug fixes:

**Fix #1 - Infinite Data Reload Loop:**
- Problem: DataContext loadDataFromSupabase had state.settings in dependency array
- This caused: settings load → state update → dependency change → reload → infinite loop
- Console showed repeated "[EntityLoader] Loaded 21 tables" and NaN% time savings
- Solution: Removed state.settings from dependency array, use getLocalSettings() instead

**Fix #2 - NaN% in Performance Logging:**
- Problem: Division by zero when sequentialTime is 0 (all cached)
- Solution: Added guard: sequentialTime > 0 ? calculation : 0

**Fix #3 - Excessive Production Logging:**
- Problem: All console.log statements ran in production, causing noise
- Solution: Wrapped informational logs in process.env.NODE_ENV === 'development'
- Kept error logs for production debugging

**Fix #4 - "Unknown entity type: culture" Popup:**
- Problem: CultureWizard uses CreationContext to save drafts
- EntityFormModal showed for ALL drafts, including culture/grow types
- But EntityFormModal doesn't have forms for culture/grow (they have dedicated wizards)
- Solution: CreationModalManager now checks ENTITY_TYPES_WITH_DEDICATED_WIZARDS
- EntityFormModal only shows for reference entities (strains, containers, etc.)

**Fix #5 - Anonymous User Settings Errors:**
- Problem: user_settings RLS policies block anonymous users
- But app was trying to load settings for anonymous users → access control errors
- Solution: Check isAnonymousUser() before attempting database settings load
- Anonymous users now use localStorage-only settings (graceful fallback)

**Files Changed:**
- src/App.tsx (CreationModalManager with dedicated wizard check)
- src/store/DataContext.tsx (removed state.settings dependency, added anonymous checks, dev-only logging)
- src/lib/db/EntityLoader.ts (NaN guard, dev-only logging)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1225',
    title: 'Entity Disposal Tracking & Historical Audit Trail',
    description: 'Implemented append-only historical tracking for entity disposal. When cultures, containers, inventory, or equipment are disposed, users select an outcome reason (success, failure, neutral) which is saved to entity_outcomes table. This preserves complete historical records for analytics and traceability - nothing is ever truly deleted.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `Comprehensive entity disposal tracking implementation:

**New Types & Options:**
- Added PhysicalOutcomeCode type for containers, equipment (dropped_broken, seal_failure, electrical_failure, lost, etc.)
- Added CONTAINER_OUTCOME_OPTIONS with success (Contents Used, Cleaned & Stored), failure (Contaminated, Damaged, Dropped/Broken), neutral (Discarded, Given Away, Lost)
- Added INVENTORY_OUTCOME_OPTIONS for inventory items/lots
- Added EQUIPMENT_OUTCOME_OPTIONS for equipment lifecycle tracking
- Added ENTITY_OUTCOME_OPTIONS map and getOutcomeOptionsForEntity() helper

**New Component:**
- Created EntityDisposalModal - generic reusable modal for any entity type
- Grouped outcomes by category (success/failure/neutral) with color coding
- Optional contamination details form (type, suspected cause)
- Notes field for additional context
- Historical record notice explaining data preservation

**Culture Disposal Flow:**
- Updated deleteCulture() to accept optional EntityOutcomeData
- Saves outcome to entity_outcomes table before deletion
- Contamination details saved to contamination_details if relevant
- CultureManagement now uses EntityDisposalModal instead of confirm()

**Auto-Prompt for Depletion:**
- When culture transfer depletes source (fillVolumeMl <= 0)
- Auto-updates status to 'depleted'
- Automatically opens disposal modal to capture outcome

**Data Model:**
- Append-only pattern: outcome records are immutable
- entity_outcomes preserves: entity info, timing, costs, strain/species, notes
- Supports future analytics: success rates, contamination patterns, cost tracking

**Files Changed:**
- src/store/types.ts (new outcome types and options)
- src/store/DataContext.tsx (updated deleteCulture with outcome param, moved after saveEntityOutcome)
- src/components/common/EntityDisposalModal.tsx (new component)
- src/components/cultures/CultureManagement.tsx (disposal modal integration, auto-prompt on depletion)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1226',
    title: 'Immutable Database Architecture Design',
    description: 'Comprehensive design for iRacing-style append-only database architecture. Core principle: original records are never modified or deleted - amendments create new versioned records that reference and supersede originals. Full audit trail for compliance and debugging.',
    category: 'data',
    status: 'in_progress',
    priority: 'high',
    estimatedHours: 40,
    actualHours: 16,
    notes: `Complete immutable database design document created (IMMUTABLE_DATABASE_DESIGN.md):

**IMPLEMENTATION STATUS (v24 schema):**
- [x] Database schema migration (supabase-schema.sql)
- [x] New history tables (observation_history, harvest_history, transfer_history, stage_transition_history, data_amendment_log, bulk_operations)
- [x] Stored procedures (amend_record, archive_record, get_record_history, get_record_at_time)
- [x] TypeScript types (ImmutableRecordFields, AmendmentRequest, history entry types)
- [x] Transformation functions for all history tables
- [x] UI: RecordHistory component (timeline view)
- [x] UI: AmendmentModal component (edit with reason)
- [x] UI: RecordHistoryTab component (modal wrapper with amend/archive)
- [x] DataContext: amendCulture, archiveCulture operations
- [x] DataContext: amendGrow, archiveGrow operations
- [x] DataContext: getRecordHistory, getAmendmentLog helpers
- [x] History modal integrated into CultureManagement
- [x] History modal integrated into GrowManagement
- [ ] Integration with existing CRUD operations (wire up to SQL stored procedures)
- [ ] Prepared spawn amend/archive operations

**Phase 1 Complete - Schema and Core Types:**

**Core Principles:**
- Append-only records: INSERT only, no UPDATE/DELETE on core tables
- Amendment records: Corrections create new records linked to originals
- Soft deletes (archival): Records marked archived, never physically deleted
- Versioning: Each record has version number, record_group_id links versions
- Temporal validity: valid_from/valid_to for point-in-time queries

**New Database Schema:**
- Base fields for all core tables: version, record_group_id, is_current, valid_from, valid_to, superseded_by_id, is_archived, archived_at, archived_by, archive_reason, amendment_type, amendment_reason, amends_record_id
- observation_history: Immutable log of all observations (cultures, grows, spawn)
- harvest_history: Immutable log of all harvests (replaces embedded flushes)
- transfer_history: Immutable log of culture transfers
- stage_transition_history: Immutable log of stage changes
- data_amendment_log: Tracks all corrections with JSON diff

**Application Layer Changes:**
- ImmutableRecord base interface
- UPDATE becomes amendRecord() with reason
- DELETE becomes archiveRecord() with reason
- New query patterns: getCurrentVersion(), getHistory(), getAtPointInTime()
- Atomic amendment via database stored procedure

**UI/UX Patterns:**
- Amend modal (not inline edit) with reason required
- History tab on all record detail pages
- Version diff view
- Amendment badges showing version and type

**Implementation Phases:**
1. Phase 1: cultures, grows, flushes (critical)
2. Phase 2: recipes, inventory_items, inventory_lots
3. Phase 3: observations → observation_history migration
4. Phase 4: lookup tables (strains, locations, containers)

**Benefits:**
- Complete audit trail for compliance
- No accidental data loss
- Temporal queries ("what did this look like on day 14?")
- Analytics accuracy (historical data reflects reality at that moment)
- Trust and debuggability`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1227',
    title: 'Outcomes Analytics Dashboard',
    description: 'Created comprehensive analytics dashboard for visualizing entity outcomes from the append-only tracking system. Displays disposal patterns, contamination analysis, success rates, failure reasons, and historical trends.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    notes: `Full Outcomes Analytics implementation:

**New Component: OutcomesAnalytics.tsx**
- Summary metrics cards: total outcomes, success rate, failure rate, total yield, avg duration
- Category distribution pie chart (success/failure/neutral/partial)
- Entity type breakdown bar chart (grows, cultures, containers, inventory, equipment)
- Monthly trend line chart showing success/failure/neutral over time
- Top failure reasons analysis with percentage bars
- Recent outcomes table with sortable columns

**Data Layer Updates:**
- Added entityOutcomes to DataStoreState type
- Added to defaults.ts and initialData.ts
- Created transformEntityOutcomeFromDb in transformations.ts
- Added entity_outcomes to DataLoader TABLE_TO_STATE and TRANSFORMATIONS
- Added to DataContext setState in loadDataFromSupabase

**Navigation Integration:**
- Added 'outcomes' to Page type
- Added /outcomes route
- Added nav item under Analytics section (with Clock icon)
- Added page config and render case

**Visualization Features:**
- Time range filtering (30d, 90d, 1y, all)
- Entity type filtering
- Recharts for all visualizations
- Empty state with helpful message when no data
- Responsive grid layout

**Files Changed:**
- src/components/analytics/OutcomesAnalytics.tsx (new)
- src/store/types.ts (entityOutcomes in state)
- src/store/defaults.ts, initialData.ts (empty array defaults)
- src/store/transformations.ts (transformEntityOutcomeFromDb)
- src/lib/db/DataLoader.ts (loading config)
- src/store/DataContext.tsx (setState integration)
- src/App.tsx (navigation and routing)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1228',
    title: 'Feature Tracker - Data Architecture',
    description: 'Redesigned the devlog/roadmap system into a comprehensive Feature Tracker with milestone tracking, version awareness, and archive system.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 4,
    completedAt: timestamp(),
    notes: `**Phase 1 - Data Architecture Complete:**

**New Directory: src/data/feature-tracker/**
- types.ts: Comprehensive type system (Feature, Milestone, AppVersionInfo, Changelog)
- index.ts: Main exports with MILESTONES array and utility functions
- changelog.ts: Version history tracking

**Utility Functions:**
- search.ts: Full-text search with weighted fields (title > description > notes)
- stats.ts: Compute feature statistics by status, priority, category, milestone
- dependencies.ts: Dependency graph analysis with critical path detection
- migration.ts: Bridge from legacy DevLogFeature to new Feature format

**Bridge Pattern:**
- active/current.ts: Migrates non-completed devlog features to new format
- archive/index.ts: Migrates completed features with quarter grouping

**Milestone System:**
- Mushroom-themed codenames (Spore, Mycelium, Primordia, Golden Teacher, etc.)
- Mandatory vs optional features per milestone
- Status tracking: planned -> active -> released

**Key Features:**
- 263 features auto-migrated from legacy devlog
- Automatic tag extraction from content
- Quarter-based archive organization
- Semantic versioning support`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1229',
    title: 'Feature Tracker - UI Components',
    description: 'Built comprehensive UI for Feature Tracker with multiple views, search, filtering, and proper markdown rendering.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 5,
    completedAt: timestamp(),
    notes: `**Phase 2 - UI Components Complete:**

**New Components:**
- FeatureTrackerPage.tsx: Main container with view switching
- shared/StatusBadge.tsx: Status, Priority, Category, Tag, Milestone badges
- shared/FeatureCard.tsx: Compact and expanded views with all metadata
- shared/MarkdownContent.tsx: Renders markdown (headers, bold, lists, code blocks, links)

**Views Implemented:**
- Kanban: Status columns with drag-ready layout
- List: Mobile-first compact list
- Milestone: Grouped by version with progress indicators

**Features:**
- Cmd+K quick search modal with fuzzy matching
- Filter panel (status, priority, category, milestone)
- Stats bar showing progress and counts
- Proper markdown rendering in notes/technical notes
- Responsive design throughout

**Navigation Integration:**
- Added 'featuretracker' to Page type
- Added /feature-tracker route
- Nav item in Settings section
- Page config with title and subtitle`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1230',
    title: 'Feature Tracker - Timeline & Dependency Views',
    description: 'Implemented Timeline and Dependency graph views for the Feature Tracker with visual representations of feature relationships.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 2,
    completedAt: timestamp(),
    notes: `**Phase 3 - Advanced Views Complete:**

**Timeline View:**
- Currently Active section with amber pulsing indicators
- Up Next section showing planned features by priority
- Completed section grouped by month/year
- Visual timeline with connected dots and lines
- Expandable feature cards with description

**Dependency Graph View:**
- Interactive node visualization by depth level
- Critical path highlighting with amber glow
- Stats panel (total features, dependencies, roots, depth)
- Feature detail panel on selection
- Shows blockers and impact of completing features
- Cycle detection warning for circular dependencies

**Visual Improvements:**
- Color-coded nodes by status (completed=green, blocked=red, critical path=amber)
- Glassmorphism effects on flyouts
- Smooth animations and transitions
- Responsive grid layout for large/small screens`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1231',
    title: 'Collapsible Sidebar with Flyout Menus',
    description: 'Enhanced sidebar to be collapsible into icon strip with interactive flyout menus on hover/click.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 3,
    actualHours: 2,
    completedAt: timestamp(),
    notes: `**Collapsible Sidebar Features:**
- Toggle button to collapse/expand sidebar
- State persisted to localStorage
- When collapsed: shows icon strip (w-16)
- Mushroom logo clickable to expand

**Flyout Menu System:**
- Hover to preview menu items
- Click to pin menu open
- Pin indicator shows when locked
- Click outside to close pinned flyout
- Active page indicator with glow effect

**Visual Enhancements:**
- Magical expand button with glow, sparkle, rotation effects
- Glassmorphism on flyout menus
- Smooth scale transitions on icons
- Animated slide-in for flyout appearance
- Pulsing emerald indicator for active items

**Bug Fixes:**
- Fixed overflow-hidden clipping flyout menus
- Added overflow-visible when collapsed`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1232',
    title: 'Feature Tracker - Changelog & Detail Modal',
    description: 'Added Changelog view tab and Feature detail modal for viewing comprehensive feature information.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 3,
    actualHours: 1.5,
    completedAt: timestamp(),
    notes: `**Phase 4 - Changelog & Modal Complete:**

**Changelog View:**
- Version selector sidebar (sorted by semver)
- Shows milestone codenames for each version
- Version header with release date and highlights
- Entry cards with type-specific icons and colors
- Support for all entry types (feature, bug fix, security, etc.)
- Integrates with existing changelog data and auto-generation

**Feature Detail Modal:**
- Full feature information display
- Status, Priority, and Milestone badges
- Description and Notes sections
- Meta grid (category, complexity, estimated/actual hours)
- Tags display
- Technical notes with monospace formatting
- Acceptance criteria checklist
- Dependencies list with status indicators
- Audit dates (created, updated, completed)

**Entry Type Config:**
- 12 changelog entry types with icons
- Color-coded backgrounds and text
- Release, Feature, Bug Fix, Security, Performance, etc.`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1233',
    title: 'Release Preparation: Sign Out Fix, CSS Rework, Disposal Improvements',
    description: 'Comprehensive release preparation including critical sign-out hang fix, foundational CSS design system rework, culture/grow disposal improvements using archive pattern, and mobile-first auth modal enhancements.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    completedAt: timestamp(),
    notes: `Release preparation batch - critical stability and UX improvements:

**Fix #1 - Sign Out Hang (Critical):**
- Problem: supabase.auth.signOut() hung indefinitely on some networks
- User stuck on "Processing..." modal for 4+ minutes
- Clicking backdrop closed modal but user still showed as logged in
- Solution: Added 5-second timeout wrapper around signOut call
- Added 8-second hard failsafe timer in AccountMenu
- Prevented modal dismissal while processing
- Even if signOut times out, local state is cleared properly

**Fix #2 - Comprehensive CSS Design System Rework:**
- Created unified design token system with semantic naming
- Spacing scale (space-0 through space-16)
- Timing/easing tokens (duration-instant through duration-breathing)
- Shadow system (shadow-xs through shadow-2xl, plus glow variants)
- Typography scale with custom fonts (Plus Jakarta Sans, JetBrains Mono)
- Organic button styles with gradient backgrounds and spring animations
- Input styles with breathing focus animations
- Card styles with emergence effect on hover
- Theme-aware badge and status indicator system
- Table styles with organic feel
- Modal system with mobile-first slide-up behavior
- Ambient background effects with theme-specific gradients
- Mobile performance optimizations (disable hover effects on touch)
- Reduced motion support for accessibility

**Fix #3 - Culture Disposal 409 Conflict (Critical):**
- Problem: deleteCulture() failed with 409 FK constraint error
- Cultures have FK references from: culture_transfers, prepared_spawn, grows
- Solution: Changed disposal to use archiveCulture() instead of deleteCulture()
- Archive is soft-delete that preserves data integrity
- Outcome is saved first, then culture archived with descriptive reason
- Same fix applied to grow disposal (archiveGrow instead of deleteGrow)

**Fix #4 - Tiny Volume Threshold:**
- Problem: Residual volumes like 0.00001ml from drops were not treated as empty
- Solution: Added EMPTY_VOLUME_THRESHOLD_ML = 0.5
- Volumes below 0.5ml now considered effectively depleted
- Triggers proper depletion flow and disposal modal

**Fix #5 - Mobile Auth Modal Improvements:**
- Modal slides up from bottom on mobile, centered on desktop
- Added min-height 48px to all inputs and buttons for touch targets
- Used text-base (16px) to prevent iOS zoom on input focus
- Added safe-area-bottom padding for notched devices

**Files Changed:**
- src/lib/AuthContext.tsx (signOut timeout wrapper)
- src/components/auth/AccountMenu.tsx (failsafe timer, modal lock)
- src/components/auth/AuthModal.tsx (mobile-first layout, touch targets)
- src/styles/globals.css (complete design token system)
- src/components/cultures/CultureManagement.tsx (archive instead of delete, volume threshold)
- src/components/grows/GrowManagement.tsx (archive instead of delete)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1234',
    title: 'Mobile Modal Refresh: Touch Targets & Bottom Sheet Pattern',
    description: 'Comprehensive mobile refresh of all shared modal components with bottom-sheet pattern, proper touch targets, and iOS zoom prevention.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    completedAt: timestamp(),
    notes: `Mobile-first modal refresh for release preparation:

**Pattern Applied Across All Modals:**
- Bottom sheet on mobile (items-end + rounded-t-2xl)
- Centered dialog on desktop (sm:items-center + sm:rounded-xl)
- Max height 95vh mobile, 90vh desktop
- safe-area-bottom padding for notched devices
- overflow-y-auto for scrollable content

**Touch Target Improvements:**
- All buttons: min-h-[48px] for proper tap targets
- Close buttons: min-w-[44px] min-h-[44px]
- Star ratings: w-11 h-11 (was w-8 h-8)
- Option buttons: min-h-[48px] to min-h-[72px] depending on content
- Footer buttons: flex-1 on mobile for full-width taps

**iOS Zoom Prevention:**
- text-base (16px) on all inputs and textareas
- Prevents automatic zoom on input focus

**Modals Updated:**
- EntityDisposalModal - disposal outcome selection
- AmendmentModal - record amendment workflow
- ExitSurveyModal - exit survey with star ratings
- EntityFormModal - dynamic entity creation forms
- AccountLinkingModal - account linking options

**Files Changed:**
- src/components/common/EntityDisposalModal.tsx
- src/components/common/AmendmentModal.tsx
- src/components/surveys/ExitSurveyModal.tsx
- src/components/forms/EntityFormModal.tsx
- src/components/auth/AccountLinkingModal.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1235',
    title: 'P-Value Tracking, Shelf Life Indicators, and Culture Guide',
    description: 'Comprehensive culture management enhancements including P-value display, shelf life calculations based on generation, cold-sensitive species handling, and an educational Culture Guide page.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    completedAt: timestamp(),
    notes: `Culture management knowledge base and shelf life tracking:

**P-Value (Passage Number) Display:**
- Changed "G#" notation to "P#" for industry standard terminology
- Added P-value explanation to Culture Guide
- Displays in culture cards (grid view), list view table, and detail panel
- Lineage tree now shows P# notation (P0, P1, P2, etc.)

**Shelf Life Calculation Utility (shelf-life.ts):**
- calculateShelfLife() - returns status, remaining days, warnings
- formatRemainingShelfLife() - human-readable "2 months", "5 days"
- getExpectedShelfLifeDays() - by generation (P0=180d, P1=150d, P2=90d, P3+=60d)
- getStorageRecommendation() - cold storage temps by species type
- senescenceSigns[] - warning indicators with severity levels
- expansionRatios{} - recommended ratios by culture type

**Shelf Life Badge Component:**
- ShelfLifeBadge displays on culture cards for aging/expiring cultures
- Compact mode for cards, full mode for detail panel
- Status: fresh (hidden), good, aging, expiring, expired
- Color-coded with warning messages
- Only shows for active cultures (hidden for archived/contaminated)

**Cold-Sensitive Species:**
- Added coldSensitive boolean to Species interface
- Added minStorageTempC field (default 2°C, 10°C for tropical)
- Schema migration for cold_sensitive and min_storage_temp_c columns
- Transformation functions updated
- coldSensitiveSpecies[] list in utility

**Culture Guide Page (/culture-guide):**
- Overview - culture types explained (LC, agar, slant, spore syringe)
- P-Value System - generation definitions (P0 through P3+)
- Shelf Life - visual cards showing expected life by generation
- Senescence - warning signs with severity indicators
- Storage - temperature recommendations, cold-sensitive species list
- Expansion Ratios - recommended ratios for LC, agar, grain spawn
- Terminology - mycology terms glossary

**Files Changed:**
- src/store/types.ts - coldSensitive, minStorageTempC
- src/store/transformations.ts - species transformations
- src/utils/shelf-life.ts - new utility file
- src/utils/index.ts - export shelf-life
- src/components/cultures/CultureManagement.tsx - ShelfLifeBadge, P# notation
- src/components/library/CultureGuide.tsx - new page
- src/components/library/index.ts - export CultureGuide
- src/App.tsx - cultureguide route and nav
- supabase-schema.sql - cold_sensitive, min_storage_temp_c columns`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1236',
    title: 'Delete All My Data Feature',
    description: 'Allow users to archive all their data while keeping their account, following non-destructive database policies.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 3,
    completedAt: timestamp(),
    notes: `Account data reset feature for Settings > My Data tab:

**Feature Overview:**
- Users can "delete" all their data (actually archives it)
- Account remains active for a fresh start
- Follows immutable/non-destructive database policy

**3-Step Confirmation Flow:**
1. Warning screen showing data counts (cultures, grows, recipes, inventory)
2. Text confirmation - user must type "DELETE MY DATA"
3. Processing/success screen with progress indicator

**UI Design:**
- Red danger zone styling to indicate severity
- Mobile-first bottom sheet modal pattern
- Touch-friendly 48px minimum button heights
- Disabled state until confirmation text matches

**Data Affected:**
- Cultures (archived status)
- Grows (archived status)
- Recipes (archived status)
- Inventory items (archived status)
- Observations, flushes, and related data

**What's Preserved:**
- User account and authentication
- User settings and preferences
- System seed data (species, strains, container types)

**Files Changed:**
- src/components/settings/GrowerSettings.tsx - UI and confirmation modal`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1237',
    title: 'Bug Fixes: Sign Out Hang, Archive Guards, Volume Display, Calculator Units',
    description: 'Multiple bug fixes and improvements: fixed sign-out modal hanging, added archive guards to prevent 409 conflicts, improved volume display for tiny amounts, and added unit flexibility to spawn rate calculator.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    completedAt: timestamp(),
    notes: `Session bug fixes and improvements:

**Fix #1 - Sign Out Hang (Critical):**
- Problem: Sign out modal stuck in "Processing..." state
- Root cause: Awaiting Supabase signOut which could hang indefinitely
- Solution: Clear UI state FIRST (session, user, profile), then fire Supabase signOut in background
- Added 3-second timeout with Promise.race for Supabase call
- UI now clears instantly regardless of Supabase response

**Fix #2 - Culture Disposal 409 Conflict Guard:**
- Problem: Disposing a culture twice caused 409 conflict error
- Root cause: No check for already-archived cultures
- Solution: Added guard clause in archiveCulture() to skip if already archived
- Added fresh state check in handleDisposalConfirm() before archiving
- Same guard added to archiveGrow()

**Fix #3 - Volume Display Improvements:**
- Problem: Tiny residue volumes (0.00001ml) displayed instead of "empty"
- Solution: Added normalizeVolume() helper to treat <0.5ml as zero
- Volume display now shows "empty (residue)" for tiny amounts
- Progress bar shows minimal sliver for residue state
- Cost-per-ml calculations use normalized volume to avoid division issues

**Fix #4 - Spawn Rate Calculator Units:**
- Added unit selector dropdown (g, kg, oz, lb) for weight inputs
- Calculations convert to grams internally for consistency
- Added "suggestion" feature: enter one value, see optimal other value
- Bidirectional calculation with Apply button

**TypeScript Fix:**
- Fixed null safety issue in AuthContext signOut closure
- Captured supabase reference before async function for TypeScript

**Files Changed:**
- src/lib/AuthContext.tsx - signOut state clearing order, null safety
- src/store/DataContext.tsx - archive guards for cultures and grows
- src/components/cultures/CultureManagement.tsx - fresh state check, volume display helpers
- src/components/tools/SpawnRateCalculator.tsx - unit selectors, suggestions`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1238',
    title: 'Database-Level Idempotent Archive & Unit Standardization',
    description: 'Fixed remaining 409 conflict errors with database-level idempotent operations. Standardized unit inputs across calculators using the polished WeightInput component.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    notes: `Comprehensive fixes for archive conflicts and unit standardization:

**Fix #1 - Database-Level Idempotent Archive (Critical):**
- Problem: 409 conflict still occurred despite local state guards
- Root cause: Local state can be stale; database might already have is_archived=true
- Solution: Added .eq('is_archived', false) to UPDATE queries
- If 0 rows affected, culture was already archived - skip amendment log
- Gracefully syncs local state to match database
- Same pattern applied to both archiveCulture() and archiveGrow()

**Fix #2 - Double-Click Protection in EntityDisposalModal:**
- Problem: Rapid clicks could trigger multiple disposal attempts
- Solution: Added isSubmitting state to disable buttons during processing
- Made onConfirm async-aware with Promise<void> return type
- Shows "Processing..." text while submitting
- Disabled Cancel button during submission to prevent escape

**Fix #3 - SubstrateCalculator Unit Standardization:**
- Refactored to use WeightInput component for weight fields
- Polished unit dropdowns matching New Grow modal style
- Each weight input has its own unit selection (g, kg, oz, lb)
- Percentage input styled to match (input + % suffix)
- Results display in user's preferred unit from settings
- Saved calculations show weights in preferred unit

**Technical Notes:**
- WeightInput stores values in grams internally
- User preferences from state.settings.defaultUnits
- Responsive design with flex layout

**Files Changed:**
- src/store/DataContext.tsx - database-level idempotent archive operations
- src/components/common/EntityDisposalModal.tsx - double-click protection, async handling
- src/components/tools/SubstrateCalculator.tsx - complete refactor with WeightInput`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1239',
    title: 'Timer Sound System & Knowledge Base Search',
    description: 'Fixed timer notification with proper synthesized audio sounds and added Knowledge Base/Culture Guide to global search.',
    category: 'enhancement',
    status: 'completed',
    priority: 'medium',
    notes: `Two improvements for user experience:

**Fix #1 - Timer Sound Notification:**
- Problem: Old timer used truncated/silent base64 audio
- Solution: Created Web Audio API-based synthesized sounds
- 6 sound options: Bell, Chime, Ding, Gong, Alert, None
- New utility: src/utils/timerSounds.ts
- Uses oscillator nodes to generate tones
- Volume control saved to user settings
- Added timerSound and timerVolume to AppSettings type
- Sound selector dropdown in Pressure Cooking Calculator timer

**Fix #2 - Knowledge Base in Global Search (Cmd+K):**
- Added Species & Strain Library page to search
- Added Culture Guide page and all 7 sections:
  - Culture Types Overview
  - P-Value System
  - Shelf Life by Generation
  - Recognizing Senescence
  - Culture Storage & Temperature
  - Expansion Ratios
  - Mycology Terminology
- Each section has relevant keywords for discoverability
- New search result types: 'page' and 'guide'
- Custom icons (Book, GraduationCap) for visual distinction

**Technical Notes:**
- Web Audio API works across all modern browsers
- Sounds are synthesized on-demand, no audio files needed
- Click-outside handler closes sound selector dropdown
- Settings persist to user preferences

**Files Changed:**
- src/store/types.ts - added TimerSoundType, timerSound, timerVolume to AppSettings
- src/utils/timerSounds.ts - NEW FILE - synthesized audio utility
- src/components/tools/PressureCookingCalculator.tsx - sound selector UI, Web Audio integration
- src/components/common/GlobalSearch.tsx - static search items for Knowledge Base`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1240',
    title: 'Culture Expansion Calculator & Enhanced Mycology Knowledge Base',
    description: 'New Culture Multiplication Calculator for P-value tracking, cost analysis, and expansion planning. Enhanced Culture Guide with fungal reproduction science, interactive app integration, and cold-sensitive species warnings.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    notes: `Comprehensive mycology education and practical tools:

**Feature #1 - Culture Expansion Calculator (NEW TOOL):**
- Full P-value (Generation) tracking system with senescence risk indicators
- Preset scenarios for P1, P2, P3 cultures with cost breakdowns
- Custom calculator mode for building expansion chains
- Expansion ratio recommendations (1:10 standard, warns if exceeding)
- Cold-sensitive species toggle with storage temperature guidance
- Cost per unit calculations through the expansion chain
- Shelf life estimates by generation (P0=6mo, P1=5mo, P2=3mo, P3=2mo)
- Visual workflow diagrams for expansion planning
- Links: /culture-multiplication route, Calculators nav section

**Feature #2 - Enhanced P-Value Display:**
- New PValueBadge component with senescence risk visualization
- Color-coded badges: emerald (P0-1), green (P2), amber (P3), orange (P4), red (P5+)
- Compact view for culture cards/tables with hover tooltip
- Full view for detail panels with shelf life and storage info
- Cold-sensitive species detection with storage warnings
- Integrated into CultureManagement card, table, and detail views

**Feature #3 - Cold-Sensitive Species System:**
- Updated species seed data with cold_sensitive flags
- Species requiring 10°C minimum: Pink Oyster, Golden Oyster, Reishi, Wood Ear, Phoenix Oyster
- ColdStorageCheck component shows warnings for affected cultures
- Storage temperature warnings in culture detail panel
- Shelf life utility functions updated with temperature guidance

**Feature #4 - Enhanced Culture Guide (Knowledge Base):**
- NEW: Fungal Reproduction section explaining dikaryotic/monokaryotic mycelium
- Content: Spore genetics, A/B mating types, commercial culture creation process
- Interactive "Related Tools" section linking to relevant calculators
- Context-sensitive tool suggestions based on active section
- Navigation integration with onNavigate prop
- 8 sections total: Overview, Reproduction, P-Value, Shelf Life, Senescence, Storage, Expansion, Terminology

**Educational Content Added (from RootLab Mycology):**
- How commercial cultures are created (4-step isolation process)
- Why dikaryotic mycelium matters for consistent results
- Agar plate edge vs center transfer guidance
- Species-specific senescence patterns (Cordyceps rapid, Oyster slow)
- Expansion cost analysis workflows with real pricing examples

**Files Changed:**
- src/components/tools/CultureMultiplicationCalculator.tsx - NEW FILE
- src/components/cultures/CultureManagement.tsx - PValueBadge component, enhanced displays
- src/components/dailycheck/ColdStorageCheck.tsx - cold-sensitive species warnings
- src/components/library/CultureGuide.tsx - Reproduction section, tool integration, onNavigate
- src/App.tsx - multiplication route, navigation item, CultureGuide navigation prop
- supabase-schema.sql - cold_sensitive species UPDATE statements`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1241',
    title: 'Substrate Workbench - Comprehensive Substrate Planning Tool',
    description: 'Complete redesign of the Substrate Calculator into a multi-tab Substrate Workbench with species integration, batch planning, and inventory awareness.',
    category: 'enhancement',
    status: 'completed',
    priority: 'high',
    notes: `Deep creative redesign of the substrate calculator into a comprehensive workbench:

**Tab 1 - Calculator (Enhanced Hydration Calculations):**
- Substrate type selection grid with moisture targets from database
- 4 calculation modes: Dry→Hydrated, Hydrated→Dry, Check Moisture, Spawn→Substrate
- Custom moisture override option
- Enhanced moisture bar with field capacity visualization
- Spawn rate analysis with optimal/high/low status indicators
- Quick reference section for field capacity test, spawn ratios, pasteurization

**Tab 2 - Species Match (NEW):**
- Species selector dropdown with scientific names
- Recommended substrates for each species (based on knowledge base)
- Substrate cards with difficulty rating (easy/moderate/advanced)
- Species-substrate compatibility matrix table
- Species include: Oysters, Lions Mane, Shiitake, Reishi, Wine Cap, etc.

**Tab 3 - Batch Planner (NEW):**
- Container list builder with name, count, weight per container
- Spawn rate input
- Automatic batch totals: containers, total substrate, water needed, spawn needed
- Dry substrate calculation at target moisture

**Tab 4 - Inventory Integration (NEW):**
- Shows substrate materials from inventory (coir, vermiculite, gypsum, etc.)
- Low stock warnings for materials below reorder point
- Substrate recipes section linking to Recipe Builder
- Preparation tips for common substrates (CVG ratio, coir prep, etc.)

**Species-Substrate Knowledge Base:**
- Mapping of species to preferred substrate codes
- Oysters: straw, masters mix, sawdust, HWFP, CVG
- Lions Mane/Shiitake: masters mix, supplemented sawdust
- Wine Cap: wood chips, straw
- Difficulty ratings and preparation tips per substrate

**Files Changed:**
- src/components/tools/SubstrateCalculator.tsx - COMPLETE REWRITE (450→1160 lines)
- src/components/icons/IconLibrary.tsx - Added Dna icon`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1242',
    title: 'Pressure Cooking Calculator - Item Tracking & Auto-Logging',
    description: 'Enhanced Pressure Cooking Calculator with item selection, sterilization logging, and automatic PreparedSpawn status updates when timer completes.',
    category: 'enhancement',
    status: 'completed',
    priority: 'medium',
    notes: `Enhanced the Pressure Cooking Calculator to track and log sterilization events:

**Item Selection:**
- "Items Being Sterilized" section with Add Item button
- Select from Prepared Spawn (needs sterilizing, reserved, or re-sterilize)
- Add custom items with name and quantity
- Shows item type icons and quantities

**Automatic Tracking:**
- When timer completes, updates all PreparedSpawn items with:
  - sterilizationDate = completion time
  - sterilizationMethod = "PC {psi}psi {minutes}min"
  - status = 'available' (ready for inoculation)
- Logs sterilization event with date, items, PSI, and time

**Session History:**
- View recent sterilizations (last 10)
- Shows date/time, PSI, duration, and items sterilized
- Toggle history panel visibility

**UI Improvements:**
- Dropdown selector with spawn categorization
- Prepared Spawn shows status badges (needs sterilizing, reserved, re-sterilize)
- Custom item input with quantity
- Item list with remove buttons
- Summary showing total items and units

**Files Changed:**
- src/components/tools/PressureCookingCalculator.tsx - Item tracking, auto-logging, history`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1243',
    title: 'Anonymous User Authentication Restrictions',
    description: 'Added isAuthenticated state and requireAuth helper to prevent anonymous users from attempting CRUD operations that would fail at the database level.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    notes: `Added authentication state tracking and restrictions:

**New State Variables:**
- isAuthenticated: boolean tracking if user is logged in with real account (not anonymous)
- Updated on auth state changes and initial load

**New Helper Function:**
- requireAuth(): throws descriptive error if not authenticated
- Components can call before CRUD operations or check isAuthenticated to hide edit buttons

**Auth State Updates:**
- Set during initial data load (checks isAnonymousUser)
- Updated on SIGNED_IN, TOKEN_REFRESHED, and SIGNED_OUT events
- Logs auth state changes in development mode

**Usage by Components:**
- Check isAuthenticated before showing add/edit/delete buttons
- Call requireAuth() before CRUD operations for belt-and-suspenders safety
- Error message directs users to create a free account

**Files Changed:**
- src/store/DataContext.tsx - isAuthenticated state, requireAuth helper, auth tracking`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1244',
    title: 'Feature Tracker Full-Screen Redesign',
    description: 'Complete redesign of the DevLog/Feature Tracker page with full-screen detail views, cleaner list design, improved search and filtering, and navigation between related features.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    notes: `Complete UI overhaul addressing user feedback that item details were too cramped:

**Full-Screen Detail View:**
- Clicking any feature opens it in a full-screen view (replaces list)
- Clean header with back button and status badge
- All feature metadata displayed clearly with room to breathe
- Dependencies section with clickable links to blocking features
- "Unlocks" section showing what this feature enables (reverse dependencies)
- Click related features to navigate directly to them

**Improved List View:**
- Cleaner FeatureListItem component with better visual hierarchy
- Status indicator dots instead of bulky badges
- Category tags as subtle pills
- Priority icons for quick scanning
- Hover states for interactivity

**Search & Filter:**
- Search input filters across title, description, ID, and notes
- Status dropdown filter (All, Planned, In Progress, Completed)
- Category dropdown filter
- Filters work together and persist during session

**View Modes:**
- Phases view: Collapsible sections by development phase
- List view: Flat list sorted by status (in_progress → planned → completed)
- View toggle persists during session

**Navigation:**
- Breadcrumb-style back navigation from detail view
- Direct links between related features via dependencies/unlocks
- Smooth transitions between views

**Files Changed:**
- src/components/devlog/DevLogPage.tsx - Complete rewrite (816 lines)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1245',
    title: 'Anonymous User UI Guards for CRUD Operations',
    description: 'Applied useAuthGuard hook to all CRUD operation entry points. Anonymous users now see the auth modal when trying to add, edit, or delete data instead of getting database errors.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    notes: `Implemented proactive UI guards for anonymous users:

**New Hook:**
- Created useAuthGuard hook in src/lib/useAuthGuard.ts
- Provides guardAction() function that shows auth modal if not authenticated
- Returns true if action should proceed, false if blocked

**Components Updated:**
- LabSpaces: Add/Edit/Delete location buttons
- SelectWithAdd: Inline "Add New" dropdown option
- StandardDropdown: "Add New" button
- CultureManagement: Create, Transfer, Observation, Delete handlers
- GrowManagement: Create, Edit, Advance Stage, Harvest, Observation handlers
- RecipeBuilder: Create, Save, Duplicate, Delete handlers
- StockManagement: Add lot, Add order handlers

**User Experience:**
- Anonymous users can browse/read all data
- Clicking add/edit/delete shows signup modal immediately
- No more confusing database errors for anonymous users
- Clear path to create account to unlock features

**Files Changed:**
- src/lib/useAuthGuard.ts (new)
- src/components/locations/LabSpaces.tsx
- src/components/common/SelectWithAdd.tsx
- src/components/common/StandardDropdown.tsx
- src/components/cultures/CultureManagement.tsx
- src/components/grows/GrowManagement.tsx
- src/components/recipes/RecipeBuilder.tsx
- src/components/inventory/StockManagement.tsx`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1246',
    title: 'Fix: Delete All My Data Not Actually Deleting Data',
    description: 'Fixed the "Delete All My Data" feature in Settings which was showing success but not actually archiving any records. Implemented the archiveAllUserData function in DataContext.',
    category: 'bug_fix',
    status: 'completed',
    priority: 'high',
    completedAt: timestamp(),
    notes: `Bug Report: User tried to delete all data in Settings but data remained after "success" message.

**Root Cause:**
- The UI for "Delete All My Data" (dev-1236) was implemented with a placeholder
- The actual archiveAllUserData function in DataContext was never created
- The onClick handler just waited 2 seconds and showed "success" without doing anything

**Fix Implemented:**
1. Added archiveAllUserData function to DataContext interface
2. Implemented bulk archive operation that:
   - Archives all cultures (sets is_archived=true)
   - Archives all grows (sets is_archived=true)
   - Archives all prepared spawn (sets is_archived=true)
   - Uses efficient batch UPDATE with IN clause
   - Logs to data_amendment_log for audit trail
3. Updated GrowerSettings to call actual function
4. REMOVES archived records from local state immediately (not just marking them)
5. Added database-level filters to exclude archived records on data load

**Technical Details:**
- Follows immutable database pattern (soft-delete via is_archived flag)
- Returns counts of archived records for user feedback
- Single audit log entry for bulk operation
- Local state removes archived records immediately (no page refresh needed)
- EntityLoader TABLE_CONFIGS filter out is_archived=true records on load

**Files Changed:**
- src/store/DataContext.tsx (added archiveAllUserData function, removes archived from state)
- src/components/settings/GrowerSettings.tsx (call actual function instead of placeholder)
- src/lib/db/EntityLoader.ts (added filter to exclude archived cultures, grows, prepared_spawn)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1239',
    phaseId: 32,
    title: 'Complete Database Reset Script',
    description: 'Added comprehensive SQL script to completely wipe and reset the Supabase database. Drops all tables, functions, triggers, policies, and custom types so schema can be rebuilt from scratch.',
    category: 'feature',
    status: 'completed',
    priority: 'medium',
    completedAt: timestamp(),
    notes: `New "nuclear option" reset script for complete database rebuild:

**Problem Solved:**
- Over time, database can accumulate orphaned tables, columns, and functions
- Schema drift between development versions leaves unused objects
- Idempotent schema script can't remove old objects it doesn't know about
- Need a clean slate option for major upgrades or fixing broken state

**Solution - supabase-reset-database.sql:**
Complete 8-phase database reset that drops everything in correct dependency order:

1. **Phase 1**: Drop auth.users triggers (on_auth_user_created, etc.)
2. **Phase 2**: Drop all RLS policies (using pg_policies catalog)
3. **Phase 3**: Drop all triggers on public tables (using pg_trigger catalog)
4. **Phase 4**: Drop all custom functions (auth, core, history, notification, bulk)
5. **Phase 5**: Drop all tables in reverse dependency order (6 tiers)
6. **Phase 6**: Drop custom types (enums like culture_type, grow_stage)
7. **Phase 7**: Cleanup orphaned objects (catch-all for anything missed)
8. **Phase 8**: Verify clean state (count remaining objects)

**Table Drop Order (Tier System):**
- Tier 1: Leaf tables (notifications, history, admin)
- Tier 2: Child tables (flushes, observations, transfers)
- Tier 3: Core entities (grows, cultures, recipes, inventory)
- Tier 4: Reference tables (locations, suppliers, containers)
- Tier 5: Base lookups (species, strains, substrate_types)
- Tier 6: Schema management (schema_version)

**Usage:**
1. Backup database first
2. Run supabase-reset-database.sql
3. Run supabase-schema.sql (recreate schema)
4. Run supabase-seed-data.sql (reference data)
5. Run supabase-species-data.sql (species/strains)

**Two Reset Options Now Available:**
| Script | Use Case | Preserves Schema | Preserves Seed Data |
|--------|----------|------------------|---------------------|
| wipe-user-data.sql | Clear user data | Yes | Yes |
| reset-database.sql | Complete rebuild | No | No |

**Files Changed:**
- Web App/supabase-reset-database.sql (NEW)
- Web App/supabase-wipe-user-data.sql (updated docs, added comparison)`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1302',
    title: 'Pressure Cook Lab Inventory Selection & Auto-Preset',
    description: 'Enhanced Pressure Cooking Calculator to select items from Lab Inventory with automatic preset suggestions. Fixed Lab Inventory page buttons.',
    category: 'enhancement',
    status: 'completed',
    priority: 'medium',
    phaseId: 30,
    notes: `Pressure Cooking Calculator - Lab Inventory Integration:

**New Feature - Lab Inventory Selection:**
- Added "Lab Inventory" section to item selector dropdown
- Auto-filters to show sterilizable items (jars, bags, grains, substrate, agar, tools, syringes)
- Each item shows available quantity and category
- Selecting an item auto-suggests appropriate preset (time/PSI)

**Auto-Preset Suggestions:**
- Maps inventory categories/names to PC presets:
  - grain → Grain Jars (Quart)
  - substrate → Sawdust Blocks
  - agar → Agar Plates
  - liquid → LC Jars
  - bags → Grain Bags
  - tools/syringes → Tools
- When item is selected, preset and quantity auto-update

**UI Improvements:**
- Inventory items show in blue (distinct from green spawn items)
- Selected items display their suggested preset in the item list
- Updated empty state text to mention lab inventory

**Bug Fix - Lab Inventory Buttons:**
- "Add Culture" and "Start Grow" buttons on Lab Inventory page now work
- Navigate to respective pages and trigger creation modals
- Uses standardized mycolab:create-new event system

**Files Changed:**
- src/components/tools/PressureCookingCalculator.tsx - Lab inventory selection, auto-preset
- src/components/inventory/UnifiedItemView.tsx - Fixed button handlers`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1303',
    title: 'First-Run Onboarding Wizard',
    description: 'Comprehensive onboarding wizard for new users with experience level, purpose, location setup, equipment selection, and strain preferences.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    phaseId: 25,
    notes: `First-Run Onboarding Wizard Implementation:

**Wizard Steps:**
1. **Welcome** - Introduction with skip option
2. **Experience Level** - Beginner, Intermediate, Advanced, Expert
3. **Growing Purpose** - Hobby, Commercial, Research, Mixed
4. **First Location** - Create initial grow space/room
5. **Equipment** - Select available lab equipment (PC, flow hood, SAB, etc.)
6. **Preferred Strains** - Choose species and strains of interest
7. **Complete** - Summary and start growing

**New Types Added:**
- GrowingPurpose: 'hobby' | 'commercial' | 'research' | 'mixed'
- LabEquipment interface: Tracks user's available equipment

**AppSettings Extended:**
- growingPurpose: Why the user is growing
- labEquipment: What equipment they have
- preferredSpeciesIds: Species of interest
- preferredStrainIds: Strains they want to grow

**Wizard Triggers:**
- Shows automatically for authenticated users who haven't completed setup
- hasCompletedSetupWizard flag marks completion
- Skippable at any step

**Experience-Based Features:**
- Beginners: Tooltips enabled, guided workflows on
- Intermediate: Standard UI
- Advanced/Expert: All features unlocked, no hand-holding

**Dashboard Enhancements:**
- Getting Started Guide for new/beginner users
- Purpose-specific welcome messages
- Step-by-step onboarding cards
- Tips panel for beginners

**Files Changed:**
- src/store/types.ts - GrowingPurpose, LabEquipment types, AppSettings updates
- src/components/setup/OnboardingWizard.tsx (NEW) - Full wizard component
- src/App.tsx - Import OnboardingWizard, add trigger logic
- src/components/dashboard/LabCommandCenter.tsx - GettingStartedGuide component`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-1304',
    title: 'UX Improvements: Explanatory Text & Wizard Enhancements',
    description: 'Added explanatory info boxes to all calculators and enhanced onboarding wizard with mushroom categories and setting consequences.',
    category: 'ux',
    status: 'completed',
    priority: 'medium',
    phaseId: 25,
    notes: `UX improvements for clarity and usability:

**Calculator Info Boxes Added:**
- PressureCookingCalculator - How pressure cooking works
- SubstrateCalculator - What hydration means and why it matters
- SpawnRateCalculator - What spawn rate is and how to use it
- BiologicalEfficiencyCalculator - What BE% means and why it matters
- CultureMultiplicationCalculator - What P-value is and senescence concerns

**Onboarding Wizard Enhancements:**
- Added consequence explanations for each experience level and purpose
- Changed species/strain selection to mushroom categories (Culinary, Medicinal, Research)
- Added info boxes to location and equipment steps
- Added equipment descriptions explaining what each enables
- Updated types.ts: preferredCategories instead of preferredSpeciesIds/preferredStrainIds

**Navigation Fixes:**
- Removed persistent "New Culture" button from header (too many buttons)
- Made nav category badge in GrowthTrail clickable (opens nav hub)

**Files Changed:**
- src/components/tools/PressureCookingCalculator.tsx - Info box, field helper text
- src/components/tools/SubstrateCalculator.tsx - Info box
- src/components/tools/SpawnRateCalculator.tsx - Info box
- src/components/analysis/BiologicalEfficiencyCalculator.tsx - Info box
- src/components/tools/CultureMultiplicationCalculator.tsx - Info box
- src/components/setup/OnboardingWizard.tsx - Categories, consequences, info boxes
- src/components/navigation/GrowthTrail.tsx - Clickable category badge
- src/App.tsx - Removed newButtonConfig entries
- src/store/types.ts - preferredCategories type change`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
];

export default recentPhases;
