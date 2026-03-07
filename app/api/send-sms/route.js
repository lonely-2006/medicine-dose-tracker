export async function POST(request) {
  try {
    const { to, message } = await request.json()
    console.log(`[SMS STUB] To: ${to} | Message: ${message}`)
    return Response.json({ success: true, stub: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}