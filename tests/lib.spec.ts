import { action } from '../src/lib'

describe('lib', () => {
  it('should work', async () => {
    await action({
      ip: '', correlationId: ''
    })
  })
})
