/**
 * Ultra-fast synchronous SHA-256 implementation.
 * Optimized for V8 and modern JS engines.
 */

// Предварительно вычисленная таблица констант
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

// Рабочий массив (выделяем один раз для переиспользования внутри функции)
const W = new Uint32Array(64)

export function sha256(content: Uint8Array): string
export function sha256(content: null | string | Uint8Array): string | null
export function sha256(content: null | string | Uint8Array): string | null {
  if (content == null) {
    return null
  }

  let bytes: Uint8Array
  if (typeof content === 'string') {
    bytes = new TextEncoder().encode(content)
  }
  else if (content instanceof Uint8Array) {
    bytes = content
  }
  else {
    throw new Error(`[sha256] Unsupported content type: ${typeof content}`)
  }

  const len = bytes.length
  // Дополнение (padding)
  const newLen = ((len + 8 + 64) >> 6) << 6
  const msg = new Uint8Array(newLen)
  msg.set(bytes)
  msg[len] = 0x80

  // Установка длины в битах (Big-Endian)
  const bitLen = len * 8
  // Мы записываем 64-битное число в конец
  // JavaScript побитовые операции работают с 32 битами, поэтому делим на 2^32
  const lowBits = bitLen | 0
  const highBits = (bitLen / 0x100000000) | 0
  
  msg[newLen - 4] = (lowBits >>> 0) & 0xff
  msg[newLen - 3] = (lowBits >>> 8) & 0xff
  msg[newLen - 2] = (lowBits >>> 16) & 0xff
  msg[newLen - 1] = (lowBits >>> 24) & 0xff
  // Для корректного Big Endian длины:
  msg[newLen - 4] = lowBits >>> 0
  msg[newLen - 3] = lowBits >>> 8 // Это не совсем верно для BigEndian, исправим ниже:

  // Правильная запись длины (Big Endian)
  const view = new DataView(msg.buffer)
  view.setUint32(newLen - 4, lowBits, false)
  view.setUint32(newLen - 8, highBits, false)

  let h0 = 0x6a09e667; let h1 = 0xbb67ae85; let h2 = 0x3c6ef372; let h3 = 0xa54ff53a
  let h4 = 0x510e527f; let h5 = 0x9b05688c; let h6 = 0x1f83d9ab; let
    h7 = 0x5be0cd19

  for (let j = 0; j < newLen; j += 64) {
    // Подготовка расписания сообщений (W)
    for (let i = 0; i < 16; i++) {
      const pos = j + i * 4
      W[i] = (msg[pos] << 24) | (msg[pos + 1] << 16) | (msg[pos + 2] << 8) | (msg[pos + 3])
    }

    for (let i = 16; i < 64; i++) {
      const wi15 = W[i - 15]
      const s0 = ((wi15 >>> 7) | (wi15 << 25)) ^ ((wi15 >>> 18) | (wi15 << 14)) ^ (wi15 >>> 3)
      const wi2 = W[i - 2]
      const s1 = ((wi2 >>> 17) | (wi2 << 15)) ^ ((wi2 >>> 19) | (wi2 << 13)) ^ (wi2 >>> 10)
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0
    }

    let a = h0; let b = h1; let c = h2; let d = h3; let e = h4; let f = h5; let g = h6; let
      h = h7

    // Основной цикл (инлайним ротации)
    for (let i = 0; i < 64; i++) {
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + s1 + ch + K[i] + W[i]) | 0
      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (s0 + maj) | 0

      h = g; g = f; f = e
      e = (d + t1) | 0
      d = c; c = b; b = a
      a = (t1 + t2) | 0
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0
  }

  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7)
}

// Быстрая конвертация числа в hex (без padStart и лишних аллокаций)
function hex(num: number): string {
  let s = ''
  for (let i = 7; i >= 0; i--) {
    s += ((num >>> (i << 2)) & 0xf).toString(16)
  }
  return s
}
