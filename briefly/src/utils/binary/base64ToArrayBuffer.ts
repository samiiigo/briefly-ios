/** Decodes base64 audio chunks for streaming (native Buffer when available). */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const BufferCtor = (globalThis as { Buffer?: { from(data: string, encoding: string): Uint8Array } })
    .Buffer;
  if (BufferCtor) {
    const bytes = BufferCtor.from(b64, 'base64');
    const out = new Uint8Array(bytes.byteLength);
    out.set(bytes);
    return out.buffer;
  }

  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
