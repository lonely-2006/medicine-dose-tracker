import { supabase } from '../supabase'

/**
 * Audit Trigger - Logs all user actions automatically
 * Records: user_id, action, resource_type, resource_id, changes, timestamp
 */

export const auditLog = async (userId, action, resourceType, resourceId, details = {}) => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      timestamp: new Date(),
    })
    if (error) console.error('Audit log error:', error)
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

export const auditActions = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  DOSE_LOGGED: 'dose_logged',
  DOSE_MISSED: 'dose_missed',
  DOSE_UPDATED: 'dose_updated',
  PRESCRIPTION_CREATED: 'prescription_created',
  PRESCRIPTION_UPDATED: 'prescription_updated',
  PRESCRIPTION_DELETED: 'prescription_deleted',
  DOCTOR_ASSIGNED: 'doctor_assigned',
  ADMIN_ACTION: 'admin_action',
  NOTIFICATION_SENT: 'notification_sent',
  REMINDER_SET: 'reminder_set',
}
