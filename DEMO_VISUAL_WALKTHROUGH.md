# Visual Demo Walkthrough

---

## 📌 DEMO #1: Auto-Create Reminder

### STEP 1: Create Schedule in App

**You do:**
```
1. App → My Schedule → + Add Schedule
2. Fill form:
   ├─ Dosage: Select "Aspirin 500mg"
   ├─ Start: 2026-03-10
   ├─ End: 2026-06-10
   └─ Time: 10:00
3. Click "Add Schedule"
```

**You should see:**
```
✅ Toast message: "Schedule added! Want to set a reminder?"
```

---

### STEP 2: Show Schedule in Supabase

**You do:**
```
1. Switch to Supabase Tab
2. Go to schedule table
3. Click Refresh (↻ button)
4. Scroll to bottom
```

**You should see:**
```
┌─────────────────────────────────────────────┐
│ schedule_id │ dosage_id │ time        │     │
├─────────────────────────────────────────────┤
│     847     │    42     │ 10:00:00    │ ← NEW
└─────────────────────────────────────────────┘

Point: "New schedule created!"
```

---

### STEP 3: Show Reminder Auto-Created (MAGIC!)

**You do:**
```
1. Go to reminder table
2. Click Refresh (↻ button)
3. Scroll to bottom
```

**You should see:**
```
┌──────────────────────────────────────────────┐
│ reminder_id │ schedule_id │ reminder_time │  │
├──────────────────────────────────────────────┤
│     156     │    847      │ 10:00:00      │← AUTO!
└──────────────────────────────────────────────┘

Point: "Reminder created AUTOMATICALLY!"
       "Same schedule_id, same time!"
       "No manual creation needed!"
```

---

### STEP 4: Verify They're Linked

**Show in Supabase:**
```
In reminder table, click on the reminder row
You'll see it's linked to schedule 847

The relationship shows:
reminder.schedule_id (847) → schedule.schedule_id (847) ✓

This PROVES the trigger created it correctly!
```

---

## 📌 DEMO #2: Multi-Table Insert

### STEP 1: See Current State

**You do:**
```
1. Go to medicine table → Count rows
2. Go to dosage table → Count rows
3. Go to schedule table → Count rows
```

**You should note:**
```
Before function call:
- medicine: 15 rows
- dosage: 10 rows
- schedule: 12 rows

After function call:
- medicine: 16 rows (+ 1)
- dosage: 11 rows (+ 1)
- schedule: 13 rows (+ 1)
```

---

### STEP 2: Run the Function

**You do:**
```
1. Go to SQL Editor
2. Paste this:

SELECT add_medicine_with_schedule(
  'Metformin',           -- name
  'Glucophage',          -- brand
  'Tablet',              -- type
  'For diabetes',        -- description
  1,                     -- prescription_id
  500,                   -- amount
  'mg',                  -- unit
  'Twice daily',         -- frequency
  '2026-03-10',          -- start_date
  '2026-06-10',          -- end_date
  '09:00'                -- time
);

3. Click Run
```

**You should see:**
```
✅ Success - Query executed

(No output, but the magic happened!)
```

---

### STEP 3: Check Medicine Table

**You do:**
```
1. Go to medicine table
2. Click Refresh
3. Scroll to bottom or sort by medicine_id DESC
```

**You should see:**
```
┌────────────────────────────────────────┐
│ medicine_id │ name       │ brand       │
├────────────────────────────────────────┤
│     23      │ Metformin  │ Glucophage  │ ← NEW
└────────────────────────────────────────┘

Point: "Step 1 - Medicine inserted!"
       "Got ID 23"
```

---

### STEP 4: Check Dosage Table

**You do:**
```
1. Go to dosage table
2. Click Refresh
3. Find row with medicine_id = 23
```

**You should see:**
```
┌────────────────────────────────────────────┐
│ dosage_id │ medicine_id │ amount │ unit  │
├────────────────────────────────────────────┤
│     45    │     23      │  500   │ mg    │ ← NEW
└────────────────────────────────────────────┘

Point: "Step 2 - Dosage inserted!"
       "medicine_id = 23 - links to medicine!"
       "Got ID 45"
```

---

### STEP 5: Check Schedule Table

**You do:**
```
1. Go to schedule table
2. Click Refresh
3. Find row with dosage_id = 45
```

**You should see:**
```
┌────────────────────────────────────────────┐
│ schedule_id │ dosage_id │ time      │      │
├────────────────────────────────────────────┤
│     891     │     45    │ 09:00:00  │ ← NEW
└────────────────────────────────────────────┘

Point: "Step 3 - Schedule inserted!"
       "dosage_id = 45 - links to dosage!"
```

---

### STEP 6: Show the Complete Chain

**You do:**
```
1. In Supabase, run:

SELECT 
  m.medicine_id,
  m.name as medicine_name,
  d.dosage_id,
  d.amount,
  d.unit,
  s.schedule_id,
  s.time
FROM medicine m
JOIN dosage d ON m.medicine_id = d.medicine_id
JOIN schedule s ON d.dosage_id = s.dosage_id
WHERE m.medicine_id = 23;
```

**You should see:**
```
┌──────────────────────────────────────────────────────┐
│ medicine_id │ medicine_name │ dosage_id │ schedule_id│
├──────────────────────────────────────────────────────┤
│      23     │   Metformin   │    45     │     891    │
└──────────────────────────────────────────────────────┘

Perfect chain:
Medicine (23) → Dosage (45) → Schedule (891)

Point: "All linked perfectly from ONE function call!"
```

---

## 📌 DEMO #3: Validation Trigger

### STEP 1: Show Existing Schedule

**You do:**
```
1. Go to schedule table
2. Look for schedule_id = 1 or any low number
```

**You should see:**
```
┌──────────────────────────────┐
│ schedule_id │ dosage_id │ ...│
├──────────────────────────────┤
│      1      │     5     │ ...│
└──────────────────────────────┘

Note: "Schedule 1 exists in database"
```

---

### STEP 2: Try Invalid Insert (FAIL)

**You do:**
```
1. Go to SQL Editor
2. Paste:

INSERT INTO intake_log (schedule_id, date, status)
VALUES (99999, '2026-03-10', 'Taken');

3. Click Run
```

**You should see:**
```
❌ ERROR:
│ ERROR: Invalid schedule ID. Schedule does not exist. │

Point: "Trigger blocked it!"
       "Schedule 99999 doesn't exist!"
       "Bad data REJECTED!"
```

---

### STEP 3: Try Valid Insert (SUCCESS)

**You do:**
```
1. Clear or replace the query:

DELETE FROM intake_log 
WHERE schedule_id = 99999;

INSERT INTO intake_log (schedule_id, date, status)
VALUES (1, '2026-03-10', 'Taken');

2. Click Run
```

**You should see:**
```
✅ Success
│ INSERT 0 1 │

Point: "This time it worked!"
       "Schedule 1 exists!"
       "Good data ACCEPTED!"
```

---

### STEP 4: Verify Data Inserted

**You do:**
```
1. Paste:

SELECT log_id, schedule_id, date, status
FROM intake_log
WHERE schedule_id = 1
ORDER BY log_id DESC
LIMIT 1;

2. Click Run
```

**You should see:**
```
┌────────────────────────────────────────┐
│ log_id │ schedule_id │ date  │ status  │
├────────────────────────────────────────┤
│  156   │      1      │ date  │  Taken  │ ← NEW
└────────────────────────────────────────┘

Point: "The dose was logged!"
       "Because data was valid!"
```

---

## 📊 Complete Visual Flow

### DEMO #1 Flow:
```
App: Create Schedule
        ↓
Supabase: New Row in schedule table
        ↓
Trigger FIRES: handle_after_schedule_insert()
        ↓
Supabase: New Row in reminder table (AUTOMATIC!)
        ↓
Both linked by schedule_id ✓
```

### DEMO #2 Flow:
```
App/SQL: Call add_medicine_with_schedule()
        ↓
Trigger: Insert medicine → capture medicine_id
        ↓
Trigger: Insert dosage with medicine_id → capture dosage_id
        ↓
Trigger: Insert schedule with dosage_id
        ↓
All 3 tables updated, perfectly linked ✓
```

### DEMO #3 Flow:
```
App: Try INSERT with invalid schedule_id
        ↓
BEFORE INSERT triggers
        ↓
CHECK: Does this schedule_id exist?
        ├─ NO → RAISE EXCEPTION ❌
        └─ YES → Allow INSERT ✓
        ↓
Data protected!
```

---

## ⏱️ Timing Guide

- Setup: 1 minute
- Demo #1: 2 minutes (create, show, explain)
- Demo #2: 3 minutes (run, check 3 tables, show chain)
- Demo #3: 2 minutes (invalid fail, valid succeed, verify)
- Q&A: 2 minutes

**Total: 10 minutes**

---

**Practice this walkthrough and you'll nail the demo!** 🚀
