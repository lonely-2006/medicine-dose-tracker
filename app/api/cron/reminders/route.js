/**
 * Cron endpoint for processing due reminders
 * Call this from a cron job service (e.g., Vercel Cron, GitHub Actions, or external scheduler)
 * Example: GET /api/cron/reminders?key=your_secret_key
 */

import { processDueReminders, checkMissedDoses } from '../../../../lib/triggers/reminders'

export async function GET(request) {
  try {
    // Validate cron secret
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (key !== process.env.CRON_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process due reminders
    await processDueReminders()

    // Check for missed doses (run less frequently)
    const minute = new Date().getMinutes()
    if (minute % 30 === 0) {
      // Run every 30 minutes
      await checkMissedDoses()
    }

    return Response.json({ 
      success: true, 
      message: 'Reminders processed',
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Cron error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
