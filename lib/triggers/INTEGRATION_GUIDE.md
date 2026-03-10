/**
 * INTEGRATION GUIDE
 * How to integrate triggers into your existing application
 */

// ============================================================
// 1. AUDIT LOGGING - Add to your existing actions
// ============================================================

// In page.js, import audit logger:
import { auditLog, auditActions } from '../lib/triggers/audit'

// Add audit logging to your existing functions:

// During login:
const handleLogin = async () => {
  // ... existing login code ...
  if (data.user && profile) {
    await auditLog(data.user.id, auditActions.USER_LOGIN, 'user', data.user.id, {
      email: form.email,
      role: role,
    })
    onLogin(data.user, profile)
  }
}

// During logout:
const handleLogout = async (userId) => {
  await auditLog(userId, auditActions.USER_LOGOUT, 'user', userId)
  // ... existing logout code ...
}

// When registering:
const handleRegister = async () => {
  // ... existing register code ...
  if (authData?.user) {
    await supabase.from('users').insert({ /* ... */ })
    
    await auditLog(authData.user.id, auditActions.USER_REGISTER, 'user', authData.user.id, {
      name: form.name,
      email: form.email,
      role: role,
    })
  }
}

// ============================================================
// 2. REMINDER TRIGGERS - For dose tracking
// ============================================================

// Import reminders:
import { scheduleReminder, markDoseAsTaken } from '../lib/triggers/reminders'

// When creating/editing a prescription:
const handleCreatePrescription = async (prescription) => {
  const { data, error } = await supabase.from('prescriptions').insert(prescription)
  
  if (data) {
    // Schedule reminders for each dose time
    for (const doseTime of prescription.doseTimes) {
      const dueDate = new Date()
      dueDate.setHours(doseTime.hour, doseTime.minute, 0)
      
      await scheduleReminder(
        userId,
        data[0].id,
        prescription.medicineName,
        prescription.dosage,
        dueDate.toISOString()
      )
    }
    
    await auditLog(userId, auditActions.PRESCRIPTION_CREATED, 'prescription', data[0].id, prescription)
  }
}

// When user marks dose as taken:
const handleMarkDoseTaken = async (reminderId) => {
  const result = await markDoseAsTaken(reminderId, userId)
  
  if (result.success) {
    await auditLog(userId, auditActions.DOSE_LOGGED, 'reminder', reminderId)
  }
}

// ============================================================
// 3. NOTIFICATION TRIGGERS - Automatic alerts
// ============================================================

// Import notifications:
import { sendNotification, notifyDoctorMissedDose } from '../lib/triggers/notifications'

// Manually trigger notifications when needed:
const notifyReminder = async (reminderId, medicineName, dosage) => {
  await sendNotification(userId, 'dose_due', {
    medicineName,
    dosage,
  })
}

// ============================================================
// 4. CRON JOB SETUP - Required for automatic reminders
// ============================================================

// Add to your deployment configuration:
// 
// For Vercel (vercel.json):
/*
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "*/5 * * * *"
  }]
}
*/

// For other platforms, use external cron services:
// - EasyCron: https://www.easycron.com/
// - cron-job.org: https://cron-job.org/
// - GitHub Actions: scheduled workflow
//
// Call the endpoint every 5 minutes:
// GET /api/cron/reminders?key=YOUR_CRON_SECRET
//
// Set CRON_SECRET in .env.local

// ============================================================
// 5. DATABASE SETUP - Create required tables
// ============================================================

// Run this in Supabase SQL Editor:
/*
-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prescription_id UUID,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  due_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  missed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dose Logs
CREATE TABLE IF NOT EXISTS dose_logs (
  id BIGSERIAL PRIMARY KEY,
  reminder_id BIGINT REFERENCES reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'completed'
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  recipient VARCHAR(255),
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_id UUID;
*/

export const integrationSteps = [
  '1. Create database tables (see SQL above)',
  '2. Add CRON_SECRET to .env.local',
  '3. Import trigger modules in your components',
  '4. Wrap user actions with audit logging',
  '5. Setup cron job (Vercel or external service)',
  '6. Test SMS/email integration',
  '7. Configure real email service (SendGrid, AWS SES, etc.)',
]
