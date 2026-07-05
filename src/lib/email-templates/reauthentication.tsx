import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>קוד האימות שלך</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>אישור אימות מחדש</Heading>
          <Text style={text}>יש להשתמש בקוד הבא כדי לאמת את זהותך:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            הקוד תקף לזמן מוגבל בלבד. אם לא ביקשת אימות, אפשר להתעלם מהמייל.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  direction: 'rtl' as const,
}
const container = { padding: '24px 16px', maxWidth: '560px' }
const card = {
  backgroundColor: 'rgb(255, 238, 218)',
  borderRadius: '14px',
  padding: '32px 28px',
  textAlign: 'right' as const,
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'rgb(82, 16, 20)',
  margin: '0 0 20px',
  textAlign: 'right' as const,
}
const text = {
  fontSize: '15px',
  color: 'rgb(82, 16, 20)',
  lineHeight: '1.7',
  margin: '0 0 16px',
  textAlign: 'right' as const,
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  color: 'rgb(158, 36, 43)',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '8px 0 24px',
  textAlign: 'center' as const,
}
const footer = {
  fontSize: '12px',
  color: 'rgb(120, 80, 82)',
  margin: '28px 0 0',
  textAlign: 'right' as const,
}
