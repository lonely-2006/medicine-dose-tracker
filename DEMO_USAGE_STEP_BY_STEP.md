# Demo Usage of Each Trigger - Step by Step

---

## 🎯 DEMO #1: Auto-Create Reminder Trigger

### What This Demonstrates
When a doctor creates a schedule, the reminder is automatically created without any manual action.

### Before Demo Setup
```
1. Open Supabase Dashboard
2. Show schedule table (Note count: e.g., 5 schedules)
3. Show reminder table (Note count: should match schedules)
4. Explain: "Notice reminder count = schedule count"
```

### Step-by-Step Demo

#### STEP 1: In Your App - Create a Schedule
```
1. Open your medicine-dose-tracker app
2. Login as patient
3. Go to "My Schedule" page
4. Click "+ Add Schedule"

Form to fill:
  - Dosage: Select "Aspirin - 500mg"
  - Start Date: 2026-03-10
  - End Date: 2026-06-10
  - Time: 10:00 AM
  
5. Click "Add Schedule" button
```

#### STEP 2: See Schedule Created (In Supabase)
```
1. Switch to Supabase Dashboard
2. Go to schedule table
3. Refresh the table
4. NEW ROW appeared:
   - dosage_id: 42
   - start_date: 2026-03-10
   - end_date: 2026-06-10
   - time: 10:00:00
   
Point out: "The schedule was created successfully"
```

#### STEP 3: See Reminder Auto-Created (TRIGGER MAGIC!)
```
1. Go to reminder table
2. Refresh the table
3. NEW ROW appeared automatically:
   - schedule_id: 847 (matches the schedule_id from Step 2!)
   - mode: 'Push Notification'
   - reminder_time: 10:00:00 (same as schedule time!)
   - status: 'Active'
   
Point out: "Look! A reminder was created AUTOMATICALLY!
We never manually created this. The trigger did it!"
```

### Demo Script (What to Say)

> **"Let me show you automation in action. When a doctor or patient creates a medicine schedule, the system needs to create a reminder for it. Without triggers, we'd have to:
> 1. Create the schedule ← Manual
> 2. Create the reminder ← Manual
> 3. Match them together ← Manual
>
> But with our trigger, it's automatic. Watch...
>
> [Create schedule]
>
> Now check... [Refresh reminder table]
>
> See? A reminder appeared instantly! The database trigger heard 'new schedule created' and automatically said 'I need to create a reminder for this.' No manual work, no inconsistencies, no forgotten reminders.
>
> This is why database triggers are powerful!"**

### How to Verify It's the Trigger
```sql
-- Run this query to see your new reminder
SELECT * FROM reminder 
WHERE schedule_id = 847
ORDER BY reminder_id DESC 
LIMIT 1;

-- Result should show:
-- schedule_id: 847
-- mode: 'Push Notification'
-- reminder_time: 10:00:00
-- status: 'Active'
```

---

## 🎯 DEMO #2: Multi-Table Insert Trigger

### What This Demonstrates
One function call that inserts into 3 tables (medicine → dosage → schedule) with all proper linking.

### Before Demo Setup
```
1. Open Supabase SQL Editor
2. Have the function code ready
3. Know what values you'll use
```

### Step-by-Step Demo

#### STEP 1: Prepare the Data
```
Notice current state:
- medicine table has X rows
- dosage table has Y rows
- schedule table has Z rows

We're about to add 1 medicine, 1 dosage, 1 schedule
(3 rows added from 1 function call!)
```

#### STEP 2: Run the Function
```
In Supabase SQL Editor, run:

SELECT add_medicine_with_schedule(
  'Lisinopril',              -- Medicine name
  'Prinivil',                -- Brand
  'Tablet',                  -- Type
  'For high blood pressure',  -- Description
  1,                         -- Prescription ID
  10,                        -- Amount
  'mg',                      -- Unit
  'Once daily',              -- Frequency
  '2026-03-10',              -- Start Date
  '2026-06-10',              -- End Date
  '09:00'                    -- Time
);

Result: [No output, but success]
```

#### STEP 3: Check Medicine Table
```
1. Go to medicine table
2. Scroll to bottom or sort by medicine_id DESC
3. NEW ROW appeared:
   - medicine_id: 23
   - name: 'Lisinopril'
   - brand: 'Prinivil'
   - type: 'Tablet'
   - description: 'For high blood pressure'
   - prescription_id: 1
   
Point: "Step 1 complete - medicine inserted"
```

#### STEP 4: Check Dosage Table
```
1. Go to dosage table
2. Find new row
3. NEW ROW appeared:
   - dosage_id: 45
   - medicine_id: 23 ← Links to medicine from Step 3!
   - amount: 10
   - unit: 'mg'
   - frequency: 'Once daily'
   
Point: "Step 2 complete - dosage inserted with medicine_id!"
```

#### STEP 5: Check Schedule Table
```
1. Go to schedule table
2. Find new row
3. NEW ROW appeared:
   - schedule_id: 891
   - dosage_id: 45 ← Links to dosage from Step 4!
   - start_date: '2026-03-10'
   - end_date: '2026-06-10'
   - time: '09:00:00'
   
Point: "Step 3 complete - schedule inserted with dosage_id!"
```

#### STEP 6: Show the Chain
```
Click the relationships in Supabase:
schedule → dosage → medicine

Show visually how they're linked:
- schedule.dosage_id (45) → dosage.dosage_id (45) ✓
- dosage.medicine_id (23) → medicine.medicine_id (23) ✓

All perfectly linked!
```

### Demo Script (What to Say)

> **"One of the trickiest parts of any medical app is creating a medicine with all its details. In our database, it's stored across 3 tables:
> - medicine (WHAT drug)
> - dosage (HOW MUCH)
> - schedule (WHEN to take)
>
> These 3 tables are linked by IDs, so they have to be in sync. Normally you'd run 3 separate INSERT statements and pray they work together.
>
> But look at what we do... [Run function]
>
> One function call. Let me show you what happened:
>
> [Show medicine table] - Medicine inserted with ID 23
> [Show dosage table] - Dosage inserted with medicine_id 23
> [Show schedule table] - Schedule inserted with dosage_id 45
>
> All three tables updated from ONE function call. And notice - they're perfectly linked. Medicine → Dosage → Schedule. No broken links, no orphaned data.
>
> This is a TRANSACTION. Either all 3 happen or NONE happen. That's data integrity at its finest."**

### How to Verify It's the Function
```sql
-- Show the complete chain:

SELECT 
  m.medicine_id,
  m.name as medicine_name,
  d.dosage_id,
  d.amount,
  d.unit,
  s.schedule_id,
  s.start_date,
  s.time
FROM medicine m
JOIN dosage d ON m.medicine_id = d.medicine_id
JOIN schedule s ON d.dosage_id = s.dosage_id
WHERE m.medicine_id = 23;

-- Result shows all 3 tables linked perfectly
```

---

## 🎯 DEMO #3: Validation Trigger

### What This Demonstrates
The database rejects invalid data BEFORE it gets inserted, protecting data integrity.

### Before Demo Setup
```
1. Open Supabase SQL Editor
2. Have both test queries ready (invalid and valid)
3. Explain: "This trigger is like a bouncer at a club"
```

### Step-by-Step Demo

#### STEP 1: Show the Valid Schedule
```
In Supabase, run:
SELECT * FROM schedule LIMIT 1;

Result shows:
- schedule_id: 1
- dosage_id: 5
- start_date: '2026-03-01'
- time: '09:00:00'

Say: "Schedule ID 1 exists in the database"
```

#### STEP 2: Try Invalid Insert (Should FAIL)
```
In Supabase SQL Editor, run:

INSERT INTO intake_log (schedule_id, date, status)
VALUES (99999, '2026-03-10', 'Taken');

Result: ❌ ERROR!
"ERROR: Invalid schedule ID. Schedule does not exist."

Point: "The trigger rejected it! Schedule 99999 doesn't exist.
The trigger is protecting the database!"
```

#### STEP 3: Try Valid Insert (Should SUCCEED)
```
In Supabase SQL Editor, run:

INSERT INTO intake_log (schedule_id, date, status)
VALUES (1, '2026-03-10', 'Taken');

Result: ✅ SUCCESS!
Message: "INSERT 0 1" (one row inserted)

Point: "This time it worked! Schedule 1 exists, so trigger allowed it."
```

#### STEP 4: Verify Valid Data Is There
```
Run:
SELECT * FROM intake_log 
WHERE schedule_id = 1 
ORDER BY log_id DESC 
LIMIT 1;

Shows:
- log_id: 156
- schedule_id: 1
- date: '2026-03-10'
- status: 'Taken'
- time_taken: NULL

Say: "The dose was logged successfully because the schedule was valid!"
```

#### STEP 5: Show What Happens Without Trigger
```
Imagine without this trigger:
- Invalid insert goes through
- intake_log has orphaned row (pointing to non-existent schedule)
- Reports are broken (can't JOIN schedule table)
- Data is corrupted

But WITH the trigger:
- Trigger checks first
- Invalid data never enters database
- Complete data integrity maintained
```

### Demo Script (What to Say)

> **"Data validation is crucial in a medical app. What if a patient accidentally tries to log a dose with a schedule that doesn't exist?
>
> Without validation, bad data could slip into the database. Reports would break. Queries would fail. The system would be corrupted.
>
> But we have a trigger that acts as a gatekeeper. Let me show you...
>
> [Try invalid insert]
>
> See? Error! 'Invalid schedule ID. Schedule does not exist.' The database said NO. It refused to let bad data in.
>
> Now try with valid data... [Try valid insert]
>
> Success! Because schedule 1 actually exists, the trigger allowed it.
>
> This is why database-level validation is powerful. It works regardless of what calls the database. Even if someone calls the API directly, even if they use a script, the trigger still protects the data.
>
> The database enforces the rules, not the app. That's enterprise-level data integrity."**

### How to Verify the Trigger Works
```sql
-- Show trigger code:
SELECT pg_get_triggerdef('before_intake_log_insert'::regprocedure);

-- Test invalid insert fails:
INSERT INTO intake_log (schedule_id, date, status) 
VALUES (99999, '2026-03-10', 'Taken');
-- Result: ERROR

-- Test valid insert succeeds:
INSERT INTO intake_log (schedule_id, date, status) 
VALUES (1, '2026-03-10', 'Taken');
-- Result: SUCCESS
```

---

## 📊 All 3 Demos Summary

| Demo | Action | What Happens | Magic |
|------|--------|--------------|-------|
| #1 | Create schedule | Reminder auto-created | Trigger listens & responds |
| #2 | Call function | 3 tables populated | All linked perfectly |
| #3 | Insert with invalid ID | Insert rejected | Trigger validates & protects |

---

## 🎬 Full 10-Minute Demo Script

### Timeline
- Intro (1 min)
- Demo #1 (3 min)
- Demo #2 (3 min)
- Demo #3 (2 min)
- Q&A (1 min)

### Intro (Say This)
> "Our system uses database triggers and stored procedures for automation, data integrity, and consistency. Let me show you three powerful examples that handle critical workflows automatically."

### After Each Demo
- Trigger #1: "This is automation - eliminates manual work"
- Trigger #2: "This is transaction integrity - all or nothing"
- Trigger #3: "This is data quality - protection at DB level"

### Closing
> "Three triggers working together to ensure:
> - No manual work (automation)
> - Perfect data links (integrity)
> - No bad data (validation)
> 
> This is professional, enterprise-grade database design."

---

## ✅ Demo Checklist

- [ ] Supabase dashboard open
- [ ] App running and accessible
- [ ] Sample data ready (at least one schedule)
- [ ] SQL queries prepared
- [ ] Know the scripts to say
- [ ] 10 minutes available
- [ ] Confidence level: HIGH 🚀

---

**You're ready to demo! Go show them the power of your system!** 🎯
