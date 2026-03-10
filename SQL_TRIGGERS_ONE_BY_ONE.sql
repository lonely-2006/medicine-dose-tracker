-- ================================================================
-- YOUR EXISTING TRIGGERS - Clean Code
-- ================================================================
-- Copy and paste each trigger individually into Supabase SQL Editor
-- Run one trigger at a time to confirm they work
-- ================================================================


-- ================================================================
-- TRIGGER #1: AUTO-CREATE REMINDER WHEN SCHEDULE IS ADDED
-- ================================================================
-- What it does: When a new schedule is created, automatically 
--              creates a reminder for that schedule
-- 
-- Why: Eliminates manual reminder creation
--      Guarantees every schedule has a reminder
--      No orphaned schedules
-- 
-- Copy this entire block and run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_after_schedule_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.reminder (schedule_id, mode, reminder_time, status)
  VALUES (
    NEW.schedule_id,
    'Push Notification',
    NEW.time,
    'Active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER after_schedule_insert
  AFTER INSERT ON public.schedule
  FOR EACH ROW EXECUTE FUNCTION public.handle_after_schedule_insert();

-- ================================================================
-- END TRIGGER #1
-- ================================================================


-- ================================================================
-- TRIGGER #2: MULTI-TABLE INSERT STORED PROCEDURE
-- ================================================================
-- What it does: Single function that inserts into 3 tables at once:
--              1. medicine table
--              2. dosage table (uses medicine_id from step 1)
--              3. schedule table (uses dosage_id from step 2)
-- 
-- Why: Complex operations made simple
--      All 3 inserts happen together (atomic)
--      IDs are properly linked
--      No orphaned records
-- 
-- Copy this entire block and run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.add_medicine_with_schedule(
  p_name VARCHAR,
  p_brand VARCHAR,
  p_type VARCHAR,
  p_description VARCHAR,
  p_prescription_id INT,
  p_amount DECIMAL,
  p_unit VARCHAR,
  p_frequency VARCHAR,
  p_start_date DATE,
  p_end_date DATE,
  p_time TIME
)
RETURNS VOID AS $$
DECLARE
  v_medicine_id INT;
  v_dosage_id INT;
BEGIN
  -- Step 1: Insert into medicine table
  INSERT INTO public.medicine (name, brand, type, description, prescription_id)
  VALUES (p_name, p_brand, p_type, p_description, p_prescription_id)
  RETURNING medicine_id INTO v_medicine_id;

  -- Step 2: Insert into dosage table
  INSERT INTO public.dosage (medicine_id, amount, unit, frequency)
  VALUES (v_medicine_id, p_amount, p_unit, p_frequency)
  RETURNING dosage_id INTO v_dosage_id;

  -- Step 3: Insert into schedule table
  INSERT INTO public.schedule (dosage_id, start_date, end_date, time)
  VALUES (v_dosage_id, p_start_date, p_end_date, p_time);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- END TRIGGER #2
-- ================================================================


-- ================================================================
-- TRIGGER #3: VALIDATE SCHEDULE ID BEFORE LOGGING DOSE
-- ================================================================
-- What it does: Before inserting a dose log, checks if the 
--              schedule_id actually exists
-- 
-- Why: Prevents invalid data
--      No orphaned dose logs
--      Data corruption prevented at DB level
--      Can't be bypassed by app code
-- 
-- Copy this entire block and run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_before_intake_log_insert()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.schedule WHERE schedule_id = NEW.schedule_id) THEN
    RAISE EXCEPTION 'Invalid schedule ID. Schedule does not exist.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER before_intake_log_insert
  BEFORE INSERT ON public.intake_log
  FOR EACH ROW EXECUTE FUNCTION public.handle_before_intake_log_insert();

-- ================================================================
-- END TRIGGER #3
-- ================================================================


-- ================================================================
-- VERIFICATION QUERIES (Run these to confirm triggers work)
-- ================================================================

-- Check all triggers are installed:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY trigger_name;

-- Expected results:
-- after_schedule_insert       | schedule   | AFTER  | INSERT
-- before_intake_log_insert    | intake_log | BEFORE | INSERT


-- ================================================================
-- HOW TO USE THESE TRIGGERS
-- ================================================================

-- TRIGGER #1 - Automatic (no manual call needed)
-- Just create a schedule in your app
-- The reminder will be created automatically!


-- TRIGGER #2 - Manual function call
-- Use in your app code or SQL:
-- SELECT add_medicine_with_schedule(
--   'Lisinopril',           -- p_name
--   'Prinivil',             -- p_brand
--   'Tablet',               -- p_type
--   'High blood pressure',  -- p_description
--   1,                      -- p_prescription_id
--   10,                     -- p_amount
--   'mg',                   -- p_unit
--   'Once daily',           -- p_frequency
--   '2026-03-10',           -- p_start_date
--   '2026-06-10',           -- p_end_date
--   '09:00'                 -- p_time
-- );


-- TRIGGER #3 - Automatic (no manual call needed)
-- This trigger protects the database
-- If you try to insert with invalid schedule_id, it will error
-- Example that WILL FAIL:
-- INSERT INTO intake_log (schedule_id, date, status)
-- VALUES (99999, '2026-03-10', 'Taken');
-- Result: ERROR - Invalid schedule ID

-- Example that WILL WORK:
-- INSERT INTO intake_log (schedule_id, date, status)
-- VALUES (1, '2026-03-10', 'Taken');
-- Result: SUCCESS
