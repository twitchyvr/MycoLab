// ============================================================================
// DEV LOG: MID PHASES (10-18)
// QR Labels, Notifications, Config, Infrastructure, Mobile, Search,
// UI Polish, Calculators, Virtual Lab
// ============================================================================

import type { DevLogFeature } from '../../types';

const timestamp = () => new Date().toISOString();

/**
 * Phase 10: QR Labels & Printing
 * Phase 11: Notifications & Automation
 * Phase 12: Lookup Tables & Configuration
 * Phase 13: Infrastructure & Deployment
 * Phase 14: Mobile & Responsive
 * Phase 15: Search & Data Management
 * Phase 16: UI Polish & Themes
 * Phase 17: Advanced Analysis & Calculators
 * Phase 18: Virtual Lab Features
 */
export const midPhases: DevLogFeature[] = [
  // =============================================================================
  // PHASE 10: QR LABELS & PRINTING
  // =============================================================================
  {
    id: 'dev-090',
    title: 'QR Code Generation',
    description: 'Generate QR codes for cultures, vessels, locations, grows. Encode item ID for quick lookup.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-091',
    title: 'Label Design & Printing',
    description: 'Design printable labels with QR codes. Support for thermal printers (WiFi and Bluetooth). PDF export for standard printers.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    dependencies: ['dev-090'],
    completedAt: '2025-12-15',
    notes: 'Added LabelDesigner with template system. Supports culture/grow/location labels with QR codes. Configurable label sizes (standard, thermal 2x1, 3x2, 4x6), QR position, colors. Print preview with multi-column layout and CSS print styling.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-092',
    title: 'QR Scanner Integration',
    description: 'Scan QR labels to instantly access culture/grow records. Mobile camera integration.',
    category: 'integration',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-090'],
    completedAt: '2025-12-15',
    notes: 'Added QRScanner component using html5-qrcode library. Features: camera selection, QR scanning, scan history, auto-navigation to records. Supports culture/grow/location/recipe/inventory QR codes. Validates records against database and navigates directly to entity detail view. Upgraded QR generation to use qrcode library for proper support of long URLs. Fixed camera initialization timing and label layout overlap issues.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 11: NOTIFICATIONS & AUTOMATION
  // =============================================================================
  {
    id: 'dev-100',
    title: 'Smart Notification System',
    description: 'Configurable alerts: expiring cultures, stage transitions due, low inventory, LC too old, slow-growing items. Push notifications.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 14,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-101',
    title: 'Customized Notifications per Strain',
    description: 'Set strain-specific notification rules: cultivation windows, substrate requirements, expected timelines',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-100', 'dev-020'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-102',
    title: 'Task Management & Reminders',
    description: 'Create to-do lists and task assignments for daily operations. Reminders for substrate prep, inoculation, harvesting.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 10,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 12: LOOKUP TABLES & CONFIGURATION
  // =============================================================================
  {
    id: 'dev-110',
    title: 'Lookup Table Management UI',
    description: 'Manage all lookup tables: strains, vendors, locations, vessels, ingredients, tools, procedures. Add/remove/update without breaking historical data.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 14,
    completedAt: timestamp(),
    notes: 'Settings page with 10 tabs: Database, Species, Strains, Locations, Vessels, Container Types, Substrate Types, Suppliers, Inventory Categories. Full CRUD for all lookup tables with modal forms.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-111',
    title: 'ID/Label Configuration',
    description: 'Configurable auto-generation of unique IDs. Custom prefixes, numbering schemes.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 4,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-112',
    title: 'Procedure Library',
    description: 'Step-by-step procedure documentation with linked tools and ingredients. Reusable SOPs.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 8,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 13: INFRASTRUCTURE & DEPLOYMENT
  // =============================================================================
  {
    id: 'dev-120',
    title: 'Supabase Database Integration',
    description: 'Cloud PostgreSQL with Supabase. Real-time sync, proper relational schema for all entities. Configurable via Settings.',
    category: 'data',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 20,
    actualHours: 18,
    completedAt: timestamp(),
    notes: 'Full Supabase integration with Settings UI. Idempotent schema (safe to run multiple times). Schema migrations for evolving columns. Write permission testing. RLS policies for anonymous access. 17 tables with full CRUD.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-121',
    title: 'API Layer (Node.js)',
    description: 'RESTful API with Express/Fastify. Full CRUD endpoints for all entities.',
    category: 'core',
    status: 'backlog',
    priority: 'critical',
    estimatedHours: 24,
    dependencies: ['dev-120'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-122',
    title: 'User Authentication',
    description: 'Login/registration, session management. Supabase Auth with Anonymous Sign-Ins for pre-auth data persistence. Email/password and Magic Link support.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 10,
    completedAt: timestamp(),
    dependencies: ['dev-120'],
    notes: 'Full auth system implemented: AuthContext for state management, AuthModal for login/signup/password reset, AccountMenu for user dropdown. Supports email/password, magic links, and anonymous-to-real account upgrade flow.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-123',
    title: 'Cloud File Storage',
    description: 'Azure Blob or DigitalOcean Spaces for photos. Secure upload, CDN delivery.',
    category: 'integration',
    status: 'backlog',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-121'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-124',
    title: 'Cloud Deployment (DigitalOcean/Azure)',
    description: 'Deploy to production. CI/CD pipeline, SSL, domain setup.',
    category: 'integration',
    status: 'backlog',
    priority: 'critical',
    estimatedHours: 12,
    dependencies: ['dev-121', 'dev-122'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-125',
    title: 'Anonymous Authentication for Settings Persistence',
    description: 'Enable settings persistence without requiring user login. Uses Supabase Anonymous Auth to create temporary user sessions that can later be upgraded to full accounts.',
    category: 'data',
    status: 'completed',
    priority: 'high',
    estimatedHours: 3,
    actualHours: 2,
    completedAt: timestamp(),
    dependencies: ['dev-120'],
    notes: `Implemented in AuthContext.tsx with ensureSession() function. Anonymous users get full data persistence and can upgrade to real accounts via upgradeAnonymousAccount() which preserves all their data.`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-126',
    title: 'Supabase Auth Email Templates',
    description: 'Custom branded email templates for all Supabase authentication flows. Dark theme matching Sporely UI with emerald accents.',
    category: 'ui',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 1,
    dependencies: ['dev-122'],
    completedAt: timestamp(),
    notes: `6 branded HTML email templates created:
- Confirm Signup ({{ .ConfirmationURL }}, {{ .Email }})
- Invite User ({{ .ConfirmationURL }}, {{ .Email }})
- Magic Link ({{ .ConfirmationURL }}, {{ .Email }})
- Change Email Address ({{ .ConfirmationURL }}, {{ .Email }}, {{ .NewEmail }})
- Reauthentication ({{ .Token }}, {{ .Email }}) - code display style
- Reset Password ({{ .ConfirmationURL }}, {{ .Email }})

All templates use consistent Sporely branding:
- Dark zinc background (#18181b, #27272a)
- Emerald green accents (#10b981)
- Mushroom emoji logo
- Responsive table-based layout for email client compatibility`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-127',
    title: 'CAPTCHA Bot Protection (Cloudflare Turnstile)',
    description: 'Bot protection for auth flows using Cloudflare Turnstile. Invisible challenge that only escalates when suspicious activity detected.',
    category: 'integration',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 1,
    dependencies: ['dev-122'],
    notes: `Cloudflare Turnstile selected over hCaptcha:
- Free unlimited usage (no tiers)
- Invisible/frictionless UX (no image puzzles)
- Fast verification (~2-3 seconds)
- Privacy-focused, GDPR compliant
- Native Supabase integration

Setup:
1. Cloudflare Dashboard → Turnstile → Create widget
2. Get Site Key + Secret Key
3. Supabase → Authentication → Attack Protection → Enable CAPTCHA
4. Select Turnstile, paste keys`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-128',
    title: 'Microsoft 365 SMTP Configuration',
    description: 'Custom SMTP setup using Microsoft 365/Azure tenant for branded email delivery from noreply@sporely.co.',
    category: 'integration',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 1,
    dependencies: ['dev-126'],
    notes: `SMTP Settings for M365:
- Host: smtp.office365.com
- Port: 587 (STARTTLS)
- Username: noreply@sporely.co
- Password: App Password (if MFA) or account password (with SMTP AUTH enabled)

Prerequisites:
- Enable "Authenticated SMTP" in M365 Admin Center for the mailbox
- Or create App Password if MFA is enabled
- Sender email must match SMTP username exactly`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 14: MOBILE & RESPONSIVE
  // =============================================================================
  {
    id: 'dev-130',
    title: 'Mobile-First Responsive Design',
    description: 'Full mobile experience for lab use. Touch-friendly, quick logging. Scrollable sidebar, no content overflow.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 16,
    actualHours: 12,
    notes: 'Modal scrolling fixed - tall forms now scrollable on all screen sizes. CSS overflow fixes applied globally. Buttons always accessible. Settings page responsive with collapsible tabs. Touch-friendly inputs (44px min height), safe area support for notched devices, responsive typography utilities, improved sidebar with visible close button.',
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-131',
    title: 'PWA (Progressive Web App)',
    description: 'Installable app, offline capability, push notifications.',
    category: 'integration',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 12,
    dependencies: ['dev-130', 'dev-100'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-132',
    title: 'Native Mobile App (React Native)',
    description: 'Dedicated iOS/Android app for best mobile experience.',
    category: 'integration',
    status: 'backlog',
    priority: 'nice_to_have',
    estimatedHours: 80,
    dependencies: ['dev-121'],
    notes: 'Future consideration after web app is stable',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 15: SEARCH & DATA MANAGEMENT
  // =============================================================================
  {
    id: 'dev-140',
    title: 'Global Search',
    description: 'Search across all entities: cultures, grows, strains, recipes. Advanced filtering.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 10,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-141',
    title: 'Data Export/Import',
    description: 'Export to CSV/JSON. Backup/restore functionality. Data portability.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 8,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-142',
    title: 'Bulk Operations',
    description: 'Bulk update, delete, archive items. Batch imports.',
    category: 'core',
    status: 'backlog',
    priority: 'low',
    estimatedHours: 6,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 16: UI POLISH & THEMES
  // =============================================================================
  {
    id: 'dev-150',
    title: 'Dark/Light Theme Toggle',
    description: 'User-selectable theme with system preference detection.',
    category: 'ui',
    status: 'backlog',
    priority: 'low',
    estimatedHours: 4,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-151',
    title: 'Accessibility Improvements',
    description: 'WCAG compliance, keyboard navigation, screen reader support.',
    category: 'ui',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 10,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 17: ADVANCED ANALYSIS & CALCULATORS
  // =============================================================================
  {
    id: 'dev-160',
    title: 'Contamination Pattern Analysis',
    description: 'Log contamination type, timing, stage. Analyze patterns: "Trich at day 7 = sterilization vs day 2 = bacterial". Track contam rates by variable (grain type, season, PC time).',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 10,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-161',
    title: 'Biological Efficiency Calculator',
    description: 'Auto-calculate BE% = (fresh mushroom weight / dry substrate weight) × 100. Track per strain, method, substrate. Compare performance.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 5,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-162',
    title: 'Transfer Generation Tracking',
    description: 'Explicit T0 → T1 → T2 numbering. Track genetic degradation over transfers. Alerts when generation too high.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    dependencies: ['dev-014'],
    notes: 'Integrated into Culture Management with automatic generation increment on transfers',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-163',
    title: 'Spawn Rate Calculator',
    description: 'Quick calculator for spawn:substrate ratios (1:2, 1:4, etc.). Calculate amounts needed for target batch size.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 3,
    actualHours: 3,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-164',
    title: 'Culture Viability Reminders',
    description: 'Track days since last transfer. Alert when culture needs subculturing or viability testing. Species-specific thresholds.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    dependencies: ['dev-100'],
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-165',
    title: 'Batch Correlation & Tracking',
    description: 'Link specific agar/grain/substrate batches to outcomes. Track batch-level contam rates. Identify problematic batches.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-166',
    title: 'Pressure Cooking Calculator',
    description: 'Calculate PC times for different volumes/materials at different PSI. Altitude adjustment. Safety margins.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 4,
    actualHours: 4,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-167',
    title: 'Media Scaling Calculator',
    description: 'Scale agar/LC recipes up or down (10 plates → 50 plates). Maintain ratios. Auto-calculate ingredient amounts.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 4,
    actualHours: 2,
    completedAt: timestamp(),
    notes: 'Integrated into Recipe Builder with 0.5x-5x scaling slider',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-168',
    title: 'Timeline/Gantt View',
    description: 'Visual timeline of all active grows overlaid. Show start dates, current stage, expected completion. Identify bottlenecks.',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 14,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-169',
    title: 'Calendar Integration',
    description: 'Push expected dates to Google Calendar / iCal. Sync harvest predictions, transfer reminders, stage transitions.',
    category: 'integration',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 10,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-170',
    title: 'Microscopy Log',
    description: 'Dedicated logging for spore/culture examination under microscope. Spore measurements, contamination identification, health assessment.',
    category: 'core',
    status: 'planned',
    priority: 'low',
    estimatedHours: 6,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-171',
    title: 'Printable Log Sheets',
    description: 'PDF export for paper logging in the lab. Pre-formatted sheets for agar work, inoculation, harvest. QR code links back to digital records.',
    category: 'core',
    status: 'backlog',
    priority: 'low',
    estimatedHours: 8,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-172',
    title: 'Failure Mode Categories',
    description: 'Pre-defined failure modes with guided logging. Contamination types, stage of failure, suspected causes. Build knowledge base over time.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 6,
    dependencies: ['dev-160'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-173',
    title: 'Phenotype Tracking',
    description: 'Log visual characteristics: cap color, stem length, cluster size, print color, growth pattern (rhizo vs tomentose). Compare across genetics.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-174',
    title: 'Clone Tracking Workflow',
    description: 'Special workflow for tissue clones vs spore-derived cultures. Track clone source (cap, stem, inner tissue). Document selection criteria.',
    category: 'core',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 6,
    dependencies: ['dev-014'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-175',
    title: 'Weather/Season Correlation',
    description: 'Optional ambient condition logging. Track outdoor temp, humidity, barometric pressure. Correlate with grow outcomes for pattern detection.',
    category: 'enhancement',
    status: 'backlog',
    priority: 'low',
    estimatedHours: 8,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 18: VIRTUAL LAB FEATURES
  // =============================================================================
  {
    id: 'dev-180',
    title: 'Statistical Analysis Engine',
    description: 'Analyze performance by variable. "Your B+ performs 23% better at 76°F vs 72°F". Confidence intervals, sample size warnings.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 20,
    dependencies: ['dev-081'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-181',
    title: 'Predictive Scheduling',
    description: 'Based on strain + conditions, predict timeline. "Expect pins in 4 days". Machine learning from historical data.',
    category: 'enhancement',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 24,
    dependencies: ['dev-180'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-182',
    title: 'SOP Library & Linking',
    description: 'Standardized Operating Procedures linked to every action. Deviation logging. Procedure version control.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 12,
    dependencies: ['dev-112'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-183',
    title: 'Full Audit Trail',
    description: 'Every change logged with timestamp, user, before/after. Lab notebook compliance. Immutable history.',
    category: 'core',
    status: 'backlog',
    priority: 'high',
    estimatedHours: 14,
    dependencies: ['dev-121'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-184',
    title: 'Batch Release Criteria',
    description: 'Define release criteria: "Spawn ready when: colonization 100% + no contam + 14 days minimum". Auto-flag when criteria met.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 8,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-185',
    title: 'Closed-Loop Feedback System',
    description: 'Environmental data auto-correlated with outcomes. Identify optimal conditions automatically. Recommendations engine.',
    category: 'enhancement',
    status: 'backlog',
    priority: 'high',
    estimatedHours: 30,
    dependencies: ['dev-200', 'dev-180'],
    notes: 'Requires sensor integration + statistical engine',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
];

export default midPhases;
