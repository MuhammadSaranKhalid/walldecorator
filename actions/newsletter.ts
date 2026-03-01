'use server'

import { createServerClient } from '@/lib/supabase/server'

type NewsletterResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Subscribe email to newsletter
 * Server Action for newsletter signup form
 */
export async function subscribeToNewsletter(
  email: string
): Promise<NewsletterResult> {
  // Validate email
  if (!email || typeof email !== 'string') {
    return {
      success: false,
      error: 'Email is required',
    }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address',
    }
  }

  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.toLowerCase().trim() })

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
