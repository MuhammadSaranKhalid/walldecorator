'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

// Zod schema for email validation (React 19 + Vercel best practice)
// Zod v4: Use z.email() instead of z.string().email()
const newsletterSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address' }),
})

type NewsletterResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Subscribe email to newsletter
 * Server Action for newsletter signup form
 *
 * Best practices applied:
 * - Input validation with Zod
 * - Proper error handling
 * - No authentication required (public endpoint)
 */
export async function subscribeToNewsletter(
  email: string
): Promise<NewsletterResult> {
  // Validate input using Zod
  const validation = newsletterSchema.safeParse({ email })

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message
    return {
      success: false,
      error: firstError || 'Invalid email address',
    }
  }

  try {
    const supabase = await createServerClient()

    // Sanitize and normalize email
    const normalizedEmail = validation.data.email.toLowerCase().trim()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail })

    if (error) {
      // Handle duplicate email gracefully
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This email is already subscribed',
        }
      }

      console.error('Newsletter subscription error:', error)
      return {
        success: false,
        error: 'Failed to subscribe. Please try again.',
      }
    }

    return {
      success: true,
      message: 'Successfully subscribed! Check your inbox for your discount code.',
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
