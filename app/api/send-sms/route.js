import twilio from 'twilio'

export async function POST(request) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return Response.json({ error: 'Missing to or message' }, { status: 400 })
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    })

    return Response.json({ success: true, sid: result.sid })
  } catch (error) {
    console.error('SMS error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}