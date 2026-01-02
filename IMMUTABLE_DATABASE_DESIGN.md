# Sporely Immutable Database Design

## Executive Summary

This document outlines an immutable, append-only database architecture for Sporely, inspired by iRacing's robust data management approach. The core principle: **original records are never modified or deleted** - instead, we create amendment records that reference and supersede them.

## Why Immutable?

### Benefits
1. **Complete Audit Trail** - Every change preserved forever with full context
2. **Data Integrity** - No accidental data loss or corruption
3. **Temporal Queries** - "What did this grow look like on day 14?"
4. **Compliance Ready** - Perfect for regulatory requirements (food safety, lab compliance)
5. **Analytics Accuracy** - Historical data reflects reality at that moment
6. **Debugging** - Full history of how data evolved
7. **Trust** - Users can trust their data is safe

### Real-World Scenarios This Solves
- "I accidentally changed the harvest weight - what was the original?"
- "The contamination date was wrong - I need to correct it without losing the original entry"
- "I want to see what this culture's status was before it was marked contaminated"
- "Auditor needs to see all changes made to this batch for compliance"

---

## Core Principles

### 1. Append-Only Records
- **INSERT only** - No UPDATE or DELETE on core data tables
- Original records remain unchanged
- New data creates new records

### 2. Amendment Records
- Corrections create new records linked to originals
- Amendment types: `correction`, `update`, `void`, `merge`
- Always capture: reason, timestamp, user

### 3. Soft Deletes (Archival)
- Records are marked `archived` or `voided`, never physically deleted
- `archived_at`, `archived_by`, `archive_reason` fields
- Archived records excluded from normal queries, visible in history

### 4. Versioning
- Each record has a `version` number
- Related records linked via `record_group_id`
- `is_current` flag for quick lookups

### 5. Temporal Validity
- `valid_from` / `valid_to` timestamps
- `superseded_by_id` links to newer version
- Enables point-in-time queries

---

## Database Schema Changes

### New Base Fields (All Core Tables)

```sql
-- Add to: cultures, grows, flushes, recipes, inventory_items, etc.

-- Versioning
version INTEGER DEFAULT 1,
record_group_id UUID DEFAULT uuid_generate_v4(),  -- Links all versions of same logical record
is_current BOOLEAN DEFAULT true,

-- Temporal validity
valid_from TIMESTAMPTZ DEFAULT NOW(),
valid_to TIMESTAMPTZ,  -- NULL = still valid
superseded_by_id UUID,  -- Points to newer version

-- Archival (soft delete)
is_archived BOOLEAN DEFAULT false,
archived_at TIMESTAMPTZ,
archived_by UUID REFERENCES auth.users(id),
archive_reason TEXT,

-- Amendment tracking
amendment_type TEXT CHECK (amendment_type IN ('original', 'correction', 'update', 'void', 'merge')),
amendment_reason TEXT,
amends_record_id UUID,  -- Points to record being amended (for corrections)
```

### New History Tables

For high-frequency changes, we use dedicated history tables rather than versioning the main record:

```sql
-- ============================================================================
-- OBSERVATION HISTORY (immutable log of all observations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS observation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- What this observation is about
  entity_type TEXT NOT NULL CHECK (entity_type IN ('culture', 'grow', 'prepared_spawn', 'location')),
  entity_id UUID NOT NULL,

  -- Observation data (immutable once created)
  observed_at TIMESTAMPTZ NOT NULL,
  observation_type TEXT NOT NULL,
  title TEXT,
  notes TEXT,

  -- Measurements at time of observation
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  co2_ppm INTEGER,
  colonization_percent INTEGER,
  health_rating INTEGER CHECK (health_rating BETWEEN 1 AND 5),

  -- Stage context (for grows)
  stage TEXT,

  -- Media attachments
  images TEXT[],

  -- Immutability tracking
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),

  -- Amendment support (observations can be corrected)
  is_current BOOLEAN DEFAULT true,
  superseded_by_id UUID REFERENCES observation_history(id),
  amendment_reason TEXT,

  -- Indexing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HARVEST HISTORY (immutable log of all harvests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS harvest_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Link to grow
  grow_id UUID NOT NULL,  -- No FK - grow might be versioned
  grow_record_group_id UUID NOT NULL,  -- Links to logical grow across versions

  -- Harvest data (immutable)
  flush_number INTEGER NOT NULL,
  harvest_date DATE NOT NULL,
  wet_weight_g DECIMAL(10,2),
  dry_weight_g DECIMAL(10,2),
  mushroom_count INTEGER,
  quality TEXT CHECK (quality IN ('excellent', 'good', 'fair', 'poor')),

  -- Context
  notes TEXT,
  images TEXT[],

  -- Recording metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),

  -- Amendment support
  is_current BOOLEAN DEFAULT true,
  superseded_by_id UUID REFERENCES harvest_history(id),
  amendment_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRANSFER HISTORY (immutable log of all culture transfers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transfer_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Source culture
  from_culture_id UUID NOT NULL,
  from_culture_record_group_id UUID NOT NULL,

  -- Destination (culture or grow)
  to_entity_type TEXT NOT NULL CHECK (to_entity_type IN ('culture', 'grow', 'grain_spawn', 'bulk')),
  to_entity_id UUID,
  to_entity_record_group_id UUID,

  -- Transfer details (immutable)
  transfer_date TIMESTAMPTZ NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,

  -- Context
  notes TEXT,

  -- Recording metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),

  -- Amendment support
  is_current BOOLEAN DEFAULT true,
  superseded_by_id UUID REFERENCES transfer_history(id),
  amendment_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STAGE TRANSITION HISTORY (immutable log of stage changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stage_transition_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- What transitioned
  entity_type TEXT NOT NULL CHECK (entity_type IN ('grow', 'culture', 'prepared_spawn')),
  entity_id UUID NOT NULL,
  entity_record_group_id UUID NOT NULL,

  -- Transition details (immutable)
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  transitioned_at TIMESTAMPTZ NOT NULL,

  -- Context
  notes TEXT,
  trigger TEXT CHECK (trigger IN ('manual', 'automatic', 'scheduled', 'condition')),

  -- Recording metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA AMENDMENT LOG (tracks all corrections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_amendment_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- What was amended
  entity_type TEXT NOT NULL,
  original_record_id UUID NOT NULL,
  new_record_id UUID NOT NULL,
  record_group_id UUID NOT NULL,

  -- Amendment details
  amendment_type TEXT NOT NULL CHECK (amendment_type IN ('correction', 'update', 'void', 'merge')),
  reason TEXT NOT NULL,

  -- What changed (JSON diff)
  changes_summary JSONB,  -- { "field": { "old": value, "new": value } }

  -- Who and when
  amended_at TIMESTAMPTZ DEFAULT NOW(),
  amended_by UUID REFERENCES auth.users(id),

  -- For auditing
  ip_address INET,
  user_agent TEXT
);
```

### Migration Strategy for Existing Tables

```sql
-- Example: Adding immutability to cultures table
-- Run as idempotent migration

DO $$ BEGIN
  -- Version tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'version') THEN
    ALTER TABLE cultures ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'record_group_id') THEN
    ALTER TABLE cultures ADD COLUMN record_group_id UUID DEFAULT uuid_generate_v4();
    -- Backfill: existing records get their id as record_group_id
    UPDATE cultures SET record_group_id = id WHERE record_group_id IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'is_current') THEN
    ALTER TABLE cultures ADD COLUMN is_current BOOLEAN DEFAULT true;
  END IF;

  -- Temporal validity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'valid_from') THEN
    ALTER TABLE cultures ADD COLUMN valid_from TIMESTAMPTZ DEFAULT NOW();
    UPDATE cultures SET valid_from = created_at WHERE valid_from IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'valid_to') THEN
    ALTER TABLE cultures ADD COLUMN valid_to TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'superseded_by_id') THEN
    ALTER TABLE cultures ADD COLUMN superseded_by_id UUID REFERENCES cultures(id);
  END IF;

  -- Archival
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'is_archived') THEN
    ALTER TABLE cultures ADD COLUMN is_archived BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'archived_at') THEN
    ALTER TABLE cultures ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'archived_by') THEN
    ALTER TABLE cultures ADD COLUMN archived_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'archive_reason') THEN
    ALTER TABLE cultures ADD COLUMN archive_reason TEXT;
  END IF;

  -- Amendment tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'amendment_type') THEN
    ALTER TABLE cultures ADD COLUMN amendment_type TEXT DEFAULT 'original'
      CHECK (amendment_type IN ('original', 'correction', 'update', 'void', 'merge'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'amendment_reason') THEN
    ALTER TABLE cultures ADD COLUMN amendment_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultures' AND column_name = 'amends_record_id') THEN
    ALTER TABLE cultures ADD COLUMN amends_record_id UUID REFERENCES cultures(id);
  END IF;

EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create index for efficient "current record" lookups
CREATE INDEX IF NOT EXISTS idx_cultures_current
  ON cultures(record_group_id, is_current)
  WHERE is_current = true AND is_archived = false;

-- Create index for temporal queries
CREATE INDEX IF NOT EXISTS idx_cultures_temporal
  ON cultures(record_group_id, valid_from, valid_to);
```

---

## Application Layer Changes

### TypeScript Interface Updates

```typescript
// Base interface for all immutable records
interface ImmutableRecord {
  id: string;

  // Versioning
  version: number;
  recordGroupId: string;  // Links all versions of same logical record
  isCurrent: boolean;

  // Temporal validity
  validFrom: Date;
  validTo?: Date;
  supersededById?: string;

  // Archival
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;
  archiveReason?: string;

  // Amendment tracking
  amendmentType: 'original' | 'correction' | 'update' | 'void' | 'merge';
  amendmentReason?: string;
  amendsRecordId?: string;
}

// Example: Culture with immutability
interface Culture extends ImmutableRecord {
  type: CultureType;
  label: string;
  strainId: string;
  status: CultureStatus;
  // ... existing fields
}

// Amendment request
interface AmendmentRequest<T> {
  originalRecordId: string;
  amendmentType: 'correction' | 'update' | 'void';
  reason: string;
  changes: Partial<T>;
}
```

### CRUD Operation Changes

#### CREATE (unchanged)
```typescript
async function createCulture(data: CreateCultureInput): Promise<Culture> {
  const culture = {
    ...data,
    id: generateId('culture'),
    version: 1,
    recordGroupId: generateId('group'),
    isCurrent: true,
    validFrom: new Date(),
    amendmentType: 'original',
  };

  await supabase.from('cultures').insert(culture);
  return culture;
}
```

#### UPDATE → AMEND (new pattern)
```typescript
async function amendCulture(request: AmendmentRequest<Culture>): Promise<Culture> {
  const { originalRecordId, amendmentType, reason, changes } = request;

  // 1. Fetch original record
  const original = await getCulture(originalRecordId);
  if (!original) throw new Error('Original record not found');
  if (!original.isCurrent) throw new Error('Can only amend current records');

  // 2. Create new version
  const newVersion: Culture = {
    ...original,
    ...changes,
    id: generateId('culture'),
    version: original.version + 1,
    isCurrent: true,
    validFrom: new Date(),
    amendmentType,
    amendmentReason: reason,
    amendsRecordId: original.id,
  };

  // 3. Mark original as superseded (in transaction)
  await supabase.rpc('amend_record', {
    table_name: 'cultures',
    original_id: original.id,
    new_record: newVersion,
    reason,
    amendment_type: amendmentType,
  });

  // 4. Log amendment
  await logAmendment({
    entityType: 'culture',
    originalRecordId: original.id,
    newRecordId: newVersion.id,
    recordGroupId: original.recordGroupId,
    amendmentType,
    reason,
    changes: computeDiff(original, newVersion),
  });

  return newVersion;
}
```

#### DELETE → ARCHIVE (soft delete)
```typescript
async function archiveCulture(
  cultureId: string,
  reason: string
): Promise<void> {
  await supabase
    .from('cultures')
    .update({
      isArchived: true,
      archivedAt: new Date(),
      archivedBy: getCurrentUserId(),
      archiveReason: reason,
      validTo: new Date(),
      isCurrent: false,
    })
    .eq('id', cultureId);

  await logAmendment({
    entityType: 'culture',
    originalRecordId: cultureId,
    newRecordId: cultureId, // Same record, just archived
    amendmentType: 'void',
    reason,
  });
}
```

#### READ (queries for current data)
```typescript
// Get current version of a record
async function getCulture(id: string): Promise<Culture | null> {
  const { data } = await supabase
    .from('cultures')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

// Get current version by record group (logical record)
async function getCurrentCultureVersion(recordGroupId: string): Promise<Culture | null> {
  const { data } = await supabase
    .from('cultures')
    .select('*')
    .eq('record_group_id', recordGroupId)
    .eq('is_current', true)
    .eq('is_archived', false)
    .single();
  return data;
}

// Get all versions of a record (history view)
async function getCultureHistory(recordGroupId: string): Promise<Culture[]> {
  const { data } = await supabase
    .from('cultures')
    .select('*')
    .eq('record_group_id', recordGroupId)
    .order('version', { ascending: true });
  return data || [];
}

// Get record state at a specific point in time
async function getCultureAtTime(
  recordGroupId: string,
  asOf: Date
): Promise<Culture | null> {
  const { data } = await supabase
    .from('cultures')
    .select('*')
    .eq('record_group_id', recordGroupId)
    .lte('valid_from', asOf.toISOString())
    .or(`valid_to.is.null,valid_to.gt.${asOf.toISOString()}`)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  return data;
}

// List all current, non-archived cultures
async function listActiveCultures(): Promise<Culture[]> {
  const { data } = await supabase
    .from('cultures')
    .select('*')
    .eq('is_current', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  return data || [];
}
```

### Database Function for Atomic Amendments

```sql
-- Stored procedure for atomic record amendment
CREATE OR REPLACE FUNCTION amend_record(
  p_table_name TEXT,
  p_original_id UUID,
  p_new_record JSONB,
  p_reason TEXT,
  p_amendment_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
  v_record_group_id UUID;
BEGIN
  -- Get record_group_id from original
  EXECUTE format(
    'SELECT record_group_id FROM %I WHERE id = $1',
    p_table_name
  ) INTO v_record_group_id USING p_original_id;

  IF v_record_group_id IS NULL THEN
    RAISE EXCEPTION 'Original record not found: %', p_original_id;
  END IF;

  -- Mark original as superseded
  EXECUTE format(
    'UPDATE %I SET
      is_current = false,
      valid_to = NOW(),
      updated_at = NOW()
    WHERE id = $1',
    p_table_name
  ) USING p_original_id;

  -- Insert new version
  v_new_id := (p_new_record->>'id')::UUID;

  EXECUTE format(
    'INSERT INTO %I SELECT * FROM jsonb_populate_record(NULL::%I, $1)',
    p_table_name, p_table_name
  ) USING p_new_record;

  -- Update superseded_by on original
  EXECUTE format(
    'UPDATE %I SET superseded_by_id = $1 WHERE id = $2',
    p_table_name
  ) USING v_new_id, p_original_id;

  -- Log to amendment log
  INSERT INTO data_amendment_log (
    entity_type,
    original_record_id,
    new_record_id,
    record_group_id,
    amendment_type,
    reason,
    amended_by
  ) VALUES (
    p_table_name,
    p_original_id,
    v_new_id,
    v_record_group_id,
    p_amendment_type,
    p_reason,
    auth.uid()
  );

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## UI/UX Patterns

### 1. Edit → Amend Modal
Instead of inline editing, show an "Amend Record" modal that:
- Shows original values (read-only)
- Shows editable "New Values" fields
- Requires amendment reason
- Preview diff before saving

### 2. History View
Every record detail page has a "History" tab showing:
- All versions with timestamps
- Who made each change and why
- Diff view between versions
- Option to view record at any point in time

### 3. Archive Confirmation
When "deleting", show dialog:
- "This record will be archived, not deleted"
- Require archive reason
- Show that data will still be accessible in history

### 4. Amendment Badges
Show visual indicators:
- 🔵 Original record
- 🟡 Amended record (with hover to see reason)
- ⚫ Archived record
- Version number (v1, v2, etc.)

---

## Tables to Make Immutable

### Phase 1: Core Entities (Critical)
1. **cultures** - Full versioning + archival
2. **grows** - Full versioning + archival
3. **flushes** → migrate to **harvest_history** (append-only)
4. **prepared_spawn** - Full versioning + archival

### Phase 2: Supporting Entities
5. **recipes** - Full versioning + archival
6. **inventory_items** - Full versioning + archival
7. **inventory_lots** - Full versioning + archival
8. **inventory_usages** → already append-only ✅
9. **entity_outcomes** → already append-only ✅

### Phase 3: Observations & Events
10. **culture_observations** → migrate to **observation_history**
11. **grow_observations** → migrate to **observation_history**
12. **culture_transfers** → migrate to **transfer_history**

### Phase 4: Lookup Tables (Lower Priority)
13. **strains** - Versioning (user-created ones)
14. **locations** - Versioning
15. **containers** - Versioning

### Not Immutable (Mutable by Design)
- **user_settings** - User preferences, OK to update
- **user_profiles** - Profile info, OK to update
- **notification_**** - Operational, OK to update/delete

---

## Migration Path

### Step 1: Add Fields (Non-Breaking)
- Add all new columns with defaults
- Backfill `record_group_id = id` for existing records
- All existing records get `amendment_type = 'original'`

### Step 2: Update Application Layer
- Create new amend/archive functions
- Update existing update/delete to use new patterns
- Add history views to UI

### Step 3: Database Triggers
- Add trigger to prevent direct UPDATE on protected fields
- Add trigger to auto-populate `valid_from` on INSERT
- Add trigger to log all amendments

### Step 4: Data Cleanup
- Archive any soft-deleted records properly
- Ensure all records have valid `record_group_id`

---

## Performance Considerations

### Indexes Required
```sql
-- Fast lookup of current records
CREATE INDEX idx_{table}_current ON {table}(record_group_id) WHERE is_current = true AND is_archived = false;

-- Fast temporal queries
CREATE INDEX idx_{table}_temporal ON {table}(record_group_id, valid_from, valid_to);

-- Fast version ordering
CREATE INDEX idx_{table}_versions ON {table}(record_group_id, version);
```

### Query Patterns
- Always filter by `is_current = true` AND `is_archived = false` for normal views
- Use `record_group_id` for history views, not `id`
- Paginate history queries

### Storage Growth
- Expect 1.5-3x storage for frequently amended records
- Consider archiving old versions to cold storage after N months
- Monitor table sizes

---

## Benefits Summary

| Scenario | Before | After |
|----------|--------|-------|
| Accidental edit | Data lost | Original preserved, amendment logged |
| Need to correct typo | UPDATE overwrites | New version created with reason |
| Auditor requests history | "Sorry, we don't have that" | Full change history available |
| User deletes by mistake | Data gone | Archived, can restore |
| Debug "why is this value wrong?" | No idea | Full amendment history |
| Compliance audit | Scramble to explain | Complete audit trail |

---

## Implementation Priority

1. **Immediate**: Add immutability fields to cultures, grows, flushes
2. **Short-term**: Implement amend/archive patterns in DataContext
3. **Medium-term**: Build history UI components
4. **Long-term**: Extend to all entities, add temporal query UI

---

## Questions to Resolve

1. **Retention Policy**: How long to keep all versions? Forever? Archive after N years?
2. **Performance**: What's acceptable query overhead for current-record lookups?
3. **UI Complexity**: How much history do we show by default?
4. **Correction vs Update**: Should we distinguish "fixing a typo" from "recording a real change"?

---

## Advanced Considerations

### GDPR "Right to Erasure" Compliance

Immutability conflicts with GDPR Article 17 (right to be forgotten). We must balance audit requirements with privacy rights.

#### Strategy: Cryptographic Erasure + PII Separation

```sql
-- ============================================================================
-- PII SEPARATION: Keep personal data separate from immutable records
-- ============================================================================

-- User PII stored separately with encryption key reference
CREATE TABLE IF NOT EXISTS user_pii (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encryption_key_id UUID NOT NULL,  -- Reference to key in secure key store

  -- Encrypted PII fields
  full_name_encrypted BYTEA,
  email_encrypted BYTEA,
  phone_encrypted BYTEA,
  address_encrypted BYTEA,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encryption key management (simplified - use proper KMS in production)
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,  -- Hash of key for verification (key itself in KMS)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ  -- Set when user requests erasure
);

-- GDPR erasure request log (for compliance documentation)
CREATE TABLE IF NOT EXISTS gdpr_erasure_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  erasure_method TEXT CHECK (erasure_method IN ('key_deletion', 'anonymization', 'full_delete')),
  data_categories_erased TEXT[],
  verification_hash TEXT,  -- Proof that erasure was completed
  processed_by UUID REFERENCES auth.users(id)
);
```

#### Erasure Process

```typescript
async function processGDPRErasure(userId: string): Promise<void> {
  // 1. Revoke encryption key (renders encrypted PII unreadable)
  await revokeEncryptionKey(userId);

  // 2. Anonymize references in immutable records
  await anonymizeUserReferences(userId);

  // 3. Delete actual PII
  await supabase.from('user_pii').delete().eq('user_id', userId);

  // 4. Log for compliance
  await logErasure(userId, 'key_deletion', ['name', 'email', 'phone', 'address']);
}

async function anonymizeUserReferences(userId: string): Promise<void> {
  // Replace user references with anonymized placeholder
  // This is a direct UPDATE - allowed for compliance reasons
  const tables = ['data_amendment_log', 'observation_history', 'harvest_history'];

  for (const table of tables) {
    await supabase.rpc('anonymize_user_in_table', {
      p_table_name: table,
      p_user_id: userId,
      p_anonymous_id: 'GDPR_ANONYMIZED'
    });
  }
}
```

#### Data Categories & Retention

| Data Category | Contains PII? | Retention | GDPR Handling |
|---------------|---------------|-----------|---------------|
| Cultures, Grows | No (references user_id) | Forever | Anonymize user_id |
| Amendment logs | Yes (amended_by) | Forever | Anonymize user reference |
| User settings | Yes | Until erasure | Full delete |
| User profiles | Yes | Until erasure | Full delete |
| Observations | Possibly (notes) | Forever | Redact free-text PII |

---

### Foreign Key Strategy with Versioning

When records have versions, traditional foreign keys break. A grow that references `source_culture_id` might point to an old version.

#### Problem Illustration

```
Time T1: Culture v1 created (id: abc-123, record_group_id: xyz-789)
Time T2: Grow created, references source_culture_id = abc-123
Time T3: Culture amended → v2 created (id: def-456, record_group_id: xyz-789)
         v1 marked is_current = false

Result: Grow still points to abc-123 (v1), but v1 is no longer current!
```

#### Solution: Reference record_group_id, Not id

```sql
-- WRONG: Traditional FK to record id
ALTER TABLE grows ADD COLUMN source_culture_id UUID REFERENCES cultures(id);

-- RIGHT: Reference the logical record group (no FK constraint)
ALTER TABLE grows ADD COLUMN source_culture_group_id UUID;
-- Note: No FK because record_group_id isn't a PK

-- Add index for efficient joins
CREATE INDEX idx_grows_source_culture_group ON grows(source_culture_group_id);
```

#### Query Pattern for Versioned References

```typescript
// Get grow with CURRENT version of source culture
async function getGrowWithSourceCulture(growId: string): Promise<GrowWithCulture> {
  const { data } = await supabase
    .from('grows')
    .select(`
      *,
      source_culture:cultures!inner(*)
    `)
    .eq('id', growId)
    .eq('source_culture.record_group_id', 'grows.source_culture_group_id')
    .eq('source_culture.is_current', true)
    .single();

  return data;
}

// Alternative: Database view for simpler queries
```

```sql
-- View that automatically joins to current versions
CREATE OR REPLACE VIEW grows_with_current_refs AS
SELECT
  g.*,
  c.label as source_culture_label,
  c.status as source_culture_status,
  c.version as source_culture_version
FROM grows g
LEFT JOIN cultures c ON c.record_group_id = g.source_culture_group_id
                    AND c.is_current = true
                    AND c.is_archived = false;
```

#### Historical Accuracy Option

Sometimes you WANT to know what version existed at the time of reference:

```sql
-- Track which version was current when relationship was created
ALTER TABLE grows ADD COLUMN source_culture_version_at_creation INTEGER;

-- Or: Store snapshot of key fields at creation time
ALTER TABLE grows ADD COLUMN source_culture_snapshot JSONB;
-- { "label": "LC-241215-001", "strain": "Blue Oyster", "version": 1 }
```

---

### Concurrent Amendment Handling

Two users amending the same record simultaneously can cause lost updates.

#### Optimistic Locking Implementation

```typescript
interface AmendmentRequest<T> {
  originalRecordId: string;
  expectedVersion: number;  // Client sends version they're amending
  amendmentType: 'correction' | 'update' | 'void';
  reason: string;
  changes: Partial<T>;
}

async function amendWithOptimisticLock<T extends ImmutableRecord>(
  tableName: string,
  request: AmendmentRequest<T>
): Promise<T> {
  const { originalRecordId, expectedVersion, amendmentType, reason, changes } = request;

  // Use database function with version check
  const { data, error } = await supabase.rpc('amend_record_with_lock', {
    p_table_name: tableName,
    p_original_id: originalRecordId,
    p_expected_version: expectedVersion,
    p_new_record: changes,
    p_reason: reason,
    p_amendment_type: amendmentType,
  });

  if (error?.code === 'CONFLICT') {
    throw new OptimisticLockError(
      'This record was modified by another user. Please refresh and try again.',
      { currentVersion: error.details.currentVersion }
    );
  }

  return data;
}
```

```sql
-- Database function with version check
CREATE OR REPLACE FUNCTION amend_record_with_lock(
  p_table_name TEXT,
  p_original_id UUID,
  p_expected_version INTEGER,
  p_new_record JSONB,
  p_reason TEXT,
  p_amendment_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_record_group_id UUID;
  v_new_id UUID;
BEGIN
  -- Lock the row and check version
  EXECUTE format(
    'SELECT version, record_group_id FROM %I WHERE id = $1 FOR UPDATE',
    p_table_name
  ) INTO v_current_version, v_record_group_id USING p_original_id;

  -- Version mismatch = concurrent modification
  IF v_current_version != p_expected_version THEN
    RAISE EXCEPTION 'CONFLICT: Expected version %, found %',
      p_expected_version, v_current_version
      USING ERRCODE = 'serialization_failure',
            DETAIL = format('{"currentVersion": %s}', v_current_version);
  END IF;

  -- Proceed with amendment (rest of logic same as before)
  -- ...

  RETURN jsonb_build_object('id', v_new_id, 'version', v_current_version + 1);
END;
$$ LANGUAGE plpgsql;
```

#### UI Handling

```typescript
// React hook for amendment with conflict handling
function useAmendRecord<T extends ImmutableRecord>(tableName: string) {
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const amend = async (request: AmendmentRequest<T>) => {
    try {
      return await amendWithOptimisticLock(tableName, request);
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        setConflict({
          message: error.message,
          currentVersion: error.currentVersion,
          yourChanges: request.changes,
        });
        return null;
      }
      throw error;
    }
  };

  const resolveConflict = async (action: 'refresh' | 'force') => {
    if (action === 'refresh') {
      // Reload current data, user re-applies changes
      setConflict(null);
    } else {
      // Force amendment with new version (use with caution)
      // Re-fetch and re-apply
    }
  };

  return { amend, conflict, resolveConflict };
}
```

---

### Field Categorization: What Triggers a New Version?

Not all field changes should create a new version. Categorize fields by impact:

```typescript
// Field categories per entity type
const CULTURE_FIELD_CATEGORIES = {
  // Changes to these create a new version (material changes)
  versioned: [
    'status',
    'type',
    'strainId',
    'containerId',
    'fillVolumeMl',
    'healthRating',
    'cost',
    'locationId',
  ],

  // Changes to these update in place (non-material)
  mutable: [
    'notes',
    'tags',
    'internalMemo',
  ],

  // These are computed, never directly set
  computed: [
    'updatedAt',
    'volumeUsed',
    'costPerMl',
  ],

  // These are immutable after creation
  immutableAfterCreate: [
    'id',
    'recordGroupId',
    'createdAt',
    'type',  // Can't change LC to Agar
  ],
};

const GROW_FIELD_CATEGORIES = {
  versioned: [
    'status',
    'currentStage',
    'strainId',
    'sourceCultureGroupId',
    'substrateWeight',
    'spawnWeight',
    'totalYield',
    'locationId',
  ],
  mutable: [
    'notes',
    'tags',
  ],
  computed: [
    'updatedAt',
    'totalCost',
    'costPerGramWet',
  ],
  immutableAfterCreate: [
    'id',
    'recordGroupId',
    'createdAt',
    'spawnedAt',
  ],
};
```

#### Smart Update Router

```typescript
async function updateRecord<T extends ImmutableRecord>(
  tableName: string,
  recordId: string,
  changes: Partial<T>,
  reason?: string
): Promise<T> {
  const fieldCategories = getFieldCategories(tableName);
  const changedFields = Object.keys(changes);

  // Check for immutable field violations
  const immutableViolations = changedFields.filter(f =>
    fieldCategories.immutableAfterCreate.includes(f)
  );
  if (immutableViolations.length > 0) {
    throw new Error(`Cannot modify immutable fields: ${immutableViolations.join(', ')}`);
  }

  // Separate versioned vs mutable changes
  const versionedChanges = pick(changes, fieldCategories.versioned);
  const mutableChanges = pick(changes, fieldCategories.mutable);

  // If any versioned fields changed, create new version
  if (Object.keys(versionedChanges).length > 0) {
    if (!reason) {
      throw new Error('Amendment reason required for material changes');
    }
    return await amendRecord(tableName, {
      originalRecordId: recordId,
      amendmentType: 'update',
      reason,
      changes: { ...versionedChanges, ...mutableChanges },
    });
  }

  // Only mutable fields changed - update in place
  return await updateInPlace(tableName, recordId, mutableChanges);
}
```

---

### Cascading Amendments

When a parent record is amended, should child records also get new versions?

#### Recommendation: No Cascading

Historical accuracy means "this grow was created from Culture v1, even if we later corrected it to v2."

#### Denormalized Snapshots for Context

Store key context at creation time:

```sql
-- Add snapshot fields to grows
ALTER TABLE grows ADD COLUMN IF NOT EXISTS source_culture_snapshot JSONB;
-- Stores: { "label": "LC-001", "strain": "Blue Oyster", "version": 1, "capturedAt": "..." }

ALTER TABLE grows ADD COLUMN IF NOT EXISTS strain_snapshot JSONB;
-- Stores: { "name": "Blue Oyster", "species": "Pleurotus ostreatus", "version": 1 }
```

```typescript
// When creating a grow, capture snapshots
async function createGrow(data: CreateGrowInput): Promise<Grow> {
  const sourceCulture = await getCurrentCultureVersion(data.sourceCultureGroupId);
  const strain = await getStrain(data.strainId);

  const grow: Grow = {
    ...data,
    id: generateId('grow'),
    version: 1,
    recordGroupId: generateId('group'),

    // Snapshot parent data at creation time
    sourceCultureSnapshot: {
      id: sourceCulture.id,
      label: sourceCulture.label,
      strainName: strain.name,
      version: sourceCulture.version,
      capturedAt: new Date().toISOString(),
    },
    strainSnapshot: {
      id: strain.id,
      name: strain.name,
      species: strain.species,
      version: strain.version,
      capturedAt: new Date().toISOString(),
    },
  };

  await supabase.from('grows').insert(grow);
  return grow;
}
```

#### When to Show Current vs Snapshot

| Context | Show |
|---------|------|
| Grow detail page - "Source Culture" | Current version (with link to history) |
| Grow history - "Created from" | Snapshot (what existed at creation) |
| Analytics - "Yields by strain" | Current strain name (for grouping) |
| Audit report - "Trace lineage" | Snapshot (historical accuracy) |

---

### Bulk Operations

Importing large datasets shouldn't create excessive amendment logs.

#### Bulk Import Pattern

```sql
-- Add bulk operation tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'migration', 'correction', 'archive')),
  entity_type TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  source_description TEXT,  -- e.g., "CSV import from legacy system"
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'rolled_back')),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Bulk operation details (optional - for audit)
CREATE TABLE IF NOT EXISTS bulk_operation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bulk_operation_id UUID REFERENCES bulk_operations(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  record_group_id UUID NOT NULL,
  action TEXT CHECK (action IN ('created', 'amended', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```typescript
async function bulkImportCultures(
  cultures: CreateCultureInput[],
  sourceDescription: string
): Promise<BulkImportResult> {
  // 1. Create bulk operation record
  const bulkOp = await createBulkOperation({
    operationType: 'import',
    entityType: 'culture',
    recordCount: cultures.length,
    sourceDescription,
  });

  try {
    // 2. Insert all records with bulk_operation_id reference
    const records = cultures.map(c => ({
      ...c,
      id: generateId('culture'),
      version: 1,
      recordGroupId: generateId('group'),
      amendmentType: 'original',
      bulkOperationId: bulkOp.id,  // Link to bulk op
    }));

    await supabase.from('cultures').insert(records);

    // 3. Single amendment log entry for entire bulk operation
    await supabase.from('data_amendment_log').insert({
      entityType: 'culture',
      amendmentType: 'bulk_import',
      reason: sourceDescription,
      bulkOperationId: bulkOp.id,
      changesSummary: { recordCount: records.length },
    });

    // 4. Mark complete
    await completeBulkOperation(bulkOp.id, 'completed');

    return { success: true, recordCount: records.length, bulkOperationId: bulkOp.id };
  } catch (error) {
    await completeBulkOperation(bulkOp.id, 'failed', error.message);
    throw error;
  }
}
```

---

### Storage Growth & Archival Strategy

Versioned tables grow over time. Plan for it.

#### Table Partitioning

```sql
-- Partition observation_history by month
CREATE TABLE observation_history (
  id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  -- ... other columns
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE observation_history_2025_01
  PARTITION OF observation_history
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE observation_history_2025_02
  PARTITION OF observation_history
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automate partition creation (run monthly via cron/pg_cron)
CREATE OR REPLACE FUNCTION create_monthly_partition(
  p_table_name TEXT,
  p_year INTEGER,
  p_month INTEGER
) RETURNS void AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_partition_name := format('%s_%s_%s', p_table_name, p_year, lpad(p_month::text, 2, '0'));
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := v_start_date + interval '1 month';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    v_partition_name, p_table_name, v_start_date, v_end_date
  );
END;
$$ LANGUAGE plpgsql;
```

#### Cold Storage Archival

```sql
-- Archive table for old versions (cheaper storage tier)
CREATE TABLE IF NOT EXISTS cultures_archive (
  LIKE cultures INCLUDING ALL
);

-- Move old superseded versions to archive
CREATE OR REPLACE FUNCTION archive_old_versions(
  p_table_name TEXT,
  p_retention_days INTEGER DEFAULT 730  -- 2 years
) RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
  v_archive_table TEXT := p_table_name || '_archive';
BEGIN
  -- Insert into archive
  EXECUTE format(
    'INSERT INTO %I SELECT * FROM %I
     WHERE is_current = false
       AND valid_to < NOW() - interval ''%s days''
       AND id NOT IN (SELECT id FROM %I)',
    v_archive_table, p_table_name, p_retention_days, v_archive_table
  );

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  -- Delete from main table (optional - or keep for faster history queries)
  -- EXECUTE format(
  --   'DELETE FROM %I WHERE is_current = false AND valid_to < NOW() - interval ''%s days''',
  --   p_table_name, p_retention_days
  -- );

  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;
```

#### Storage Monitoring

```sql
-- View to monitor table sizes
CREATE OR REPLACE VIEW table_storage_stats AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) as index_size,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Alert threshold check
CREATE OR REPLACE FUNCTION check_storage_thresholds()
RETURNS TABLE(tablename TEXT, size_mb NUMERIC, alert_level TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    (pg_total_relation_size('public.' || t.tablename) / 1024 / 1024)::NUMERIC as size_mb,
    CASE
      WHEN pg_total_relation_size('public.' || t.tablename) > 1073741824 THEN 'CRITICAL'  -- > 1GB
      WHEN pg_total_relation_size('public.' || t.tablename) > 536870912 THEN 'WARNING'   -- > 500MB
      ELSE 'OK'
    END as alert_level
  FROM pg_tables t
  WHERE t.schemaname = 'public';
END;
$$ LANGUAGE plpgsql;
```

---

### Draft Amendments

Users may want to prepare amendments before committing them.

```sql
-- Pending/draft amendments
CREATE TABLE IF NOT EXISTS pending_amendments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What's being amended
  entity_type TEXT NOT NULL,
  record_group_id UUID NOT NULL,
  original_record_id UUID NOT NULL,

  -- Draft changes
  draft_changes JSONB NOT NULL,
  amendment_type TEXT NOT NULL CHECK (amendment_type IN ('correction', 'update', 'void')),
  draft_reason TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',  -- Auto-cleanup

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'committed', 'expired'))
);

-- Index for user's drafts
CREATE INDEX idx_pending_amendments_user ON pending_amendments(created_by, status);

-- Auto-expire old drafts
CREATE OR REPLACE FUNCTION cleanup_expired_drafts() RETURNS void AS $$
BEGIN
  UPDATE pending_amendments
  SET status = 'expired'
  WHERE status = 'draft' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Draft amendment workflow
interface DraftAmendment {
  id: string;
  entityType: string;
  recordGroupId: string;
  originalRecordId: string;
  draftChanges: Record<string, any>;
  amendmentType: 'correction' | 'update' | 'void';
  draftReason?: string;
  status: 'draft' | 'submitted' | 'committed';
}

async function saveDraft(draft: Omit<DraftAmendment, 'id' | 'status'>): Promise<DraftAmendment> {
  const { data } = await supabase
    .from('pending_amendments')
    .upsert({
      ...draft,
      status: 'draft',
      updatedAt: new Date(),
    })
    .select()
    .single();
  return data;
}

async function commitDraft(draftId: string, finalReason: string): Promise<void> {
  const draft = await getDraft(draftId);

  // Apply the amendment
  await amendRecord(draft.entityType, {
    originalRecordId: draft.originalRecordId,
    amendmentType: draft.amendmentType,
    reason: finalReason || draft.draftReason,
    changes: draft.draftChanges,
  });

  // Mark draft as committed
  await supabase
    .from('pending_amendments')
    .update({ status: 'committed' })
    .eq('id', draftId);
}
```

---

### Cryptographic Integrity (Optional)

For high-compliance environments, add tamper-evidence:

```sql
-- Add integrity fields to amendment log
ALTER TABLE data_amendment_log ADD COLUMN IF NOT EXISTS record_hash TEXT;
ALTER TABLE data_amendment_log ADD COLUMN IF NOT EXISTS previous_hash TEXT;
ALTER TABLE data_amendment_log ADD COLUMN IF NOT EXISTS chain_sequence BIGINT;

-- Sequence for chain ordering
CREATE SEQUENCE IF NOT EXISTS amendment_chain_seq;

-- Function to compute and store hash chain
CREATE OR REPLACE FUNCTION compute_amendment_hash()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_hash TEXT;
  v_content TEXT;
BEGIN
  -- Get previous hash in chain
  SELECT record_hash INTO v_previous_hash
  FROM data_amendment_log
  ORDER BY chain_sequence DESC
  LIMIT 1;

  -- Compute content to hash
  v_content := concat_ws('|',
    NEW.entity_type,
    NEW.original_record_id,
    NEW.new_record_id,
    NEW.amendment_type,
    NEW.reason,
    NEW.amended_at::TEXT,
    COALESCE(v_previous_hash, 'GENESIS')
  );

  -- Set hash values
  NEW.chain_sequence := nextval('amendment_chain_seq');
  NEW.previous_hash := v_previous_hash;
  NEW.record_hash := encode(sha256(v_content::bytea), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER amendment_hash_trigger
  BEFORE INSERT ON data_amendment_log
  FOR EACH ROW
  EXECUTE FUNCTION compute_amendment_hash();
```

```typescript
// Verify chain integrity
async function verifyAmendmentChain(): Promise<ChainVerificationResult> {
  const { data: amendments } = await supabase
    .from('data_amendment_log')
    .select('*')
    .order('chain_sequence', { ascending: true });

  let previousHash = 'GENESIS';
  const errors: string[] = [];

  for (const amendment of amendments) {
    // Recompute expected hash
    const content = [
      amendment.entityType,
      amendment.originalRecordId,
      amendment.newRecordId,
      amendment.amendmentType,
      amendment.reason,
      amendment.amendedAt,
      previousHash,
    ].join('|');

    const expectedHash = await computeSHA256(content);

    if (amendment.recordHash !== expectedHash) {
      errors.push(`Chain broken at sequence ${amendment.chainSequence}: hash mismatch`);
    }

    if (amendment.previousHash !== previousHash) {
      errors.push(`Chain broken at sequence ${amendment.chainSequence}: previous hash mismatch`);
    }

    previousHash = amendment.recordHash;
  }

  return {
    valid: errors.length === 0,
    errors,
    recordCount: amendments.length,
    lastVerifiedSequence: amendments[amendments.length - 1]?.chainSequence,
  };
}
```

---

### Undo vs Amend

Distinguish quick undo from formal amendments:

```typescript
// Undo: Quick reversal within time window
interface UndoRequest {
  recordId: string;
  // No reason required for undo
}

// Amend: Formal correction with documentation
interface AmendRequest<T> {
  recordId: string;
  changes: Partial<T>;
  reason: string;  // Required
  amendmentType: 'correction' | 'update';
}

const UNDO_WINDOW_MINUTES = 60;  // Can undo within 1 hour

async function undoLastChange(recordGroupId: string): Promise<void> {
  const history = await getRecordHistory(recordGroupId);

  if (history.length < 2) {
    throw new Error('Nothing to undo - this is the original record');
  }

  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  // Check undo window
  const minutesSinceChange = (Date.now() - new Date(current.validFrom).getTime()) / 60000;
  if (minutesSinceChange > UNDO_WINDOW_MINUTES) {
    throw new Error(`Undo window expired. Use "Amend" to make corrections.`);
  }

  // Create revert amendment
  await amendRecord({
    originalRecordId: current.id,
    amendmentType: 'revert',  // Special type
    reason: `Undo: Reverted to version ${previous.version}`,
    changes: extractRevertChanges(current, previous),
  });
}
```

---

### API Design for Versioned Data

External API consumers need version-aware endpoints:

```typescript
// API Response format
interface VersionedApiResponse<T> {
  data: T;
  meta: {
    id: string;
    recordGroupId: string;
    version: number;
    isCurrent: boolean;
    validFrom: string;
    validTo: string | null;
    _links: {
      self: string;
      history: string;
      currentVersion: string;
    };
  };
}

// Example response
{
  "data": {
    "label": "LC-241215-001",
    "type": "liquid_culture",
    "status": "ready",
    "strainId": "...",
    // ... other fields
  },
  "meta": {
    "id": "abc-123",
    "recordGroupId": "xyz-789",
    "version": 3,
    "isCurrent": true,
    "validFrom": "2025-12-15T10:00:00Z",
    "validTo": null,
    "_links": {
      "self": "/api/v1/cultures/abc-123",
      "history": "/api/v1/cultures/xyz-789/history",
      "currentVersion": "/api/v1/cultures/xyz-789/current"
    }
  }
}
```

#### API Endpoints

```
GET  /api/v1/cultures/:id              → Get specific version by id
GET  /api/v1/cultures/:groupId/current → Get current version
GET  /api/v1/cultures/:groupId/history → Get all versions
GET  /api/v1/cultures/:groupId/at/:timestamp → Get version at point in time

POST /api/v1/cultures                   → Create new (returns v1)
POST /api/v1/cultures/:id/amend         → Create amendment (returns new version)
POST /api/v1/cultures/:id/archive       → Archive (soft delete)
```

---

## Sporely-Specific Considerations

### Lineage Tracking with Versions

Culture lineage becomes complex with versioning:

```typescript
interface LineageNode {
  recordGroupId: string;
  currentVersion: {
    id: string;
    label: string;
    version: number;
    status: string;
  };
  versionAtTransfer?: {
    id: string;
    label: string;
    version: number;
    transferDate: Date;
  };
  children: LineageNode[];
  parents: LineageNode[];
}

async function getCultureLineageWithVersions(recordGroupId: string): Promise<LineageNode> {
  // Get all transfers involving this culture
  const transfers = await supabase
    .from('transfer_history')
    .select('*')
    .or(`from_culture_record_group_id.eq.${recordGroupId},to_entity_record_group_id.eq.${recordGroupId}`)
    .eq('is_current', true);

  // Build lineage tree with version context
  // For each transfer, we know:
  // - Which version of parent existed at transfer time
  // - Current version of parent for display

  // ...implementation
}
```

### Cost Tracking with Amendments

When costs are amended, we DON'T recalculate historical grow costs:

```typescript
// Cost is captured at time of use
interface InventoryUsage {
  // ...
  unitCostAtUsage: number;   // Frozen at usage time
  consumedCost: number;      // quantity * unitCostAtUsage
}

// If inventory item cost is amended:
// - New usages use new cost
// - Old usages keep historical cost
// - This is CORRECT behavior for financial accuracy
```

### Analytics Across Versions

```typescript
// Always aggregate on current versions only
async function getYieldStats(strainId: string): Promise<YieldStats> {
  const { data } = await supabase
    .from('grows')
    .select('totalYield, substrateWeight')
    .eq('strain_id', strainId)
    .eq('is_current', true)      // Only current versions
    .eq('is_archived', false)    // Exclude archived
    .eq('status', 'completed');  // Only completed grows

  // Calculate stats from current truth
  return computeStats(data);
}
```

---

## Appendix: iRacing Comparison

| iRacing Pattern | Sporely Equivalent |
|-----------------|-------------------|
| Race results never edited | Harvest records never edited |
| Incidents can be protested (creates amendment) | Observations can be corrected (creates amendment) |
| Driver stats computed from history | Yield stats computed from harvest_history |
| Series/season changes create new records | Stage transitions create history records |
| Championship points locked at end of season | Grow outcomes locked at completion |

This approach gives Sporely the same data integrity guarantees that make iRacing's statistics trustworthy and auditable.
