-- ============================================================================
-- MycoLab COMPLETE DATABASE RESET SCRIPT
-- ============================================================================
--
-- PURPOSE: Completely remove ALL database objects so schema can be rebuilt
--   from scratch using the idempotent schema and seed data scripts.
--
-- THIS SCRIPT REMOVES:
--   - All triggers (including auth triggers)
--   - All RLS policies on all tables
--   - All functions
--   - All tables (in correct dependency order)
--   - All custom types/enums
--   - Resets extensions to initial state
--
-- WHAT IS PRESERVED:
--   - PostgreSQL system tables
--   - Supabase internal tables (auth, storage, etc.)
--   - Database connection and user
--
-- ============================================================================
-- ⚠️  EXTREME WARNING: THIS IS A DESTRUCTIVE OPERATION  ⚠️
-- ============================================================================
--
-- This script will PERMANENTLY DELETE:
--   - ALL user data
--   - ALL seed data
--   - ALL database schema
--   - ALL custom functions
--   - ALL triggers and policies
--
-- There is NO UNDO. The only recovery is from a backup.
--
-- AFTER RUNNING THIS SCRIPT, YOU MUST:
--   1. Run supabase-schema.sql to recreate the schema
--   2. Run supabase-seed-data.sql to populate reference data
--   3. Run supabase-species-data.sql to populate species/strains
--
-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
--
-- 1. BACKUP YOUR DATABASE FIRST (if you have any data you want to keep):
--    - Use Supabase Dashboard > Database > Backups
--    - Or use pg_dump from command line
--
-- 2. Run this script in Supabase SQL Editor:
--    - Go to Database > SQL Editor
--    - Paste this entire script
--    - Click "Run" (or Cmd/Ctrl+Enter)
--
-- 3. After successful completion, run the rebuild scripts in order:
--    a. supabase-schema.sql
--    b. supabase-seed-data.sql
--    c. supabase-species-data.sql
--
-- ============================================================================

-- Start the reset process
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           MYCOLAB DATABASE RESET - STARTING                      ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║  ⚠️  WARNING: All data will be PERMANENTLY DELETED!              ║';
  RAISE NOTICE '║  This operation cannot be undone.                                 ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PHASE 1: DROP TRIGGERS ON auth.users
-- ============================================================================
-- These must be dropped FIRST as they reference functions we'll drop later

DO $$
BEGIN
  RAISE NOTICE '━━━ PHASE 1: Dropping triggers on auth.users ━━━';

  -- Drop auth triggers safely
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  RAISE NOTICE '  ✓ Dropped on_auth_user_created trigger';

  DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
  RAISE NOTICE '  ✓ Dropped on_auth_user_updated trigger';

  DROP TRIGGER IF EXISTS on_user_created_populate_data ON auth.users;
  RAISE NOTICE '  ✓ Dropped on_user_created_populate_data trigger';

  DROP TRIGGER IF EXISTS on_auth_user_created_notify ON auth.users;
  RAISE NOTICE '  ✓ Dropped on_auth_user_created_notify trigger';

  RAISE NOTICE '  ✓ Phase 1 complete: Auth triggers dropped';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Phase 1 error (continuing): %', SQLERRM;
END $$;

-- ============================================================================
-- PHASE 2: DROP ALL RLS POLICIES
-- ============================================================================
-- Must drop policies before dropping tables

DO $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '━━━ PHASE 2: Dropping all RLS policies ━━━';

  -- Get all policies on tables in public schema
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  ) LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                     r.policyname, r.schemaname, r.tablename);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  Could not drop policy % on %.%: %',
                    r.policyname, r.schemaname, r.tablename, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '  ✓ Phase 2 complete: Dropped % policies', v_count;
END $$;

-- ============================================================================
-- PHASE 3: DROP ALL TRIGGERS ON PUBLIC TABLES
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '━━━ PHASE 3: Dropping all triggers on public tables ━━━';

  -- Get all triggers on tables in public schema
  FOR r IN (
    SELECT tgname AS trigger_name, relname AS table_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND NOT tgisinternal
    ORDER BY relname, tgname
  ) LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I',
                     r.trigger_name, r.table_name);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  Could not drop trigger % on %: %',
                    r.trigger_name, r.table_name, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '  ✓ Phase 3 complete: Dropped % triggers', v_count;
END $$;

-- ============================================================================
-- PHASE 4: DROP ALL FUNCTIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '━━━ PHASE 4: Dropping all custom functions ━━━';
END $$;

-- Auth-related functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.populate_default_user_data() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admins_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_admin_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) CASCADE;

-- Admin/utility functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_not_anonymous() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- Core data functions
DROP FUNCTION IF EXISTS public.insert_flush(UUID, TIMESTAMPTZ, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, UUID, JSONB, UUID, JSONB, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.insert_flush(UUID, TIMESTAMPTZ, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, UUID, JSONB, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.insert_flush(UUID, TIMESTAMPTZ, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) CASCADE;

-- Passport functions
DROP FUNCTION IF EXISTS public.generate_passport_code() CASCADE;
DROP FUNCTION IF EXISTS public.record_passport_view(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Account migration functions
DROP FUNCTION IF EXISTS public.check_email_account(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.migrate_user_data(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_existing_email(TEXT) CASCADE;

-- History/amendment functions
DROP FUNCTION IF EXISTS public.amend_record(UUID, TEXT, JSONB, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.archive_record(TEXT, UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_record_history(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_record_at_time(TEXT, UUID, TIMESTAMPTZ) CASCADE;

-- Notification functions
DROP FUNCTION IF EXISTS public.check_culture_expirations() CASCADE;
DROP FUNCTION IF EXISTS public.check_grow_stage_transitions() CASCADE;
DROP FUNCTION IF EXISTS public.check_low_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.check_harvest_ready() CASCADE;
DROP FUNCTION IF EXISTS public.process_scheduled_notifications() CASCADE;
DROP FUNCTION IF EXISTS public.setup_notification_cron_jobs() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_notification_check() CASCADE;
DROP FUNCTION IF EXISTS public.get_pending_notifications(UUID) CASCADE;

-- Bulk operation functions
DROP FUNCTION IF EXISTS public.bulk_create_from_template(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_update_status(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_clone_records(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_archive_records(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.execute_bulk_operation(UUID) CASCADE;

-- Suggestion functions
DROP FUNCTION IF EXISTS public.update_suggestion_message(UUID, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_suggestion_message(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.add_suggestion_message(UUID, TEXT, TEXT, UUID) CASCADE;

-- Archive functions
DROP FUNCTION IF EXISTS public.archive_all_user_data(UUID) CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Phase 4 complete: Functions dropped';
END $$;

-- ============================================================================
-- PHASE 5: DROP ALL TABLES
-- ============================================================================
-- Tables must be dropped in REVERSE dependency order (children before parents)

DO $$
BEGIN
  RAISE NOTICE '━━━ PHASE 5: Dropping all tables ━━━';
  RAISE NOTICE '  (Tables dropped in reverse dependency order)';
END $$;

-- ----- TIER 1: Leaf/History tables (no dependents) -----

-- Notification system tables
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.notification_delivery_log CASCADE;
DROP TABLE IF EXISTS public.notification_event_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_channels CASCADE;
DROP TABLE IF EXISTS public.notification_templates CASCADE;
DROP TABLE IF EXISTS public.verification_codes CASCADE;

-- History/audit tables
DROP TABLE IF EXISTS public.stage_transition_history CASCADE;
DROP TABLE IF EXISTS public.transfer_history CASCADE;
DROP TABLE IF EXISTS public.harvest_history CASCADE;
DROP TABLE IF EXISTS public.observation_history CASCADE;
DROP TABLE IF EXISTS public.data_amendment_log CASCADE;
DROP TABLE IF EXISTS public.bulk_operations CASCADE;

-- Suggestion/feedback tables
DROP TABLE IF EXISTS public.suggestion_messages CASCADE;
DROP TABLE IF EXISTS public.library_suggestions CASCADE;

-- Outcome tracking tables
DROP TABLE IF EXISTS public.exit_surveys CASCADE;
DROP TABLE IF EXISTS public.contamination_details CASCADE;
DROP TABLE IF EXISTS public.entity_outcomes CASCADE;

-- Daily operations tables
DROP TABLE IF EXISTS public.cold_storage_checks CASCADE;
DROP TABLE IF EXISTS public.harvest_forecasts CASCADE;
DROP TABLE IF EXISTS public.room_statuses CASCADE;
DROP TABLE IF EXISTS public.daily_checks CASCADE;
DROP TABLE IF EXISTS public.lab_events CASCADE;

-- Passport/sharing tables
DROP TABLE IF EXISTS public.passport_views CASCADE;
DROP TABLE IF EXISTS public.batch_passports CASCADE;
DROP TABLE IF EXISTS public.share_tokens CASCADE;
DROP TABLE IF EXISTS public.redaction_presets CASCADE;

-- Admin tables
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;

-- User tables
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Tier 1 tables dropped (history, notifications, admin, user)';
END $$;

-- ----- TIER 2: Child tables (depend on core entities) -----

-- Grow children
DROP TABLE IF EXISTS public.flushes CASCADE;
DROP TABLE IF EXISTS public.grow_observations CASCADE;

-- Culture children
DROP TABLE IF EXISTS public.culture_transfers CASCADE;
DROP TABLE IF EXISTS public.culture_observations CASCADE;

-- Recipe children
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;

-- Inventory children
DROP TABLE IF EXISTS public.inventory_usages CASCADE;
DROP TABLE IF EXISTS public.inventory_lots CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Tier 2 tables dropped (child/observation tables)';
END $$;

-- ----- TIER 3: Core entity tables -----

DROP TABLE IF EXISTS public.grows CASCADE;
DROP TABLE IF EXISTS public.prepared_spawn CASCADE;
DROP TABLE IF EXISTS public.cultures CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Tier 3 tables dropped (core entities)';
END $$;

-- ----- TIER 4: Reference/lookup tables -----

DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.containers CASCADE;

-- Drop legacy tables if they still exist
DROP TABLE IF EXISTS public.vessels CASCADE;
DROP TABLE IF EXISTS public.container_types CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Tier 4 tables dropped (locations, suppliers, containers)';
END $$;

-- ----- TIER 5: Base lookup tables -----

DROP TABLE IF EXISTS public.strains CASCADE;
DROP TABLE IF EXISTS public.species CASCADE;
DROP TABLE IF EXISTS public.location_types CASCADE;
DROP TABLE IF EXISTS public.location_classifications CASCADE;
DROP TABLE IF EXISTS public.substrate_types CASCADE;
DROP TABLE IF EXISTS public.inventory_categories CASCADE;
DROP TABLE IF EXISTS public.recipe_categories CASCADE;
DROP TABLE IF EXISTS public.grain_types CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Tier 5 tables dropped (base lookup tables)';
END $$;

-- ----- TIER 6: Schema management -----

DROP TABLE IF EXISTS public.schema_version CASCADE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Phase 5 complete: All tables dropped';
END $$;

-- ============================================================================
-- PHASE 6: DROP CUSTOM TYPES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '━━━ PHASE 6: Dropping custom types ━━━';

  -- Drop any custom enum types that might exist
  DROP TYPE IF EXISTS public.culture_type CASCADE;
  DROP TYPE IF EXISTS public.culture_status CASCADE;
  DROP TYPE IF EXISTS public.grow_stage CASCADE;
  DROP TYPE IF EXISTS public.grow_status CASCADE;
  DROP TYPE IF EXISTS public.recipe_category CASCADE;
  DROP TYPE IF EXISTS public.notification_type CASCADE;
  DROP TYPE IF EXISTS public.notification_status CASCADE;

  RAISE NOTICE '  ✓ Phase 6 complete: Custom types dropped';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '  ✓ Phase 6 complete: No custom types to drop';
END $$;

-- ============================================================================
-- PHASE 7: CLEAN UP ORPHANED OBJECTS
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '━━━ PHASE 7: Cleaning up orphaned objects ━━━';

  -- Drop any remaining functions in public schema (catch-all)
  FOR r IN (
    SELECT proname, oidvectortypes(proargtypes) as argtypes
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname NOT LIKE 'pg_%'
    ORDER BY proname
  ) LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.argtypes);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors - function might have dependencies or already be dropped
      NULL;
    END;
  END LOOP;

  IF v_count > 0 THEN
    RAISE NOTICE '  ✓ Dropped % additional functions', v_count;
  END IF;

  RAISE NOTICE '  ✓ Phase 7 complete: Cleanup finished';
END $$;

-- ============================================================================
-- PHASE 8: VERIFY CLEAN STATE
-- ============================================================================

DO $$
DECLARE
  v_tables INTEGER;
  v_functions INTEGER;
  v_policies INTEGER;
  v_triggers INTEGER;
BEGIN
  RAISE NOTICE '━━━ PHASE 8: Verifying clean state ━━━';

  -- Count remaining tables in public schema
  SELECT COUNT(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

  -- Count remaining functions in public schema
  SELECT COUNT(*) INTO v_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public';

  -- Count remaining policies on public tables
  SELECT COUNT(*) INTO v_policies
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Count remaining triggers on public tables
  SELECT COUNT(*) INTO v_triggers
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND NOT tgisinternal;

  RAISE NOTICE '  Remaining in public schema:';
  RAISE NOTICE '    Tables: %', v_tables;
  RAISE NOTICE '    Functions: %', v_functions;
  RAISE NOTICE '    Policies: %', v_policies;
  RAISE NOTICE '    Triggers: %', v_triggers;

  IF v_tables = 0 AND v_policies = 0 AND v_triggers = 0 THEN
    RAISE NOTICE '  ✓ Database is clean and ready for schema rebuild';
  ELSE
    RAISE WARNING '  ⚠ Some objects may remain - this is usually OK';
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           DATABASE RESET COMPLETE                                 ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║                                                                   ║';
  RAISE NOTICE '║  The database has been completely reset.                          ║';
  RAISE NOTICE '║                                                                   ║';
  RAISE NOTICE '║  NEXT STEPS - Run these scripts IN ORDER:                         ║';
  RAISE NOTICE '║                                                                   ║';
  RAISE NOTICE '║  1. supabase-schema.sql        - Recreate all tables & functions  ║';
  RAISE NOTICE '║  2. supabase-seed-data.sql     - Populate reference data          ║';
  RAISE NOTICE '║  3. supabase-species-data.sql  - Populate species & strains       ║';
  RAISE NOTICE '║                                                                   ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- END OF RESET SCRIPT
-- ============================================================================
