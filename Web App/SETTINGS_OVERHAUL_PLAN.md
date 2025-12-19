# Settings & Admin System Overhaul Plan

## Current Issues

1. **Database tab separate from Admin** - Should be part of admin console
2. **Too many tabs (12)** - Overwhelming for all users
3. **No role-based visibility** - Anonymous users see admin-level settings
4. **No experience level** - Can't differentiate beginner vs advanced users
5. **No suggestion system** - Users can't propose new library entries
6. **No admin-grower communication** - No way to discuss suggestions/requests
7. **Mixed concerns** - Preferences mixes basic settings with complex notification config

---

## New Architecture

### User Types & Their Settings Access

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANONYMOUS USER (Local Only)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ⚙️ Quick Settings (Minimal)                                                 │
│  ├── Units: Metric (°C, g, ml) / Imperial (°F, oz, fl oz)                  │
│  ├── Theme: Dark/Light/System                                               │
│  ├── Currency: USD/EUR/GBP/CAD                                              │
│  └── [Sign Up Prompt] "Create an account to sync your data and unlock      │
│       full features"                                                         │
│                                                                              │
│  📖 Library (Read-Only)                                                      │
│  ├── Browse global species, strains, substrates                            │
│  └── View cultivation parameters (no editing)                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         GROWER (Authenticated User)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  👤 Profile                                                                  │
│  ├── Display name, avatar                                                   │
│  ├── Email & password management                                            │
│  ├── Account deletion                                                        │
│  └── Subscription status (if applicable)                                    │
│                                                                              │
│  ⚙️ Preferences                                                              │
│  ├── Experience Level: [Beginner] [Intermediate] [Advanced] [Expert]       │
│  │   └── Controls complexity of UI throughout app                          │
│  ├── Units, Currency, Timezone                                              │
│  ├── Theme/Appearance                                                        │
│  └── Advanced Mode toggle (shows all customization options)                 │
│                                                                              │
│  🔔 Notifications                                                            │
│  ├── Email settings + verification                                          │
│  ├── SMS settings + verification                                            │
│  ├── Event preferences (what to notify about)                               │
│  └── Quiet hours                                                             │
│                                                                              │
│  📍 My Locations                                                             │
│  ├── Personal locations (full CRUD)                                         │
│  └── Location types & classifications for MY locations                      │
│                                                                              │
│  📖 Library (View + Suggest)                                                 │
│  ├── Browse all global library entries (read-only)                          │
│  ├── Submit suggestions for new entries                                     │
│  ├── View status of my submissions                                          │
│  └── Respond to admin feedback                                              │
│                                                                              │
│  💾 Data Management                                                          │
│  ├── Export my data (JSON/CSV)                                              │
│  ├── Import data                                                             │
│  └── Clear local cache                                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN (Global Admin)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  [All Grower Settings Above, PLUS:]                                         │
│                                                                              │
│  🛡️ Admin Console                                                           │
│  ├── 📊 Dashboard                                                            │
│  │   ├── System health overview                                              │
│  │   ├── User statistics                                                     │
│  │   ├── Pending suggestions count                                           │
│  │   └── Recent admin notifications                                          │
│  │                                                                           │
│  ├── ☁️ Database                                                             │
│  │   ├── Connection status                                                   │
│  │   ├── Table health check                                                  │
│  │   ├── Schema version & updates                                            │
│  │   └── Data refresh controls                                               │
│  │                                                                           │
│  ├── 👥 User Management                                                      │
│  │   ├── User list with search/filter                                        │
│  │   ├── Edit user profiles                                                  │
│  │   ├── Grant/revoke admin                                                  │
│  │   ├── Activate/deactivate accounts                                        │
│  │   └── Subscription tier management                                        │
│  │                                                                           │
│  ├── 📚 Library Management                                                   │
│  │   ├── Species (full CRUD, set as global)                                 │
│  │   ├── Strains (full CRUD, set as global)                                 │
│  │   ├── Containers (full CRUD, set as global)                              │
│  │   ├── Substrate Types (full CRUD, set as global)                         │
│  │   ├── Grain Types (full CRUD, set as global)                             │
│  │   ├── Suppliers (full CRUD, set as global)                               │
│  │   ├── Inventory Categories (full CRUD, set as global)                    │
│  │   ├── Location Types (full CRUD, set as global)                          │
│  │   └── Location Classifications (full CRUD, set as global)                │
│  │                                                                           │
│  ├── 📬 Suggestion Queue                                                     │
│  │   ├── Pending suggestions list                                            │
│  │   ├── Review & approve/reject workflow                                    │
│  │   ├── Request changes from user                                           │
│  │   ├── Direct message to suggester                                         │
│  │   └── Bulk actions                                                        │
│  │                                                                           │
│  ├── 🔔 Admin Notifications                                                  │
│  │   ├── New user signups                                                    │
│  │   ├── Suggestion submissions                                              │
│  │   ├── System warnings/errors                                              │
│  │   └── Mark as read / dismiss                                              │
│  │                                                                           │
│  ├── 📜 Audit Log                                                            │
│  │   ├── Admin action history                                                │
│  │   ├── Filter by action type, admin, date                                 │
│  │   └── Export audit log                                                    │
│  │                                                                           │
│  └── ⚡ Services Config                                                      │
│      ├── Email service (Resend/SendGrid)                                     │
│      ├── SMS service (Twilio)                                                │
│      ├── Test notifications                                                  │
│      └── Environment variable reference                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Experience Level System

Users can choose their experience level, which affects UI complexity:

| Level | Description | UI Behavior |
|-------|-------------|-------------|
| **Beginner** | New to cultivation | - Simplified forms with sensible defaults<br>- Tooltips & explanations shown<br>- Advanced options hidden<br>- Guided workflows |
| **Intermediate** | Some experience | - Standard forms<br>- Tooltips on hover<br>- Common advanced options visible |
| **Advanced** | Experienced grower | - All options visible<br>- Minimal hand-holding<br>- Quick-access shortcuts |
| **Expert** | Power user | - Full customization<br>- Bulk operations<br>- Advanced analytics<br>- API access |

---

## Library Suggestion System

### Database Schema

```sql
-- Suggestions table
CREATE TABLE library_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What type of entry is being suggested
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'species', 'strain', 'container', 'substrate_type', 'grain_type',
    'supplier', 'inventory_category', 'location_type', 'location_classification'
  )),

  -- The suggested data (JSON matches the target table structure)
  suggested_data JSONB NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting admin review
    'under_review', -- Admin is looking at it
    'changes_requested', -- Admin requested changes
    'approved',     -- Accepted, will be added to library
    'rejected',     -- Not accepted
    'merged'        -- Already exists, merged with existing
  )),

  -- Admin handling
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,           -- Internal notes for admins
  rejection_reason TEXT,       -- Shown to user if rejected

  -- Communication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestion messages (for back-and-forth communication)
CREATE TABLE suggestion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES library_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin_message BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_suggestions_user ON library_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON library_suggestions(status);
CREATE INDEX idx_suggestions_type ON library_suggestions(suggestion_type);
CREATE INDEX idx_suggestion_messages ON suggestion_messages(suggestion_id);
```

### Workflow

```
User submits suggestion
        ↓
  [Status: pending]
        ↓
Admin receives notification
        ↓
Admin reviews suggestion
        ↓
   ┌────┴────────────┬─────────────────┐
   ↓                 ↓                 ↓
[Approve]     [Request Changes]    [Reject]
   ↓                 ↓                 ↓
Entry added    User notified      User notified
to library     User revises       with reason
   ↓                 ↓
User notified  Resubmit → pending
```

---

## New Component Structure

```
src/components/settings/
├── SettingsPage.tsx              # Router/wrapper that shows correct view
├── common/
│   ├── SettingsSection.tsx       # Reusable section wrapper
│   ├── SettingsToggle.tsx        # Toggle switch component
│   └── SettingsField.tsx         # Form field component
├── anonymous/
│   └── AnonymousSettings.tsx     # Minimal settings for anonymous users
├── grower/
│   ├── GrowerSettings.tsx        # Main grower settings page
│   ├── ProfileSection.tsx        # Profile management
│   ├── PreferencesSection.tsx    # User preferences
│   ├── NotificationSection.tsx   # Notification settings
│   ├── MyLocationsSection.tsx    # Personal locations
│   ├── LibraryBrowser.tsx        # Read-only library view
│   ├── MySuggestions.tsx         # User's suggestion submissions
│   └── DataManagement.tsx        # Export/import
├── admin/
│   ├── AdminConsole.tsx          # Main admin dashboard
│   ├── AdminDashboard.tsx        # Overview stats
│   ├── DatabaseSection.tsx       # DB health & config
│   ├── UserManagement.tsx        # User CRUD (existing)
│   ├── LibraryManagement.tsx     # Library entry CRUD
│   ├── SuggestionQueue.tsx       # Review suggestions
│   ├── AdminNotifications.tsx    # Admin alerts (existing)
│   ├── AuditLog.tsx              # Audit trail (existing)
│   └── ServicesConfig.tsx        # Email/SMS config (existing)
└── shared/
    └── LibraryEntryForm.tsx      # Shared form for library entries
```

---

## New Types

```typescript
// Experience level for UI complexity
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Suggestion types
type SuggestionType =
  | 'species'
  | 'strain'
  | 'container'
  | 'substrate_type'
  | 'grain_type'
  | 'supplier'
  | 'inventory_category'
  | 'location_type'
  | 'location_classification';

type SuggestionStatus =
  | 'pending'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'merged';

interface LibrarySuggestion {
  id: string;
  userId: string;
  suggestionType: SuggestionType;
  suggestedData: Record<string, any>;
  status: SuggestionStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SuggestionMessage {
  id: string;
  suggestionId: string;
  userId: string;
  message: string;
  isAdminMessage: boolean;
  createdAt: Date;
}

// Updated AppSettings
interface AppSettings {
  // Basic preferences
  defaultUnits: 'metric' | 'imperial';
  defaultCurrency: string;
  timezone: string;

  // NEW: Experience level
  experienceLevel: ExperienceLevel;
  advancedMode: boolean;  // Override to show everything

  // Notifications (existing)
  notifications: NotificationSettings;

  // ... rest of existing settings
}
```

---

## Implementation Phases

### Phase 1: Database & Types (This Session)
- [ ] Add `experience_level` and `advanced_mode` to user_settings schema
- [ ] Create `library_suggestions` and `suggestion_messages` tables
- [ ] Add RLS policies for new tables
- [ ] Update TypeScript types

### Phase 2: Component Restructure (This Session)
- [ ] Create new component folder structure
- [ ] Build `AnonymousSettings` component
- [ ] Build `GrowerSettings` with all sections
- [ ] Refactor `AdminConsole` to include Database section
- [ ] Update `SettingsPage` to route to correct component based on role

### Phase 3: Suggestion System (This Session)
- [ ] Build `LibraryBrowser` for read-only viewing
- [ ] Build `MySuggestions` for user submissions
- [ ] Build `SuggestionQueue` for admin review
- [ ] Add notification triggers for suggestions

### Phase 4: Experience Level Integration (Follow-up)
- [ ] Add experience level selector to preferences
- [ ] Create helper hook `useExperienceLevel()`
- [ ] Update key forms/components to respect experience level
- [ ] Add tooltips/guidance for beginner mode

---

## UI/UX Principles

1. **Progressive Disclosure** - Show simple by default, reveal complexity on demand
2. **Role-Appropriate** - Only show what the user can actually do
3. **Consistent Grouping** - Related settings together, not scattered
4. **Clear Hierarchy** - Admin > Database > Tables, not Admin | Database
5. **Action Feedback** - Every action shows immediate result/confirmation
6. **Breadcrumbs** - Know where you are in deep settings

---

## Migration Notes

- Existing settings will map to `experienceLevel: 'intermediate'`
- Anonymous users get `localStorage` only settings
- Admin tabs consolidate into single Admin Console
- Database section moves under Admin Console
- Individual library tabs (Species, Strains, etc.) merge into Library Management

---

## Questions for User

1. Should anonymous users be able to submit suggestions (with email for follow-up)?
2. Should there be a "suggestion reputation" system (trusted contributors)?
3. Do we want notification badges showing pending suggestions count for admins?
4. Should approved suggestions credit the original suggester?
