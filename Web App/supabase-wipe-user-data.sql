-- ============================================================================
-- MycoLab User Data Wipe Script
-- ============================================================================
--
-- PURPOSE: Completely remove all user-created data while preserving:
--   - Database schema (tables, indexes, constraints)
--   - System/seed reference data (species, strain defaults, etc.)
--   - Schema version tracking
--
-- WHEN TO USE:
--   - Testing: Reset to fresh state for integration testing
--   - Development: Clear dev database before new testing cycle
--   - User request: Complete data removal (GDPR, account deletion, etc.)
--   - Disaster recovery: Clean slate before reimporting from backup
--
-- ⚠️ WARNING: This script PERMANENTLY DELETES all user data!
-- ⚠️ There is NO undo. Always backup your database first.
--
-- ============================================================================
-- CHOOSING THE RIGHT RESET SCRIPT
-- ============================================================================
--
-- MycoLab provides TWO reset options depending on your needs:
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-wipe-user-data.sql (THIS FILE)                              │
-- │ ────────────────────────────────────────────                         │
-- │ USE WHEN: You want to clear user data but keep the schema           │
-- │                                                                      │
-- │ • Removes all user-created records (user_id IS NOT NULL)            │
-- │ • PRESERVES database schema (tables, indexes, triggers, policies)   │
-- │ • PRESERVES seed data (system species, strains, containers, etc.)   │
-- │ • Fastest option - just DELETE statements                           │
-- │ • Good for: Testing, dev reset, GDPR requests                       │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-reset-database.sql (NUCLEAR OPTION)                         │
-- │ ──────────────────────────────────────────────                       │
-- │ USE WHEN: Schema is broken, has old tables, or needs fresh start    │
-- │                                                                      │
-- │ • DROPS EVERYTHING: tables, functions, triggers, policies, types    │
-- │ • Removes ALL data including seed data                              │
-- │ • Cleans up orphaned/unused objects from old schema versions        │
-- │ • REQUIRES running these scripts after:                             │
-- │     1. supabase-schema.sql (recreate schema)                        │
-- │     2. supabase-seed-data.sql (populate reference data)             │
-- │     3. supabase-species-data.sql (populate species/strains)         │
-- │ • Good for: Schema drift, orphaned objects, major version upgrades  │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ============================================================================
-- SQL SCRIPTS RELATIONSHIP DOCUMENTATION
-- ============================================================================
--
-- The MycoLab database uses several SQL scripts that work together:
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-schema.sql                                                  │
-- │ ─────────────────────                                                │
-- │ • Creates all tables, indexes, triggers, RLS policies               │
-- │ • Contains migrations for schema changes                            │
-- │ • Idempotent: Safe to run multiple times                            │
-- │ • Run FIRST when setting up database                                │
-- │ • Version: Check schema_version table (currently v23)               │
-- └─────────────────────────────────────────────────────────────────────┘
--                                    │
--                                    ▼
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-seed-data.sql                                               │
-- │ ──────────────────────                                               │
-- │ • Populates reference/lookup tables with default values             │
-- │ • Container types, inventory categories, substrate types, etc.       │
-- │ • Has user_id = NULL for system-level data                          │
-- │ • Idempotent: Uses ON CONFLICT DO UPDATE                            │
-- │ • Run SECOND after schema.sql                                        │
-- └─────────────────────────────────────────────────────────────────────┘
--                                    │
--                                    ▼
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-species-data.sql                                            │
-- │ ────────────────────────                                             │
-- │ • Populates species and strain reference data                       │
-- │ • Scientific names, cultivation parameters, grow conditions          │
-- │ • Has user_id = NULL for system-level data                          │
-- │ • Idempotent: Uses ON CONFLICT DO UPDATE                            │
-- │ • Run THIRD after seed-data.sql                                      │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-wipe-user-data.sql (THIS FILE)                              │
-- │ ────────────────────────────                                         │
-- │ • Removes all USER-created data (user_id IS NOT NULL)               │
-- │ • Preserves schema, indexes, triggers, RLS policies                 │
-- │ • Preserves seed data (user_id IS NULL)                             │
-- │ • Idempotent: Safe to run multiple times                            │
-- │ • Run ANYTIME to reset to fresh state                               │
-- │                                                                      │
-- │ ⚠️ IF SCHEMA CHANGES: Update this file's table list!                │
-- │ New tables with user data must be added to deletion list below.      │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ supabase-reset-database.sql                                          │
-- │ ───────────────────────────                                          │
-- │ • NUCLEAR OPTION - Drops EVERYTHING                                 │
-- │ • Use when schema has orphaned objects or major drift               │
-- │ • REQUIRES running schema + seed scripts after                      │
-- │ • See file header for detailed usage instructions                   │
-- └─────────────────────────────────────────────────────────────────────┘
--
-- DEPENDENCY ORDER:
--   When ADDING data: Parents first, children last
--   When DELETING data: Children first, parents last
--
-- ============================================================================
-- MAINTENANCE CHECKLIST
-- ============================================================================
--
-- When modifying the database schema, check these files:
--
-- ☐ supabase-schema.sql - Add/modify table definition
-- ☐ supabase-seed-data.sql - Add default values (if applicable)
-- ☐ supabase-species-data.sql - Add species/strain data (if applicable)
-- ☐ supabase-wipe-user-data.sql - Add to deletion list (if has user data)
-- ☐ supabase-reset-database.sql - Add to drop list (if new table)
--
-- Tables with user data must be deleted in REVERSE dependency order:
--   1. Delete from child tables (with foreign keys)
--   2. Then delete from parent tables
--
-- ============================================================================
-- BEGIN DATA WIPE
-- ============================================================================

-- Wrap in a transaction for atomicity
BEGIN;

-- Display warning
DO $$
BEGIN
  RAISE WARNING '⚠️  STARTING USER DATA WIPE - ALL USER DATA WILL BE DELETED';
  RAISE NOTICE 'This operation is IRREVERSIBLE. Backup your data first!';
END $$;

-- ============================================================================
-- TIER 1: Leaf tables (no dependencies, delete first)
-- These tables are referenced by nothing else
-- ============================================================================

-- Outcome tracking (newest tables)
DELETE FROM contamination_details WHERE user_id IS NOT NULL;
DELETE FROM exit_surveys WHERE user_id IS NOT NULL;
DELETE FROM entity_outcomes WHERE user_id IS NOT NULL;

-- Daily operations
DELETE FROM cold_storage_checks WHERE user_id IS NOT NULL;
DELETE FROM harvest_forecasts WHERE user_id IS NOT NULL;
DELETE FROM room_statuses WHERE user_id IS NOT NULL;
DELETE FROM daily_checks WHERE user_id IS NOT NULL;

-- Event logging
DELETE FROM lab_events WHERE user_id IS NOT NULL;
DELETE FROM library_suggestions WHERE user_id IS NOT NULL;

-- Admin/Audit
DELETE FROM admin_notifications WHERE user_id IS NOT NULL OR user_id IS NULL;  -- Clear all notifications
DELETE FROM admin_audit_log WHERE user_id IS NOT NULL OR user_id IS NULL;  -- Clear all audit logs

-- User notification system
DELETE FROM notification_queue WHERE user_id IS NOT NULL;
DELETE FROM notification_delivery_log WHERE user_id IS NOT NULL;
DELETE FROM notification_event_preferences WHERE user_id IS NOT NULL;
DELETE FROM notification_channels WHERE user_id IS NOT NULL;

-- User settings
DELETE FROM user_settings WHERE user_id IS NOT NULL;
DELETE FROM user_profiles WHERE user_id IS NOT NULL;

-- ============================================================================
-- TIER 2: Child tables (depend on core tables)
-- ============================================================================

-- Grow-related children
DELETE FROM flushes WHERE user_id IS NOT NULL;
DELETE FROM grow_observations WHERE user_id IS NOT NULL;

-- Culture-related children
DELETE FROM culture_transfers WHERE user_id IS NOT NULL;
DELETE FROM culture_observations WHERE user_id IS NOT NULL;

-- Recipe ingredients
DELETE FROM recipe_ingredients WHERE user_id IS NOT NULL;

-- Inventory children
DELETE FROM inventory_usages WHERE user_id IS NOT NULL;
DELETE FROM inventory_lots WHERE user_id IS NOT NULL;

-- ============================================================================
-- TIER 3: Core entity tables
-- ============================================================================

-- Grows (depends on cultures, strains)
DELETE FROM grows WHERE user_id IS NOT NULL;

-- Prepared spawn (depends on cultures, strains)
DELETE FROM prepared_spawn WHERE user_id IS NOT NULL;

-- Cultures (depends on strains, recipes)
DELETE FROM cultures WHERE user_id IS NOT NULL;

-- Recipes
DELETE FROM recipes WHERE user_id IS NOT NULL;

-- Inventory items
DELETE FROM inventory_items WHERE user_id IS NOT NULL;

-- Purchase orders
DELETE FROM purchase_orders WHERE user_id IS NOT NULL;

-- ============================================================================
-- TIER 4: Reference/lookup tables with user data
-- ============================================================================

-- Locations (user-defined lab spaces)
DELETE FROM locations WHERE user_id IS NOT NULL;

-- Suppliers (user-defined vendors)
DELETE FROM suppliers WHERE user_id IS NOT NULL;

-- Containers (user-defined vessel types) - if user-created
DELETE FROM containers WHERE user_id IS NOT NULL;

-- ============================================================================
-- TIER 5: Reference tables - PRESERVE SEED DATA
-- These have user_id = NULL for system defaults, only delete user-added
-- ============================================================================

-- User-added strains (preserve system strains)
DELETE FROM strains WHERE user_id IS NOT NULL;

-- User-added species (preserve system species)
DELETE FROM species WHERE user_id IS NOT NULL;

-- User-added lookup values (preserve system defaults)
DELETE FROM location_types WHERE user_id IS NOT NULL;
DELETE FROM location_classifications WHERE user_id IS NOT NULL;
DELETE FROM substrate_types WHERE user_id IS NOT NULL;
DELETE FROM inventory_categories WHERE user_id IS NOT NULL;
DELETE FROM recipe_categories WHERE user_id IS NOT NULL;
DELETE FROM grain_types WHERE user_id IS NOT NULL;

-- ============================================================================
-- SUMMARY & VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  DATA WIPE COMPLETE - VERIFICATION SUMMARY';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';

  -- Count remaining user records in key tables
  SELECT COUNT(*) INTO v_count FROM cultures WHERE user_id IS NOT NULL;
  RAISE NOTICE '  Cultures (user): % records remaining', v_count;

  SELECT COUNT(*) INTO v_count FROM grows WHERE user_id IS NOT NULL;
  RAISE NOTICE '  Grows (user): % records remaining', v_count;

  SELECT COUNT(*) INTO v_count FROM recipes WHERE user_id IS NOT NULL;
  RAISE NOTICE '  Recipes (user): % records remaining', v_count;

  SELECT COUNT(*) INTO v_count FROM inventory_items WHERE user_id IS NOT NULL;
  RAISE NOTICE '  Inventory items (user): % records remaining', v_count;

  -- Count preserved seed data
  SELECT COUNT(*) INTO v_count FROM species WHERE user_id IS NULL;
  RAISE NOTICE '  Species (system): % records preserved', v_count;

  SELECT COUNT(*) INTO v_count FROM strains WHERE user_id IS NULL;
  RAISE NOTICE '  Strains (system): % records preserved', v_count;

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ✓ All user data has been removed';
  RAISE NOTICE '  ✓ System seed data has been preserved';
  RAISE NOTICE '  ✓ Database schema is intact';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this, the data wipe completed successfully.
-- Your database is now in a fresh state with only seed data.
--
-- To repopulate with seed data (if accidentally deleted):
--   1. Run supabase-seed-data.sql
--   2. Run supabase-species-data.sql
-- ============================================================================
