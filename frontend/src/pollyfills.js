import { Buffer } from 'buffer'

if (typeof global === 'undefined') {
  globalThis.global = globalThis
}

if (typeof Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

if (typeof process === 'undefined') {
  globalThis.process = { env: {} }
}