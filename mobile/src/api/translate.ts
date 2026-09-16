import { byteLength, MAX_TRANSLATE_BYTES } from "./byteLength";
import { post } from "./client";

/**
 * Machine translation, for the language the author does not write in.
 *
 * Online only and never queued: a translation is an assist the author reads,
 * corrects and verifies, so producing it hours later on a flush — after they
 * have stopped looking — would be worse than not producing it at all. The field
 * stays fully editable offline; only the button is unavailable.
 */

export interface TranslateResult {
  translatedText: string;
  /** Provenance the record carries alongside the text. */
  translationMessage?: string;
}

export { byteLength, MAX_TRANSLATE_BYTES };

export async function translateText(
  text: string,
  fromLang: "en" | "fr",
): Promise<TranslateResult> {
  const response = await post<{ data: TranslateResult | string }>("/translate", {
    text,
    fromLang,
  });
  // The endpoint mirrors the old callable, which returned either shape.
  const data = response?.data;
  return typeof data === "string" ? { translatedText: data } : (data ?? { translatedText: "" });
}
