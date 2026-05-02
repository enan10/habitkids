import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const payload = request.user as { userId: string }
    request.userId = payload.userId
  } catch {
    reply.code(401).send({ error: 'Non autorisé' })
  }
}
