import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { Resend } from 'resend'
import { requireAuth } from '../middleware/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

function resetEmailHtml(name: string, resetUrl: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#FF6B35,#F7C59F);padding:36px 32px;text-align:center;">
      <div style="font-size:52px;margin-bottom:8px;">⭐</div>
      <h1 style="color:white;font-size:26px;font-weight:900;margin:0;letter-spacing:-0.5px;">HabitKids</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:4px 0 0;">Les habitudes des champions !</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:18px;font-weight:700;color:#1f2937;margin:0 0 8px;">Bonjour ${name} 👋</p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Vous avez demandé à réinitialiser votre mot de passe HabitKids.<br>
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#F7931E);color:white;font-weight:900;font-size:16px;padding:14px 36px;border-radius:14px;text-decoration:none;letter-spacing:0.3px;">
          🔑 Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0 0 8px;">
        Ce lien expire dans <strong>1 heure</strong>.
      </p>
      <p style="color:#d1d5db;font-size:12px;text-align:center;margin:0;">
        Si vous n'avez pas fait cette demande, ignorez cet email.<br>
        Votre mot de passe ne sera pas modifié.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="color:#d1d5db;font-size:11px;margin:0;">© HabitKids · Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const existing = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return reply.code(400).send({ error: 'Email déjà utilisé' })

    const hashed = await bcrypt.hash(body.password, 12)
    const user = await app.prisma.user.create({
      data: { email: body.email, password: hashed, name: body.name },
    })
    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } }
  })

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const user = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return reply.code(401).send({ error: 'Email ou mot de passe incorrect' })
    }
    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } }
  })

  app.post('/upgrade', { preHandler: requireAuth }, async (request: any) => {
    await app.prisma.user.update({ where: { id: request.userId }, data: { plan: 'PREMIUM' } })
    return { success: true, plan: 'PREMIUM' }
  })

  // Changer le mot de passe (utilisateur connecté)
  app.patch('/password', { preHandler: requireAuth }, async (request: any, reply) => {
    const body = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }).parse(request.body)

    const user = await app.prisma.user.findUnique({ where: { id: request.userId } })
    if (!user || !(await bcrypt.compare(body.currentPassword, user.password))) {
      return reply.code(400).send({ error: 'Mot de passe actuel incorrect' })
    }

    const hashed = await bcrypt.hash(body.newPassword, 12)
    await app.prisma.user.update({ where: { id: request.userId }, data: { password: hashed } })
    return { success: true }
  })

  // Mot de passe oublié — envoie un email de réinitialisation
  app.post('/forgot-password', async (request, reply) => {
    const body = z.object({ email: z.string().email() }).parse(request.body)

    const user = await app.prisma.user.findUnique({ where: { email: body.email } })
    // Toujours répondre success pour ne pas révéler si l'email existe
    if (!user) return { success: true }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

    await app.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    })

    const frontendUrl = process.env.FRONTEND_URL || 'https://habitkids.netlify.app'
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`

    const resend = getResend()
    if (resend) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      try {
        await resend.emails.send({
          from: `HabitKids <${fromEmail}>`,
          to: user.email,
          subject: 'Réinitialisation de votre mot de passe HabitKids',
          html: resetEmailHtml(user.name, resetUrl),
        })
      } catch (err) {
        console.error('Resend error:', err)
      }
    } else {
      // Dev fallback: log le lien
      console.log(`[DEV] Reset URL for ${user.email}: ${resetUrl}`)
    }

    return { success: true }
  })

  // Réinitialiser le mot de passe avec le token reçu par email
  app.post('/reset-password', async (request, reply) => {
    const body = z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }).parse(request.body)

    const user = await app.prisma.user.findFirst({
      where: {
        resetToken: body.token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    })

    if (!user) return reply.code(400).send({ error: 'Lien invalide ou expiré' })

    const hashed = await bcrypt.hash(body.newPassword, 12)
    await app.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiresAt: null },
    })

    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } }
  })
}
