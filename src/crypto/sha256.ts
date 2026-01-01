/**
 * ULTRA-MEGA FAST SHA-256 (Synchronous)
 * Оптимизировано для V8: Zero-allocations в циклах, Inline битовых операций, Hex-lookup table.
 */

// 1. Константы (Pre-allocated)
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

// 2. Lookup-таблица для моментальной конвертации в HEX
const HEX_TAB = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

// 3. Переиспользуемые буферы (чтобы не нагружать GC)
const W = new Uint32Array(64)
const STATE = new Uint32Array(8)

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

  const n = bytes.length
    
  // Padding: вычисляем новую длину (кратно 64 байтам)
  const newLen = ((n + 8 + 64) >>> 6) << 6
  const msg = new Uint8Array(newLen)
  msg.set(bytes)
  msg[n] = 0x80

  // Запись длины сообщения в битах (Big-Endian 64-bit) в конец буфера
  // JS не поддерживает 64-бит битовые сдвиги идеально, поэтому считаем через множитель
  const bitLen = n * 8
  const lowBits = (bitLen % 0x100000000) >>> 0
  const highBits = (bitLen / 0x100000000) >>> 0

  msg[newLen - 4] = lowBits >>> 24
  msg[newLen - 3] = (lowBits >>> 16) & 0xff
  msg[newLen - 2] = (lowBits >>> 8) & 0xff
  msg[newLen - 1] = lowBits & 0xff
  msg[newLen - 8] = highBits >>> 24
  msg[newLen - 7] = (highBits >>> 16) & 0xff
  msg[newLen - 6] = (highBits >>> 8) & 0xff
  msg[newLen - 5] = highBits & 0xff

  // Начальные хеш-значения
  let h0 = 0x6a09e667; let h1 = 0xbb67ae85; let h2 = 0x3c6ef372; let h3 = 0xa54ff53a
  let h4 = 0x510e527f; let h5 = 0x9b05688c; let h6 = 0x1f83d9ab; let
    h7 = 0x5be0cd19

  // Основной цикл обработки блоков по 64 байта
  for (let j = 0; j < newLen; j += 64) {
    // Заполнение первых 16 слов в W
    for (let i = 0; i < 16; i++) {
      const p = j + (i << 2)
      W[i] = (msg[p] << 24) | (msg[p + 1] << 16) | (msg[p + 2] << 8) | msg[p + 3]
    }

    // Расширение W до 64 слов
    for (let i = 16; i < 64; i++) {
      const v0 = W[i - 15]
      const s0 = ((v0 >>> 7) | (v0 << 25)) ^ ((v0 >>> 18) | (v0 << 14)) ^ (v0 >>> 3)
      const v1 = W[i - 2]
      const s1 = ((v1 >>> 17) | (v1 << 15)) ^ ((v1 >>> 19) | (v1 << 13)) ^ (v1 >>> 10)
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0
    }

    let a = h0; let b = h1; let c = h2; let d = h3; let e = h4; let f = h5; let g = h6; let
      h = h7

    // 64 раунда сжатия
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[i] + W[i]) | 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) | 0

      h = g; g = f; f = e
      e = (d + t1) | 0
      d = c; c = b; b = a
      a = (t1 + t2) | 0
    }

    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0
  }

  // Финальная сборка HEX-строки через Lookup таблицу (в разы быстрее toString(16))
  return hashToHex(h0, h1, h2, h3, h4, h5, h6, h7)
}

function hashToHex(h0: number, h1: number, h2: number, h3: number, h4: number, h5: number, h6: number, h7: number): string {
  const h = [h0, h1, h2, h3, h4, h5, h6, h7]
  let res = ''
  for (let i = 0; i < 8; i++) {
    const v = h[i]
    res += HEX_TAB[(v >>> 24) & 0xff]
               + HEX_TAB[(v >>> 16) & 0xff]
               + HEX_TAB[(v >>> 8) & 0xff]
               + HEX_TAB[v & 0xff]
  }
  return res
}
