/**
 * Supabase Database Schema for Triggers
 * Run these SQL commands in your Supabase SQL Editor
 */

/**
 * Audit Logs Table - Logs all user actions automatically
 */
export const auditLogsSchema = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);
`

/**
 * Reminders Table - Tracks scheduled dose reminders
 */
export const remindersSchema = `
CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prescription_id UUID,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  due_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, sent, completed, missed
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  missed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_due_time ON reminders(due_time);
`

/**
 * Dose Logs Table - Records when doses were actually taken
 */
export const doseLogsSchema = `
CREATE TABLE IF NOT EXISTS dose_logs (
  id BIGSERIAL PRIMARY KEY,
  reminder_id BIGINT REFERENCES reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'completed', -- completed, skipped
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dose_logs_user_id ON dose_logs(user_id);
CREATE INDEX idx_dose_logs_taken_at ON dose_logs(taken_at);
`

/**
 * Notifications Table - Tracks all sent notifications
 */
export const notificationsSchema = `
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- dose_due, dose_missed, low_stock, doctor_alert
  message TEXT NOT NULL,
  recipient VARCHAR(255),
  status VARCHAR(20) DEFAULT 'sent', -- sent, failed
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
`

/**
 * Update Users Table - Add phone field if not exists
 */
export const updateUsersSchema = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_id UUID;
`
