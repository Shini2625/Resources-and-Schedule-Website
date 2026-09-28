# Jacker SMTP setup

## What SMTP means

SMTP stands for **Simple Mail Transfer Protocol**. It is the standard way an application sends outgoing email through an email provider. Jacker uses it to send password-reset links. It is separate from R2: R2 stores files; SMTP sends email.

Jacker does not create SMTP credentials for you. You create them with an email provider (for example, Brevo or SendGrid), then save them as **backend environment variables in Render**. Do not put SMTP passwords/keys in the frontend, GitHub, or chat.

## Suggested setup: Brevo

1. Create/sign in to a Brevo account.
2. In Brevo, open **Settings → SMTP & API → SMTP** and note the SMTP login shown there.
3. Choose **Generate a new SMTP key**. Copy and securely save the key when Brevo shows it; the full key may only be shown at creation time.
4. Add and authenticate a sender/domain in Brevo, then use that verified sender address in Jacker.
5. In Render, open the **Jacker backend Web Service → Environment** and add the values below. Use your own SMTP login, SMTP key, verified sender address, and deployed frontend URL.
6. Save the changes and redeploy the backend. Then use **Forgot password?** to test delivery.

| Render variable | Brevo value |
| --- | --- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | The SMTP login shown on Brevo's SMTP page (not necessarily your account login) |
| `SMTP_PASS` | The generated **SMTP key** (not a Brevo API key) |
| `EMAIL_FROM` | `Jacker <your-verified-sender@yourdomain.com>` |
| `FRONTEND_URL` | Your exact frontend origin, e.g. `https://your-jacker-site.onrender.com` |
| `SMTP_SECURE` | Leave unset/false on port `587`; use `true` for port `465` |
| `CLIENT_URL` | The same exact frontend origin, for browser CORS |

For port `465`, use implicit TLS and set `SMTP_SECURE=true`. Port `587` is the usual STARTTLS choice. Jacker sets the email sender display name to **Jacker**; the sender email address still has to be one your provider accepts/has verified.

## Other providers

- **SendGrid:** its official SMTP guide uses host `smtp.sendgrid.net`, the literal username `apikey`, an API key with Mail permission as the password, and typically port `587`. Follow SendGrid's sender/domain verification steps before sending.
- **Gmail:** Google's app-password feature requires 2-Step Verification. App passwords can be unavailable for some work/school accounts, Advanced Protection, or accounts that use only security keys for 2-Step Verification. A transactional email provider is usually more suitable for an application.

## Keep these values private

Set SMTP credentials only on the **backend** Render service. Never add them to `VITE_*` frontend variables, source files, screenshots, GitHub, or a message. If a key is exposed, revoke/rotate it with the provider and update Render.

The reset endpoint returns an unavailable message until SMTP and a valid frontend origin are configured. Once configured, the user receives a single-use reset link that expires after 15 minutes. If a test email does not arrive, check spam, provider sender/domain verification, SMTP login vs. key, port/encryption, and the backend Render logs.

## Official references

- [Brevo: Create and manage SMTP keys](https://help.brevo.com/hc/en-us/articles/7959631848850-Create-and-manage-your-SMTP-keys)
- [Brevo: Send transactional emails using SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)
- [SendGrid: Integrating with the SMTP API](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api)
- [Google Account Help: Sign in with app passwords](https://support.google.com/accounts/answer/185833?hl=en)
