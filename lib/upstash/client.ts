import { Redis } from '@upstash/redis'

// TODO: Add these to your .env.local file
// UPSTASH_REDIS_REST_URL=your-upstash-url
// UPSTASH_REDIS_REST_TOKEN=your-upstash-token

// Create Redis client - will use in-memory fallback if env vars not set
let redis: Redis

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  })
} catch (error) {
  console.warn('Redis not configured, using in-memory fallback')
  // In-memory fallback for development
  const cache = new Map<string, { value: any; expiry: number }>()

  redis = {
    async get(key: string) {
      const item = cache.get(key)
      if (!item) return null
      if (Date.now() > item.expiry) {
        cache.delete(key)
        return null
      }
      return item.value
    },
    async setex(key: string, seconds: number, value: any) {
      cache.set(key, {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        expiry: Date.now() + seconds * 1000,
      })
      return 'OK'
    },
    async del(key: string) {
      cache.delete(key)
      return 1
    },
  } as any
}

export { redis }
