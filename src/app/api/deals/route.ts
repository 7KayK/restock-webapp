import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Placeholder — wire up Kroger API or another deals provider here
  return Response.json({ data: [] })
}
