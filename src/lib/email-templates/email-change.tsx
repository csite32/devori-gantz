import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אישור החלפת כתובת המייל ב־{siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>אישור החלפת כתובת מייל</Heading>
          <Text style={text}>
            התקבלה בקשה לשנות את כתובת המייל שלך ב־{siteName} מ־
            <Link href={`mailto:${oldEmail}`} style={link}>
              {oldEmail}
            </Link>{' '}
            ל־
            <Link href={`mailto:${newEmail}`} style={link}>
              {newEmail}
            </Link>
            .
          </Text>
          <Text style={text}>לחיצה על הכפתור למטה תאשר את השינוי:</Text>
          <Section style={{ textAlign: 'center' as const }}>
            <Button style={button} href={confirmationUrl}>
              אישור החלפת המייל
            </Button>
          </Section>
          <Text style={footer}>
            אם לא ביקשת את השינוי, יש לאבטח את החשבון שלך באופן מיידי.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: 'rgb(158, 36, 43)', textDecoration: 'underline' }
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
