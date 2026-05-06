import { render } from '@react-email/components'
import { getResend, FROM_EMAIL } from '@/lib/email'
import NewsletterWelcomeEmail from '@/emails/newsletter-welcome'

export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  const html = await render(NewsletterWelcomeEmail({ email }))

  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to Wall Decorator',
    html,
  })

  if (error) {
    console.error('[email] Failed to send newsletter welcome to', email, error)
  } else {
    console.log('[email] Newsletter welcome sent to', email, data?.id)
  }
}
