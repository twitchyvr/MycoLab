# MycoLab Public Sharing & Batch Passport Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding **public shareable links**, **batch passports**, **role-based access control**, and **enhanced customer transparency features** to MycoLab, following industry best practices for secure, scalable, and user-friendly public-facing applications.

---

## Part 1: Gap Analysis - User Spec vs. Existing Roadmap

### Feature Comparison Matrix

| User Spec Feature | Existing in Roadmap? | Status | Gap Analysis |
|-------------------|---------------------|--------|--------------|
| **Full Lineage Tracking** (spore → harvest) | ✅ Yes (dev-014, dev-015) | Completed | Core lineage exists, needs vendor/lot number fields |
| **Container/Event Timeline** | ✅ Yes (dev-062, dev-801) | Completed | Observation system exists |
| **Temperature/Humidity Logging** | ✅ Yes (dev-460, dev-461) | Planned | Manual logging planned, IoT foundation ready |
| **Harvest Weights & BE%** | ✅ Yes (dev-013, dev-080, dev-161) | Completed | Full implementation exists |
| **Failed Runs Preserved** | ✅ Yes (dev-911) | Completed | Outcome logging system exists |
| **Audit Trail Export** | 🟡 Partial (dev-452, dev-453) | Planned | Export planned, no audit trail yet |
| **PDF Export** | 🟡 Partial (dev-451) | Planned | No implementation yet |
| **Public Batch Passport** | ❌ NO | Not in roadmap | **CRITICAL GAP** |
| **Redacted Public Views** | ❌ NO | Not in roadmap | **CRITICAL GAP** |
| **Shareable Links & QR Codes** | 🟡 Partial (dev-090-092) | Completed | QR exists for internal use only |
| **Role-Based Views** (owner/auditor/customer) | ❌ NO | Not in roadmap | **CRITICAL GAP** |
| **Living Species Library** | ✅ Yes (dev-020, dev-710) | Completed | 35+ species with full parameters |
| **Citation System for Library** | ❌ NO | Not in roadmap | **NEW FEATURE** |
| **Community Contributions** | 🟡 Partial (dev-202) | Backlog | v2.0 consideration |
| **Strain Mastery Badges** | ❌ NO | Not in roadmap | **NEW FEATURE** |
| **Smart Notifications** | ✅ Yes (dev-100, dev-802) | Partially Complete | Core exists, needs expansion |
| **IoT Sensor Integration** | 🟡 Partial (dev-200) | Backlog | Future feature |
| **Weather API Correlation** | 🟡 Partial (dev-175) | Backlog | Low priority |
| **AI Foundation (data structure)** | ✅ Yes | In Progress | Data structured for future ML |

### Critical Gaps Identified

1. **Public Sharing System** - No mechanism to share grows/cultures publicly
2. **Token-Based Access** - No secure share tokens for anonymous access
3. **Role-Based Views** - No view filtering by permission level
4. **Data Redaction** - No ability to hide sensitive fields from public view
5. **Batch Passport** - No "Digital Product Passport" concept
6. **Customer Portal** - No way for buyers to view purchase lineage
7. **Citation System** - Species library lacks source documentation
8. **Reputation/Mastery** - No user credibility system

---

## Part 2: Industry Best Practices Applied

### 2.1 Secure Public Sharing (Token-Based Access)

Based on [API Security Best Practices 2025](https://www.globaldots.com/resources/blog/10-api-security-best-practices/):

**Implementation Pattern:**
```
share_tokens table:
- token: Opaque random string (NOT JWT - per security best practices)
- entity_type: 'grow' | 'culture' | 'batch' | 'recipe'
- entity_id: UUID of shared entity
- permissions: JSON with allowed fields
- expires_at: Short-lived by default (configurable)
- view_count: Analytics
- created_by: Owner user_id
```

**Key Principles:**
- Use **opaque tokens** (random strings), not JWTs for public links
- Short expiration by default (30 days, configurable)
- Token revocation capability
- Rate limiting on public endpoints
- No sensitive data in URLs

### 2.2 Digital Product Passport (DPP) Standards

Based on [EU ESPR and GS1 Standards](https://www.circularise.com/blogs/digital-product-passports-dpp-what-how-and-why):

**Implementation Pattern:**
```
batch_passports table:
- id: UUID (internal)
- passport_code: GS1-compatible identifier (optional)
- entity_type: 'grow' | 'culture' | 'batch'
- entity_id: UUID of tracked entity
- public_fields: JSON defining visible data
- redacted_fields: JSON defining hidden data
- qr_data_url: Cached QR image
- lineage_snapshot: Frozen lineage data at time of creation
- created_at, updated_at
```

**DPP Best Practices Applied:**
- Unique identifier per passport (shareable)
- Machine-readable structured data
- Includes origin, materials, process, certifications
- Immutable lineage snapshot (prevents post-hoc modifications)
- QR code links to live passport view

### 2.3 Role-Based Access Control (RBAC)

Based on [Supabase RBAC with RLS](https://supabase.com/docs/database/postgres/custom-claims-and-role-based-access-control-rbac):

**Role Hierarchy:**
```
owner     → Full access (CRUD, share, redact, delete)
admin     → Full access minus delete
auditor   → Read all fields including costs/failures
customer  → Read public fields only (redacted view)
anonymous → Read public passport only
```

**Implementation Pattern:**
```sql
-- RLS Policy for public views
CREATE POLICY "public_view_policy" ON grows
  FOR SELECT
  USING (
    -- Owner always sees everything
    auth.uid() = user_id
    OR
    -- Public passport exists and viewer has valid token
    EXISTS (
      SELECT 1 FROM share_tokens
      WHERE share_tokens.entity_id = grows.id
        AND share_tokens.token = current_setting('app.share_token', true)
        AND share_tokens.expires_at > NOW()
    )
  );
```

---

## Part 3: Database Schema Design

### 3.1 New Tables Required

```sql
-- ============================================================================
-- PUBLIC SHARING SYSTEM
-- ============================================================================

-- Share tokens for public/anonymous access
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Token is opaque random string (NOT JWT)
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- What is being shared
  entity_type TEXT NOT NULL CHECK (entity_type IN ('grow', 'culture', 'batch', 'recipe', 'lineage')),
  entity_id UUID NOT NULL,

  -- Access control
  access_level TEXT DEFAULT 'customer' CHECK (access_level IN ('customer', 'auditor')),
  permissions JSONB DEFAULT '{}',

  -- Expiration & analytics
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Revocation
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch passports (Digital Product Passport)
CREATE TABLE IF NOT EXISTS batch_passports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Unique passport identifier (shareable, human-readable)
  passport_code TEXT UNIQUE NOT NULL, -- e.g., "ML-2024-12-0001"

  -- What this passport represents
  entity_type TEXT NOT NULL CHECK (entity_type IN ('grow', 'culture', 'batch')),
  entity_id UUID NOT NULL,

  -- Public/Redacted field configuration
  -- JSON object mapping field names to visibility
  -- e.g., {"strain": true, "cost": false, "location_address": false}
  field_visibility JSONB DEFAULT '{}',

  -- Custom public notes (seller-written)
  public_description TEXT,
  public_notes TEXT,
  seller_name TEXT,
  seller_contact TEXT,

  -- Lineage snapshot (frozen at passport creation)
  -- Stores full lineage tree to prevent post-hoc modifications
  lineage_snapshot JSONB,

  -- QR Code data
  qr_data_url TEXT,
  qr_short_url TEXT,

  -- Status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- View analytics for passports
CREATE TABLE IF NOT EXISTS passport_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passport_id UUID REFERENCES batch_passports(id) ON DELETE CASCADE,

  -- Viewer info (anonymous - no PII stored)
  viewer_token TEXT, -- Hashed session token
  ip_hash TEXT, -- Hashed IP for fraud detection
  user_agent TEXT,
  referrer TEXT,

  -- Geolocation (optional, city-level only)
  geo_country TEXT,
  geo_region TEXT,

  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Field redaction presets (templates for common redaction patterns)
CREATE TABLE IF NOT EXISTS redaction_presets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,

  -- Field visibility template
  field_visibility JSONB NOT NULL,

  -- Which entity types this preset applies to
  applies_to TEXT[] DEFAULT ARRAY['grow', 'culture', 'batch'],

  -- Ownership
  is_system BOOLEAN DEFAULT false, -- System presets available to all
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Field Visibility Schema

```typescript
// TypeScript interface for field_visibility JSON
interface FieldVisibility {
  // Grow fields
  strain?: boolean;           // true = show, false = hide
  substrate_type?: boolean;
  spawn_weight?: boolean;
  substrate_weight?: boolean;
  container?: boolean;
  location?: boolean;         // General location (e.g., "Pacific Northwest")
  location_address?: boolean; // Specific address - ALWAYS default false

  // Timeline/dates
  inoculation_date?: boolean;
  colonization_date?: boolean;
  fruiting_date?: boolean;
  harvest_dates?: boolean;

  // Yields
  total_yield?: boolean;
  flush_weights?: boolean;
  biological_efficiency?: boolean;

  // Observations
  observations?: boolean;
  photos?: boolean;

  // Sensitive data - DEFAULT FALSE
  cost?: boolean;
  failures?: boolean;
  contamination_history?: boolean;
  supplier_info?: boolean;
  recipe_details?: boolean;
  notes?: boolean;
}
```

### 3.3 Default Redaction Presets

```sql
INSERT INTO redaction_presets (name, description, field_visibility, is_system) VALUES
(
  'Customer View (Default)',
  'Standard view for customers - shows product quality, hides business details',
  '{
    "strain": true,
    "substrate_type": true,
    "spawn_weight": false,
    "substrate_weight": false,
    "container": true,
    "location": true,
    "location_address": false,
    "inoculation_date": true,
    "colonization_date": true,
    "fruiting_date": true,
    "harvest_dates": true,
    "total_yield": true,
    "flush_weights": true,
    "biological_efficiency": true,
    "observations": true,
    "photos": true,
    "cost": false,
    "failures": false,
    "contamination_history": false,
    "supplier_info": false,
    "recipe_details": false,
    "notes": false
  }',
  true
),
(
  'Auditor View',
  'Full transparency for auditors/inspectors - shows everything except addresses',
  '{
    "strain": true,
    "substrate_type": true,
    "spawn_weight": true,
    "substrate_weight": true,
    "container": true,
    "location": true,
    "location_address": false,
    "inoculation_date": true,
    "colonization_date": true,
    "fruiting_date": true,
    "harvest_dates": true,
    "total_yield": true,
    "flush_weights": true,
    "biological_efficiency": true,
    "observations": true,
    "photos": true,
    "cost": true,
    "failures": true,
    "contamination_history": true,
    "supplier_info": true,
    "recipe_details": true,
    "notes": true
  }',
  true
),
(
  'Minimal View',
  'Bare minimum for privacy-conscious sellers',
  '{
    "strain": true,
    "substrate_type": false,
    "spawn_weight": false,
    "substrate_weight": false,
    "container": false,
    "location": false,
    "location_address": false,
    "inoculation_date": false,
    "colonization_date": false,
    "fruiting_date": false,
    "harvest_dates": true,
    "total_yield": true,
    "flush_weights": false,
    "biological_efficiency": true,
    "observations": false,
    "photos": true,
    "cost": false,
    "failures": false,
    "contamination_history": false,
    "supplier_info": false,
    "recipe_details": false,
    "notes": false
  }',
  true
);
```

---

## Part 4: Implementation Roadmap

### Phase 1: Foundation (High Priority)

**Estimated Effort: 40-50 hours**

| ID | Feature | Description | Dependencies |
|----|---------|-------------|--------------|
| PS-001 | Share Tokens Table | Database schema + RLS policies | None |
| PS-002 | Batch Passports Table | Database schema + RLS policies | PS-001 |
| PS-003 | Redaction Presets | System presets + user custom presets | PS-002 |
| PS-004 | Token Generation API | Create/revoke share tokens | PS-001 |
| PS-005 | Public Route Handler | `/passport/:code` route | PS-002, PS-004 |
| PS-006 | Field Redaction Engine | Apply visibility rules to data | PS-003 |

### Phase 2: Core UI (High Priority)

**Estimated Effort: 30-40 hours**

| ID | Feature | Description | Dependencies |
|----|---------|-------------|--------------|
| PS-007 | Create Passport Modal | UI for creating batch passports | PS-001 to PS-006 |
| PS-008 | Redaction Field Picker | UI for selecting visible/hidden fields | PS-006 |
| PS-009 | Public Passport View | Customer-facing passport page | PS-005 |
| PS-010 | QR Code Generator Update | Generate passport QR codes | PS-002 |
| PS-011 | Share Link Copy/Print | Share links with QR on labels | PS-010 |
| PS-012 | Passport Management Page | List/edit/revoke passports | PS-007 |

### Phase 3: Enhanced Features (Medium Priority)

**Estimated Effort: 25-35 hours**

| ID | Feature | Description | Dependencies |
|----|---------|-------------|--------------|
| PS-013 | Lineage Snapshot Generator | Freeze lineage tree for passport | PS-002 |
| PS-014 | Interactive Lineage View | Public lineage tree visualization | PS-013 |
| PS-015 | View Analytics Dashboard | Track passport views/engagement | PS-002 |
| PS-016 | Expiration Management | Auto-expire/renew share tokens | PS-001 |
| PS-017 | Bulk Passport Generation | Create passports for multiple items | PS-007 |
| PS-018 | Short URL Support | mycolab.link/abc123 style links | PS-005 |

### Phase 4: Advanced Features (Lower Priority)

**Estimated Effort: 40-50 hours**

| ID | Feature | Description | Dependencies |
|----|---------|-------------|--------------|
| PS-019 | Weather API Integration | Link grows to weather data | External API |
| PS-020 | 3D Model Linking | Attach 3D fruiting block models | PS-009 |
| PS-021 | Yield-Per-Jar Stats | Auto-calculate bragging stats | None |
| PS-022 | Citation System | Add sources to species library | None |
| PS-023 | Strain Mastery Badges | Track verified grows per user | None |
| PS-024 | Customer Messaging | Let buyers contact sellers | Auth system |

---

## Part 5: New DevLog Entries

The following features need to be added to the devlog:

```typescript
// Add to recent-phases.ts

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
  notes: 'Foundation for all public sharing features. Uses opaque tokens per API security best practices.',
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
```

---

## Part 6: Public API Endpoints

### 6.1 Public Routes (No Auth Required)

```
GET /api/passport/:passportCode
  - Returns public passport data with redaction applied
  - Rate limited (100 req/min per IP)
  - Increments view count

GET /api/passport/:passportCode/lineage
  - Returns frozen lineage tree from snapshot
  - Same rate limiting as above

GET /api/passport/:passportCode/qr
  - Returns QR code image for passport
  - Cacheable, long TTL
```

### 6.2 Private Routes (Auth Required)

```
POST /api/passports
  - Create new batch passport
  - Requires: entity_type, entity_id
  - Optional: field_visibility, public_description

PATCH /api/passports/:id
  - Update passport configuration
  - Owner only

DELETE /api/passports/:id
  - Delete/archive passport
  - Owner only

POST /api/passports/:id/share
  - Generate share token for passport
  - Returns: token, url, expires_at

POST /api/passports/:id/revoke
  - Revoke all share tokens for passport
  - Owner only

GET /api/passports/:id/analytics
  - Get view analytics for passport
  - Owner only
```

---

## Part 7: Security Considerations

### 7.1 Token Security

- Tokens are **opaque 256-bit random strings** (not JWTs)
- Stored hashed in database (bcrypt)
- Never logged or exposed in error messages
- Automatic expiration (default 30 days)
- Revocation capability with instant effect

### 7.2 Data Protection

- **No PII in public views** by default
- Location addresses always redacted
- Costs/failures/supplier info opt-in only
- Lineage snapshots are immutable

### 7.3 Rate Limiting

- Public endpoints: 100 req/min per IP
- Token generation: 10/min per user
- Analytics: 1000 req/hour per user

### 7.4 Audit Trail

- All passport creations logged
- All share token generations logged
- View events logged (anonymized)
- Revocations logged with reason

---

## Part 8: UI/UX Wireframes

### 8.1 Create Passport Modal

```
┌─────────────────────────────────────────────────────┐
│ Create Batch Passport                            ✕  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Strain: Blue Oyster (BO-2024-12)                   │
│  Grow: Monotub #3 - 450g total yield               │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Visibility Template:  [ Customer View (Default) ▼] │
│                                                     │
│  Customize Fields:                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ ✓ Strain              ✓ Harvest Dates       │   │
│  │ ✓ Substrate Type      ✓ Total Yield         │   │
│  │ ✓ Container           ✓ BE%                 │   │
│  │ ✓ Location (Region)   ✓ Photos              │   │
│  │ ✗ Exact Address       ✗ Cost                │   │
│  │ ✗ Failures            ✗ Notes               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Public Description:                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ Organic oyster mushroom spawn grown with    │   │
│  │ care in Pacific Northwest conditions...     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│           [ Preview ]     [ Create Passport ]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 8.2 Public Passport View (Customer)

```
┌─────────────────────────────────────────────────────┐
│  🍄 MycoLab Batch Passport                          │
│                                                     │
│  ══════════════════════════════════════════════════ │
│                                                     │
│  [QR CODE]     Blue Oyster                          │
│                BO-2024-12-0042                      │
│                                                     │
│                Verified Grow Record                 │
│                450g Total Yield | 112% BE          │
│                                                     │
│  ──────────────────────────────────────────────────│
│                                                     │
│  📍 Region: Pacific Northwest                       │
│  🌱 Strain: Blue Oyster (Pleurotus ostreatus)      │
│  📦 Substrate: Masters Mix (Hardwood + Soy Hulls)  │
│  📅 Inoculated: Nov 15, 2024                       │
│  🍄 First Harvest: Dec 1, 2024                     │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  LINEAGE TREE                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🧫 Original Culture (LC-042)                │   │
│  │   ↓                                         │   │
│  │ 🌾 Grain Spawn (GS-102, 103)               │   │
│  │   ↓                                         │   │
│  │ 📦 Monotub #3 ← YOU ARE HERE               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  HARVEST TIMELINE                                   │
│  F1: 180g (Dec 1)  F2: 150g (Dec 8)  F3: 120g     │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  📸 PHOTOS                                          │
│  [img1] [img2] [img3] [img4]                       │
│                                                     │
│  ══════════════════════════════════════════════════ │
│                                                     │
│  Seller: Mountain Mushroom Co.                      │
│  Verified by MycoLab                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Part 9: Implementation Priority

### Must-Have (v1.0 Scope)

1. ✅ Share Token System (PS-001, PS-004)
2. ✅ Batch Passport Table (PS-002)
3. ✅ Field Redaction Engine (PS-003, PS-006)
4. ✅ Create Passport UI (PS-007, PS-008)
5. ✅ Public Passport View (PS-009)
6. ✅ QR Code Integration (PS-010, PS-011)

### Should-Have (v1.1 Scope)

7. 📋 Passport Management Page (PS-012)
8. 📋 Lineage Snapshot (PS-013, PS-014)
9. 📋 View Analytics (PS-015)
10. 📋 Role-Based Views (PS-006 enhanced)

### Nice-to-Have (v1.2+ Scope)

11. 📋 Weather API Integration (PS-019)
12. 📋 3D Model Linking (PS-020)
13. 📋 Citation System (PS-022)
14. 📋 Mastery Badges (PS-023)

---

## Sources & References

- [API Security Best Practices 2025 - GlobalDots](https://www.globaldots.com/resources/blog/10-api-security-best-practices/)
- [SaaS Authentication Best Practices 2025](https://supastarter.dev/blog/saas-authentication-best-practices-in-2025)
- [Digital Product Passports (DPP) - Circularise](https://www.circularise.com/blogs/digital-product-passports-dpp-what-how-and-why)
- [GS1 QR Codes for Product Transparency](https://wordlift.io/blog/en/maximizing-product-transparency-with-gs1-qr-codes/)
- [QR Code Traceability Best Practices - TraceX](https://tracextech.com/qr-code-traceability/)
- [Supabase RBAC with Custom Claims](https://supabase.com/docs/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [PostgreSQL RBAC Implementation](https://medium.com/@wasiualhasib/implementing-role-based-access-control-in-postgresql-for-multi-database-environments-in-postgresql-bb3673eece10)

---

---

## Part 10: Brainstormed Features (User Wants You Haven't Asked For)

Based on research of competitor apps ([MycoFile](https://play.google.com/store/apps/details?id=com.flutterflow.mycofile), [Kinoko](https://kinoko-app.com/), [MycoSense](https://www.mycosense.ch/technology)), popular garden apps ([Planta](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781), [Gardenize](https://apps.apple.com/us/app/gardenize-plant-care-gardening/id1118448120)), and Etsy seller requirements, here are features users consistently want:

### 10.1 High-Value User-Requested Features

| Feature | Why Users Want It | Priority |
|---------|-------------------|----------|
| **Activity Log Editing** | Users accidentally click wrong buttons, can't fix mistakes | Critical |
| **Bulk Operations** | Managing 100+ items is tedious one-by-one | High |
| **Cross-Device Sync** | Users switch between phone and computer | High |
| **Offline Mode with Sync** | Lab/grow room may have poor connectivity | High |
| **Photo Progress Timeline** | Visual growth comparison over time | High |
| **Disease/Contam Photo ID** | AI/ML to identify contamination from photos | Medium |
| **Clone from Successful Grow** | Duplicate a winning setup with one click | Medium |
| **Weather Alerts** | Frost warnings, heat wave alerts for outdoor grows | Medium |
| **Batch Grouping** | "These 10 jars are from the same LC transfer" | High |
| **Cost Per Gram Calculator** | True cost analysis including labor/utilities | Medium |

### 10.2 Seller/Commercial Features (Etsy, Markets, Co-ops)

| Feature | Business Value | Priority |
|---------|----------------|----------|
| **GPSR Compliance Support** | EU product safety regulation | Medium |
| **Batch/Serial Number System** | Required for product traceability | High |
| **Certificate of Authenticity** | PDF proof of organic/verified status | Medium |
| **Inventory Depletion Tracking** | "Sold 5 syringes from LC-042" | High |
| **Customer Order Linking** | Attach passport to specific order/customer | Medium |
| **Seller Profile Page** | Public profile showing mastery, reviews | Medium |
| **Print-Ready Labels** | Thermal printer-compatible labels with QR | Completed (exists) |

### 10.3 Community & Social Features

| Feature | User Value | Priority |
|---------|------------|----------|
| **Strain Reviews/Ratings** | Community feedback on genetics | Low |
| **Recipe Sharing** | Share substrate recipes publicly | Medium |
| **Growing Tips per Strain** | Community-contributed wisdom | Medium |
| **Local Grower Directory** | Find other cultivators nearby | Low |
| **Mentor/Mentee Matching** | Expert helps newbie | Low |
| **Competition Boards** | BE% leaderboards, monthly challenges | Low |

### 10.4 Advanced Analytics (Future AI)

| Feature | Data Science Value | Priority |
|---------|-------------------|----------|
| **Anomaly Detection** | "This colonization is slower than normal" | Medium |
| **Yield Prediction** | ML model predicts final yield | Low |
| **Optimal Conditions Finder** | "Your best B+ grows were at 72°F" | Medium |
| **Contamination Risk Score** | Based on historical patterns | Medium |
| **Seasonal Trend Analysis** | Performance by month/season | Low |

### 10.5 Mobile-First Enhancements

| Feature | UX Value | Priority |
|---------|----------|----------|
| **Quick Log Widget** | iOS/Android home screen widget | Medium |
| **Voice Logging** | "Hey MycoLab, log harvest 450 grams" | Low |
| **Push Notifications** | Stage transition reminders | High (exists) |
| **Camera Quick Actions** | One-tap photo with auto-timestamp | Medium |
| **Haptic Feedback** | Satisfying taps for confirmations | Low |

---

## Part 11: New DevLog Entries (All Phases)

### Phase 31: Public Sharing & Batch Passports

```typescript
// Add to recent-phases.ts after dev-921

// =============================================================================
// PHASE 31: PUBLIC SHARING & BATCH PASSPORTS
// Trust-building features for sellers and customer transparency
// =============================================================================

// Core features (dev-1000 through dev-1011) as detailed in Part 5 above
```

### Phase 32: Activity & Audit Improvements

```typescript
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
```

### Phase 33: Batch & Bulk Operations

```typescript
{
  id: 'dev-1030',
  title: 'Batch Grouping System',
  description: 'Group multiple items into a batch (e.g., "LC Transfer Batch 2024-12-15"). Track outcomes at batch level. Identify if one jar from batch contaminates.',
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
```

### Phase 34: Commercial & Seller Features

```typescript
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
```

### Phase 35: Photo & Visual Features

```typescript
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
```

### Phase 36: Cost & Business Analytics

```typescript
{
  id: 'dev-1060',
  title: 'Cost Per Gram Calculator',
  description: 'True cost analysis including: substrate, spawn, utilities, labor estimate, overhead. Calculate $/gram for each grow.',
  category: 'core',
  status: 'planned',
  priority: 'medium',
  estimatedHours: 10,
  dependencies: ['dev-071', 'dev-072'],
  notes: 'Helps sellers price products and hobbyists understand true costs.',
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
```

### Phase 37: Offline & Sync

```typescript
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
```

---

## Appendix: Existing Features That Support Public Sharing

### Already Completed (Build On These)

| Feature | Dev ID | Relevance |
|---------|--------|-----------|
| QR Code Generation | dev-090 | Extend for passport QR codes |
| QR Scanner Integration | dev-092 | Validate passport codes |
| Lineage Visualization | dev-014 | Source for lineage snapshots |
| Observation Logging | dev-801 | Include in public timeline |
| Outcome Logging System | dev-911 | Track share analytics similarly |
| URL Deep-Linking | dev-904 | Foundation for passport URLs |

### Ready for Enhancement

| Feature | Dev ID | Enhancement Needed |
|---------|--------|-------------------|
| Label Designer | dev-091 | Add passport QR template |
| Recipe Builder | dev-050 | Add "share recipe" option |
| Species Library | dev-020 | Add citation fields |
| Strain Analytics | dev-021 | Add mastery tracking |
