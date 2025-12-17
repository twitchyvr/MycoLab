// ============================================================================
// DEV LOG: RECENT PHASES (28-30)
// Container Workflow, Inline Creation, Recent Development, v1.0 Priorities
// December 2024 Updates, UX Improvements
// ============================================================================

import type { DevLogFeature } from '../../types';

const timestamp = () => new Date().toISOString();

/**
 * Phase 28: Culture & Container Workflow (Critical Gaps)
 * Phase 29: Inline Creation & Draft Workflow (Critical UX Gap)
 * Phase 30: Recent Development (v0.9.0)
 * v1.0 Priorities
 * December 2024 Updates
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
];

export default recentPhases;
