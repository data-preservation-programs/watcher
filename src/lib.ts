import { Payload } from './types'

export async function action (payload: Payload) : Promise<void> {
  console.log(payload)
}
