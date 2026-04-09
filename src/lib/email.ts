import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export interface EmailResult {
  sent: boolean
  previewLink?: string // shown in UI when no SMTP configured
}

export async function sendEmail(opts: EmailOptions): Promise<EmailResult> {
  const transporter = createTransporter()

  if (!transporter) {
    // Dev mode: no SMTP configured, return the content for display in UI
    console.log(`[EMAIL DEV] To: ${opts.to} | Subject: ${opts.subject}`)
    return { sent: false }
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  await transporter.sendMail({ from, ...opts })
  return { sent: true }
}

export function emailRegistrationToken(email: string, token: string, entrepriseNom: string): EmailOptions {
  const url = `${process.env.NEXTAUTH_URL}/setup/${token}`
  return {
    to: email,
    subject: `Créez votre compte PlanifyHub — ${entrepriseNom}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#1e3a5f">Bienvenue sur PlanifyHub</h2>
        <p>Votre entreprise <strong>${entrepriseNom}</strong> a été enregistrée.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer votre mot de passe :</p>
        <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          Créer mon mot de passe
        </a>
        <p style="color:#666;font-size:13px">Ce lien est valable 24 heures.<br>${url}</p>
      </div>
    `,
  }
}

export function emailSecretaryInvite(email: string, token: string, entrepriseNom: string, dirigeantNom: string): EmailOptions {
  const url = `${process.env.NEXTAUTH_URL}/setup/${token}`
  return {
    to: email,
    subject: `Invitation à rejoindre ${entrepriseNom} sur PlanifyHub`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#1e3a5f">Vous êtes invité(e)</h2>
        <p>${dirigeantNom} vous invite à rejoindre <strong>${entrepriseNom}</strong> en tant que secrétaire / administration.</p>
        <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          Accéder à la plateforme
        </a>
        <p style="color:#666;font-size:13px">Ce lien est valable 24 heures.<br>${url}</p>
      </div>
    `,
  }
}

export function emailEmployeeCredentials(email: string, password: string, prenom: string, entrepriseNom: string): EmailOptions {
  const url = `${process.env.NEXTAUTH_URL}/login`
  return {
    to: email,
    subject: `Vos accès à ${entrepriseNom} — PlanifyHub`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#1e3a5f">Bonjour ${prenom},</h2>
        <p>Votre compte a été créé sur la plateforme RH de <strong>${entrepriseNom}</strong>.</p>
        <div style="background:#f0f4f8;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Mot de passe :</strong> ${password}</p>
        </div>
        <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:8px 0">
          Se connecter
        </a>
        <p style="color:#666;font-size:12px">Pour des raisons de sécurité, ce mot de passe est géré par votre administration.</p>
      </div>
    `,
  }
}
