import { Payload } from './types.js'

export async function action (payload: Payload): Promise<void> {
  console.log(payload)
}
