# MycoLab Immutable Database Design

## Executive Summary

This document outlines an immutable, append-only database architecture for MycoLab, inspired by iRacing's robust data management approach. The core principle: **original records are never modified or deleted** - instead, we create amendment records that reference and supersede them.

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

## Appendix: iRacing Comparison

| iRacing Pattern | MycoLab Equivalent |
|-----------------|-------------------|
| Race results never edited | Harvest records never edited |
| Incidents can be protested (creates amendment) | Observations can be corrected (creates amendment) |
| Driver stats computed from history | Yield stats computed from harvest_history |
| Series/season changes create new records | Stage transitions create history records |
| Championship points locked at end of season | Grow outcomes locked at completion |

This approach gives MycoLab the same data integrity guarantees that make iRacing's statistics trustworthy and auditable.
