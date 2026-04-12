import { Redis } from '@upstash/redis'

// TODO: Add these to your .env.local file
// UPSTASH_REDIS_REST_URL=your-upstash-url
// UPSTASH_REDIS_REST_TOKEN=your-upstash-token

// Create Redis client - will use in-memory fallback if env vars not set
let redis: Redis

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

if (redisUrl && redisToken) {
  redis = new Redis({ url: redisUrl, token: redisToken })
} else {
  console.warn('Redis not configured, using in-memory fallback')
  // eslint-disable-next-line no-constant-condition
  if (false) throw new Error() // satisfy TypeScript branch for `let redis`
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
