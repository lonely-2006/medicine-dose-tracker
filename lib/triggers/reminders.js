import { supabase } from '../supabase'
import { sendNotification } from './notifications'

/**
 * Reminder Trigger - Schedules and manages dose reminders
 */

export const scheduleReminder = async (userId, prescriptionId, medicineName, dosage, dueTime) => {
  try {
    const { error } = await supabase.from('reminders').insert({
      user_id: userId,
      prescription_id: prescriptionId,
      medicine_name: medicineName,
      dosage,
      due_time: dueTime,
      status: 'scheduled',
      created_at: new Date(),
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Schedule reminder error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check for due reminders and send notifications
 * This should be called by a cron job or background task
 */
export const processDueReminders = async () => {
  try {
    const now = new Date()
    const in5Minutes = new Date(now.getTime() + 5 * 60000)

    // Get all reminders due in next 5 minutes
    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'scheduled')
      .lte('due_time', in5Minutes.toISOString())
      .gte('due_time', now.toISOString())

    if (!reminders || reminders.length === 0) return

    for (const reminder of reminders) {
      // Send notification
      await sendNotification(reminder.user_id, 'dose_due', {
        medicineName: reminder.medicine_name,
        dosage: reminder.dosage,
      })

      // Mark reminder as sent
      await supabase
        .from('reminders')
        .update({ status: 'sent', sent_at: new Date() })
        .eq('id', reminder.id)
    }
  } catch (error) {
    console.error('Process reminders error:', error)
  }
}

/**
 * Check for missed doses and send alerts
 * This should be called by a cron job (e.g., every hour)
 */
export const checkMissedDoses = async () => {
  try {
    const now = new Date()

    // Get reminders that should have been taken but weren't
    const { data: missedReminders } = await supabase
      .from('reminders')
      .select('*, schedules:prescription_id(*)')
      .eq('status', 'sent')
      .lt('due_time', now.toISOString())

    if (!missedReminders) return

    for (const reminder of missedReminders) {
      // Check if dose was actually logged
      const { data: doseLogs } = await supabase
        .from('dose_logs')
        .select('*')
        .eq('reminder_id', reminder.id)
        .gte('taken_at', reminder.due_time)

      if (!doseLogs || doseLogs.length === 0) {
        // Dose was missed
        await supabase
          .from('reminders')
          .update({ status: 'missed', missed_at: now })
          .eq('id', reminder.id)

        // Get doctor info if assigned
        const { data: patient } = await supabase
          .from('users')
          .select('doctor_id')
          .eq('auth_id', reminder.user_id)
          .single()

        if (patient?.doctor_id) {
          // Notify doctor
          const { sendNotification: notifyDoctor } = await import('./notifications')
          await notifyDoctor(patient.doctor_id, 'dose_missed', {
            patientId: reminder.user_id,
            medicineName: reminder.medicine_name,
            missedTime: reminder.due_time,
          })
        }
      }
    }
  } catch (error) {
    console.error('Check missed doses error:', error)
  }
}

/**
 * Mark dose as taken (triggered by user action)
 */
export const markDoseAsTaken = async (reminderId, userId) => {
  try {
    const { error: logError } = await supabase.from('dose_logs').insert({
      reminder_id: reminderId,
      user_id: userId,
      taken_at: new Date(),
      status: 'completed',
    })

    if (logError) throw logError

    // Update reminder status
    await supabase
      .from('reminders')
      .update({ status: 'completed', completed_at: new Date() })
      .eq('id', reminderId)

    return { success: true }
  } catch (error) {
    console.error('Mark dose error:', error)
    return { success: false, error: error.message }
  }
}
