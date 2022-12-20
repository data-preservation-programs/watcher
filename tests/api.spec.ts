import { handler } from '../src/api'

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
