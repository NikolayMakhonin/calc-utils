import crypto from 'node:crypto'
import { calcPerformance } from 'rdtsc/node'
import {sha256} from './sha256'
import {sha256Node} from './sha256Node'

describe('calcSha256', function () {
  this.timeout(10 * 60 * 1000)

  it('perf', () => {
    const len = 10
    let bytes = crypto.randomBytes(len)
    const result = calcPerformance({
      time : 60000,
      funcs: [
        () => {},
        () => {
          return sha256Node(bytes)
        },
        () => {
          return sha256(bytes)
        },
        () => {
          bytes = crypto.randomBytes(len)
        },
      ],
    })

    console.log(result)
  })
})
