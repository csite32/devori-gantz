import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>איפוס סיסמה ל־{siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>איפוס סיסמה</Heading>
          <Text style={text}>
            קיבלנו בקשה לאיפוס הסיסמה שלך ב־{siteName}. לחיצה על הכפתור למטה
            תעביר אותך לבחירת סיסמה חדשה.
          </Text>
          <Section style={{ textAlign: 'center' as const }}>
            <Button style={button} href={confirmationUrl}>
              איפוס סיסמה
            </Button>
          </Section>
          <Text style={footer}>
            אם לא ביקשת לאפס סיסמה, אפשר להתעלם מהמייל. הסיסמה שלך לא תשתנה.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
  margin: '0 0 20px',
  textAlign: 'right' as const,
}
const button = {
  backgroundColor: 'rgb(158, 36, 43)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 12px',
}
const footer = {
  fontSize: '12px',
  color: 'rgb(120, 80, 82)',
  margin: '28px 0 0',
  textAlign: 'right' as const,
}
