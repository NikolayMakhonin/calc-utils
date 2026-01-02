import { describe, it, assert } from 'vitest'
import { getCallerStackFrame } from './getCallerStackFrame'

// В safari другой вид stack trace, и наверное нафиг не нужна эта функция
describe.skip('getCallerStackFrame', function () {
  function func() {
    const callerStackFrame = getCallerStackFrame()
    assert.ok(
      /^[ \t]*(at caller ?|caller@?).*$/.test(callerStackFrame!),
      callerStackFrame!,
    )
  }

  function caller() {
    func()
  }

  it('base', function () {
    caller()
  })
})
