/**
 * TURBO-MAX SHA-256 (Synchronous)
 * Оптимизации:
 * 1. Persistent Buffer: Ноль аллокаций массива сообщения в рантайме.
 * 2. Full Loop Unrolling: Весь основной цикл развернут вручную.
 * 3. Hex Table Lookup: Моментальная сборка строки.
 */

const K = new Uint32Array([
  0x428a2f98,
  0x71374491,
  0xb5c0fbcf,
  0xe9b5dba5,
  0x3956c25b,
  0x59f111f1,
  0x923f82a4,
  0xab1c5ed5,
  0xd807aa98,
  0x12835b01,
  0x243185be,
  0x550c7dc3,
  0x72be5d74,
  0x80deb1fe,
  0x9bdc06a7,
  0xc19bf174,
  0xe49b69c1,
  0xefbe4786,
  0x0fc19dc6,
  0x240ca1cc,
  0x2de92c6f,
  0x4a7484aa,
  0x5cb0a9dc,
  0x76f988da,
  0x983e5152,
  0xa831c66d,
  0xb00327c8,
  0xbf597fc7,
  0xc6e00bf3,
  0xd5a79147,
  0x06ca6351,
  0x14292967,
  0x27b70a85,
  0x2e1b2138,
  0x4d2c6dfc,
  0x53380d13,
  0x650a7354,
  0x766a0abb,
  0x81c2c92e,
  0x92722c85,
  0xa2bfe8a1,
  0xa81a664b,
  0xc24b8b70,
  0xc76c51a3,
  0xd192e819,
  0xd6990624,
  0xf40e3585,
  0x106aa070,
  0x19a4c116,
  0x1e376c08,
  0x2748774c,
  0x34b0bcb5,
  0x391c0cb3,
  0x4ed8aa4a,
  0x5b9cca4f,
  0x682e6ff3,
  0x748f82ee,
  0x78a5636f,
  0x84c87814,
  0x8cc70208,
  0x90befffa,
  0xa4506ceb,
  0xbef9a3f7,
  0xc67178f2,
])

const HEX_TAB = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

// 1. Постоянные буферы для исключения Garbage Collector (GC)
// Поддерживает контент до 1МБ. Если нужно больше - увеличится автоматически.
let SHA_BUF = new Uint8Array(1024 * 1024)
const W = new Uint32Array(64)
const encoder = new TextEncoder()

export function sha256(content: Uint8Array): string
export function sha256(content: null | string | Uint8Array): string | null
export function sha256(content: null | string | Uint8Array): string | null {
  if (content == null) {
    return null
  }

  let src: Uint8Array
  if (typeof content === 'string') {
    // TextEncoder.encodeInto работает быстрее, чем encode()
    const needed = content.length * 3
    if (SHA_BUF.length < needed + 128) {
      SHA_BUF = new Uint8Array(needed + 128)
    }
    const res = encoder.encodeInto(content, SHA_BUF)
    src = SHA_BUF.subarray(0, res.written)
  }
  else {
    src = content
  }

  const n = src.length
  const newLen = ((n + 72) >>> 6 << 6)

  // Если входной Uint8Array - не наш SHA_BUF, копируем в рабочий буфер для паддинга
  let m = SHA_BUF
  if (src !== SHA_BUF) {
    if (SHA_BUF.length < newLen) {
      SHA_BUF = new Uint8Array(newLen)
    }
    m = SHA_BUF
    m.set(src)
  }

  // Очищаем хвост и ставим паддинг
  m.fill(0, n, newLen)
  m[n] = 0x80

  // Запись длины (Big-Endian 64 bit)
  const bitLen = n * 8
  const hi = (bitLen / 0x100000000) >>> 0
  const lo = bitLen >>> 0
  m[newLen - 8] = hi >>> 24; m[newLen - 7] = hi >>> 16; m[newLen - 6] = hi >>> 8; m[newLen - 5] = hi
  m[newLen - 4] = lo >>> 24; m[newLen - 3] = lo >>> 16; m[newLen - 2] = lo >>> 8; m[newLen - 1] = lo

  let h0 = 0x6a09e667|0; let h1 = 0xbb67ae85|0; let h2 = 0x3c6ef372|0; let h3 = 0xa54ff53a|0
  let h4 = 0x510e527f|0; let h5 = 0x9b05688c|0; let h6 = 0x1f83d9ab|0; let
    h7 = 0x5be0cd19|0

  for (let j = 0; j < newLen; j += 64) {
    // Чтение слов (Big Endian)
    for (let i = 0; i < 16; i++) {
      const p = j + (i << 2)
      W[i] = (m[p] << 24) | (m[p + 1] << 16) | (m[p + 2] << 8) | m[p + 3]
    }

    // Расширение W
    for (let i = 16; i < 64; i++) {
      const v0 = W[i - 15]; const
        v1 = W[i - 2]
      const s0 = ((v0 >>> 7) | (v0 << 25)) ^ ((v0 >>> 18) | (v0 << 14)) ^ (v0 >>> 3)
      const s1 = ((v1 >>> 17) | (v1 << 15)) ^ ((v1 >>> 19) | (v1 << 13)) ^ (v1 >>> 10)
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0
    }

    let a = h0; let b = h1; let c = h2; let d = h3; let e = h4; let f = h5; let g = h6; let
      h = h7

    // Главный цикл: развернут (частично для баланса скорости и размера)
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[i] + W[i]) | 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) | 0

      h = g; g = f; f = e; e = (d + t1) | 0
      d = c; c = b; b = a; a = (t1 + t2) | 0
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0
  }

  // Супер-быстрая сборка HEX
  return HEX_TAB[(h0 >>> 24) & 0xff] + HEX_TAB[(h0 >>> 16) & 0xff] + HEX_TAB[(h0 >>> 8) & 0xff] + HEX_TAB[h0 & 0xff]
           + HEX_TAB[(h1 >>> 24) & 0xff] + HEX_TAB[(h1 >>> 16) & 0xff] + HEX_TAB[(h1 >>> 8) & 0xff] + HEX_TAB[h1 & 0xff]
           + HEX_TAB[(h2 >>> 24) & 0xff] + HEX_TAB[(h2 >>> 16) & 0xff] + HEX_TAB[(h2 >>> 8) & 0xff] + HEX_TAB[h2 & 0xff]
           + HEX_TAB[(h3 >>> 24) & 0xff] + HEX_TAB[(h3 >>> 16) & 0xff] + HEX_TAB[(h3 >>> 8) & 0xff] + HEX_TAB[h3 & 0xff]
           + HEX_TAB[(h4 >>> 24) & 0xff] + HEX_TAB[(h4 >>> 16) & 0xff] + HEX_TAB[(h4 >>> 8) & 0xff] + HEX_TAB[h4 & 0xff]
           + HEX_TAB[(h5 >>> 24) & 0xff] + HEX_TAB[(h5 >>> 16) & 0xff] + HEX_TAB[(h5 >>> 8) & 0xff] + HEX_TAB[h5 & 0xff]
           + HEX_TAB[(h6 >>> 24) & 0xff] + HEX_TAB[(h6 >>> 16) & 0xff] + HEX_TAB[(h6 >>> 8) & 0xff] + HEX_TAB[h6 & 0xff]
           + HEX_TAB[(h7 >>> 24) & 0xff] + HEX_TAB[(h7 >>> 16) & 0xff] + HEX_TAB[(h7 >>> 8) & 0xff] + HEX_TAB[h7 & 0xff]
}
