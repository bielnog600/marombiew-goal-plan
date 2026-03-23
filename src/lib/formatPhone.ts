/**
 * Formats a phone number for WhatsApp (wa.me) by ensuring it has a country code.
 * Supports Brazil (+55) and Portugal (+351).
 */
export function formatWhatsAppNumber(raw: string): string {
  // Remove all non-digit characters
  const digits = raw.replace(/\D/g, "");

  // Already has country code
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits; // Brazil: 55 + DDD(2) + number(8-9)
  }
  if (digits.startsWith("351") && (digits.length === 12)) {
    return digits; // Portugal: 351 + number(9)
  }

  // Portugal numbers: start with 9 and have 9 digits
  if (digits.startsWith("9") && digits.length === 9) {
    return `351${digits}`;
  }

  // Brazil numbers: 10-11 digits (DDD + number)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Brazil without DDD? Unlikely but 8-9 digit number
  if (digits.length === 8 || digits.length === 9) {
    // Can't determine DDD, return as-is with 55
    return `55${digits}`;
  }

  // Already formatted or unknown format - return as-is
  return digits;
}
