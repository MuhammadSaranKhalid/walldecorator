import { getResend, FROM_EMAIL } from '@/lib/email'

interface NotifyParams {
  customerName: string
  customerEmail: string
  customerPhone: string | null
  description: string | null
  preferredMaterial: string | null
  preferredSize: string | null
  preferredThickness: string | null
  customOrderId: string
}

/**
 * Notify the admin team that a new custom-order request was submitted.
 * Silently no-ops if ADMIN_NOTIFICATION_EMAIL isn't configured — the request
 * still lands in the DB, this is best-effort outbound only.
 */
export async function sendCustomOrderNotification(params: NotifyParams): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_NOTIFICATION_EMAIL not set; skipping custom-order notification')
    return
  }

  const rows = [
    ['Name', params.customerName],
    ['Email', params.customerEmail],
    ['Phone', params.customerPhone ?? '(not provided)'],
    ['Material', params.preferredMaterial ?? '(no preference)'],
    ['Size', params.preferredSize ?? '(no preference)'],
    ['Thickness', params.preferredThickness ?? '(no preference)'],
    ['Order ID', params.customOrderId],
  ]

  const html = `
    <h2 style="font-family: sans-serif; color: #1A1A1A;">New custom order request</h2>
    <table style="font-family: sans-serif; border-collapse: collapse;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 12px 6px 0; color:#737373;">${label}</td><td style="padding:6px 0;"><strong>${escapeHtml(value ?? '')}</strong></td></tr>`
        )
        .join('')}
    </table>
    ${
      params.description
        ? `<h3 style="font-family: sans-serif; margin-top:24px;">Design description</h3>
           <p style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(params.description)}</p>`
        : ''
    }
    <p style="font-family: sans-serif; color:#737373; margin-top:24px; font-size:12px;">
      Open the admin app to view the uploaded design image and respond to the customer.
    </p>
  `

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    replyTo: params.customerEmail,
    subject: `New custom order — ${params.customerName}`,
    html,
  })

  if (error) {
    console.error('[email] Failed to send custom-order admin notification', error)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  )
}
