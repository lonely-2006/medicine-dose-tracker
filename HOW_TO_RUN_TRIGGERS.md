# Step-by-Step: Running Triggers in Supabase

## 📍 How to Get the SQL Code

Your SQL file is at: `sql/supabase_triggers.sql`

**Quick path:**
1. Open File Explorer
2. Go to `c:\Users\acer5\medicine-dose-tracker\sql\`
3. Open `supabase_triggers.sql` with any text editor
4. Keep it open while you follow the steps below

---

## 🔧 Running Triggers in Supabase (Step-by-Step)

### Step 1: Open Supabase SQL Editor
```
1. Go to https://app.supabase.com
2. Login with your credentials
3. Select your "medicine-dose-tracker" project
4. Click "SQL Editor" in left sidebar
5. Click "+ New Query" button (top right)
```

### Step 2: Copy First Trigger Block
From `supabase_triggers.sql`, copy this section:

```sql
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
```

### Step 3: Paste into Supabase
```
1. Paste the SQL into the editor
2. Click "Run" (bottom right, or Ctrl+Enter)
3. You should see: ✅ Success message
4. You'll see in results panel: "CREATE FUNCTION", "CREATE TRIGGER" messages
```

**What you're seeing:**
- Created function `update_timestamp`
- Created 3 triggers that use that function
- All rows being updated will now auto-set timestamp

---

### Step 4: Copy Second Trigger Block
From `supabase_triggers.sql`, copy:

```sql
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
```

### Step 5: Paste and Run in Supabase
```
1. Select all text in editor (Ctrl+A) and delete
2. Paste the second block
3. Click "Run"
4. Should see: ✅ "CREATE FUNCTION" and "CREATE TRIGGER" success
```

**What's happening:**
- Created function `log_dose_to_audit()`
- Created trigger that watches `dose_logs` table
- Whenever a new dose log is inserted, trigger fires and auto-creates audit log entry

---

### Step 6: Copy Third Trigger Block
From `supabase_triggers.sql`, copy:

```sql
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
```

### Step 7: Paste and Run
```
1. Clear editor, paste third block
2. Click "Run"
3. Should see: ✅ Success messages
```

**What's happening:**
- Created function `update_reminder_on_dose_logged()`
- When dose logged, reminder status auto-updates to 'completed'
- Timestamp auto-set to when dose was taken

---

## ✅ Verify Triggers Installed Correctly

### Quick Check Query
Run this in Supabase SQL Editor to confirm triggers exist:

```sql
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

**Expected Results:**
```
trigger_name                    | event_object_table | event_manipulation
────────────────────────────────┼────────────────────┼───────────────────
dose_log_audit_trigger          | dose_logs          | INSERT
update_audit_logs_timestamp     | audit_logs         | UPDATE
update_notifications_timestamp  | notifications      | UPDATE
update_reminder_on_dose_trigger | dose_logs          | INSERT
update_reminders_timestamp      | reminders          | UPDATE
```

**If you see these 5 triggers → Success! ✅**

---

## 🎯 Now You Can Demo

### Demo Setup Check
```
1. ✅ Supabase has all triggers installed
2. ✅ Open Supabase Dashboard in one tab
3. ✅ Open your app in another tab
4. ✅ Have TRIGGERS_CHEAT_SHEET.md nearby
5. Ready to demo!
```

### The Demo Moment

**In App:**
1. Click "Mark as Taken" for a dose

**In Supabase (Live):**
1. Refresh `dose_logs` table → see new entry
2. Refresh `audit_logs` table → see automatic entry (trigger created this!)
3. Search `reminders` table → see status changed to 'completed'

**Say:**
> "One click in the app triggered three automatic database updates. The triggers are doing the hard work!"

---

## 🔍 Useful Queries During Demo

### See Recent Dose Logs
```sql
SELECT id, reminder_id, user_id, taken_at, status
FROM dose_logs
ORDER BY taken_at DESC
LIMIT 10;
```

### See Audit Logs Created by Trigger
```sql
SELECT user_id, action, resource_type, details, timestamp
FROM audit_logs
WHERE action = 'dose_logged'
ORDER BY timestamp DESC
LIMIT 10;
```

### See Completed Reminders (Updated by Trigger)
```sql
SELECT id, medicine_name, status, completed_at, updated_at
FROM reminders
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 10;
```

### See All Timestamps Auto-Updated
```sql
SELECT id, medicine_name, status, updated_at
FROM reminders
ORDER BY updated_at DESC
LIMIT 5;
```

---

## ❌ Troubleshooting

### "Trigger already exists" Error
**Solution:** This means it was already created. That's fine! Just move to next trigger.

### "Function already exists" Error  
**Solution:** Same as above. Functions are reusable by multiple triggers.

### Triggers aren't firing
**Check:**
1. Open `information_schema.triggers` query (above)
2. Verify all 5 triggers show up
3. Check trigger ACTIONS - should be INSERT or UPDATE
4. If missing, re-run the trigger SQL

### Audit log not appearing
**Check:**
1. Is `dose_logs` entry being created? (check dose_logs table)
2. Does the dose_logs entry have a `reminder_id`?
3. Does that reminder exist in `reminders` table?
4. Try running verification query above

---

## 💪 You're All Set!

```
✅ SQL file created (sql/supabase_triggers.sql)
✅ Demo guide written (TRIGGERS_DEMO_GUIDE.md)
✅ Cheat sheet ready (TRIGGERS_CHEAT_SHEET.md)
✅ Step-by-step instructions (this file)
✅ Verification queries provided
✅ Troubleshooting guide included

Ready to demo! 🚀
```

---

## 🎬 Final Demo Checklist

- [ ] All 5 triggers installed in Supabase
- [ ] Verification query returns all triggers
- [ ] Sample reminder exists in database
- [ ] App is running
- [ ] Supabase dashboard is open
- [ ] Have TRIGGERS_CHEAT_SHEET.md visible
- [ ] Know the 3-minute demo script
- [ ] Practice the demo once
- [ ] You're confident explaining what triggers do

**You've got this! Go impress them! 🎯**
