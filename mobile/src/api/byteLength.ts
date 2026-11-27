/**
 * UTF-8 byte length.
 *
 * Its own module because the translate cap is measured in bytes and this must
 * be testable without dragging the API client — and react-native — in with it.
 */

/** Cohere's request limit, enforced client-side so the failure is legible. */
export const MAX_TRANSLATE_BYTES = 5000;

export function byteLength(text: string): number {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}
