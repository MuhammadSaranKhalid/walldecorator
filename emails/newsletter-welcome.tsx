import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Font,
} from '@react-email/components'
import * as React from 'react'

interface NewsletterWelcomeEmailProps {
  email?: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const NewsletterWelcomeEmail = ({
  email = 'customer@example.com',
}: NewsletterWelcomeEmailProps) => {
  const previewText = "Welcome to Wall Decorator – you're in!"

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Manrope"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Link href={SITE_URL} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <Img
                src={`${SITE_URL}/logo.png`}
                alt="Wall Decorator"
                width={44}
                height={44}
                style={{ display: 'inline-block', verticalAlign: 'middle' }}
              />
              <Text style={logoText}>Wall Decorator</Text>
            </Link>
            <Text style={tagline}>Art That Defines Your Space</Text>
          </Section>

          {/* Welcome Banner */}
          <Section style={welcomeBanner}>
            <Text style={welcomeIcon}>✉</Text>
            <Heading style={welcomeHeading}>You&apos;re on the list!</Heading>
            <Text style={welcomeText}>
              Thanks for subscribing. You&apos;ll be the first to hear about new
              collections, exclusive offers, and interior inspiration.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              In the meantime, explore our full collection of premium steel wall art.
            </Text>
            <Link style={primaryButton} href={`${SITE_URL}/products`}>
              Shop the Collection
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Link href={SITE_URL} style={{ textDecoration: 'none' }}>
              <Text style={footerLogo}>WallDecorator</Text>
            </Link>
            <Text style={footerText}>
              Questions? Reach us at{' '}
              <Link href="mailto:support@walldecorator.store" style={footerLink}>
                support@walldecorator.store
              </Link>
            </Text>
            <Text style={unsubscribeText}>
              You&apos;re receiving this because you subscribed with {email}.{' '}
              <Link
                href={`${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`}
                style={footerLink}
              >
                Unsubscribe
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} WallDecorator. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default NewsletterWelcomeEmail

// ─── Brand Colors ───
const BRAND_GOLD = '#C8982F'
const BRAND_DARK = '#1A1A1A'
const BRAND_MUTED = '#737373'
const BRAND_BORDER = '#E8E0D0'
const BRAND_BG = '#FAFAF7'

const main: React.CSSProperties = {
  backgroundColor: BRAND_BG,
  fontFamily: "'Manrope', Arial, Helvetica, sans-serif",
}

const container: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  marginTop: '40px',
  marginBottom: '40px',
}

const header: React.CSSProperties = {
  backgroundColor: BRAND_DARK,
  padding: '36px 40px 28px',
  textAlign: 'center',
}

const logoText: React.CSSProperties = {
  color: BRAND_GOLD,
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '-0.5px',
  margin: '0',
  fontFamily: "'Manrope', Arial, sans-serif",
}

const tagline: React.CSSProperties = {
  color: '#999999',
  fontSize: '12px',
  fontWeight: '500',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  margin: '8px 0 0',
}

const welcomeBanner: React.CSSProperties = {
  padding: '36px 40px 28px',
  textAlign: 'center',
}

const welcomeIcon: React.CSSProperties = {
  display: 'inline-block',
  width: '48px',
  height: '48px',
  lineHeight: '48px',
  borderRadius: '50%',
  backgroundColor: '#F5EFE0',
  color: BRAND_GOLD,
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 auto 16px',
  textAlign: 'center',
}

const welcomeHeading: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '26px',
  fontWeight: '800',
  margin: '0 0 12px',
  letterSpacing: '-0.3px',
}

const welcomeText: React.CSSProperties = {
  color: BRAND_MUTED,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
}

const divider: React.CSSProperties = {
  borderColor: '#F0F0F0',
  margin: '0 40px',
}

const ctaSection: React.CSSProperties = {
  padding: '32px 40px',
  textAlign: 'center',
}

const ctaText: React.CSSProperties = {
  color: BRAND_MUTED,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 20px',
}

const primaryButton: React.CSSProperties = {
  backgroundColor: BRAND_GOLD,
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 36px',
  letterSpacing: '0.3px',
}

const footer: React.CSSProperties = {
  padding: '8px 40px 32px',
  textAlign: 'center',
}

const footerDivider: React.CSSProperties = {
  borderColor: BRAND_BORDER,
  margin: '0 0 24px',
}

const footerLogo: React.CSSProperties = {
  color: BRAND_GOLD,
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 12px',
}

const footerText: React.CSSProperties = {
  color: BRAND_MUTED,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
}

const unsubscribeText: React.CSSProperties = {
  color: '#A0A0A0',
  fontSize: '11px',
  lineHeight: '18px',
  margin: '0 0 8px',
}

const footerLink: React.CSSProperties = {
  color: BRAND_GOLD,
  textDecoration: 'underline',
}

const footerCopyright: React.CSSProperties = {
  color: '#A0A0A0',
  fontSize: '11px',
  margin: '12px 0 0',
}
