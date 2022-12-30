import { handler } from '../src/api.js'

xdescribe('api', () => {
  it('should not fail', async () => {
    await handler(<any>{
      queryStringParameters: {
        token: 'token',
        ip: 'ip'
      }
    })
  })
})
