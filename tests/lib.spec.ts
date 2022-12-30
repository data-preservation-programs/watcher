import { action } from '../src/lib.js'

describe('lib', () => {
  it('should work', async () => {
    await action({
      ip: '', correlationId: ''
    })
  })
})
