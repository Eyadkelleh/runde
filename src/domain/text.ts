import type { Result } from "@/domain/catalog";
import { messages } from "@/domain/messages";

const LINK = /(?:https?:\/\/|www\.)\S+/i;
const PRIVATE_PLACE =
  /(bei mir|zu\s?hause|meine[rmsn]*\s+wohnung|privatwohnung|meine\s+adresse|komm\s+hoch|\bklingel\b|\bstockwerk\b|\betage\b|mein\s+zimmer|\bwg\b|\bapartment\b|my\s+place)/i;
const NAME = /^[\p{L}][\p{L}\p{M}'’. -]{0,23}$/u;

export function normalizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateDisplayName(value: string): Result<string> {
  const name = normalizeText(value);
  if (LINK.test(name) || name.length < 2 || name.length > 24 || !NAME.test(name)) {
    return { ok: false, error: { code: "invalid-name", message: messages.invalidName } };
  }
  return { ok: true, value: name };
}

export function placeError(value: string): string | null {
  const place = normalizeText(value);
  if (!place) return messages.placeRequired;
  if (place.length < 3) return messages.placeShort;
  if (place.length > 80) return messages.placeLong;
  if (LINK.test(place)) return messages.placeLink;
  if (PRIVATE_PLACE.test(place)) return messages.placePrivate;
  return null;
}

export function noteError(value: string): { note: string; error: string | null } {
  const note = normalizeText(value);
  if (LINK.test(note)) return { note, error: messages.noteLink };
  if (note.length > 140) return { note, error: messages.noteLong };
  return { note, error: null };
}
