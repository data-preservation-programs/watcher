import { Payload } from './types.js'
import dotenv from 'dotenv'
import { action } from './lib.js'
dotenv.config()

const payload = JSON.parse(process.argv[2]) as Payload
await action(payload)
