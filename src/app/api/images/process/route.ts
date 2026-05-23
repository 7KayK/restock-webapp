import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { processImageWithVision, isSupportedMediaType } from '@/lib/imageIntelligence'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { imageBase64?: string; mediaType?: string }
    const { imageBase64, mediaType = 'image/jpeg' } = body

    if (!imageBase64?.trim()) {
      return Response.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    if (!isSupportedMediaType(mediaType)) {
      return Response.json(
        { error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' },
        { status: 400 }
      )
    }

    const result = await processImageWithVision(imageBase64, mediaType)
    return Response.json({ data: result })
  } catch {
    return Response.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
