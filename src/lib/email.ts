import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export interface EmailResult {
  sent: boolean
}

const FROM_EMAIL = 'PlanifyHub <onboarding@resend.dev>'

export async function sendEmail(opts: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[EMAIL DEV] To: ${opts.to} | Subject: ${opts.subject}`)
    return { sent: false }
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    return { sent: true }
  } catch (err) {
    console.error('[EMAIL ERROR]', err)
    return { sent: false }
  }
}

export function emailSecretaryInvite(email: string, token: string, entrepriseNom: string, dirigeantNom: string): EmailOptions {
  const url = `${process.env.NEXTAUTH_URL}/setup/${token}`
  return {
    to: email,
    subject: `Invitation à rejoindre ${entrepriseNom} sur PlanifyHub`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="background:#1e3a5f;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center">
            <span style="color:white;font-size:22px;font-weight:bold">P</span>
          </div>
          <h2 style="color:#1e3a5f;margin:12px 0 4px">PlanifyHub</h2>
        </div>
        <h3 style="color:#111">Vous êtes invité(e) !</h3>
        <p style="color:#444">${dirigeantNom} vous invite à rejoindre <strong>${entrepriseNom}</strong> en tant que secrétaire / administration.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
            Accéder à la plateforme →
          </a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Ce lien est valable 24 heures.</p>
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
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="background:#1e3a5f;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center">
            <span style="color:white;font-size:22px;font-weight:bold">P</span>
          </div>
          <h2 style="color:#1e3a5f;margin:12px 0 4px">PlanifyHub</h2>
        </div>
        <h3 style="color:#111">Bonjour ${prenom} 👋</h3>
        <p style="color:#444">Votre compte a été créé sur la plateforme RH de <strong>${entrepriseNom}</strong>.</p>
        <div style="background:#f0f4f8;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:4px 0"><strong>Email :</strong> ${email}</p>
          <p style="margin:4px 0"><strong>Mot de passe :</strong> <code>${password}</code></p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
            Se connecter →
          </a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Pour des raisons de sécurité, ce mot de passe est géré par votre administration.</p>
      </div>
    `,
  }
}

// Kept for invite route compatibility
export function emailRegistrationToken(email: string, token: string, entrepriseNom: string): EmailOptions {
  const url = `${process.env.NEXTAUTH_URL}/setup/${token}`
  return {
    to: email,
    subject: `Invitation à rejoindre ${entrepriseNom} — PlanifyHub`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="background:#1e3a5f;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center">
            <span style="color:white;font-size:22px;font-weight:bold">P</span>
          </div>
          <h2 style="color:#1e3a5f;margin:12px 0 4px">PlanifyHub</h2>
        </div>
        <h3 style="color:#111">Bienvenue sur PlanifyHub !</h3>
        <p style="color:#444">Votre espace <strong>${entrepriseNom}</strong> est prêt. Cliquez ci-dessous pour définir votre mot de passe.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
            Créer mon mot de passe →
          </a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Ce lien est valable 24 heures.</p>
      </div>
    `,
  }
}
