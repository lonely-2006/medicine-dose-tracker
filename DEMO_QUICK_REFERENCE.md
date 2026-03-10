# Quick Demo Reference - What to Do

---

## ⚡ DEMO #1 (3 minutes)

### What to Do:
1. **In App:** Create Schedule
   - Medicine: Any medicine
   - Time: 10:00 AM
   - Click "Add Schedule"

2. **In Supabase:** Refresh reminder table
   - Show new reminder appeared
   - Point out reminder.reminder_time = 10:00
   - Point out reminder.schedule_id matches new schedule

### What to Say:
> "When schedule created, reminder auto-created. Trigger did it! One action, two database records."

---

## ⚡ DEMO #2 (3 minutes)

### What to Do:
1. **In Supabase SQL Editor:** Paste and run:

```sql
SELECT add_medicine_with_schedule(
  'Metformin', 'Glucophage', 'Tablet', 'For diabetes',
  1, 500, 'mg', 'Twice daily',
  '2026-03-10', '2026-06-10', '09:00'
);
```

2. **Check medicine table** → Show new row (ID = 23)
3. **Check dosage table** → Show new row (medicine_id = 23)
4. **Check schedule table** → Show new row (dosage_id = 45)

### Visual to Show:
```
medicine (ID 23)
    ↓ medicine_id
dosage (ID 45)
    ↓ dosage_id
schedule (ID 891)

All linked perfectly from ONE function call!
```

### What to Say:
> "One function call created records in 3 tables. All linked perfectly. This is a transaction - all succeed or all fail together."

---

## ⚡ DEMO #3 (2 minutes)

### What to Do:

1. **Try INVALID insert** (Should fail):
```sql
INSERT INTO intake_log (schedule_id, date, status)
VALUES (99999, '2026-03-10', 'Taken');
```
**Result:** ❌ ERROR "Invalid schedule ID"

2. **Try VALID insert** (Should work):
```sql
INSERT INTO intake_log (schedule_id, date, status)
VALUES (1, '2026-03-10', 'Taken');
```
**Result:** ✅ SUCCESS

### What to Say:
> "The trigger validated the data. Bad data rejected, good data accepted. This protects the database from corruption."

---

## 📝 Demo Script (Read This)

```
"Our system uses 3 database triggers.

TRIGGER 1: When schedule created → reminder auto-created
[Create schedule, show reminder appeared]
Automation in action!

TRIGGER 2: One function creates medicine → dosage → schedule
[Run function, show 3 tables updated]
Complex transactions made simple!

TRIGGER 3: Validates schedule ID before accepting dose log
[Try invalid, show error. Try valid, show success]
Data protection at database level!

Three triggers = automation + integrity + quality"
```

---

## ✅ Step-by-Step Checklist

### Before Demo:
- [ ] Supabase dashboard open
- [ ] App running
- [ ] SQL queries in clipboard or ready

### During Demo #1:
- [ ] Create schedule with specific time (e.g., 10:00)
- [ ] Refresh reminder table
- [ ] Point out times match
- [ ] Say: "Automatic!"

### During Demo #2:
- [ ] Run function
- [ ] Check medicine table → point to ID
- [ ] Check dosage table → point to medicine_id
- [ ] Check schedule table → point to dosage_id
- [ ] Say: "All linked from one call!"

### During Demo #3:
- [ ] Run invalid insert → show error
- [ ] Run valid insert → show success
- [ ] Say: "Trigger protects data!"

### After Demo:
- [ ] Explain business value
- [ ] Answer questions
- [ ] Show live data results

---

## 🎯 Key Points to Emphasize

| Demo | Key Point |
|------|-----------|
| #1 | "Zero manual work - database does it automatically" |
| #2 | "Three tables, one call, perfect linking" |
| #3 | "Bad data prevented before it corrupts database" |

---

**You've got this! 🚀**
