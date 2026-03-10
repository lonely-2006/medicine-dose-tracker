# Copy-Paste Demo Queries

Use these exact queries for your demos. Just copy and paste!

---

## DEMO #1: Auto-Create Reminder

### No SQL needed!
Just use the app to create a schedule, then refresh Supabase tables.

**If you want to verify with SQL:**

```sql
-- Show newest schedule
SELECT schedule_id, dosage_id, start_date, time 
FROM schedule 
ORDER BY schedule_id DESC 
LIMIT 1;

-- Show matching reminder
SELECT reminder_id, schedule_id, mode, reminder_time, status
FROM reminder 
ORDER BY reminder_id DESC 
LIMIT 1;

-- Both should have matching IDs and times!
```

---

## DEMO #2: Multi-Table Insert

### Copy and paste this into SQL Editor:

```sql
SELECT add_medicine_with_schedule(
  'Metformin',
  'Glucophage',
  'Tablet',
  'For type 2 diabetes',
  1,
  500,
  'mg',
  'Twice daily',
  '2026-03-10',
  '2026-06-10',
  '09:00'
);
```

### Then check each table:

```sql
-- Check medicine table
SELECT medicine_id, name, brand, type 
FROM medicine 
ORDER BY medicine_id DESC 
LIMIT 1;
```

```sql
-- Check dosage table (should show medicine_id from above)
SELECT dosage_id, medicine_id, amount, unit, frequency
FROM dosage 
ORDER BY dosage_id DESC 
LIMIT 1;
```

```sql
-- Check schedule table (should show dosage_id from above)
SELECT schedule_id, dosage_id, start_date, end_date, time
FROM schedule 
ORDER BY schedule_id DESC 
LIMIT 1;
```

### Or see the complete chain:

```sql
SELECT 
  m.medicine_id,
  m.name,
  d.dosage_id,
  d.amount,
  d.unit,
  s.schedule_id,
  s.start_date,
  s.time
FROM medicine m
JOIN dosage d ON m.medicine_id = d.medicine_id
JOIN schedule s ON d.dosage_id = s.dosage_id
ORDER BY m.medicine_id DESC
LIMIT 1;
```

---

## DEMO #3: Validation Trigger

### Test 1: Try INVALID insert (Should FAIL)

```sql
INSERT INTO intake_log (schedule_id, date, status)
VALUES (99999, '2026-03-10', 'Taken');
```

**Expected Result:**
```
ERROR: Invalid schedule ID. Schedule does not exist.
```

### Test 2: Try VALID insert (Should SUCCEED)

```sql
INSERT INTO intake_log (schedule_id, date, status)
VALUES (1, '2026-03-10', 'Taken');
```

**Expected Result:**
```
INSERT 0 1
```

### Verify the valid insert worked:

```sql
SELECT log_id, schedule_id, date, status
FROM intake_log
WHERE schedule_id = 1
ORDER BY log_id DESC
LIMIT 1;
```

---

## OPTIONAL: Show All Triggers Are Installed

```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

**Expected Result:**
```
after_schedule_insert       | schedule   | AFTER  | INSERT
before_intake_log_insert    | intake_log | BEFORE | INSERT
```

---

## 📋 Demo Sequence

1. **DEMO #1**
   - Use app to create schedule
   - Run verification SQL from DEMO #1
   - Point: times match!

2. **DEMO #2**
   - Copy-paste the function call
   - Run each verification query
   - Point: all 3 tables updated!

3. **DEMO #3**
   - Copy-paste invalid insert
   - Show error
   - Copy-paste valid insert
   - Show success

---

**Ready to demo!** 🚀
