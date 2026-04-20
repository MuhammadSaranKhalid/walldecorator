import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { redis } from '@/lib/upstash/client'

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!process.env.REVALIDATE_SECRET || token !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get('slug')

  try {
    const keysToDelete: string[] = []

    if (slug) {
      keysToDelete.push(`product:detail:${slug}`)
    }

    // Find and clear all product list and count caches
    const [listKeys, countKeys] = await Promise.all([
      (redis as any).keys('products:list:*'),
      (redis as any).keys('products:count:*'),
    ])

    keysToDelete.push(...(listKeys ?? []), ...(countKeys ?? []))

    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((key: string) => redis.del(key)))
    }
  } catch (error) {
    console.error('[revalidate] Redis cache clear error:', error)
    // Continue — Next.js ISR revalidation below will still take effect
  }

  revalidatePath('/products')
  if (slug) {
    revalidatePath(`/products/${slug}`)
  }

  return NextResponse.json({ revalidated: true, slug: slug ?? 'all' })
}
