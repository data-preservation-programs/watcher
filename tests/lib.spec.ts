import { hello } from '../src/lib'

describe('lib', () => {
  it('should work', () => {
    const result = hello()
    expect(result).toEqual('Hello World')
  })
})
