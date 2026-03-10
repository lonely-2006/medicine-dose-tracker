/**
 * SUPABASE DATABASE TRIGGERS
 * 
 * This SQL file sets up automated workflows at the database level.
 * These triggers work without any app code - they run automatically
 * whenever data changes in your database.
 * 
 * How to use:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Create a new query
 * 3. Copy & paste the sections below one by one (or all at once)
 * 4. Click "Run" for each section
 * 5. You should see "Success" messages
 */

-- ================================================================
-- TRIGGER #1: AUTO-UPDATE TIMESTAMPS
-- ================================================================
-- What it does: Automatically updates the updated_at field whenever
-- a record is modified. This is useful for tracking when data changed.
--
-- Demo explanation:
-- "When a user updates their profile, the database automatically
--  sets updated_at to the current time. No manual code needed!"

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to audit_logs table
CREATE TRIGGER update_audit_logs_timestamp
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Apply to reminders table
CREATE TRIGGER update_reminders_timestamp
BEFORE UPDATE ON reminders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Apply to notifications table
CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ================================================================
-- TRIGGER #2: AUTO-LOG DOSE TO AUDIT TRAIL
-- ================================================================
-- What it does: When a dose is logged in dose_logs table,
-- it AUTOMATICALLY creates an entry in audit_logs table.
-- This creates a complete audit trail without manual logging.
--
-- Demo workflow:
-- 1. Patient clicks "Mark as Taken" in app
-- 2. dose_logs table gets new entry
-- 3. Database trigger fires automatically
-- 4. audit_logs table gets entry: "dose_logged" action
-- 5. Complete history is captured at DB level!
--
-- Real-world benefit:
-- Even if someone manually changes dose_logs directly in Supabase,
-- the audit log still captures it. Full transparency!

CREATE OR REPLACE FUNCTION log_dose_to_audit()
RETURNS TRIGGER AS $$
DECLARE
  p_user_id UUID;
BEGIN
  -- Get the user_id from the reminder
  SELECT user_id INTO p_user_id
  FROM reminders
  WHERE id = NEW.reminder_id;
  
  -- Insert into audit_logs automatically
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, timestamp)
  VALUES (
    p_user_id,
    'dose_logged',
    'dose_log',
    NEW.id::text::uuid,
    jsonb_build_object(
      'reminder_id', NEW.reminder_id,
      'status', NEW.status,
      'taken_at', NEW.taken_at,
      'automatically_logged', true
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to dose_logs table
CREATE TRIGGER dose_log_audit_trigger
AFTER INSERT ON dose_logs
FOR EACH ROW
EXECUTE FUNCTION log_dose_to_audit();

-- ================================================================
-- TRIGGER #3: AUTO-UPDATE REMINDER STATUS WHEN DOSE LOGGED
-- ================================================================
-- What it does: When a dose is marked as taken, the reminder status
-- automatically updates from "sent" to "completed".
--
-- Demo workflow:
-- 1. Reminder is waiting with status='sent'
-- 2. Patient logs dose → dose_logs entry created
-- 3. This trigger fires automatically
-- 4. Reminder status updates to 'completed'
-- 5. System knows dose was taken!

CREATE OR REPLACE FUNCTION update_reminder_on_dose_logged()
RETURNS TRIGGER AS $$
BEGIN
  -- If dose was taken successfully, mark reminder as completed
  IF NEW.status = 'completed' THEN
    UPDATE reminders
    SET status = 'completed',
        completed_at = NEW.taken_at
    WHERE id = NEW.reminder_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER update_reminder_on_dose_trigger
AFTER INSERT ON dose_logs
FOR EACH ROW
EXECUTE FUNCTION update_reminder_on_dose_logged();

-- ================================================================
-- HELPER FUNCTION: CREATE SAMPLE TEST DATA
-- ================================================================
-- Use this to test the triggers work correctly!

CREATE OR REPLACE FUNCTION create_sample_reminder_sequence()
RETURNS TABLE (reminder_id BIGINT, dose_log_id BIGINT, audit_entry_count INT) AS $$
DECLARE
  v_user_id UUID;
  v_reminder_id BIGINT;
  v_dose_log_id BIGINT;
  v_audit_count INT;
BEGIN
  -- Get a sample user (you can change this to your user_id)
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user. Please login first.';
  END IF;
  
  -- Create a sample reminder
  INSERT INTO reminders (user_id, medicine_name, dosage, due_time, status)
  VALUES (v_user_id, 'Test Medicine', '500mg', NOW(), 'sent')
  RETURNING id INTO v_reminder_id;
  
  -- Create a dose log (this will trigger the audit log creation!)
  INSERT INTO dose_logs (reminder_id, user_id, taken_at, status)
  VALUES (v_reminder_id, v_user_id, NOW(), 'completed')
  RETURNING id INTO v_dose_log_id;
  
  -- Count audit logs created
  SELECT COUNT(*)::INT INTO v_audit_count
  FROM audit_logs
  WHERE user_id = v_user_id
  AND action = 'dose_logged';
  
  RETURN QUERY SELECT v_reminder_id, v_dose_log_id, v_audit_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MONITORING QUERIES (Run these to verify triggers work)
-- ================================================================

-- Check if triggers are installed
-- SELECT trigger_name, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public';

-- View all audit logs created by triggers
-- SELECT user_id, action, resource_type, details, timestamp
-- FROM audit_logs
-- WHERE action = 'dose_logged'
-- ORDER BY timestamp DESC
-- LIMIT 10;

-- View reminder status changes
-- SELECT id, medicine_name, status, updated_at, completed_at
-- FROM reminders
-- ORDER BY updated_at DESC
-- LIMIT 5;
