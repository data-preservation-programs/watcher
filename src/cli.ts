import { Payload } from './types.js'
import { action } from './lib.js'

const ip = process.argv[2]
const correlationId = process.argv[3]
const payload: Payload = {
  ip, correlationId
}

await action(payload)
