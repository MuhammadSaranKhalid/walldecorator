import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Wall Decorator <orders@walldecorator.store>'
