import { route } from '@/server/http'
import { endSession } from '@/server/session'

export const POST = route(async () => {
  await endSession()
  return { ok: true }
})
