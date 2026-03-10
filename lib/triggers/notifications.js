import { supabase } from '../supabase'

/**
 * Notification Trigger - Sends SMS/Email alerts for missed/upcoming doses
 */

export const sendNotification = async (userId, type, payload) => {
  try {
    // Get user phone and email
    const { data: user } = await supabase
      .from('users')
      .select('email, phone')
      .eq('auth_id', userId)
      .single()

    if (!user) return { success: false, error: 'User not found' }

    let message = ''
    let recipient = ''

    if (type === 'dose_due') {
      message = `💊 Reminder: Time to take your ${payload.medicineName} dose (${payload.dosage})`
      recipient = user.phone || user.email
    } else if (type === 'dose_missed') {
      message = `⚠️ Alert: You missed your ${payload.medicineName} dose at ${payload.missedTime}`
      recipient = user.phone || user.email
    } else if (type === 'low_stock') {
      message = `📌 Your ${payload.medicineName} stock is running low. Please refill soon.`
      recipient = user.phone || user.email
    }

    if (!recipient) return { success: false, error: 'No contact info' }

    // Send SMS if phone, otherwise email stub
    const endpoint = user.phone ? '/api/send-sms' : '/api/send-email'
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient,
        message,
        type,
        userId,
      }),
    })

    const result = await response.json()

    // Log notification in database
    if (result.success || result.stub) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        message,
        recipient,
        status: 'sent',
        sent_at: new Date(),
      })
    }

    return result
  } catch (error) {
    console.error('Notification error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Batch notify doctor about patient's missed dose
 */
export const notifyDoctorMissedDose = async (patientId, doctorId, medicineName) => {
  try {
    const { data: doctor } = await supabase
      .from('users')
      .select('email, phone')
      .eq('auth_id', doctorId)
      .single()

    if (!doctor) return

    const message = `🚨 Your patient missed a ${medicineName} dose. Please follow up.`
    
    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: doctor.phone || doctor.email,
        message,
        type: 'doctor_alert',
      }),
    })

    await supabase.from('notifications').insert({
      user_id: doctorId,
      type: 'patient_missed_dose',
      message,
      recipient: doctor.phone || doctor.email,
      status: 'sent',
      sent_at: new Date(),
    })
  } catch (error) {
    console.error('Doctor notification error:', error)
  }
}

export const notificationTypes = {
  DOSE_DUE: 'dose_due',
  DOSE_MISSED: 'dose_missed',
  LOW_STOCK: 'low_stock',
  DOCTOR_ALERT: 'doctor_alert',
}
