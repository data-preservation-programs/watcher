import { Payload } from './types'
import { action } from './lib'

const ip = process.argv[2]
const correlationId = process.argv[3]
const payload: Payload = {
  ip, correlationId
}

action(payload)
